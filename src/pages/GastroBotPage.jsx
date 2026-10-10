import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import GastroBot from '../components/GastroBot';
export default function GastroBotPage() {
  return <main className="gg-focus-page"><header><Link to="/" className="gg-focus-back"><img src="/gastroguard-assets/logo.png" alt=""/> <span>Beranda</span></Link><span className="gg-focus-label"><Activity size={16}/> <span>SESI KONSELING</span></span></header><GastroBot standalone/></main>;
}
