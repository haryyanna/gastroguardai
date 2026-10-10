import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { chatCompletion } from '../lib/nutriApi';
import './Chat.css';

const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: 'bot',
        text: 'Halo! Aku Ranstal AI, asisten Travel Health Nursing untuk keselamatan anak selama perjalanan wisata. Aku bisa membantu pertolongan pertama, tips kesehatan perjalanan, panduan obat, dan memberi langkah praktis yang aman.',
    }
];

const SUGGESTIONS = [
    "Pertolongan pertama muntah perjalanan",
    "Tips mencegah mabuk perjalanan",
    "Obat apa yang wajib dibawa?",
    "Cara menjaga kebersihan saat wisata"
];
    const CHAT_REFERENCES = '\n\nReferensi:\n- Kemenkes RI, Pedoman Gizi Seimbang: https://ayosehat.kemkes.go.id/pedoman-gizi-seimbang\n- WHO, Guideline: Sugars intake for adults and children: https://www.who.int/publications/i/item/9789241549028\n- USDA FoodData Central, basis data komposisi pangan: https://fdc.nal.usda.gov/';

    const withReferences = (text) => {
        const answer = String(text || '').trim();
        return answer.toLowerCase().includes('referensi:') ? answer : `${answer}${CHAT_REFERENCES}`;
    };

