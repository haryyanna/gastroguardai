import { useState } from 'react';
import { Activity, ArrowUpRight, Check, CircleAlert, ClipboardCheck, HeartPulse, Leaf, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Sun, Utensils, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GastroBot from '../components/GastroBot';
import ClinicLocator from '../components/ClinicLocator';
import HerbalGuide from '../components/HerbalGuide';
import GutDefender from '../components/GutDefender';
import './Home.css';

const checklistItems = ['Oralit / P3K cerna', 'Air minum kemasan tersegel', 'Obat pribadi & anti-mual', 'Probiotik (opsional)', 'Tisu & hand sanitizer'];
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path}`;

export default function Home() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState({});
  const [username, setUsername] = useState(() => localStorage.getItem('moodify_currentUser') || '');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => localStorage.getItem('gastroguard_welcome_seen') !== '1');
  const goToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleLogin = (event) => {
    event.preventDefault();
    const name = loginName.trim();
    if (!name || !privacyAccepted) { setLoginError('Masukkan nama dan setujui pemberitahuan privasi.'); return; }
    localStorage.setItem('moodify_currentUser', name);
    const key = `moodify_data_${name}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ joinedAt: new Date().toISOString(), chatHistory: [], profile: 'traveler' }));
    setUsername(name); setLoginOpen(false); setLoginError('');
  };
  const logout = () => { localStorage.removeItem('moodify_currentUser'); setUsername(''); setProfileOpen(false); };

  return <div className="gg-app">
    <header className="gg-header"><Link className="gg-brand" to="/"><img className="gg-brand-mark gg-brand-logo" src={publicAsset('gastroguard-assets/logo.png')} alt="" /><span><b>GastroGuard <em>AI</em></b><small>TRAVEL HEALTH COMPANION</small></span></Link><nav className="gg-desktop-nav"><button onClick={() => navigate('/predict')}>Gut-Predict</button><button onClick={() => goToSection('scan')}>AyuScan</button><button onClick={() => goToSection('herbal')}>Herbal guide</button><button onClick={() => navigate('/gastrobot')}>GastroBot</button></nav><div className="gg-account-actions"><a className="gg-emergency" href="tel:112"><Phone size={16}/> Darurat 112</a><button className="gg-account-button" onClick={() => username ? setProfileOpen((open) => !open) : setLoginOpen(true)}>{username ? username.slice(0, 1).toUpperCase() : <CircleAlert size={17}/>}<span>{username ? 'Profil' : 'Login'}</span></button>{profileOpen && <div className="gg-profile-menu"><b>{username}</b><small>Akun GastroGuard AI · riwayat tersimpan di perangkat ini</small><button className="gg-logout" onClick={logout}>Keluar akun</button></div>}</div></header>
    <main id="top">
      <section className="gg-hero"><div className="gg-hero-copy"><span className="gg-eyebrow"><Sparkles size={14}/> SMART TRAVELER HEALTH</span><h1>Jelajahi tropis.<br/><span>Tetap nyaman.</span></h1><p>Asisten cerdas untuk menjaga kesehatan pencernaan dan keamanan pangan di setiap perjalanan.</p><div className="gg-hero-actions"><Link className="gg-button gg-button-light" to="/predict">Cek risiko destinasi <ArrowUpRight size={17}/></Link><Link className="gg-text-link" to="/gastrobot">Tanya GastroBot <MessageCircle size={16}/></Link></div><div className="gg-trust"><span><i/> Panduan preventif</span><span><i/> Dibuat untuk pelancong tropis</span></div></div><div className="gg-hero-art"><div className="gg-orbit gg-orbit-one"/><div className="gg-orbit gg-orbit-two"/><div className="gg-sun"/><Leaf className="gg-hero-leaf leaf-a"/><Leaf className="gg-hero-leaf leaf-b"/><div className="gg-hero-note"><span className="gg-note-icon"><HeartPulse size={17}/></span><span><b>Perjalanan lebih tenang</b><small>Mulai dari pilihan yang aman</small></span><span className="gg-live-dot"/></div><div className="gg-hero-pin"><MapPin size={16}/> BALI, INDONESIA</div></div></section>
      <section className="gg-welcome-row"><div><span className="gg-kicker">YOUR TRAVEL WELLNESS HUB</span><h2>{username ? `Halo, ${username}` : 'Halo, traveler'} <HeartPulse size={17}/></h2><p>Bekal pintar untuk menjaga perut tetap nyaman selama menjelajah.</p></div><div className="gg-weather"><Sun className="gg-weather-icon" size={22}/><span><b>Bali · Tropis</b><small>Prakiraan cuaca belum terhubung</small></span><span className="gg-temp">29°</span></div></section>
      <section id="feature-overview" className="gg-feature-overview"><div className="gg-overview-heading"><span className="gg-kicker">PILIH ASISTEN PERJALANANMU</span><h2>Empat cara menjaga pencernaan tetap prima</h2><p>Alat praktis untuk merencanakan perjalanan, memilih makanan, dan mendapatkan bantuan.</p></div><div className="gg-feature-grid"><Link to="/predict" className="gg-feature-card"><span className="gg-feature-icon teal"><img src={publicAsset('gastroguard-assets/features/gut-predict.png')} alt="" /></span><span className="gg-feature-copy"><small>01 · RISK FORECAST</small><b>Gut-Predict Engine</b><i>Model ARIMAX dan faktor risiko destinasi</i></span><ArrowUpRight size={16}/></Link><button className="gg-feature-card" onClick={() => goToSection('scan')}><span className="gg-feature-icon orange"><img src={publicAsset('gastroguard-assets/features/ayuscan.png')} alt="" /></span><span className="gg-feature-copy"><small>02 · FOOD SAFETY</small><b>AyuScan</b><i>Panduan memilih sajian lokal</i></span><ArrowUpRight size={16}/></button><button className="gg-feature-card" onClick={() => goToSection('herbal')}><span className="gg-feature-icon green"><img src={publicAsset('gastroguard-assets/features/herbal-guide.png')} alt="" /></span><span className="gg-feature-copy"><small>03 · LOCAL WISDOM</small><b>Herbal guide</b><i>Panduan tradisional dan kehati-hatian</i></span><ArrowUpRight size={16}/></button><Link to="/gastrobot" className="gg-feature-card"><span className="gg-feature-icon coral"><img src={publicAsset('gastroguard-assets/features/gastrobot.png')} alt="" /></span><span className="gg-feature-copy"><small>04 · AI FIRST AID</small><b>GastroBot</b><i>Konseling pencernaan dan pertolongan awal</i></span><ArrowUpRight size={16}/></Link></div></section>
      <section id="scan" className="gg-section"><div className="gg-section-head"><div><span className="gg-kicker">02 / AYUSCAN</span><h2>Pilih makanan dengan lebih yakin</h2><p>Pindai foto, cocokkan dengan katalog makanan, dan pelajari cara memilih hidangan yang lebih aman.</p></div><span className="gg-section-icon orange gg-section-image"><img src={publicAsset('gastroguard-assets/features/ayuscan.png')} alt="" /></span></div><div className="gg-card gg-scan-launch"><div className="gg-scan-launch-icon"><Utensils size={24}/></div><div><b>Analisis hidangan dari foto atau katalog</b><p>AyuScan membandingkan hasil identifikasi visual dengan data gizi terverifikasi. Foto tidak dapat memastikan keamanan mikrobiologis makanan.</p></div><Link className="gg-button gg-button-teal" to="/scan">Buka AyuScan <ArrowUpRight size={16}/></Link></div></section>
      <section id="herbal" className="gg-section"><div className="gg-section-head"><div><span className="gg-kicker">03 / KEARIFAN LOKAL</span><h2>Herbal & kenyamanan pencernaan</h2><p>Kenali penggunaan tradisional beserta batas bukti dan kewaspadaannya.</p></div><span className="gg-section-icon gg-section-image"><img src={publicAsset('gastroguard-assets/features/herbal-guide.png')} alt="" /></span></div><HerbalGuide/></section>
      <section id="gastrobot" className="gg-section"><div className="gg-section-head"><div><span className="gg-kicker">04 / GASTROBOT AI</span><h2>Pertolongan awal & bantuan terdekat</h2><p>Chatbot berbasis AI dan pencarian layanan kesehatan di sekitar.</p></div><span className="gg-section-icon coral gg-section-image"><img src={publicAsset('gastroguard-assets/features/gastrobot.png')} alt="" /></span></div><div className="gg-bot-grid"><GastroBot/><ClinicLocator/></div></section>
      <section className="gg-bottom-grid">
        <div className="gg-card gg-check-card">
          <div className="gg-mini-head">
            <span className="gg-section-icon"><ClipboardCheck size={18}/></span>
            <div><span className="gg-kicker">PRE-TRAVEL CHECKLIST</span><h3>Bekal pencernaan</h3></div>
            <span className="gg-check-count">{Object.values(checked).filter(Boolean).length}/{checklistItems.length}</span>
          </div>
          <div className="gg-check-list">{checklistItems.map((item) => (
            <label key={item} className={checked[item] ? 'done' : ''}>
              <button onClick={() => setChecked((state) => ({ ...state, [item]: !state[item] }))}>{checked[item] && <Check size={13}/>}</button>
              {item}
            </label>
          ))}</div>
        </div>
        <GutDefender/>
      </section>
      <footer className="gg-footer"><Link className="gg-brand" to="/"><img className="gg-brand-mark gg-brand-logo" src={publicAsset('gastroguard-assets/logo.png')} alt="" /><span><b>GastroGuard <em>AI</em></b><small>TRAVEL HEALTH COMPANION</small></span></Link><p>Informasi bersifat edukatif dan tidak menggantikan diagnosis atau perawatan tenaga kesehatan profesional.</p><span>© 2026 GastroGuard AI</span></footer>
    </main>
    {welcomeOpen && <div className="gg-welcome-overlay" role="presentation"><section className="gg-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="gg-welcome-title"><img src={publicAsset('gastroguard-assets/logo.png')} alt="Logo GastroGuard" /><span className="gg-kicker">TRAVEL HEALTH COMPANION</span><h2 id="gg-welcome-title">Selamat datang di GastroGuard AI</h2><p>Teman perjalanan untuk membantu menjaga kesehatan pencernaan, memilih makanan, dan menemukan edukasi yang relevan.</p><button onClick={() => { localStorage.setItem('gastroguard_welcome_seen', '1'); setWelcomeOpen(false); }}>Mulai jelajahi <ArrowUpRight size={16}/></button><small>Informasi di sini bersifat edukatif dan bukan pengganti saran tenaga kesehatan.</small></section></div>}
    <nav className="gg-mobile-nav"><Link to="/" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ShieldCheck size={19}/><span>Beranda</span></Link><Link to="/predict"><Activity size={19}/><span>Prediksi</span></Link><button onClick={() => goToSection('scan')}><Utensils size={19}/><span>AyuScan</span></button><button onClick={() => goToSection('herbal')}><Leaf size={19}/><span>Herbal</span></button><Link to="/gastrobot"><MessageCircle size={19}/><span>GastroBot</span></Link></nav>
    {loginOpen && <div className="gg-login-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}><form className="gg-login-card" onSubmit={handleLogin}><button type="button" className="gg-login-close" aria-label="Tutup" onClick={() => setLoginOpen(false)}><X size={17}/></button><img className="gg-brand-mark gg-brand-logo" src={publicAsset('gastroguard-assets/logo.png')} alt="" /><span className="gg-kicker">AKUN GASTROGUARD</span><h2>Selamat datang, traveler</h2><p>Masuk menggunakan nama panggilan untuk menyimpan riwayat konseling pada perangkat ini.</p><label>Nama panggilan<input value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Nama kamu" autoComplete="nickname"/></label><label className="gg-privacy-check"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)}/>Saya memahami riwayat konseling disimpan secara lokal pada perangkat ini.</label>{loginError && <small className="gg-login-error">{loginError}</small>}<button className="gg-login-submit" type="submit">Masuk / Buat profil</button></form></div>}
  </div>;
}
