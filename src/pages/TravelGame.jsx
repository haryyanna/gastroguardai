import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, Trophy, ArrowLeft, RefreshCw, Plane, Backpack, Camera, Sun } from 'lucide-react';
import './TravelGame.css';

const BALI_DISTRICTS = [
  { id: 1, name: 'Gianyar', icon: '🗺️', points: 15, region: 'Kabupaten Gianyar', color: '#2dd4bf' },
  { id: 2, name: 'Badung', icon: '🏝️', points: 15, region: 'Kabupaten Badung', color: '#60a5fa' },
  { id: 3, name: 'Denpasar', icon: '🏙️', points: 20, region: 'Kota Denpasar', color: '#f59e0b' },
  { id: 4, name: 'Ubud', icon: '🌿', points: 15, region: 'Ubud', color: '#34d399' },
  { id: 5, name: 'Kuta', icon: '🌊', points: 15, region: 'Kuta', color: '#38bdf8' },
  { id: 6, name: 'Seminyak', icon: '☀️', points: 15, region: 'Seminyak', color: '#fbbf24' },
  { id: 7, name: 'Nusa Dua', icon: '🏖️', points: 20, region: 'Nusa Dua', color: '#4ade80' },
  { id: 8, name: 'Tabanan', icon: '🌾', points: 15, region: 'Kabupaten Tabanan', color: '#a78bfa' },
  { id: 9, name: 'Bangli', icon: '⛰️', points: 15, region: 'Kabupaten Bangli', color: '#fb7185' },
  { id: 10, name: 'Buleleng', icon: '🌅', points: 15, region: 'Kabupaten Buleleng', color: '#22c55e' },
  { id: 11, name: 'Sukawati', icon: '🌼', points: 15, region: 'Sukawati', color: '#f472b6' },
  { id: 12, name: 'Sanur', icon: '🚤', points: 20, region: 'Sanur', color: '#0ea5e9' },
];

const GAME_DURATION = 45; // seconds

const TravelGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [items, setItems] = useState([]);
  const [collectedItems, setCollectedItems] = useState([]);
  
  const gameAreaRef = useRef(null);

  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        return;
      }

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (error) {
      console.log("Audio play failed");
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    let generator;
    if (gameState === 'playing') {
      generator = setInterval(() => {
        if (gameAreaRef.current && items.length < 8) {
          const item = BALI_DISTRICTS[Math.floor(Math.random() * BALI_DISTRICTS.length)];
          const width = gameAreaRef.current.clientWidth;
          const height = gameAreaRef.current.clientHeight;
          
          const newItem = {
            id: Date.now() + Math.random(),
            ...item,
            left: Math.floor(Math.random() * (width - 80)),
            top: Math.floor(Math.random() * (height - 80)),
            collected: false
          };

          setItems(prev => [...prev, newItem]);
        }
      }, 1500);
    }
    return () => clearInterval(generator);
  }, [gameState, items.length]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setItems([]);
    setCollectedItems([]);
    setGameState('playing');
    playSound('collect');
  };

  const endGame = () => {
    setGameState('end');
    playSound('win');
  };

  const handleCollect = (item) => {
    if (item.collected || gameState !== 'playing') return;

    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, collected: true } : i
    ));
    
    setCollectedItems(prev => [...prev, item]);
    setScore(prev => prev + item.points);
    playSound('collect');
    
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id));
    }, 300);
  };

  return (
    <div className="travelgame-container animate-fade-in">
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 30 }}>
        <button 
          onClick={() => navigate('/home')}
          style={{ background: 'white', border: 'none', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} color="#0f172a" />
        </button>
      </div>

      <div className="travelgame-header">
        <div className="header-icon">
          <Backpack size={32} />
        </div>
        <h1>Persiapan <span style={{ color: '#3b82f6' }}>Perjalanan</span></h1>
        {gameState === 'playing' && <p>Kumpulkan perlengkapan travel secepat mungkin!</p>}
      </div>

      <div className="game-stats">
        <div className="score-box">
          <Trophy size={18} />
          <span>{score} Poin</span>
        </div>
        <div className={`time-box ${timeLeft <= 10 ? 'urgent' : ''}`}>
          <Compass size={18} />
          <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="collected-items">
        <span>Daerah Bali Terkumpul: {collectedItems.length}/{BALI_DISTRICTS.length}</span>
        <div className="collected-icons">
          {collectedItems.map(item => (
            <span key={item.id} className="collected-icon">{item.icon}</span>
          ))}
        </div>
      </div>

      <div className="game-area" ref={gameAreaRef}>
        <div className="bali-map-illustration" aria-hidden="true">
          <div className="map-pin pin-gianyar">Gianyar</div>
          <div className="map-pin pin-badung">Badung</div>
          <div className="map-pin pin-denpasar">Denpasar</div>
          <div className="map-pin pin-ubud">Ubud</div>
          <div className="map-pin pin-kuta">Kuta</div>
          <div className="map-pin pin-seminyak">Seminyak</div>
        </div>

        {gameState === 'playing' && items.map(item => (
          <div 
            key={item.id}
            className={`travel-item ${item.collected ? 'collected' : ''}`}
            style={{ 
              left: `${item.left}px`, 
              top: `${item.top}px`,
              borderColor: item.color,
              boxShadow: `0 10px 18px ${item.color}22`
            }}
            onClick={() => handleCollect(item)}
          >
            <span className="item-emoji">{item.icon}</span>
            <span className="item-name">{item.name}</span>
            <span className="item-region">{item.region}</span>
            <span className="item-points">+{item.points}</span>
          </div>
        ))}

        {gameState === 'start' && (
          <div className="game-overlay animate-fade-in">
            <div className="overlay-icon">
              <Plane size={64} color="#3b82f6" />
            </div>
            <h2>Siap Jelajah Bali?</h2>
            <p>Kumpulkan kabupaten dan destinasi Bali yang siap dikunjungi. <br/><br/>Klik area yang muncul di peta, seperti Gianyar, Badung, Denpasar, Ubud, Kuta, dan daerah favorit lainnya.</p>
            <div className="district-preview">
              <span>Gianyar</span>
              <span>Badung</span>
              <span>Denpasar</span>
              <span>Ubud</span>
            </div>
            <button className="btn-primary" onClick={startGame} style={{ padding: '16px 32px', fontSize: '18px' }}>
              <Compass size={20} /> Mulai Petualangan Bali!
            </button>
          </div>
        )}

        {gameState === 'end' && (
          <div className="game-overlay animate-fade-in">
            <Trophy size={64} color="#f59e0b" style={{ marginBottom: '16px' }} />
            <h2>Perjalanan Bali Selesai!</h2>
            <div className="final-score">{score} Poin</div>
            <p>Kamu telah mengumpulkan {collectedItems.length} dari {BALI_DISTRICTS.length} destinasi Bali. Siap untuk petualangan berikutnya!</p>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-primary" onClick={startGame}>
                <RefreshCw size={18} /> Main Lagi
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => navigate('/home')}
                style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '14px 24px', borderRadius: '12px', fontWeight: '600' }}
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelGame;
