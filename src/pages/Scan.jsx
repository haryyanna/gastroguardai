import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Sparkles, AlertTriangle, RotateCcw, Upload, SwitchCamera, ScanLine, Lightbulb, BookOpenCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { enqueueSheetsBackup } from '../lib/sheetsBackup';
import { analyzeFoodOrDrinkImage } from '../lib/nutriApi';
import { recognizeFoodInBrowser } from '../lib/browserFoodRecognition';
import { VERIFIED_FOODS, findVerifiedFood, normalizeFoodData } from '../../data/verifiedFoods';
import { VERIFIED_DRINKS } from '../data/verifiedDrinks';
import './Scan.css';

const SCAN_CATALOG = [
  ...VERIFIED_FOODS.map((item) => ({ ...item, isDrink: false, scanKey: `food:${item.id}` })),
  ...VERIFIED_DRINKS.map((item) => ({ ...item, isDrink: true, scanKey: `drink:${item.id}` }))
];
const MAX_IMAGE_DATA_URL_LENGTH = 3_700_000;
const normalizeScanItem = (item, source) => {
  if (item?.isDrink) {
    return {
      ...item,
      source,
      isFood: false,
      isDrink: true,
      safetyTips: item.tips,
      servingRecommendation: item.servingDescription,
      additionalRecommendations: [],
      allergens: ''
    };
  }
  return normalizeFoodData({ ...item, source });
};
const encodeScanImage = (sourceCanvas) => {
  let width = sourceCanvas.width;
  let height = sourceCanvas.height;
  const qualities = [0.82, 0.72, 0.62, 0.52];

  for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);

    for (const quality of qualities) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
    }

    if (Math.max(width, height) <= 512) break;
    const scale = Math.min(0.8, 512 / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  throw new Error('Foto terlalu besar untuk dianalisis. Pilih foto dengan resolusi lebih rendah.');
};

