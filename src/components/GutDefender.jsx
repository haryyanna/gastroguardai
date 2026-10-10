import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

const QUESTIONS = [
  { question: 'Apa pilihan paling aman saat diare menyebabkan banyak cairan hilang?', options: ['Minuman bersoda', 'Oralit sesuai petunjuk kemasan', 'Tidak minum dulu'], answer: 1, tip: 'Oralit membantu mengganti cairan dan elektrolit. Larutkan tepat sesuai petunjuk pada kemasan.' },
  { question: 'Saat memilih seafood matang, apa yang perlu diperhatikan?', options: ['Disajikan panas dan matang menyeluruh', 'Dibiarkan lama di suhu ruang', 'Aroma tidak penting'], answer: 0, tip: 'Makanan matang sebaiknya disajikan panas, dan tidak dibiarkan lama pada suhu ruang.' },
  { question: 'Apa yang sebaiknya dilakukan sebelum makan di perjalanan?', options: ['Cuci tangan pakai sabun', 'Cukup lap di baju', 'Tidak perlu bila makan lokal'], answer: 0, tip: 'Cuci tangan dengan sabun dan air bersih sebelum makan untuk membantu mengurangi penyebaran kuman.' },
  { question: 'Mana tanda bahaya diare yang perlu segera diperiksa?', options: ['Haus ringan setelah berjalan', 'Tinja berdarah atau sulit minum', 'Nafsu makan kembali'], answer: 1, tip: 'Tinja berdarah, sulit minum, sangat lemas, demam tinggi, atau muntah terus perlu pertolongan medis segera.' },
  { question: 'Bagaimana cara paling aman mencoba makanan lokal baru?', options: ['Pilih yang matang dan tersaji segar', 'Pilih yang lama di suhu ruang', 'Abaikan alergi bahan'], answer: 0, tip: 'Pilih makanan yang matang menyeluruh, baru dimasak, dan perhatikan alergi atau intoleransi pribadi.' },
];

export default function GutDefender() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = QUESTIONS[index];
  const progress = finished ? 100 : ((index + (answer === null ? 0 : 1)) / QUESTIONS.length) * 100;

  const choose = (optionIndex) => {
    if (answer !== null) return;
    setAnswer(optionIndex);
    if (optionIndex === current.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (index === QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer(null);
  };

  const restart = () => { setIndex(0); setAnswer(null); setScore(0); setFinished(false); };

  return <section className="gg-card gg-quiz-card gg-gut-defender">
    <div className="gg-mini-head"><span className="gg-section-icon orange"><ShieldCheck size={18}/></span><div><span className="gg-kicker">GUT DEFENDER · MISI SEHAT</span><h3>{finished ? 'Misi selesai!' : 'Uji insting sehatmu'}</h3></div><span className="gg-quiz-score"><Sparkles size={13}/>{score} poin</span></div>
    <div className="gg-quiz-progress"><span style={{ width: `${progress}%` }}/></div>
    {finished ? <div className="gg-quiz-finish"><b>{score}/{QUESTIONS.length} jawaban benar</b><p>{score === QUESTIONS.length ? 'Keren! Kamu siap menjaga perjalanan tetap sehat.' : 'Terus belajar—kebiasaan aman dapat membantu mencegah gangguan pencernaan.'}</p><button className="gg-next-quiz" onClick={restart}><RotateCcw size={15}/> Main lagi</button></div> : <>
      <div className="gg-quiz-meta"><span>Pertanyaan {index + 1} dari {QUESTIONS.length}</span><span>{answer === null ? 'Pilih jawabanmu' : answer === current.answer ? 'Tepat sekali!' : 'Yuk pelajari jawabannya'}</span></div>
      <p className="gg-quiz-question">{current.question}</p>
      <div className="gg-quiz-options">{current.options.map((option, optionIndex) => {
        const isCorrect = optionIndex === current.answer;
        const selected = answer === optionIndex;
        return <button key={option} disabled={answer !== null} onClick={() => choose(optionIndex)} className={answer !== null && isCorrect ? 'correct' : selected && !isCorrect ? 'incorrect' : ''}>
          <span className="gg-quiz-option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{answer !== null && isCorrect && <Check size={16}/>}
        </button>;
      })}</div>
      {answer !== null && <div className={`gg-quiz-feedback ${answer === current.answer ? 'correct' : 'incorrect'}`}><b>{answer === current.answer ? 'Jawaban benar' : 'Belum tepat'}</b><span>{current.tip}</span></div>}
      {answer !== null && <button className="gg-next-quiz" onClick={next}>{index === QUESTIONS.length - 1 ? 'Lihat hasil' : 'Lanjutkan'} <ArrowRight size={15}/></button>}
    </>}
  </section>;
}
