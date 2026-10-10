import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="desktop-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>RANSTAL</h3>
                    <p>Panduan kesehatan dan nutrisi perjalanan yang ringan, cepat, dan ramah untuk keluarga.</p>
                </div>
                <div className="footer-section">
                    <h4>Tautan Cepat</h4>
                    <ul>
                        <li><Link to="/home">Beranda</Link></li>
                        <li><Link to="/scan">Scan Makanan</Link></li>
                        <li><Link to="/chat">Ranstal AI</Link></li>
                        <li><Link to="/progress">Pantauan Kesehatan</Link></li>
                        <li><Link to="/education">Edukasi Kesehatan</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Bantuan & Info</h4>
                    <ul>
                        <li><Link to="/scan">Cara Menggunakan Ranstal</Link></li>
                        <li><Link to="/education">Panduan Kesehatan & Edukasi</Link></li>
                        <li><Link to="/privacy">Kebijakan Privasi</Link></li>
                        <li><Link to="/profile">Profil & Pengaturan</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} RANSTAL. Semua hak dilindungi.</p>
            </div>
        </footer>
    );
};

export default Footer;
