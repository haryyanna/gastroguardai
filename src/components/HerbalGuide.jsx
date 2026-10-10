import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Leaf, MessageCircle, Send, Sparkles } from 'lucide-react';
import { chatCompletion } from '../lib/nutriApi';
import './HerbalGuide.css';

const PLANTS = [
  { name: 'Jahe', latin: 'Zingiber officinale', symptom: 'Mual ringan', summary: 'Seduhan jahe hangat kerap digunakan untuk membantu rasa mual.', use: 'Iris tipis jahe bersih dan seduh. Mulai dari rasa yang ringan; hentikan jika terasa perih.', evidence: 'Ada penelitian pada mual dalam beberapa kondisi, tetapi manfaat dan dosisnya tidak sama untuk setiap orang.', caution: 'Dapat memicu rasa panas atau refluks. Konsultasikan bila hamil, memiliki kondisi medis, atau menggunakan obat rutin.' },
  { name: 'Kunyit', latin: 'Curcuma longa', symptom: 'Kenyamanan pencernaan', summary: 'Rempah pangan tradisional; belum terbukti sebagai pengobatan gangguan lambung.', use: 'Gunakan sebagai bumbu atau minuman pangan dengan jumlah wajar.', evidence: 'Kurkumin sedang diteliti; bukti belum cukup untuk menggantikan perawatan medis.', caution: 'Suplemen pekat dapat berinteraksi dengan obat dan tidak cocok untuk sebagian kondisi empedu.' },
  { name: 'Temulawak', latin: 'Curcuma xanthorrhiza', symptom: 'Nafsu makan', summary: 'Secara tradisional dimanfaatkan sebagai jamu dan bumbu.', use: 'Pilih olahan higienis dan porsi kecil; hindari produk tanpa label jelas.', evidence: 'Klaim manfaat pencernaan masih memerlukan bukti klinis yang lebih kuat.', caution: 'Hindari menjadikannya terapi tunggal. Konsultasikan jika hamil, menyusui, atau memiliki penyakit hati/empedu.' },
  { name: 'Daun jambu biji', latin: 'Psidium guajava', symptom: 'Diare ringan', summary: 'Penggunaan tradisional untuk diare tidak menggantikan cairan dan oralit.', use: 'Utamakan oralit sesuai petunjuk kemasan dan air aman; jangan menunda pemeriksaan untuk mencoba ramuan.', evidence: 'Bukti klinis untuk ramuan rumahan masih terbatas dan dosisnya tidak baku.', caution: 'Segera periksa bila ada darah, demam tinggi, muntah terus, lemas/dehidrasi, atau keluhan memburuk.' },
  { name: 'Serai', latin: 'Cymbopogon citratus', symptom: 'Minuman tradisional', summary: 'Sering digunakan sebagai bumbu dan minuman hangat, bukan obat pencernaan.', use: 'Seduh sebagai minuman pangan dan batasi gula tambahan.', evidence: 'Belum cukup bukti bahwa seduhan serai mengobati keluhan pencernaan.', caution: 'Jangan konsumsi minyak esensial. Hentikan bila muncul alergi atau iritasi.' },
  { name: 'Daun mint', latin: 'Mentha spp.', symptom: 'Rasa tidak nyaman', summary: 'Aroma mint dapat terasa menyegarkan, namun bisa memperburuk refluks pada sebagian orang.', use: 'Boleh digunakan sebagai penambah rasa pada minuman atau makanan.', evidence: 'Efek produk mint berbeda-beda dan tidak berlaku untuk semua keluhan.', caution: 'Hindari bila mint memicu heartburn/refluks; bukan pengganti evaluasi medis.' },
  { name: 'Adas', latin: 'Foeniculum vulgare', symptom: 'Kembung', summary: 'Biji adas biasa digunakan sebagai rempah dan seduhan tradisional.', use: 'Gunakan secukupnya sebagai rempah pangan, bukan ekstrak pekat.', evidence: 'Manfaat untuk kembung belum dipastikan untuk semua orang.', caution: 'Waspadai alergi keluarga wortel/seledri. Konsultasikan untuk anak, kehamilan, atau obat rutin.' },
  { name: 'Kayu manis', latin: 'Cinnamomum spp.', symptom: 'Rempah pangan', summary: 'Rempah aromatik untuk makanan; bukan terapi gangguan pencernaan.', use: 'Tambahkan sedikit pada makanan/minuman dan pilih produk pangan berlabel.', evidence: 'Belum terbukti mengatasi keluhan pencernaan.', caution: 'Hindari konsumsi dosis tinggi atau minyak esensial; jenis cassia dapat mengandung kumarin.' },
  { name: 'Kencur', latin: 'Kaempferia galanga', symptom: 'Jamu tradisional', summary: 'Rempah yang sering dipakai dalam jamu dan masakan Indonesia.', use: 'Konsumsi hanya sebagai pangan/jamu higienis dalam jumlah wajar.', evidence: 'Bukti manfaat klinis untuk gangguan pencernaan masih terbatas.', caution: 'Perhatikan gula pada jamu kemasan; jangan gunakan untuk menunda pemeriksaan.' },
  { name: 'Lidah buaya', latin: 'Aloe vera', symptom: 'Perlu kehati-hatian', summary: 'Produk lidah buaya untuk diminum tidak otomatis aman atau bermanfaat bagi pencernaan.', use: 'Jangan menelan lateks/getah kuning atau produk yang tidak jelas prosesnya.', evidence: 'Produk dan kandungannya sangat bervariasi; manfaat klinis belum pasti.', caution: 'Lateks dapat menyebabkan kram dan diare serta berinteraksi dengan obat. Hindari tanpa saran tenaga kesehatan.' },
  { name: 'Bawang putih', latin: 'Allium sativum', symptom: 'Bumbu pangan', summary: 'Bumbu sehari-hari yang dapat mengiritasi atau memicu kembung pada sebagian orang.', use: 'Gunakan sebagai bahan masakan matang sesuai toleransi.', evidence: 'Tidak terbukti sebagai pengobatan keluhan cerna.', caution: 'Suplemen dapat meningkatkan risiko perdarahan dan berinteraksi dengan obat tertentu.' },
  { name: 'Daun salam', latin: 'Syzygium polyanthum', symptom: 'Bumbu pangan', summary: 'Daun aromatik untuk masakan, bukan pengganti obat.', use: 'Gunakan untuk memasak; buang daun sebelum disajikan.', evidence: 'Klaim terapeutik rumahan belum memiliki bukti yang cukup.', caution: 'Hindari konsumsi ekstrak pekat dan hentikan bila menimbulkan reaksi.' },
];

