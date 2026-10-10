import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import PredictionPage from './pages/PredictionPage';
import GastroBotPage from './pages/GastroBotPage';
import Scan from './pages/Scan';
import './index.css';
function App() {
  return <Router><Routes><Route path="/" element={<Home/>}/><Route path="/home" element={<Home/>}/><Route path="/predict" element={<PredictionPage/>}/><Route path="/gastrobot" element={<GastroBotPage/>}/><Route path="/chat" element={<GastroBotPage/>}/><Route path="/scan" element={<Scan/>}/><Route path="/tracking" element={<Home/>}/><Route path="/checklist" element={<Home/>}/><Route path="/education" element={<Home/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Router>;
}
export default App;