const Scan = () => {
  const videoRef = useRef(null), canvasRef = useRef(null), inputRef = useRef(null), streamRef = useRef(null);
  const cameraAttemptRef = useRef(0);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraState, setCameraState] = useState('loading');
  const [cameraError, setCameraError] = useState('');
  const [hasFlash, setHasFlash] = useState(false);
  const [photo, setPhoto] = useState(''), [selectedFoodId, setSelectedFoodId] = useState('');
  const [showAllFoods, setShowAllFoods] = useState(false), [foodSearch, setFoodSearch] = useState('');
  const [scanSteps, setScanSteps] = useState(''), [progress, setProgress] = useState(0), [scannedFood, setScannedFood] = useState(null);
  const stopCamera = useCallback(() => {
    cameraAttemptRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);
  const startCamera = useCallback(async () => {
    stopCamera(); setCameraError(''); setCameraState('loading');
    const attempt = cameraAttemptRef.current;
    try {
      if (!window.isSecureContext) throw new Error('Kamera membutuhkan koneksi HTTPS. Buka alamat https:// dari server jaringan, lalu izinkan sertifikat dan akses kamera.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser ini tidak mendukung akses kamera.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (attempt !== cameraAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!videoRef.current) {
        stopCamera();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (attempt !== cameraAttemptRef.current) return;
      setCameraState('ready');
    } catch (error) {
      if (attempt !== cameraAttemptRef.current) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraError(error.name === 'NotAllowedError' ? 'Izin kamera ditolak. Aktifkan izin kamera pada browser, lalu coba lagi.' : error.message || 'Kamera tidak dapat dibuka.');
      setCameraState('error');
    }
  }, [facingMode, stopCamera]);
  useEffect(() => { startCamera(); return stopCamera; }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video?.videoWidth || !canvas) return;
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      setPhoto(encodeScanImage(canvas));
      stopCamera();
      setCameraState('preview');
    } catch (error) {
      setCameraError(error.message);
    }
  };
  const handleUpload = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('image/')) {
      setCameraError('File yang dipilih harus berupa foto atau gambar.');
      setCameraState('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setCameraError('');
        try {
          setPhoto(encodeScanImage(canvas));
          stopCamera();
          setCameraState('preview');
        } catch (error) {
          setCameraError(error.message);
          setCameraState('error');
        }
      };
      image.onerror = () => {
        setCameraError('Format foto tidak didukung browser ini. Simpan foto sebagai JPEG atau PNG, lalu pilih kembali.');
        setCameraState('error');
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => { setCameraError('Foto tidak dapat dibaca. Silakan pilih file gambar lain.'); setCameraState('error'); };
    reader.readAsDataURL(file);
  };
  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0]; if (!track?.applyConstraints) return;
    try { const next = !hasFlash; await track.applyConstraints({ advanced: [{ torch: next }] }); setHasFlash(next); } catch { setCameraError('Lampu flash tidak tersedia pada kamera ini.'); }
  };
  const saveScanToHistory = (food) => {
    const username = localStorage.getItem('moodify_currentUser') || localStorage.getItem('ranstal_currentUser');
    if (!username || !food || typeof food !== 'object') return;
    try {
      const key = `moodify_data_${username}`;
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const scan = { 
        date: new Date().toISOString(), 
        foodId: food?.id || 'unknown', 
        name: food?.name || 'Makanan', 
        grade: food?.grade || 'B', 
        calories: Number(food?.calories) || 0, 
        protein: Number(food?.protein) || 0, 
        fat: Number(food?.fat) || 0, 
        carbs: Number(food?.carbs) || 0, 
        source: food?.source || 'Database Makanan Ranstal'
      };
      data.scanHistory = Array.isArray(data.scanHistory) ? data.scanHistory : [];
      data.scanHistory.push(scan);
      data.gamification = data.gamification || { xp: 0, level: 1, badges: [] };
      if (typeof data.gamification?.xp === 'number') data.gamification.xp += 15;
      if (typeof data.gamification?.level === 'number') data.gamification.level = Math.max(1, Math.floor(data.gamification.xp / 60) + 1);
      localStorage.setItem(key, JSON.stringify(data));
      if (localStorage.getItem('moodify_currentUser') !== username) localStorage.setItem('moodify_currentUser', username);
      enqueueSheetsBackup({ eventType: 'food_scan', username, payload: scan });
    } catch (error) { console.warn('Tidak dapat menyimpan riwayat scan', error); }
  };

  const startAnalysis = async () => {
    if (!photo) return;
    setCameraState('scanning');
    setProgress(8);
    const steps = ['Mengirim foto ke server...', 'Mengenali makanan atau minuman...', 'Mencari data gizi...', 'Menyiapkan ringkasan nutrisi...'];
    let index = 0;
    let usingBrowserRecognition = false;
    setScanSteps(steps[index]);

    const timer = window.setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      if (!usingBrowserRecognition) setScanSteps(steps[index]);
      setProgress((value) => Math.min(value + 16, 88));
    }, 900);

    try {
      const selectedFood = SCAN_CATALOG.find((item) => item.scanKey === selectedFoodId);
      const matchedFood = selectedFood || findVerifiedFood(selectedFoodId || 'makanan');
      let result = null;
      let analysisError = null;
      let browserRecognition = null;
      try {
        result = await analyzeFoodOrDrinkImage({
          imageB64: selectedFoodId ? '' : photo,
          searchHint: matchedFood?.name || '',
          catalogKey: selectedFoodId
        });
      } catch (error) {
        analysisError = error;
      }
      if (!result?.result && !matchedFood) {
        try {
          usingBrowserRecognition = true;
          setScanSteps('Memeriksa foto dengan pengenalan di perangkat...');
          browserRecognition = await recognizeFoodInBrowser(photo, setScanSteps);
        } catch (error) {
          console.warn('Pengenalan makanan di browser gagal:', error);
        }
      }
      const valueToAnalyze = result?.result || matchedFood || browserRecognition?.food;
      if (!valueToAnalyze && analysisError) {
        throw new Error(`Foto belum bisa dikenali otomatis. Server scan tidak tersedia (${analysisError.message}); pengenalan di perangkat juga tidak menemukan kecocokan yang cukup jelas. Pastikan koneksi internet aktif, atau pilih jenis makanan secara manual.`);
      }
      if (!valueToAnalyze) throw new Error('Makanan belum teridentifikasi. Pilih jenis makanan yang paling sesuai, lalu coba lagi.');
      const source = result?.source || (browserRecognition ? 'browser-vision-prediction' : 'Database Makanan Ranstal');
      const food = normalizeScanItem(valueToAnalyze, source);

      setScannedFood(food);
      setProgress(100);
      saveScanToHistory(food);
      setCameraState('result');
      setCameraError('');
    } catch (error) {
      console.error('Error saat analisis:', error);
      const message = error?.message || 'Makanan belum teridentifikasi. Pilih jenis makanan yang paling sesuai, lalu coba lagi.';
      setCameraError(message);
      setCameraState('preview');
    } finally {
      window.clearInterval(timer);
    }
  };

  const resetScanner = () => { setPhoto(''); setProgress(0); setScannedFood(null); setSelectedFoodId(''); startCamera(); };
  const normalizedFoodSearch = foodSearch.trim().toLowerCase();
  const visibleFoods = SCAN_CATALOG.filter((item) => {
    if (!normalizedFoodSearch) return showAllFoods || SCAN_CATALOG.indexOf(item) < 5;
    const terms = [item.name, ...(item.terms || []), ...(item.searchTerms || [])].join(' ').toLowerCase();
    return terms.includes(normalizedFoodSearch);
  });
  const food = scannedFood;
  const safetyInterpretation = food?.isDrink
      ? 'Informasi gula dan kalori ini adalah perkiraan katalog per sajian, bukan hasil pembacaan label produk. Foto tidak memastikan kandungan, kebersihan, atau keamanan minuman.'
    : food?.status === 'Sangat Aman'
      ? 'Label ini adalah ringkasan katalog, bukan jaminan higienitas. Pastikan makanan matang sempurna, tersaji segar, dan sesuai alergi serta kondisi kesehatanmu.'
    : food?.status === 'Perlu Hati-hati'
        ? 'Periksa cara penyajian, kematangan, kebersihan, ukuran porsi, dan bahan pemicu alergi. Foto saja tidak dapat memastikan makanan bebas kuman.'
      : food?.status === 'Bukan Makanan'
          ? 'Objek yang dipindai belum teridentifikasi sebagai makanan. Jangan konsumsi berdasarkan hasil AI saja; periksa bahan dan cara penyajiannya.'
          : 'Katalog memberi peringatan umum, bukan penilaian keamanan aktual. Pilih makanan matang menyeluruh dan hindari sajian yang lama berada di suhu ruang.';

  return (
    <div className="scan-container">
      <header className="scan-header">
        <Link to="/" className="scan-back-link"><ArrowLeft size={17}/> Beranda</Link>
        <div className="feature-heading">
          <ScanLine className="feature-heading-icon" />
          <h2 className="title">Scan Makanan & Minuman</h2>
        </div>
        <p className="subtitle">Kenali makanan dan minuman dari foto, lalu cocokkan dengan katalog gizi.</p>
      </header>

      <section className="gemini-key-card">
        <div className="gemini-key-heading"><Sparkles size={18}/><span><b>Identifikasi AI di server</b><small>Foto dianalisis lewat backend; API key tidak disimpan di browser.</small></span></div>
        <small>Hasil identifikasi dicocokkan dengan katalog gizi makanan dan minuman. Perkiraan gizi maupun foto tidak dapat memastikan kebersihan atau keamanan pangan.</small>
      </section>
      
      <div className="drink-selector-wrapper">
        <label>Pilih makanan atau minuman jika scan otomatis belum tersedia</label>
        <input
          className="food-search-input"
          value={foodSearch}
          onChange={(event) => setFoodSearch(event.target.value)}
          placeholder="Cari nasi, apel, ayam, air kelapa, teh..."
          aria-label="Cari makanan atau minuman"
        />
        <div className="selector-grid">
          {visibleFoods.map((item) => (
            <button 
              key={item.scanKey}
              className={`select-chip ${selectedFoodId === item.scanKey ? 'active' : ''}`}
              onClick={() => setSelectedFoodId(selectedFoodId === item.scanKey ? '' : item.scanKey)}
            >
              <span>{item.emoji}</span> {item.name.split(' ').slice(0, 2).join(' ')}{item.scanKey.startsWith('drink:') ? ' · Minuman' : ''}
            </button>
          ))}
        </div>
        {!normalizedFoodSearch && <button 
          type="button" 
          className="toggle-drinks-btn" 
          onClick={() => setShowAllFoods((value) => !value)}
        >
          {showAllFoods ? 'Tampilkan lebih sedikit' : `Tampilkan selengkapnya (${SCAN_CATALOG.length - 5} lainnya)`}
        </button>}
        {normalizedFoodSearch && visibleFoods.length === 0 && <p className="food-search-empty">Belum ada di katalog. Coba kata lain atau gunakan scan otomatis.</p>}
      </div>
      
      <button 
        type="button" 
        className="upload-file-btn" 
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={18} /> Upload foto dari galeri / file
      </button>
      
      <div className="camera-viewport-card">
        {(cameraState === 'loading' || cameraState === 'ready') && (
          <div className="camera-live">
            <video ref={videoRef} className="camera-video" playsInline muted />
            <div className="scan-guide-box guide-green">
              <span className="guide-label">ARAHKAN KE MAKANAN ATAU MINUMAN</span>
            </div>
            <div className="camera-bar-top">
              <button onClick={toggleFlash} className={`icon-btn ${hasFlash ? 'text-amber' : ''}`} title="Flash">⚡</button>
              <span className="cam-status">KAMERA & SCAN SIAP</span>
              <button className="icon-btn" onClick={() => setFacingMode((mode) => mode === 'environment' ? 'user' : 'environment')} title="Ganti kamera">
                <SwitchCamera size={18} />
              </button>
            </div>
            <div className="camera-bar-bottom">
              <button className="camera-action" onClick={() => inputRef.current?.click()} title="Pilih foto">
                <Upload size={22} />
              </button>
              <button className="shutter-btn" disabled={cameraState === 'loading'} onClick={capturePhoto} title="Ambil foto">
                <div className="inner-shutter" />
              </button>
              <span className="camera-action"><Camera size={22} /></span>
            </div>
          </div>
        )}
        
        {cameraState === 'error' && (
          <div className="camera-preview camera-error">
            <AlertTriangle size={44} />
            <h3>Kamera belum tersedia</h3>
            <p>{cameraError}</p>
            <button className="btn-primary" onClick={startCamera}><Camera size={16} /> Coba buka kamera</button>
            <button className="btn-secondary" onClick={() => inputRef.current?.click()}><Upload size={16} /> Pilih foto</button>
          </div>
        )}
        
        {cameraState === 'preview' && (
          <div className="camera-preview">
            <h3 className="preview-heading">Hasil Tangkapan</h3>
            <img className="captured-image-box captured-photo" src={photo} alt="Foto makanan untuk diperiksa" />
            <p className="analysis-error">{cameraError}</p>
            <div className="action-buttons">
              <button className="btn-secondary" onClick={resetScanner}><RotateCcw size={16} /> Foto Ulang</button>
              <button className="btn-primary" onClick={startAnalysis}><Sparkles size={16} /> Analisa Foto</button>
            </div>
          </div>
        )}
        
        {cameraState === 'scanning' && (
          <div className="camera-scanning">
            <div className="radar-circle">
              <div className="scan-line" />
              <Camera size={56} />
            </div>
            <h3 className="scanning-title">Menganalisis Foto</h3>
            <p className="scanning-step">{scanSteps}</p>
            <div className="progress-bar-container">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-percentage">{progress}%</span>
          </div>
        )}
        
        {cameraState === 'result' && food && (
          <div className="scan-result-card animate-fade-in">
            <div className="result-header">
              <span className="result-emoji">{food.emoji || '🍽️'}</span>
              <div>
                <h3 className="drink-title">{food.name}</h3>
                <span className="drink-cat">{food.category}</span>
              </div>
            </div>
            <div className="scan-insight-grid">
              <div className="scan-insight-item">
                <Lightbulb size={19} />
                <div>
                  <strong>Mengapa diperiksa?</strong>
                  <p>{food.isFood === false
                          ? food.isDrink
                            ? 'Hasil ini adalah estimasi gula dan kalori minuman dari katalog, bukan pembacaan label merek atau uji keamanan.'
                            : 'Objek yang dipindai tidak jelas sebagai makanan. Pastikan Anda memindai makanan yang aman dan sesuai untuk dikonsumsi.'
                    : food.source === 'browser-vision-prediction'
                      ? 'Ini prediksi visual dari model di browser. Periksa nama makanan agar sesuai dengan foto sebelum memakai informasi gizinya.'
                      : 'Gunakan hasil katalog sebagai perkiraan gizi. Periksa kembali nama, porsi, bahan, dan label produk sebelum mengambil keputusan konsumsi.'}</p>
                </div>
              </div>
              <div className="scan-insight-item">
                <BookOpenCheck size={19} />
                <div>
                  <strong>Cara membaca hasil</strong>
                  <p>Nilai gizi adalah estimasi katalog dan dapat berbeda menurut resep serta porsi. Grade bukan pemeriksaan kuman, kesegaran, alergen, atau jaminan aman dikonsumsi.</p>
                </div>
              </div>
            </div>
            <div className="result-meta-strip">
              <span className="result-badge status-badge" style={{ background: food.gradeColor }}>
                Katalog: {food.status}
              </span>
              <span className="result-badge secondary-badge">
                {food.isDrink ? 'Estimasi minuman' : food.isFood === false ? 'Cek ulang' : food.visualAnalysis ? 'Identifikasi Gemini' : food.source === 'browser-vision-prediction' ? 'Prediksi visual' : food.source?.startsWith('Pilihan manual') ? 'Dipilih manual' : 'Data katalog'}
              </span>
            </div>
            {food.visualAnalysis && <div className="scan-visual-note"><Sparkles size={17}/><div><strong>Identifikasi visual Gemini · {Math.round(food.visualAnalysis.confidence * 100)}% keyakinan</strong><p>{food.visualAnalysis.visibleCondition || food.visualAnalysis.reason || 'Tidak ada detail visual tambahan.'} Keyakinan AI bukan ukuran akurasi terkalibrasi. Pastikan nama hidangan cocok dengan foto.</p></div></div>}
            <div className="grade-badge-row">
              <div className="nutriscore-badge" style={{ backgroundColor: food.gradeColor }}>
                <span className="score-lbl">Kode katalog</span>
                <span className="score-val">{food.grade}</span>
              </div>
              <div className="health-status-msg">
                <span className="status-title">Catatan katalog</span>
                <span className="status-desc" style={{ color: food.gradeColor }}>{food.status}</span>
              </div>
            </div>
            <div className="nutrition-details-table">
              {(food?.nutritionList || []).map((item, index) => (
                <div key={index} className="details-row">
                  <span className="lbl">{item.label}</span>
                  <div className="val-group">
                    <span className="val">{item.value}</span>
                    <span className="desc">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="interpretation-box">
              <p className="interpretation-text">{safetyInterpretation}</p>
            </div>
            <p className="scan-data-source">Sumber identifikasi: {food.source || 'katalog lokal'}. Perkiraan gizi tidak menggantikan label produk atau saran ahli gizi.</p>
            <div className="tips-section">
              <div className="tips-section-block">
                <h4>Rekomendasi penyajian</h4>
                <p>{food.servingRecommendation || 'Sajikan dengan porsi sesuai usia, pastikan bersih, dan tetap seimbang dengan hidrasi.'}</p>
              </div>
              <div className="tips-section-block">
                <h4>Tips Keamanan</h4>
                <p>{food.safetyTips}</p>
              </div>
              <ul className="recommendation-list">
                {(food.additionalRecommendations || []).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
              {food.allergens && food.allergens !== 'Tidak ada' && (
                <p className="allergen-warning">⚠️ Alergen: {food.allergens}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden-canvas" />
      <input ref={inputRef} className="hidden-file-input" type="file" accept="image/*" onChange={handleUpload} />
    </div>
  );
};
export default Scan;
