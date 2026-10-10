import { useCallback, useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Navigation, Phone, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { publicAsset } from '../lib/publicAsset';
import './ClinicLocator.css';

const SEARCH_RADIUS_METERS = 6000;
const INITIAL_CENTER = [-8.5069, 115.2625];
const distanceMeters = (aLat, aLon, bLat, bLon) => {
  const radians = (n) => n * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};
const prettyDistance = (meters) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
const facilityType = (tags = {}) => {
  if (/puskesmas/i.test(tags.name || '')) return 'Puskesmas';
  if (tags.amenity === 'hospital') return 'Rumah sakit';
  if (tags.amenity === 'clinic' || tags.healthcare === 'clinic') return 'Klinik';
  if (tags.amenity === 'pharmacy' || tags.healthcare === 'pharmacy') return 'Apotek';
  if (tags.amenity === 'doctors') return 'Praktik dokter';
  return 'Fasilitas kesehatan';
};
const iconFor = (color) => L.divIcon({ className: 'gg-leaflet-icon', html: `<span style="--marker:${color}"><i></i></span>`, iconSize: [27, 27], iconAnchor: [13, 13] });

export default function ClinicLocator() {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [status, setStatus] = useState('Peta berpusat di Gianyar. Tekan tombol untuk mencari layanan di dekat lokasimu.');
  const [facilities, setFacilities] = useState([]);
  const [locating, setLocating] = useState(false);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return undefined;
    const map = L.map(mapNode.current, { scrollWheelZoom: false }).setView(INITIAL_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 120);
    return () => { window.clearTimeout(timer); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setError('Perangkat ini tidak menyediakan geolokasi.'); return; }
    setLocating(true);
    setError('');
    setStatus('Meminta lokasi perangkat…');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setCenter([lat, lon]);
      mapRef.current?.setView([lat, lon], 14);
      setStatus('Mencari rumah sakit, klinik, puskesmas, dan apotek dalam radius 6 km…');
      layerRef.current?.clearLayers();
      L.marker([lat, lon], { icon: iconFor('#0d9488') }).addTo(layerRef.current).bindPopup('Lokasimu');
      const query = `[out:json][timeout:25];(node[amenity~"^(hospital|clinic|doctors|pharmacy)$"](around:${SEARCH_RADIUS_METERS},${lat},${lon});way[amenity~"^(hospital|clinic|doctors|pharmacy)$"](around:${SEARCH_RADIUS_METERS},${lat},${lon});relation[amenity~"^(hospital|clinic|doctors|pharmacy)$"](around:${SEARCH_RADIUS_METERS},${lat},${lon});node[healthcare~"^(hospital|clinic|doctor|pharmacy)$"](around:${SEARCH_RADIUS_METERS},${lat},${lon});way[healthcare~"^(hospital|clinic|doctor|pharmacy)$"](around:${SEARCH_RADIUS_METERS},${lat},${lon}););out center tags;`;
      try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('OpenStreetMap tidak dapat dijangkau.');
        const data = await response.json();
        const results = (data.elements || []).map((element) => {
          const point = element.type === 'node' ? { lat: element.lat, lon: element.lon } : element.center;
          if (!point) return null;
          const distance = distanceMeters(lat, lon, point.lat, point.lon);
          return { id: `${element.type}-${element.id}`, name: element.tags?.name || facilityType(element.tags), type: facilityType(element.tags), lat: point.lat, lon: point.lon, distance, phone: element.tags?.phone || element.tags?.['contact:phone'] || '', address: [element.tags?.['addr:street'], element.tags?.['addr:city']].filter(Boolean).join(', ') };
        }).filter((item) => item && item.distance <= SEARCH_RADIUS_METERS).sort((a, b) => a.distance - b.distance);
        const deduplicated = results.filter((item, index, list) => list.findIndex((other) => other.name === item.name && Math.abs(other.distance - item.distance) < 50) === index).slice(0, 30);
        setFacilities(deduplicated);
        deduplicated.forEach((facility) => {
          const marker = L.marker([facility.lat, facility.lon], { icon: iconFor(facility.type === 'Apotek' ? '#f97316' : '#0f766e') }).addTo(layerRef.current);
          const popup = document.createElement('div');
          const title = document.createElement('strong'); title.textContent = facility.name;
          const detail = document.createElement('div'); detail.textContent = `${facility.type} · ${prettyDistance(facility.distance)}`;
          popup.append(title, detail);
          marker.bindPopup(popup);
        });
        setStatus(deduplicated.length ? `${deduplicated.length} fasilitas ditemukan dalam radius 6 km.` : 'Belum ada fasilitas terpetakan dalam radius 6 km. Coba perbarui pencarian.');
      } catch (fetchError) {
        setError(fetchError.message || 'Pencarian fasilitas gagal. Coba lagi beberapa saat.');
        setStatus('Pencarian gagal.');
      } finally { setLocating(false); }
    }, (geoError) => {
      setLocating(false);
      setError(geoError.code === 1 ? 'Izin lokasi tidak diberikan. Aktifkan akses lokasi untuk mencari fasilitas terdekat.' : 'Lokasi perangkat tidak dapat ditentukan. Periksa GPS dan coba lagi.');
      setStatus('Lokasi belum tersedia.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }, []);

  return <section className="gg-card gg-clinic-card gg-clinic-locator"><div className="gg-clinic-title"><span className="gg-clinic-icon gg-clinic-image"><img src={publicAsset('gastroguard-assets/features/emergency-finder.png')} alt="" /></span><span><b>Rumah sakit & puskesmas terdekat</b><small>Peta interaktif OpenStreetMap · jangkauan 6 km</small></span></div><button className="gg-location-btn" onClick={locate} disabled={locating}>{locating ? <RefreshCw className="gg-spin" size={16}/> : <LocateFixed size={17}/>} {locating ? 'Mencari fasilitas…' : 'Mulai pelacakan lokasi'} <Navigation size={15}/></button><small className="gg-location-consent">Lokasimu hanya dikirim ke OpenStreetMap untuk mencari fasilitas di sekitar. Browser akan meminta izin lokasi.</small><div className="gg-locator-status" role="status">{status}</div>{error && <p className="gg-locator-error">{error}</p>}<div className="gg-leaflet-map" ref={mapNode} aria-label="Peta interaktif fasilitas kesehatan di sekitar"/><div className="gg-facility-list">{facilities.map((facility) => <article className="gg-facility-row" key={facility.id}><span className="gg-facility-pin"><MapPin size={15}/></span><span className="gg-facility-info"><b>{facility.name}</b><small>{facility.type}{facility.address ? ` · ${facility.address}` : ''}</small></span><span className="gg-facility-distance">{prettyDistance(facility.distance)}</span>{facility.phone && <a className="gg-facility-call" href={`tel:${facility.phone.replace(/[^\d+]/g, '')}`} aria-label={`Telepon ${facility.name}`}><Phone size={15}/></a>}<a className="gg-facility-directions" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${center[0]}%2C${center[1]}%3B${facility.lat}%2C${facility.lon}`} aria-label={`Petunjuk arah ke ${facility.name}`}><Navigation size={15}/></a></article>)}</div><div className="gg-locator-emergency"><a href="tel:112"><Phone size={15}/><span><b>112</b><small>Darurat</small></span></a><a href="tel:119"><Phone size={15}/><span><b>119</b><small>Ambulans</small></span></a><a href="tel:118"><Phone size={15}/><span><b>118</b><small>Medis</small></span></a></div></section>;
}
