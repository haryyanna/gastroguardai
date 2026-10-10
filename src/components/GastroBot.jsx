import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatCompletion } from '../lib/nutriApi';

const SYSTEM_PROMPT = 'Kamu GastroBot, asisten edukasi kesehatan pencernaan bagi pelancong tropis. Jawab bahasa Indonesia yang jelas, hangat, dan praktis (umumnya 3–6 kalimat). Jangan mendiagnosis atau meresepkan obat. Untuk diare, utamakan penggantian cairan dan oralit sesuai petunjuk kemasan. Tegaskan untuk segera mencari tenaga medis bila ada darah pada tinja, demam tinggi, muntah terus hingga tidak bisa minum, tanda dehidrasi, nyeri berat, atau kondisi memburuk. Beri perhatian khusus untuk anak, lansia, ibu hamil, dan penyakit kronis. Herbal bukan pengganti perawatan medis.';
const SUGGESTIONS = ['Diare saat perjalanan', 'Cara minum oralit', 'Perut kram'];
const INITIAL = [{ id: 'welcome', sender: 'bot', text: 'Halo! Saya GastroBot. Ceritakan keluhan, sejak kapan, dan apakah kamu masih bisa minum. Saya akan bantu langkah awal yang aman.' }];
const chatKey = (username) => username ? `moodify_data_${username}` : 'gastroguard_guest_data';

function loadHistory() {
  try {
    const raw = localStorage.getItem(chatKey(localStorage.getItem('moodify_currentUser')));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.chatHistory) && parsed.chatHistory.length ? parsed.chatHistory : INITIAL;
  } catch { return INITIAL; }
}

function storeHistory(messages) {
  try {
    const key = chatKey(localStorage.getItem('moodify_currentUser'));
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...data, chatHistory: messages }));
  } catch { /* storage may be unavailable */ }
}

function localFallback(text) {
  const lower = text.toLowerCase();
  if (/diare|mencret|berak cair/.test(lower)) return 'Minum oralit yang dilarutkan sesuai volume air pada kemasan, sedikit tetapi sering, dan pilih air yang aman. Segera cari bantuan medis jika tinja berdarah, demam tinggi, muntah terus, terasa sangat lemas, atau sulit minum.';
  if (/mual|muntah|kram|sakit perut/.test(lower)) return 'Beristirahat dan minum sedikit demi sedikit. Hindari dulu makanan yang terasa memperburuk keluhan. Jika nyeri berat, muntah berulang, demam tinggi, ada darah, atau kondisi memburuk, segera periksa ke tenaga kesehatan.';
  return 'Ceritakan gejala yang dirasakan, sejak kapan, dan apakah ada demam, muntah, diare, atau darah pada tinja. Untuk gejala berat atau memburuk, segera hubungi layanan kesehatan.';
}

export default function GastroBot({ standalone = false }) {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(standalone);
  const endRef = useRef(null);
  const username = localStorage.getItem('moodify_currentUser');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);
  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape' && !standalone) setExpanded(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded, standalone]);

  const send = async (raw = input) => {
    const prompt = raw.trim();
    if (!prompt || loading) return;
    const outgoing = [...messages, { id: `${Date.now()}-u`, sender: 'user', text: prompt }];
    setMessages(outgoing);
    setInput('');
    setLoading(true);
    storeHistory(outgoing);
    try {
      const history = outgoing.slice(-12).map((message) => ({ role: message.sender === 'user' ? 'user' : 'assistant', content: message.text }));
      const response = await chatCompletion({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history], max_tokens: 450, temperature: 0.5 });
      const answer = response.content?.trim() || localFallback(prompt);
      const updated = [...outgoing, { id: `${Date.now()}-b`, sender: 'bot', text: answer }];
      setMessages(updated);
      storeHistory(updated);
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 180) : 'Koneksi ke Gemini gagal.';
      const updated = [...outgoing, { id: `${Date.now()}-b`, sender: 'bot', text: `AI Gemini belum dapat merespons (${reason}). Panduan awal: ${localFallback(prompt)}` }];
      setMessages(updated);
      storeHistory(updated);
    } finally { setLoading(false); }
  };

  return <div className={`gg-chat-shell ${expanded ? 'gg-chat-expanded' : ''} ${standalone ? 'gg-chat-standalone' : ''}`}>
    {expanded && !standalone && <button className="gg-chat-backdrop" onClick={() => setExpanded(false)} aria-label="Tutup mode fokus"/>}
    <section className="gg-card gg-chat-card">
      <header className="gg-chat-head"><span className="gg-bot-avatar"><Sparkles size={19}/></span><span className="gg-chat-title"><b>GastroBot</b><small><i/> {loading ? 'Sedang merespons' : 'Siap membantu'}</small></span><span className="gg-ai-tag">ASISTEN PENCERNAAN</span>{standalone ? <Link to="/" className="gg-chat-head-action" aria-label="Kembali"><ArrowLeft size={17}/></Link> : <button className="gg-chat-head-action" onClick={() => setExpanded((current) => !current)} title={expanded ? 'Keluar mode fokus' : 'Fokus konseling layar penuh'} aria-label={expanded ? 'Keluar mode fokus' : 'Fokus konseling layar penuh'}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>}</header>
      <div className="gg-messages" role="log" aria-live="polite">{messages.slice(-30).map((message) => <div className={`gg-message ${message.sender}`} key={message.id}>{message.text}</div>)}{loading && <div className="gg-message bot gg-typing">GastroBot sedang menyiapkan jawaban…</div>}<div ref={endRef}/></div>
      <div className="gg-quick-prompts">{SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} disabled={loading}>{suggestion}</button>)}</div>
      <form className="gg-chat-form" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tulis gejala atau pertanyaan…" aria-label="Pesan untuk GastroBot"/><button aria-label="Kirim pesan" disabled={!input.trim() || loading}><Send size={16}/></button></form>
      <small className="gg-medical-note"><ShieldCheck size={12}/> Informasi edukatif, bukan diagnosis. Segera cari pertolongan untuk tanda bahaya.</small>
      {username && <span className="gg-chat-user"><Sparkles size={11}/> Riwayat tersimpan di profil perangkat ini</span>}
    </section>
    {standalone && <div className="gg-standalone-note">Untuk keadaan darurat, hubungi <a href="tel:112">112</a> atau <a href="tel:119">119</a>.</div>}
  </div>;
}
