import { json } from '../_lib/http.js';

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_TEXT_LENGTH = 4000;
const MAX_CONVERSATION_TEXT_LENGTH = 16000;
const MAX_RESPONSE_TOKENS = 1000;

const normalizeMessagesText = (messages) => {
  return messages.map((message) => {
    if (typeof message.content === 'string') return `${message.role}: ${message.content}`;
    if (Array.isArray(message.content)) {
      return `${message.role}: ${message.content.map((part) => part.text || '').join('\n')}`;
    }
    return `${message.role}: ${String(message.content ?? '')}`;
  }).join('\n\n');
};

const callGemini = async ({ messages, max_tokens = 600, temperature = 0.7, model = GEMINI_MODEL }) => {
  const apiKey = globalThis.process?.env?.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: normalizeMessagesText(messages) }] }],
      generationConfig: {
        maxOutputTokens: max_tokens,
        temperature
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Gemini API error');
    error.status = response.status;
    throw error;
  }

  const content = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || '';

  if (!content) throw new Error('Gemini tidak mengembalikan teks.');
  return { ok: true, content, model };
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

    if (!globalThis.process?.env?.GEMINI_API_KEY) {
      return json(res, 503, { ok: false, error: 'GEMINI_API_KEY belum dikonfigurasi.' });
    }

    let geminiResult;
    try {
      geminiResult = await callGemini({ messages, max_tokens: safeMaxTokens, temperature: safeTemperature });
    } catch (error) {
      if (![429, 500, 503, 504].includes(error.status)) throw error;
      console.warn('Gemini Flash busy; retrying with Gemini Flash-Lite:', error.message);
      geminiResult = await callGemini({
        messages,
        max_tokens: safeMaxTokens,
        temperature: safeTemperature,
        model: GEMINI_FALLBACK_MODEL
      });
    }
    return json(res, 200, geminiResult);
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Chat proxy failed' });
  }
}
