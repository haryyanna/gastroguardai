import { useState } from 'react';
import { MapPin, Cloud, Users, Thermometer, Droplets, Wind, Search, Navigation, Compass } from 'lucide-react';
import './Progress.css';

const INDONESIAN_LOCATIONS = {
    'bali': { province: 'Bali', districts: ['Denpasar', 'Ubud', 'Kuta', 'Sanur', 'Gianyar', 'Klungkung', 'Bangli'] },
    'jakarta': { province: 'Jakarta', districts: ['Jakarta Pusat', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Utara', 'Kepulauan Seribu'] },
    'jawa barat': { province: 'Jawa Barat', districts: ['Bandung', 'Bogor', 'Sukabumi', 'Cianjur', 'Indramayu', 'Cirebon', 'Karawang'] },
    'jawa tengah': { province: 'Jawa Tengah', districts: ['Semarang', 'Solo', 'Salatiga', 'Pekalongan', 'Tegal', 'Sukoharjo', 'Wonogiri'] },
    'yogyakarta': { province: 'Yogyakarta', districts: ['Yogyakarta', 'Sleman', 'Bantul', 'Gunung Kidul', 'Kulon Progo'] },
    'jawa timur': { province: 'Jawa Timur', districts: ['Surabaya', 'Malang', 'Pasuruan', 'Probolinggo', 'Jember', 'Banyuwangi', 'Mojokerto'] },
    'sumatera utara': { province: 'Sumatera Utara', districts: ['Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Deli Serdang'] },
    'sumatera barat': { province: 'Sumatera Barat', districts: ['Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Agam'] },
    'riau': { province: 'Riau', districts: ['Pekanbaru', 'Dumai', 'Bangkinang', 'Indragiri Hilir'] },
    'lampung': { province: 'Lampung', districts: ['Bandar Lampung', 'Metro', 'Pringsewu', 'Tanggamus', 'Lampung Selatan'] }
};

const Progress = () => {
    const [destinationSearch, setDestinationSearch] = useState('');
    const [destinationData, setDestinationData] = useState(null);
    const [showDestinationInfo, setShowDestinationInfo] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

    const getLocationFromGPS = () => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Browser tidak mendukung GPS.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setUserLocation({ latitude, longitude, accuracy });
                const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                setDestinationSearch(`Lokasi saya: ${locString}`);
                searchDestinationWithGPS(latitude, longitude);
            },
            (error) => {
                const msg = error.code === 1 ? 'Izin GPS ditolak' : error.code === 2 ? 'GPS tidak tersedia' : 'Error GPS';
                setLocationError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const searchDestinationWithGPS = (lat, lon) => {
        const mockData = {
            name: `Lokasi ${lat.toFixed(2)}, ${lon.toFixed(2)}`,
            coordinates: { latitude: lat, longitude: lon },
            weather: { temp: 25 + Math.floor(Math.random() * 10), condition: 'Cerah', humidity: 60 + Math.floor(Math.random() * 30), wind: 5 + Math.floor(Math.random() * 15) },
            crowd: { level: 'Sedang', percentage: 50 + Math.floor(Math.random() * 30), description: 'Kondisi normal' },
            health: { airQuality: 'Baik', hospitalAccess: 'Mudah', pharmacyAccess: 'Mudah' },
            tips: ['Gunakan sunscreen', 'Bawa air minum cukup', 'Jaga kebersihan makanan']
        };
        setDestinationData(mockData);
        setShowDestinationInfo(true);
    };

    const handleLocationSearch = (value) => {
        setDestinationSearch(value);
        if (!value.trim()) {
            setFilteredLocations([]);
            setShowLocationSuggestions(false);
            return;
        }
        const lower = value.toLowerCase();
        const matches = Object.entries(INDONESIAN_LOCATIONS)
            .filter(([key, data]) => key.includes(lower) || data.province.toLowerCase().includes(lower) || data.districts.some(d => d.toLowerCase().includes(lower)))
            .flatMap(([key, data]) => [
                { type: 'province', name: data.province, key },
                ...data.districts.map(d => ({ type: 'district', name: d, province: data.province, key }))
            ])
            .slice(0, 10);
        setFilteredLocations(matches);
        setShowLocationSuggestions(true);
    };

    // Mock destination data (in production, this would call a real weather API)
    const searchDestination = () => {
        if (!destinationSearch.trim()) return;
        
        // Simulate API call with mock data
        const mockDestinations = {
            'bali': {
                name: 'Bali',
                weather: { temp: 28, condition: 'Cerah Berawan', humidity: 75, wind: 12 },
                crowd: { level: 'Tinggi', percentage: 85, description: 'Sedang musim liburan, banyak wisatawan domestik dan internasional' },
                health: { airQuality: 'Baik', hospitalAccess: 'Mudah', pharmacyAccess: 'Sangat Mudah' },
                tips: ['Gunakan sunscreen SPF 30+', 'Bawa botol air minum', 'Hindari aktivitas outdoor 11-14 WIB', 'Selalu gunakan masker di area ramai']
            },
            'yogyakarta': {
                name: 'Yogyakarta',
                weather: { temp: 27, condition: 'Cerah', humidity: 70, wind: 8 },
                crowd: { level: 'Sedang', percentage: 60, description: 'Normal, tidak terlalu ramai namun tetap ada aktivitas wisata' },
                health: { airQuality: 'Sedang', hospitalAccess: 'Mudah', pharmacyAccess: 'Mudah' },
                tips: ['Kenakan pakaian tipis dan nyaman', 'Bawa payung untuk hujan mendadak', 'Jaga kebersihan makanan', 'Cek kesehatan sebelum naik gunung']
            },
            'bandung': {
                name: 'Bandung',
                weather: { temp: 22, condition: 'Berawan', humidity: 80, wind: 15 },
                crowd: { level: 'Sedang', percentage: 55, description: 'Cukup nyaman untuk berwisata keluarga' },
                health: { airQuality: 'Baik', hospitalAccess: 'Sangat Mudah', pharmacyAccess: 'Sangat Mudah' },
                tips: ['Bawa jaket karena suhu dingin', 'Perhatikan kondisi jalan menuju Lembang', 'Siapkan obat maag untuk makanan pedas', 'Jaga jarak di tempat wisata populer']
            },
            'jakarta': {
                name: 'Jakarta',
                weather: { temp: 32, condition: 'Panas Terik', humidity: 65, wind: 10 },
                crowd: { level: 'Sangat Tinggi', percentage: 95, description: 'Sangat ramai, waspada kemacetan dan kerumunan' },
                health: { airQuality: 'Sedang', hospitalAccess: 'Sangat Mudah', pharmacyAccess: 'Sangat Mudah' },
                tips: ['Gunakan masker N95 jika sensitif polusi', 'Hindari aktivitas outdoor siang hari', 'Selalu bawa air minum', 'Pilih transportasi umum untuk hindari macet']
            },
            'surabaya': {
                name: 'Surabaya',
                weather: { temp: 30, condition: 'Cerah', humidity: 72, wind: 14 },
                crowd: { level: 'Sedang', percentage: 50, description: 'Kondisi normal, cocok untuk wisata keluarga' },
                health: { airQuality: 'Baik', hospitalAccess: 'Mudah', pharmacyAccess: 'Mudah' },
                tips: ['Coba kuliner lokal dengan hati-hati', 'Bawa obat maag untuk makanan pedas', 'Gunakan sunscreen', 'Jaga kebersihan tangan sebelum makan']
            }
        };

        const searchTerm = destinationSearch.toLowerCase();
        const foundDestination = Object.values(mockDestinations).find(
            dest => dest.name.toLowerCase().includes(searchTerm)
        );

        if (foundDestination) {
            setDestinationData(foundDestination);
            setShowDestinationInfo(true);
        } else {
            // Generate generic data for unknown destinations
            setDestinationData({
                name: destinationSearch,
                weather: { temp: 25 + Math.floor(Math.random() * 10), condition: 'Cerah Berawan', humidity: 60 + Math.floor(Math.random() * 30), wind: 5 + Math.floor(Math.random() * 15) },
                crowd: { level: 'Sedang', percentage: 50 + Math.floor(Math.random() * 30), description: 'Data kerumunan tidak tersedia, waspada tetap disarankan' },
                health: { airQuality: 'Baik', hospitalAccess: 'Perlu Cek', pharmacyAccess: 'Perlu Cek' },
                tips: ['Selalu bawa P3K lengkap', 'Cek lokasi rumah sakit terdekat', 'Jaga kebersihan makanan dan minuman', 'Gunakan masker di area ramai']
            });
            setShowDestinationInfo(true);
        }
    };

    return (
        <div className="progress-container animate-fade-in">
            <header className="progress-top-brand">
                <div className="feature-heading"><MapPin className="feature-heading-icon" /><span className="brand-text">Jelajah Destinasi</span></div>
            </header>

            {/* Destination Information Section */}
            <div className="destination-section glass-card">
                <div className="destination-heading section-heading-row">
                    <div className="destination-heading-copy">
                        <span className="destination-eyebrow">PANDUAN PERJALANAN</span>
                        <h3 className="destination-title">Temukan destinasi berikutnya</h3>
                        <p className="destination-subtitle">Dapatkan gambaran cuaca, keramaian, dan tips lokal sebelum berangkat.</p>
                    </div>
                    <div className="destination-heading-icon"><MapPin size={26} /></div>
                </div>

                <div className="destination-search">
                    <input
                        type="text"
                        placeholder="Cari destinasi atau ketik kabupaten, kecamatan..."
                        value={destinationSearch}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchDestination()}
                        autoComplete="off"
                    />
                    <button className="btn-primary destination-search-button" onClick={searchDestination} title="Cari destinasi">
                        <Search size={18} />
                        Cari
                    </button>
                    <button className="btn-secondary destination-gps-button" onClick={getLocationFromGPS} title="Lacak lokasi GPS saat ini">
                        <Compass size={18} />
                        GPS
                    </button>
                    
                    {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="location-suggestions">
                            {filteredLocations.map((loc, idx) => (
                                <button
                                    key={idx}
                                    className="suggestion-item"
                                    onClick={() => {
                                        setDestinationSearch(loc.name);
                                        setShowLocationSuggestions(false);
                                        setFilteredLocations([]);
                                    }}
                                >
                                    <span className="suggestion-type">{loc.type === 'province' ? '📍 Provinsi' : '📍 Kabupaten'}</span>
                                    <span className="suggestion-name">{loc.name}</span>
                                    {loc.province && <span className="suggestion-province">({loc.province})</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {locationError && (
                    <div className="alert-warning" style={{ marginTop: '10px', padding: '10px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                        ⚠️ {locationError}
                    </div>
                )}

                {userLocation && (
                    <div className="location-display" style={{ marginTop: '10px', padding: '10px', background: '#dbeafe', borderRadius: '8px', color: '#1e40af', fontSize: '13px' }}>
                        📍 Lokasi GPS: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)} (akurasi: ±{userLocation.accuracy.toFixed(0)}m)
                    </div>
                )}

                {showDestinationInfo && destinationData && (
                    <div className="destination-info animate-fade-in">
                        <div className="destination-header">
                            <h4 className="destination-name">{destinationData.name}</h4>
                            <span className="destination-badge">Wisata Aman</span>
                        </div>

                        {/* Weather Information */}
                        <div className="info-grid">
                            <div className="info-card weather-card">
                                <div className="info-icon">
                                    <Thermometer size={24} color="#ef4444" />
                                </div>
                                <div className="info-content">
                                    <span className="info-value">{destinationData.weather.temp}°C</span>
                                    <span className="info-label">Suhu</span>
                                </div>
                            </div>
                            <div className="info-card weather-card">
                                <div className="info-icon">
                                    <Cloud size={24} color="#64748b" />
                                </div>
                                <div className="info-content">
                                    <span className="info-value">{destinationData.weather.condition}</span>
                                    <span className="info-label">Cuaca</span>
                                </div>
                            </div>
                            <div className="info-card weather-card">
                                <div className="info-icon">
                                    <Droplets size={24} color="#0ea5e9" />
                                </div>
                                <div className="info-content">
                                    <span className="info-value">{destinationData.weather.humidity}%</span>
                                    <span className="info-label">Kelembaban</span>
                                </div>
                            </div>
                            <div className="info-card weather-card">
                                <div className="info-icon">
                                    <Wind size={24} color="#22c55e" />
                                </div>
                                <div className="info-content">
                                    <span className="info-value">{destinationData.weather.wind} km/h</span>
                                    <span className="info-label">Angin</span>
                                </div>
                            </div>
                        </div>

                        {/* Crowd Level */}
                        <div className="crowd-section">
                            <div className="crowd-header">
                                <Users size={20} color="#8b5cf6" />
                                <span className="crowd-title">Tingkat Kerumunan</span>
                            </div>
                            <div className="crowd-bar-container">
                                <div className="crowd-bar">
                                    <div 
                                        className="crowd-fill" 
                                        style={{ 
                                            width: `${destinationData.crowd.percentage}%`,
                                            backgroundColor: destinationData.crowd.percentage > 80 ? '#ef4444' : 
                                                           destinationData.crowd.percentage > 60 ? '#f97316' : 
                                                           destinationData.crowd.percentage > 40 ? '#eab308' : '#10b981'
                                        }}
                                    />
                                </div>
                                <span className="crowd-percentage">{destinationData.crowd.percentage}%</span>
                            </div>
                            <div className="crowd-info">
                                <span className="crowd-level">{destinationData.crowd.level}</span>
                                <span className="crowd-description">{destinationData.crowd.description}</span>
                            </div>
                        </div>

                        {/* Health Access */}
                        <div className="health-access-section">
                            <h5 className="health-access-title">Akses Layanan Kesehatan</h5>
                            <div className="health-access-grid">
                                <div className="health-access-item">
                                    <span className="health-label">Kualitas Udara:</span>
                                    <span className={`health-value ${destinationData.health.airQuality === 'Baik' ? 'good' : 'moderate'}`}>
                                        {destinationData.health.airQuality}
                                    </span>
                                </div>
                                <div className="health-access-item">
                                    <span className="health-label">Akses Rumah Sakit:</span>
                                    <span className="health-value">{destinationData.health.hospitalAccess}</span>
                                </div>
                                <div className="health-access-item">
                                    <span className="health-label">Akses Apotek:</span>
                                    <span className="health-value">{destinationData.health.pharmacyAccess}</span>
                                </div>
                            </div>
                        </div>

                        {/* Travel Tips */}
                        <div className="travel-tips-section">
                            <h5 className="travel-tips-title">
                                <Navigation size={18} color="#3b82f6" />
                                Tips Kesehatan Perjalanan
                            </h5>
                            <ul className="travel-tips-list">
                                {destinationData.tips.map((tip, index) => (
                                    <li key={index} className="travel-tip-item">
                                        <span className="tip-bullet">💡</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Progress;