const INITIAL_MESSAGES = [{ role: 'assistant', content: 'Tanyakan tanaman, cara penggunaan tradisional, atau batas keamanannya. Saya akan membedakan informasi tradisional dari bukti yang sudah tersedia.' }];

function localAnswer(question) {
  const text = question.toLowerCase();
  const plant = PLANTS.find((item) => text.includes(item.name.toLowerCase()));
  if (/diare|mencret/.test(text)) return 'Saat diare, yang utama adalah mencegah dehidrasi: minum oralit yang dilarutkan sesuai petunjuk kemasan dan air aman. Ramuan daun jambu biji belum terbukti sebagai pengganti oralit. Segera periksa bila tinja berdarah, demam tinggi, muntah terus, sangat lemas, atau sulit minum.';
  if (plant) return `${plant.name} (${plant.latin}): ${plant.summary} ${plant.use} Catatan keamanan: ${plant.caution} Informasi tradisional bukan diagnosis atau pengganti perawatan tenaga kesehatan.`;
  return 'Sebutkan nama tanaman atau keluhan yang ingin ditanyakan agar saya dapat memberi informasi yang lebih sesuai. Bukti manfaat herbal sering terbatas; jangan menunda pemeriksaan untuk mencoba ramuan, terutama bila gejala berat atau memburuk.';
}

