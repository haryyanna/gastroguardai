import { useMemo, useState } from 'react';
import { Activity, ArrowUpRight, BadgeInfo, ChartNoAxesCombined, CircleAlert, Database, Download, FileImage, FileSpreadsheet, Info, MapPin, Printer, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PredictionPage.css';
import './PredictionExport.css';

const VARIABLES = [
  { key: 'rain', label: 'Curah hujan', unit: 'mm', color: '#168c84' },
  { key: 'humidity', label: 'Kelembapan', unit: '%', color: '#4f8cbf' },
  { key: 'temperature', label: 'Suhu', unit: '°C', color: '#ed8a45' },
  { key: 'sanitation', label: 'Skor sanitasi', unit: '/5', color: '#8a72b8' },
  { key: 'outbreak', label: 'Laporan wabah lokal', unit: 'kasus', color: '#d8654b' },
];
const TARGETS = ['Diare wisatawan', 'Kasus diare akut', 'KLB gastroenteritis'];
const DESTINATIONS = ['Gianyar, Bali', 'Ubud, Gianyar', 'Sanur, Denpasar', 'Kuta, Badung', 'Nusa Penida, Klungkung'];
const avg = (items) => items.reduce((sum, value) => sum + value, 0) / (items.length || 1);
const sd = (items) => Math.sqrt(avg(items.map((value) => (value - avg(items)) ** 2))) || 1;

function makeDemo(target) {
  return Array.from({ length: 24 }, (_, index) => {
    const season = Math.sin((index / 12) * Math.PI * 2 - 0.7);
    const rain = Math.round(130 + season * 86 + (index % 4) * 9);
    const humidity = Math.round(74 + season * 8 + (index % 3));
    const temperature = +(28.2 + season * 1.7 + ((index % 5) - 2) * 0.12).toFixed(1);
    const sanitation = +(3.2 + ((index + 1) % 4) * 0.25).toFixed(1);
    const outbreak = (index % 7 === 0 ? 4 : index % 5 === 0 ? 2 : 0);
    const multiplier = target === TARGETS[2] ? 0.32 : target === TARGETS[1] ? 1.18 : 1;
    const cases = Math.max(3, Math.round((18 + rain * 0.045 + humidity * 0.16 + (5 - sanitation) * 5.4 + outbreak * 2.4 + Math.max(0, temperature - 28) * 1.8 + season * 5) * multiplier));
    return { cases, rain, humidity, temperature, sanitation, outbreak };
  });
}
function toCsv(rows) { return rows.map((row) => [row.cases, row.rain, row.humidity, row.temperature, row.sanitation, row.outbreak].join(',')).join('\n'); }
function parseCsv(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => line.split(/[;,\t]/).map((field) => Number(field.trim()))).filter((fields) => fields.length >= 5 && fields.every(Number.isFinite)).map(([cases, rain, humidity, temperature, sanitation, outbreak = 0]) => ({ cases, rain, humidity, temperature, sanitation, outbreak }));
}
function solve(matrix, values) {
  const n = values.length;
  const a = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    if (Math.abs(a[pivot][column]) < 1e-9) return null;
    [a[column], a[pivot]] = [a[pivot], a[column]];
    const divisor = a[column][column];
    for (let j = column; j <= n; j += 1) a[column][j] /= divisor;
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = a[row][column];
      for (let j = column; j <= n; j += 1) a[row][j] -= factor * a[column][j];
    }
  }
  return a.map((row) => row[n]);
}
function fitArimax(rows, variables) {
  const target = rows.map((row) => row.cases);
  const countMean = avg(target);
  const countSd = sd(target);
  const scales = Object.fromEntries(variables.map((key) => [key, { mean: avg(rows.map((row) => row[key])), sd: sd(rows.map((row) => row[key])) }]));
  const matrix = rows.slice(1).map((row, index) => [1, (target[index] - countMean) / countSd, ...variables.map((key) => (row[key] - scales[key].mean) / scales[key].sd)]);
  const outcome = target.slice(1).map((value) => (value - countMean) / countSd);
  const xtx = matrix[0].map((_, i) => matrix[0].map((_, j) => matrix.reduce((sum, row) => sum + row[i] * row[j], 0)));
  const xty = matrix[0].map((_, i) => matrix.reduce((sum, row, index) => sum + row[i] * outcome[index], 0));
  const coefficients = solve(xtx, xty);
  if (!coefficients) return null;
  const residuals = matrix.map((row, index) => (outcome[index] - row.reduce((sum, value, j) => sum + value * coefficients[j], 0)) * countSd);
  const rmse = Math.sqrt(avg(residuals.map((value) => value ** 2)));
  return { coefficients, countMean, countSd, scales, rmse, observations: matrix.length };
}
function forecast(model, rows, variables, futureX, horizon) {
  const result = [];
  let previous = rows.at(-1).cases;
  for (let period = 0; period < horizon; period += 1) {
    const normalizedLag = (previous - model.countMean) / model.countSd;
    const inputs = [1, normalizedLag, ...variables.map((key) => (futureX[key] - model.scales[key].mean) / model.scales[key].sd)];
    const normalized = inputs.reduce((sum, value, index) => sum + value * model.coefficients[index], 0);
    previous = Math.max(0, model.countMean + normalized * model.countSd);
    result.push(Math.round(previous * 10) / 10);
  }
  return result;
}

