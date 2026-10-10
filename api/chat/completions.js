import { json } from '../_lib/http.js';

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-oss-120b';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_TEXT_LENGTH = 4000;
const MAX_CONVERSATION_TEXT_LENGTH = 16000;
const MAX_RESPONSE_TOKENS = 1000;
const CHAT_REFERENCES = '\n\nSumber kesehatan perjalanan:\n- CDC Yellow Book, Travelers’ Diarrhea: https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/travelers-diarrhea.html\n- CDC Yellow Book, Food and Water Precautions for Travelers: https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/food-and-water-precautions-for-travelers.html';

const normalizeMessagesText = (messages) => {
  return messages.map((message) => {
    if (typeof message.content === 'string') return `${message.role}: ${message.content}`;
    if (Array.isArray(message.content)) {
      return `${message.role}: ${message.content.map((part) => part.text || '').join('\n')}`;
    }
    return `${message.role}: ${String(message.content ?? '')}`;
  }).join('\n\n');
};

const callGemini = async ({ messages, max_tokens = 600, temperature = 0.7 }) => {
  const apiKey = globalThis.process?.env?.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: normalizeMessagesText(messages) }] }],
      generationConfig: {
        maxOutputTokens: Math.max(max_tokens, 800),
        temperature
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini API error');
  }

  const content = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || '';

  if (!content) throw new Error('Gemini tidak mengembalikan teks.');
  return { ok: true, content: `${content}${content.toLowerCase().includes('referensi:') ? '' : CHAT_REFERENCES}`, model: GEMINI_MODEL };
};

const callCerebras = async ({ messages, max_tokens = 600, temperature = 0.7, model = DEFAULT_MODEL }) => {
  const apiKey = globalThis.process?.env?.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(CEREBRAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, max_tokens, temperature })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || 'Cerebras API error');
  }

  const content = data?.choices?.[0]?.message?.content || '';
  return { ok: true, content: `${content}${content.toLowerCase().includes('referensi:') ? '' : CHAT_REFERENCES}`, model: data?.model || model };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const { messages, max_tokens = 600, temperature = 0.7 } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return json(res, 400, { ok: false, error: 'messages wajib diisi' });
    }

    const conversationTextLength = messages.reduce((total, message) => {
      const content = typeof message?.content === 'string'
        ? message.content
        : Array.isArray(message?.content)
          ? message.content.map((part) => part?.text || '').join('\n')
          : '';
      return total + content.length;
    }, 0);
    if (
      messages.length > MAX_MESSAGES ||
      messages.some((message) => !['system', 'user', 'assistant'].includes(message?.role) ||
        (typeof message?.content !== 'string' && !Array.isArray(message?.content)) ||
        (typeof message.content === 'string' && message.content.length > MAX_MESSAGE_TEXT_LENGTH)) ||
      conversationTextLength > MAX_CONVERSATION_TEXT_LENGTH
    ) {
      return json(res, 413, { ok: false, error: 'Percakapan terlalu panjang. Mulai percakapan baru atau ringkas pesan.' });
    }

    const safeMaxTokens = Math.min(MAX_RESPONSE_TOKENS, Math.max(100, Number(max_tokens) || 600));
    const safeTemperature = Math.min(1, Math.max(0, Number(temperature) || 0));

    if (globalThis.process?.env?.GEMINI_API_KEY) {
      try {
        const geminiResult = await callGemini({ messages, max_tokens: safeMaxTokens, temperature: safeTemperature });
        if (geminiResult?.ok) {
          return json(res, 200, geminiResult);
        }
      } catch (error) {
        console.warn('Gemini failed, falling back to Cerebras:', error.message);
      }
    }

    const cerebrasResult = await callCerebras({ messages, max_tokens: safeMaxTokens, temperature: safeTemperature, model: DEFAULT_MODEL });
    if (cerebrasResult?.ok) {
      return json(res, 200, cerebrasResult);
    }

    return json(res, 503, { ok: false, error: 'Tidak ada provider AI yang aktif.' });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Chat proxy failed' });
  }
}