export default function HerbalGuide() {
  const [expanded, setExpanded] = useState({});
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);

  const buildPlantContext = (prompt) => {
    const normalizedPrompt = prompt.toLocaleLowerCase('id');
    const mentionedPlants = PLANTS.filter((plant) =>
      normalizedPrompt.includes(plant.name.toLocaleLowerCase('id')) ||
      normalizedPrompt.includes(plant.latin.toLocaleLowerCase('id'))
    );
    const catalogSummary = PLANTS
      .map(({ name, symptom, summary }) => `${name} (${symptom}): ${summary}`)
      .join('\n');
    const relevantDetails = mentionedPlants
      .map(({ name, latin, use, evidence, caution }) => `${name} (${latin}) — Penggunaan: ${use} Bukti: ${evidence} Perhatian: ${caution}`)
      .join('\n');
    return `${catalogSummary}${relevantDetails ? `\nRincian tanaman yang ditanyakan:\n${relevantDetails}` : ''}`;
  };

  const ask = async (event) => {
    event.preventDefault();
    const prompt = question.trim().slice(0, 1000);
    if (!prompt || loading) return;
    const nextMessages = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMessages);
    setQuestion('');
    setLoading(true);
    try {
      const context = buildPlantContext(prompt);
      const response = await chatCompletion({
        messages: [
          { role: 'system', content: `Kamu edukator kearifan lokal untuk kesehatan pencernaan. Jawab bahasa Indonesia dengan 3–5 kalimat yang langsung menjawab dan memberi langkah praktis. Bedakan penggunaan tradisional dari bukti klinis. Jangan mendiagnosis, menentukan dosis terapi, atau menyarankan herbal sebagai pengganti perawatan. Prioritaskan oralit saat diare. Sarankan pertolongan medis untuk darah pada tinja, dehidrasi, demam tinggi, muntah terus, nyeri berat, atau kondisi memburuk. Jika menyebut sumber, cukup satu sumber ringkas tanpa daftar URL panjang. Informasi tanaman:\n${context}` },
          ...nextMessages.slice(-6),
        ],
        max_tokens: 550,
        temperature: 0.35,
      });
      setMessages([...nextMessages, { role: 'assistant', content: response.content?.trim() || localAnswer(prompt) }]);
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 160) : 'Koneksi Gemini gagal.';
      setMessages([...nextMessages, { role: 'assistant', content: `AI belum dapat merespons (${reason}). Panduan lokal: ${localAnswer(prompt)}` }]);
    } finally {
      setLoading(false);
    }
  };

  return <div className="gg-herbal-guide">
    <div className="gg-herb-tools"><p className="gg-herb-intro"><Leaf size={16}/> Ringkasan penting ditampilkan terlebih dahulu. Buka detail untuk melihat cara penggunaan, batas bukti, dan kewaspadaan.</p></div>
    <div className="gg-herb-grid">{PLANTS.map((plant) => <article className="gg-card gg-herb-card" key={plant.name}>
      <div className="gg-herb-top"><span className="gg-herb-icon"><Leaf size={20}/></span><small>{plant.symptom}</small></div>
      <h3>{plant.name}</h3><span className="gg-herb-latin">{plant.latin}</span>
      <p>{plant.summary}</p>
      <button className="gg-herb-learn" aria-expanded={Boolean(expanded[plant.name])} onClick={() => setExpanded((state) => ({ ...state, [plant.name]: !state[plant.name] }))}>
        {expanded[plant.name] ? 'Tutup detail' : 'Pelajari selengkapnya'} {expanded[plant.name] ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
      </button>
      {expanded[plant.name] && <div className="gg-herb-details">
        <div><b>Penggunaan tradisional</b><span>{plant.use}</span></div>
        <div><b>Batas bukti</b><span>{plant.evidence}</span></div>
        <div className="gg-herb-caution"><AlertCircle size={14}/><span>{plant.caution}</span></div>
      </div>}
    </article>)}</div>
    <section className="gg-herbal-chat gg-card" aria-label="Tanya GastroBot tentang tanaman herbal">
      <div className="gg-herbal-chat-title"><span><Sparkles size={17}/></span><div><b>Tanya seputar kearifan lokal</b><small>Jawaban disesuaikan dengan pertanyaan dan panduan keamanan.</small></div></div>
      <div className="gg-herbal-chat-log" role="log" aria-live="polite">{messages.slice(-8).map((message, index) => <p className={`gg-herbal-chat-message ${message.role}`} key={`${index}-${message.content}`}>{message.content}</p>)}{loading && <p className="gg-herbal-chat-message assistant">Sedang menyiapkan jawaban…</p>}</div>
      <form className="gg-herbal-chat-form" onSubmit={ask}><MessageCircle size={17}/><input value={question} maxLength={1000} onChange={(event) => setQuestion(event.target.value)} placeholder="Contoh: apakah jahe membantu mual?" aria-label="Tanya tentang tanaman herbal"/><button disabled={!question.trim() || loading} aria-label="Kirim pertanyaan"><Send size={16}/></button></form>
    </section>
  </div>;
}
