import { useState } from 'react';
import { Phone, HeartHandshake, X, PhoneCall, ShieldAlert, Flame, Ambulance, LifeBuoy, Users, ChevronUp } from 'lucide-react';
import './SOSButton.css';

const EMERGENCY_CONTACTS = [
  { name: 'Darurat Nasional', number: '112', description: 'Satu nomor untuk keadaan darurat', icon: ShieldAlert, color: '#dc2626' },
  { name: 'Kepolisian', number: '110', description: 'Laporan keamanan dan kepolisian', icon: ShieldAlert, color: '#2563eb' },
  { name: 'Ambulans / Kemenkes', number: '118 / 119', callNumber: '119', description: 'Bantuan medis dan ambulans', icon: Ambulance, color: '#059669' },
  { name: 'Pemadam Kebakaran', number: '113', description: 'Kebakaran dan penyelamatan', icon: Flame, color: '#ea580c' },
  { name: 'Basarnas / SAR', number: '115', description: 'Pencarian dan pertolongan', icon: LifeBuoy, color: '#0891b2' },
  { name: 'SAPA 129', number: '129', description: 'Perlindungan perempuan dan anak', icon: Users, color: '#7c3aed' },
  { name: '911', number: '911', description: 'Darurat internasional atau wilayah yang mendukung', icon: PhoneCall, color: '#475569' }
];

const SOSButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className={`sos-floating-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        title="Butuh Bantuan Darurat?"
        aria-expanded={isOpen}
        aria-label="Buka nomor bantuan darurat"
      >
        {isOpen ? <ChevronUp size={24} /> : <Phone size={24} />}
      </button>

      {isOpen && (
        <div className="sos-dropdown animate-fade-in" role="dialog" aria-label="Daftar nomor bantuan darurat">
          <div className="sos-dropdown-header">
            <div className="sos-icon-wrapper"><HeartHandshake size={24} /></div>
            <div>
              <h2>Bantuan Darurat</h2>
              <p>Pilih layanan yang paling sesuai. Ketuk nomor untuk menelepon.</p>
            </div>
            <button className="sos-close-btn" onClick={() => setIsOpen(false)} aria-label="Tutup daftar bantuan">
              <X size={18} />
            </button>
          </div>

          <div className="sos-contacts">
            {EMERGENCY_CONTACTS.map(({ name, number, callNumber, description, icon: Icon, color }) => (
              <a key={name} href={`tel:${callNumber || number.replace(/\D/g, '')}`} className="sos-contact-card">
                <span className="sos-contact-icon" style={{ color, backgroundColor: `${color}14` }}><Icon size={19} /></span>
                <span className="sos-contact-info">
                  <strong>{name}</strong>
                  <small>{description}</small>
                </span>
                <span className="sos-contact-number" style={{ color }}>{number}</span>
                <PhoneCall size={17} color="#94a3b8" />
              </a>
            ))}
          </div>

          <p className="sos-footer">Pastikan lokasi dan kondisi kamu saat berbicara dengan petugas. Nomor dapat berbeda menurut wilayah.</p>
        </div>
      )}
    </>
  );
};

export default SOSButton;
