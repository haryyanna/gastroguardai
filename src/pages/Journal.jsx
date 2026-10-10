import { useState } from 'react';
import { ArrowLeft, BookOpen, Send, Sparkles, NotebookPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatCompletion } from '../lib/nutriApi';
import './Journal.css';

const Journal = () => {
    const navigate = useNavigate();
    const [entry, setEntry] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);

    const getAiReflection = async (text) => {
        const systemPrompt = 'Tugasmu membaca jurnal pengguna dan memberi refleksi empatik, bukan diagnosis. Balas JSON murni berbahasa Indonesia dengan format {"emotion":"rangkuman emosi","summary":"refleksi singkat","advice":"satu saran coping yang aman"}. Jika pengguna menyebut bahaya langsung terhadap diri sendiri atau orang lain, utamakan keselamatan dan sarankan segera menghubungi orang tepercaya atau layanan darurat.';
        try {
            const response = await chatCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                max_tokens: 300,
                temperature: 0.2
            });
            const json = response.content.match(/\{[\s\S]*\}/)?.[0];
            if (!json) throw new Error('AI response did not contain a JSON object.');
            const parsed = JSON.parse(json);
            return {
                emotion: parsed.emotion || 'Netral',
                summary: parsed.summary || 'Terima kasih sudah menuliskan perasaanmu.',
                advice: parsed.advice || 'Pertimbangkan berbagi cerita dengan orang yang kamu percaya.'
            };
        } catch (error) {
            console.error('Journal AI reflection failed:', error);
            return {
                emotion: 'AI belum tersedia',
                summary: 'Jurnalmu tetap dapat disimpan, tetapi refleksi AI belum berhasil dibuat.',
                advice: 'Periksa konfigurasi API server (GEMINI_API_KEY atau CEREBRAS_API_KEY) dan coba lagi nanti.'
            };
        }
    };

    const handleSave = async () => {
        if (!entry.trim()) return;
        setIsSubmitting(true);
        setAiFeedback(null);

        // Get AI Reflection
        const feedback = await getAiReflection(entry);
        setAiFeedback(feedback);

        // Save to local storage
        const username = localStorage.getItem('moodify_currentUser');
        if (username) {
            const userKey = `moodify_data_${username}`;
            const savedData = localStorage.getItem(userKey);
            if (savedData) {
                const userData = JSON.parse(savedData);
                if (!userData.journals) userData.journals = [];
                userData.journals.push({
                    date: new Date().toISOString(),
                    text: entry,
                    feedback: feedback
                });
                localStorage.setItem(userKey, JSON.stringify(userData));
            }
        }

        setIsSubmitting(false);
        setEntry('');
    };

    return (
        <div className="journal-container animate-fade-in">
            <header className="page-header">
                <button className="icon-btn-rounded" onClick={() => navigate('/home')}>
                    <ArrowLeft size={24} />
                </button>
                <div className="feature-heading"><NotebookPen className="feature-heading-icon" /><h2>Jurnal & Curhat</h2></div>
                <div style={{ width: 40 }} />
            </header>

            <div className="journal-content">
                <div className="journal-editor glass-card">
                    <div className="editor-header">
                        <BookOpen size={20} className="icon-blue" />
                        <h3>Apa yang kamu rasakan hari ini?</h3>
                    </div>
                    
                    <textarea 
                        className="journal-textarea" 
                        placeholder="Hari ini aku merasa..."
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        disabled={isSubmitting}
                    ></textarea>

                    <div className="editor-footer">
                        <span className="char-count">{entry.length} karakter</span>
                        <button 
                            className="btn-primary btn-small"
                            onClick={handleSave}
                            disabled={!entry.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Memproses...' : <><Send size={16} /> Simpan Curhat</>}
                        </button>
                    </div>
                </div>

                {isSubmitting && (
                    <div className="ai-loading">
                        <Sparkles className="pulse-animation" size={24} color="#6366f1" />
                        <p>AI sedang membaca curhatanmu...</p>
                    </div>
                )}

                {aiFeedback && (
                    <div className="ai-feedback-card glass-card animate-slide-up">
                        <div className="feedback-badge"><Sparkles size={14} /> AI Insight</div>
                        <div className="feedback-section">
                            <h4>Terdeteksi Emosi</h4>
                            <p className="emotion-tag">{aiFeedback.emotion}</p>
                        </div>
                        <div className="feedback-section">
                            <h4>Refleksi</h4>
                            <p>&ldquo;{aiFeedback.summary}&rdquo;</p>
                        </div>
                        <div className="feedback-section highlight-bg">
                            <h4>Saran RANSTAL</h4>
                            <p>{aiFeedback.advice}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Journal;