const Chat = () => {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Load chat history from localStorage on mount
    useEffect(() => {
        const username = localStorage.getItem('moodify_currentUser');
        if (username) {
            const userKey = `moodify_data_${username}`;
            try {
                const savedData = localStorage.getItem(userKey);
                if (savedData) {
                    const userData = JSON.parse(savedData);
                    if (userData.chatHistory && userData.chatHistory.length > 0 && userData.chatHistory[0].text.includes('Ranstal AI')) {
                        setMessages(userData.chatHistory);
                    } else {
                        // Custom initial greeting with username
                        const personalizedGreeting = [
                            {
                                id: 1,
                                sender: 'bot',
                                text: `Halo ${username}! Aku Ranstal AI, asisten Travel Health Nursing untuk keselamatan anak selama perjalanan wisata. Aku bisa membantu pertolongan pertama, tips kesehatan perjalanan, panduan obat, dan memberi langkah praktis yang aman.`,
                            }
                        ];
                        setMessages(personalizedGreeting);
                        userData.chatHistory = personalizedGreeting;
                        localStorage.setItem(userKey, JSON.stringify(userData));
                    }
                }
            } catch (e) {
                console.error("Error loading chat history:", e);
            }
        }
    }, []);

    // Helper to save messages to localStorage
    const saveMessagesToLocal = (newMessages) => {
        const username = localStorage.getItem('moodify_currentUser');
        if (username) {
            const userKey = `moodify_data_${username}`;
            try {
                const savedData = localStorage.getItem(userKey);
                if (savedData) {
                    const userData = JSON.parse(savedData);
                    userData.chatHistory = newMessages;
                    localStorage.setItem(userKey, JSON.stringify(userData));
                }
            } catch (e) {
                console.error("Error saving chat history:", e);
            }
        }
    };

    const playSendSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const getAiResponse = async (userText, history) => {
        try {
            const formattedHistory = history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            formattedHistory.push({
                role: 'user',
                content: userText
            });

            const systemPrompt = "Karaktermu: Ranstal AI, asisten Travel Health Nursing yang ramah, santai, akurat, dan edukatif untuk keselamatan anak selama perjalanan wisata. Jawab sesuai pertanyaan dengan bahasa Indonesia yang mudah dipahami. Berikan minimal satu paragraf yang cukup lengkap, biasanya 4-7 kalimat, tanpa bertele-tele. Bila relevan, gunakan struktur: jawaban inti, alasan/fakta medis, lalu langkah praktis pertolongan pertama atau alternatif aman. Gunakan paling banyak 1-2 emoji. Jangan mendiagnosis atau menggantikan tenaga kesehatan profesional. Selalu prioritaskan keselamatan dan rujuk ke tenaga medis untuk kondisi serius.";

            const data = await chatCompletion({
                messages: [
                    { role: "system", content: systemPrompt },
                    ...formattedHistory
                ],
                max_tokens: 800,
                temperature: 0.7
            });
            return data.content?.trim() || getLocalResponseFallback(userText);
                return withReferences(data.content?.trim() || getLocalResponseFallback(userText));
        } catch (error) {
            console.warn('AI chat unavailable; using local nutrition guidance.', error);
            return getLocalResponseFallback(userText);
                return withReferences(getLocalResponseFallback(userText));
        }
    };

    const getLocalResponseFallback = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('mabuk') || lower.includes('mual') || lower.includes('muntah') || lower.includes('perjalanan')) {
            return "Untuk mencegah mabuk perjalanan, duduk di bagian kendaraan yang stabil (tengah), hindari membaca saat bergerak, dan buka jendela untuk udara segar. Jika sudah mual, istirahatkan pandangan ke horizon jauh. Bawa permen pelega tenggorokan atau jahe. 🚗";
        }
        if (lower.includes('obat') || lower.includes('bawa') || lower.includes('sedia')) {
            return "Obat yang wajib dibawa saat wisata bersama anak: Paracetamol (demam/nyeri), obat anti-mabuk perjalanan, P3K lengkap (plester, antiseptik, kasa), minyak kayu putih, obat diare, dan obat alergi. Simpan di wadah kedap udara yang mudah dijangkau. 💊";
        }
        if (lower.includes('pertolongan') || lower.includes('pertolongan pertama') || lower.includes('p3k')) {
            return "Pertolongan pertama dasar: Untuk luka lecet → bersihkan dengan air mengalir + antiseptik, tutup plester. Untuk demam → kompres hangat + paracetamol sesuai berat badan. Untuk tersedak → hentikan makan, minum air pelan. Jika kondisi memburuk atau anak sulit bernapas, SEGERA ke fasilitas kesehatan terdekat. 🏥";
        }
        if (lower.includes('bersih') || lower.includes('cuci tangan') || lower.includes('higiene')) {
            return "Selama wisata, selalu cuci tangan dengan sabun selama 20 detik sebelum makan dan setelah dari toilet. Bawa hand sanitizer 60%+ alkohol untuk keadaan darurat. Hindari makanan dan minuman yang tidak terjamin kebersihannya, terutama es batu yang tidak jelas sumbernya. 🧼";
        }
        return "Pertanyaan menarik tentang kesehatan perjalanan! Untuk jawaban lebih tepat, ceritakan kondisi atau masalahnya secara detail (gejala, durasi, lokasi wisata). Ranstal AI akan membantu memberikan panduan aman untuk keselamatan anak selama perjalanan wisata. 🎒";
    };

    const handleSend = async (textToSend = inputText) => {
        if (!textToSend.trim()) return;
        
        playSendSound();

        const currentHistory = [...messages];

        const newMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: textToSend
        };

        const updatedMessagesWithUser = [...currentHistory, newMessage];
        setMessages(updatedMessagesWithUser);
        saveMessagesToLocal(updatedMessagesWithUser);

        setInputText('');
        setIsTyping(true);

        const aiText = await getAiResponse(textToSend, currentHistory);

        const botResponse = {
            id: updatedMessagesWithUser.length + 1,
            sender: 'bot',
            text: aiText
        };

        const finalUpdatedMessages = [...updatedMessagesWithUser, botResponse];
        setMessages(finalUpdatedMessages);
        saveMessagesToLocal(finalUpdatedMessages);

        setIsTyping(false);
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-logo-mini">🎒</div>
                    <div className="chat-header-text">
                        <h2>Ranstal AI</h2>
                        <p>Travel Health Nursing</p>
                    </div>
                </div>
            </header>

            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                        {msg.sender === 'bot' && (
                            <div className="message-avatar">🤖</div>
                        )}
                        <div className={`message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                            {msg.text.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    {i !== msg.text.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message-wrapper bot">
                        <div className="message-avatar">🤖</div>
                        <div className="message-bubble bubble-bot typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
                <div className="suggestions-container">
                    {SUGGESTIONS.map((suggestion, idx) => (
                        <button
                            key={idx}
                            className="suggestion-chip"
                            onClick={() => handleSend(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                <div className="input-bar">
                    <input
                        type="text"
                        placeholder="Tanya seputar kesehatan perjalanan di sini..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className={`send-btn ${inputText.trim() ? 'active' : ''}`}
                        onClick={() => handleSend()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