export default function PredictionPage() {
  const [target, setTarget] = useState(TARGETS[0]);
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [dataset, setDataset] = useState(() => makeDemo(TARGETS[0]));
  const [csv, setCsv] = useState(() => toCsv(makeDemo(TARGETS[0])));
  const [demo, setDemo] = useState(true);
  const [variables, setVariables] = useState(['rain', 'humidity', 'temperature', 'sanitation']);
  const [horizon, setHorizon] = useState(3);
  const [futureX, setFutureX] = useState({ rain: 140, humidity: 78, temperature: 29, sanitation: 3.5, outbreak: 0 });
  const [inputError, setInputError] = useState('');
  const parsedRows = useMemo(() => parseCsv(csv), [csv]);
  const rows = demo ? dataset : parsedRows;
  const model = variables.length > 0 && rows.length > variables.length + 3 ? fitArimax(rows, variables) : null;
  const predictions = model ? forecast(model, rows, variables, futureX, horizon) : [];
  const last = rows.at(-1)?.cases ?? 0;
  const change = predictions.length ? ((predictions.at(-1) - last) / Math.max(last, 1)) * 100 : 0;
  const chartValues = [...rows.slice(-8).map((row) => row.cases), ...predictions];
  const chartMax = Math.max(1, ...chartValues);
  const toggleVariable = (key) => setVariables((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  const handleCsv = (value) => { setCsv(value); setDemo(false); const rowsParsed = parseCsv(value); setInputError(rowsParsed.length < value.trim().split(/\r?\n/).filter(Boolean).length ? 'Pastikan setiap baris berisi angka: kasus, hujan, kelembapan, suhu, sanitasi, laporan wabah.' : ''); };
  const loadDemo = () => { const sample = makeDemo(target); setDataset(sample); setCsv(toCsv(sample)); setDemo(true); setInputError(''); };
  const changeTarget = (value) => { setTarget(value); if (demo) { const sample = makeDemo(value); setDataset(sample); setCsv(toCsv(sample)); } };
  const exportCsv = () => {
    const source = demo ? 'data_sintetis_demo' : 'data_pengguna';
    const headers = ['periode', 'jenis_data', 'destinasi', 'target', 'bulan_ramalan', 'kasus', ...VARIABLES.map((variable) => variable.key), 'sumber_data'];
    const historical = rows.map((row, index) => [index + 1, 'historis', destination, target, '', row.cases, ...VARIABLES.map((variable) => row[variable.key]), source]);
    const forecasts = predictions.map((cases, index) => [rows.length + index + 1, 'ramalan', destination, target, index + 1, cases, ...VARIABLES.map((variable) => futureX[variable.key]), source]);
    const content = [headers, ...historical, ...forecasts].map((row) => row.map((field) => typeof field === 'string' && /[",\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gut-predict-${destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 900;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#f4faf8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.roundRect(48, 48, 1304, 804, 32);
    context.fill();
    context.fillStyle = '#0f766e';
    context.font = '700 24px Arial';
    context.fillText('GASTROGUARD AI · GUT-PREDICT ENGINE', 96, 116);
    context.fillStyle = '#163b3a';
    context.font = '700 42px Arial';
    context.fillText('Prediksi risiko cerna', 96, 178);
    context.fillStyle = '#718581';
    context.font = '22px Arial';
    context.fillText(`${destination} · ${target}`, 96, 222);
    context.fillStyle = '#0f766e';
    context.font = '700 36px Arial';
    context.fillText(`${predictions.at(-1)} kasus`, 96, 294);
    context.fillStyle = '#83918d';
    context.font = '18px Arial';
    context.fillText(`Ramalan bulan ke-${horizon} · ${change >= 0 ? '+' : ''}${change.toFixed(1)}% dari data terakhir`, 96, 328);
    const chartLeft = 110;
    const chartTop = 390;
    const chartHeight = 300;
    const chartWidth = 1180;
    context.strokeStyle = '#e4eeea';
    context.lineWidth = 2;
    for (let line = 0; line <= 4; line += 1) {
      const y = chartTop + (chartHeight * line) / 4;
      context.beginPath(); context.moveTo(chartLeft, y); context.lineTo(chartLeft + chartWidth, y); context.stroke();
    }
    const barWidth = Math.min(46, chartWidth / (chartValues.length * 1.8));
    const gap = chartWidth / chartValues.length;
    chartValues.forEach((value, index) => {
      const height = Math.max(5, (value / chartMax) * chartHeight);
      context.fillStyle = index >= rows.slice(-8).length ? '#f39b62' : '#52b89e';
      context.beginPath();
      context.roundRect(chartLeft + index * gap + (gap - barWidth) / 2, chartTop + chartHeight - height, barWidth, height, [8, 8, 2, 2]);
      context.fill();
      context.fillStyle = '#728580';
      context.font = '14px Arial';
      const label = index >= rows.slice(-8).length ? `+${index - rows.slice(-8).length + 1}` : index === rows.slice(-8).length - 1 ? 'Kini' : '';
      if (label) context.fillText(label, chartLeft + index * gap + (gap - context.measureText(label).width) / 2, chartTop + chartHeight + 28);
    });
    context.fillStyle = '#82918d';
    context.font = '16px Arial';
    context.fillText(`ARIMAX(1,0,0) · ${model.observations} observasi · RMSE in-sample ${model.rmse.toFixed(1)} kasus`, 96, 764);
    context.fillStyle = '#a07540';
    context.font = '15px Arial';
    context.fillText(`${demo ? 'Data sintetis/demo' : 'Data pengguna'} bukan surveilans terverifikasi. Bukan diagnosis atau peringatan resmi.`, 96, 800);
    const link = document.createElement('a');
    link.download = `gut-predict-${destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return <main className="gg-prediction-page"><header className="gg-prediction-header"><Link to="/" className="gg-back-home"><img className="gg-prediction-logo" src="/gastroguard-assets/logo.png" alt="" /> GastroGuard AI</Link><span><MapPin size={15}/> PREDIKSI DESTINASI</span></header><div className="gg-prediction-content"><div className="gg-prediction-intro"><span className="gg-prediction-kicker"><img src="/gastroguard-assets/features/gut-predict.png" alt="" /><span className="gg-kicker">GUT-PREDICT ENGINE · ARIMAX</span></span><h1>Prediksi risiko cerna<br/>untuk keputusan perjalanan.</h1><p>Pilih kasus yang dipantau, tentukan variabel X, lalu latih model dari deret historis bulanan.</p></div>
      <div className="gg-model-notice"><BadgeInfo size={18}/><div><b>Transparansi model</b><span>Model ARIMAX(1,0,0) dihitung dari data yang kamu masukkan. Sampel awal di bawah ini adalah data sintetis untuk demonstrasi, bukan angka surveilans atau model tervalidasi. Gunakan data lokal terverifikasi sebelum mengambil keputusan kesehatan.</span></div><span className={demo ? 'gg-data-badge synthetic' : 'gg-data-badge'}>{demo ? 'DATA SINTETIS' : 'DATA PENGGUNA'}</span></div>
      <section className="gg-card gg-config-card"><div className="gg-prediction-card-head"><span className="gg-prediction-number">01</span><div><h2>Konfigurasikan prediksi</h2><p>Tentukan variabel kasus target dan faktor X (eksogen).</p></div><SlidersHorizontal size={19}/></div><div className="gg-prediction-fields"><label>DESTINASI<select value={destination} onChange={(event) => setDestination(event.target.value)}>{DESTINATIONS.map((value) => <option key={value}>{value}</option>)}</select></label><label>KASUS YANG DIPREDIKSI<select value={target} onChange={(event) => changeTarget(event.target.value)}>{TARGETS.map((value) => <option key={value}>{value}</option>)}</select></label><label>JANGKA RAMALAN<select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((value) => <option value={value} key={value}>{value} bulan ke depan</option>)}</select></label></div><div className="gg-x-heading"><b>VARIABEL X · PREDIKTOR EKOGENOUS</b><small>Pilih variabel yang tersedia di dataset.</small></div><div className="gg-x-options">{VARIABLES.map((variable) => <label className={variables.includes(variable.key) ? 'active' : ''} key={variable.key}><input type="checkbox" checked={variables.includes(variable.key)} onChange={() => toggleVariable(variable.key)}/><span className="gg-x-check">{variables.includes(variable.key) ? '✓' : '+'}</span><span><b>{variable.label}</b><small>{variable.unit}</small></span></label>)}</div><div className="gg-future-inputs"><b>ASUMSI X UNTUK PERIODE RAMALAN</b><div>{VARIABLES.filter((variable) => variables.includes(variable.key)).map((variable) => <label key={variable.key}>{variable.label}<span><input type="number" value={futureX[variable.key]} step={variable.key === 'temperature' || variable.key === 'sanitation' ? '0.1' : '1'} min={variable.key === 'sanitation' ? '1' : undefined} max={variable.key === 'sanitation' ? '5' : undefined} onChange={(event) => setFutureX((state) => ({ ...state, [variable.key]: Number(event.target.value) }))}/>{variable.unit}</span></label>)}</div><small>Nilai ini diterapkan pada tiap bulan ramalan. Ganti dengan prakiraan iklim dan sanitasi yang bersumber jelas.</small></div></section>
      <section className="gg-card gg-data-card"><div className="gg-prediction-card-head"><span className="gg-prediction-number">02</span><div><h2>Deret waktu historis</h2><p>{rows.length} baris · target bulanan dan indikator eksogen.</p></div><Database size={19}/></div><div className="gg-csv-label"><span>kasus, hujan_mm, kelembapan_pct, suhu_c, sanitasi_1-5, laporan_wabah</span><button onClick={loadDemo}><RotateCcw size={14}/> Muat data demo</button></div><textarea value={csv} onChange={(event) => handleCsv(event.target.value)} spellCheck="false" aria-label="Deret waktu historis CSV"/><div className="gg-data-footer"><span>Gunakan koma atau titik koma · satu bulan per baris · minimal {variables.length + 4} baris</span><span>{rows.length} baris valid</span></div>{inputError && <p className="gg-input-error"><CircleAlert size={14}/>{inputError}</p>}</section>
      <section className="gg-results-grid"><div className="gg-card gg-result-card"><div className="gg-prediction-card-head"><span className="gg-prediction-number coral">03</span><div><h2>Hasil model</h2><p>{destination} · {target}</p></div><ChartNoAxesCombined size={20}/></div>{!model ? <div className="gg-model-error"><CircleAlert size={17}/> Tambahkan minimal {variables.length + 4} baris numerik dan pilih setidaknya satu variabel X untuk menghitung model.</div> : <><div className="gg-forecast-summary"><span><small>RAMALAN BULAN KE-{horizon}</small><b>{predictions.at(-1)} <i>kasus</i></b></span><span className={change >= 0 ? 'increase' : 'decrease'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%<small>perubahan dari data terakhir</small></span></div><div className="gg-forecast-chart" aria-label="Grafik data aktual dan ramalan"><div className="gg-y-axis"><span>{chartMax}</span><span>{Math.round(chartMax / 2)}</span><span>0</span></div><div className="gg-bars">{chartValues.map((value, index) => <div className={`gg-bar-wrap ${index >= chartValues.length - predictions.length ? 'forecast' : ''}`} key={`${index}-${value}`} title={`${index < chartValues.length - predictions.length ? 'Historis' : 'Ramalan'}: ${value}`}><i style={{ height: `${Math.max(3, (value / chartMax) * 100)}%` }}/><small>{index >= chartValues.length - predictions.length ? `+${index - (chartValues.length - predictions.length) + 1}` : index === chartValues.length - predictions.length - 1 ? 'Kini' : ''}</small></div>)}</div></div><div className="gg-model-stats"><span><small>MODEL</small><b>ARIMAX(1,0,0)</b></span><span><small>OBSERVASI LATIH</small><b>{model.observations} bulan</b></span><span><small>RMSE IN-SAMPLE</small><b>{model.rmse.toFixed(1)} kasus</b></span><span><small>KOEFISIEN AR (φ)</small><b>{model.coefficients[1].toFixed(3)}</b></span></div><div className="gg-prediction-caution"><Info size={15}/><span>Rentang ramalan kasar ±1,96 × RMSE; belum mencakup ketidakpastian parameter. RMSE in-sample bukan bukti akurasi. Evaluasi walk-forward dan data kasus lokal diperlukan sebelum penggunaan operasional.</span></div><div className="gg-export-actions"><button onClick={() => window.print()} disabled={!model}><Printer size={15}/> Unduh PDF</button><button onClick={exportPng} disabled={!model}><FileImage size={15}/> Unduh PNG</button><button onClick={exportCsv} disabled={!model}><FileSpreadsheet size={15}/> Excel (.csv)</button></div></>}</div><aside className="gg-card gg-method-card"><span className="gg-method-icon"><Activity size={20}/></span><h3>Bagaimana model bekerja?</h3><p>Yt = c + φYt−1 + βXₜ + εₜ</p><ul><li><b>Y</b> · kasus sasaran yang kamu pilih</li><li><b>X</b> · curah hujan, kelembapan, suhu, sanitasi, atau laporan wabah</li><li><b>φ</b> · hubungan dengan jumlah kasus bulan sebelumnya</li><li><b>ε</b> · galat yang tidak dijelaskan model</li></ul><div className="gg-method-disclaimer"><CircleAlert size={15}/> Bukan alat diagnosis atau sistem peringatan resmi. Perbarui data dan cek pola musiman sebelum menafsirkan hasil.</div><a href="https://cdc.gov/yellow-book/hcp/preparing-international-travelers/travelers-diarrhea.html" target="_blank" rel="noreferrer" className="gg-source-link">Panduan kesehatan perjalanan CDC <ArrowUpRight size={13}/></a></aside></section><div className="gg-prediction-footer"><Download size={15}/> Untuk penggunaan penelitian, ekspor dan dokumentasikan sumber data, definisi kasus, serta validasi model.</div></div></main>;
}
