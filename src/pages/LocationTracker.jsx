import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  LocateFixed,
  MapPinned,
  Navigation,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Share2,
  Users,
  Wifi,
  TimerReset,
  Plus,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const TRACKER_STORAGE_KEY = 'ranstal_family_tracker';
const TRACKER_DEVICE_KEY = 'ranstal_tracker_devices';
const DEVICE_PROFILE_KEY = 'ranstal_device_profile';

const resolveDeviceProfile = () => {
  const fallback = {
    deviceId: `device_${Math.random().toString(36).slice(2, 10)}`,
    brand: 'Unknown',
    model: 'Phone',
    series: 'Unknown',
    label: 'Device A',
  };

  try {
    const cached = localStorage.getItem(DEVICE_PROFILE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.deviceId) {
        return { ...fallback, ...parsed };
      }
    }
  } catch {
    // ignore invalid cached device profile
  }

  const userAgent = navigator.userAgent || '';
  let brand = 'Android';
  let model = 'Phone';
  let series = 'Unknown';
  let label = 'Device A';

  if (/OPPO|ColorOS|CPH|RMX|PJM|PKR/i.test(userAgent)) {
    brand = 'OPPO';
    const match = userAgent.match(/(?:CPH|RMX|PJM|PKR|A\d{4}|C\d{4})[A-Za-z0-9-]*/i);
    model = match ? match[0].toUpperCase() : 'OPPO Phone';
    series = model;
    label = `${brand} ${model}`;
  } else if (/Vivo|V203|V204|V205/i.test(userAgent)) {
    brand = 'Vivo';
    const match = userAgent.match(/(?:V\d{3,}|V\d{2,}[A-Z0-9-]*)/i);
    model = match ? match[0].toUpperCase() : 'Vivo Phone';
    series = model;
    label = `${brand} ${model}`;
  } else if (/Redmi|Xiaomi|Miui/i.test(userAgent)) {
    brand = 'Xiaomi';
    const match = userAgent.match(/(?:Redmi|Mi|Poco|Xiaomi)[A-Za-z0-9-]*/i);
    model = match ? match[0].toUpperCase() : 'Redmi Phone';
    series = model;
    label = `${brand} ${model}`;
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    brand = 'Apple';
    model = /iPhone/i.test(userAgent) ? 'iPhone' : /iPad/i.test(userAgent) ? 'iPad' : 'iPod';
    series = model;
    label = `${brand} ${model}`;
  } else if (/Samsung|SM-|Galaxy/i.test(userAgent)) {
    brand = 'Samsung';
    const match = userAgent.match(/(?:SM-|Galaxy)[A-Za-z0-9-]*/i);
    model = match ? match[0].toUpperCase() : 'Galaxy';
    series = model;
    label = `${brand} ${model}`;
  }

  const deviceId = `device_${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12))}`;
  const profile = {
    deviceId,
    brand,
    model,
    series,
    label,
  };

  localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(profile));
  return profile;
};

const DEFAULT_DEVICE_LIST = () => {
  const current = resolveDeviceProfile();
  return [current.label, 'Anak 2', 'Device A'];
};

const buildMapEmbed = (lat, lon) => {
  const bbox = [lon - 0.005, lat - 0.005, lon + 0.005, lat + 0.005].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
};

const formatCoord = (value) => (typeof value === 'number' ? value.toFixed(5) : '-');

const toSafeDisplayTime = (timestamp) => {
  if (!timestamp) return 'Belum ada update';
  try {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Baru saja';
  }
};

const LocationTracker = () => {
  const navigate = useNavigate();
  const [deviceProfile, setDeviceProfile] = useState(() => resolveDeviceProfile());
  const [deviceList, setDeviceList] = useState(() => DEFAULT_DEVICE_LIST());
  const [selectedDevice, setSelectedDevice] = useState(() => DEFAULT_DEVICE_LIST()[0]);
  const [renameDraft, setRenameDraft] = useState('');
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    timestamp: null,
    heading: null,
  });
  const [status, setStatus] = useState('Mengaktifkan GPS...');
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const syncLocationToSupabase = useCallback(async (nextLocation) => {
    if (!isSupabaseConfigured || !supabase || !deviceProfile?.deviceId) return;

    const payload = {
      device_id: deviceProfile.deviceId,
      device_name: deviceProfile.label,
      brand: deviceProfile.brand,
      model: deviceProfile.model,
      series: deviceProfile.series,
      latitude: Number(nextLocation.latitude),
      longitude: Number(nextLocation.longitude),
      accuracy: Number(nextLocation.accuracy || 0),
      speed: Number(nextLocation.speed || 0),
      heading: Number(nextLocation.heading || 0),
      battery_level: Number(nextLocation.batteryLevel || 0),
      updated_at: new Date().toISOString(),
      is_online: true,
    };

    const { error } = await supabase.from('family_locations').upsert(payload, { onConflict: 'device_id' });
    if (error) {
      console.warn('Supabase location sync failed:', error.message);
    }

    const { error: deviceError } = await supabase.from('devices').upsert(
      {
        device_id: deviceProfile.deviceId,
        user_id: null,
        device_name: deviceProfile.label,
        brand: deviceProfile.brand,
        model: deviceProfile.model,
        series: deviceProfile.series,
        nickname: selectedDevice || deviceProfile.label,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' }
    );

    if (deviceError) {
      console.warn('Supabase device sync failed:', deviceError.message);
    }
  }, [deviceProfile, selectedDevice]);

  useEffect(() => {
    const stored = localStorage.getItem(TRACKER_DEVICE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          setDeviceList(parsed);
          setSelectedDevice((current) => current && parsed.includes(current) ? current : parsed[0]);
        }
      } catch {
        // ignore invalid local data
      }
    } else {
      const initial = [deviceProfile.label, 'Anak 2', 'Device A'];
      setDeviceList(initial);
      setSelectedDevice(initial[0]);
      localStorage.setItem(TRACKER_DEVICE_KEY, JSON.stringify(initial));
    }
  }, [deviceProfile.label]);

  useEffect(() => {
    setRenameDraft(selectedDevice || '');
  }, [selectedDevice]);

  useEffect(() => {
    const deviceKey = `ranstal_tracker_${selectedDevice}`;
    const stored = localStorage.getItem(deviceKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setLocation(parsed);
          setStatus('Lokasi terakhir perangkat dipilih');
          setError('');
        }
      } catch {
        // ignore invalid location payload
      }
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadLatest = async () => {
      const { data, error } = await supabase
        .from('family_locations')
        .select('*')
        .eq('device_name', selectedDevice)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && data && data[0]) {
        const row = data[0];
        setLocation({
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          accuracy: Number(row.accuracy || 0),
          speed: Number(row.speed || 0),
          heading: Number(row.heading || 0),
          timestamp: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
          deviceId: row.device_name,
        });
        setStatus(`Lokasi cloud • ${row.device_name}`);
      }
    };

    loadLatest();

    const channel = supabase.channel(`family_locations_${selectedDevice}`);
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_locations',
          filter: `device_name=eq.${selectedDevice}`,
        },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row) return;

          setLocation({
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            accuracy: Number(row.accuracy || 0),
            speed: Number(row.speed || 0),
            heading: Number(row.heading || 0),
            timestamp: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            deviceId: row.device_name,
          });
          setStatus(`Realtime aktif • ${row.device_name}`);
          setError('');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDevice]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const lat = params.get('lat');
    const lng = params.get('lng');

    if (lat && lng) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        setLocation({
          latitude: parsedLat,
          longitude: parsedLng,
          accuracy: null,
          speed: null,
          timestamp: Date.now(),
          heading: null,
        });
        setStatus('Lokasi dibagikan dari link keluarga');
        setError('');
      }
    }
  }, []);

  useEffect(() => {
    const syncStorage = (payload) => {
      if (!payload || typeof payload.latitude !== 'number' || typeof payload.longitude !== 'number') return;
      if (payload.deviceId && payload.deviceId !== selectedDevice) return;
      setLocation(payload);
      setStatus(`Lokasi terbarui dari ${payload.deviceId || 'perangkat lain'}`);
      setError('');
    };

    const storageListener = (event) => {
      if (!event.newValue) return;
      const rawKey = event.key || '';
      if (rawKey.startsWith('ranstal_tracker_') || rawKey === TRACKER_STORAGE_KEY) {
        try {
          const parsed = JSON.parse(event.newValue);
          syncStorage({ ...parsed, deviceId: rawKey.replace('ranstal_tracker_', '') });
        } catch {
          // ignore invalid payload
        }
      }
    };

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('ranstal-family-tracker');
      channel.onmessage = (event) => syncStorage({ ...event.data, deviceId: event.data.deviceId || selectedDevice });
      window.addEventListener('storage', storageListener);
      return () => {
        channel.close();
        window.removeEventListener('storage', storageListener);
      };
    }

    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, [selectedDevice]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('GPS tidak didukung browser');
      setError('Browser ini belum mendukung akses lokasi. Coba buka aplikasi di browser yang mendukung GPS.');
      return;
    }

    const onSuccess = async (position) => {
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp,
        batteryLevel: navigator?.battery?.level ? navigator.battery.level * 100 : 0,
        deviceId: selectedDevice,
      };
      setLocation(nextLocation);
      localStorage.setItem(`ranstal_tracker_${selectedDevice}`, JSON.stringify(nextLocation));
      localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(nextLocation));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ranstal-family-tracker');
        channel.postMessage(nextLocation);
        channel.close();
      }
      await syncLocationToSupabase(nextLocation);
      setStatus(`GPS aktif • ${selectedDevice} sedang dipantau`);
      setError('');
    };

    const onError = (err) => {
      const message =
        err.code === 1
          ? 'Izin lokasi ditolak. Izinkan akses GPS agar orang tua bisa melihat posisi Anda.'
          : err.code === 2
            ? 'Lokasi tidak tersedia saat ini. Coba beberapa saat lagi.'
            : 'Waktu pengambilan GPS habis. Silakan coba lagi.';
      setStatus('GPS tidak dapat mengakses lokasi');
      setError(message);
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedDevice, syncLocationToSupabase]);

  const handleRefresh = () => {
    if (!navigator.geolocation) return;
    setStatus('Memperbarui lokasi...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
          batteryLevel: navigator?.battery?.level ? navigator.battery.level * 100 : 0,
          deviceId: selectedDevice,
        };
        setLocation(nextLocation);
        localStorage.setItem(`ranstal_tracker_${selectedDevice}`, JSON.stringify(nextLocation));
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(nextLocation));
        await syncLocationToSupabase(nextLocation);
        setStatus(`Lokasi ${selectedDevice} berhasil diperbarui`);
        setError('');
      },
      (err) => {
        setStatus('Gagal memperbarui lokasi');
        setError(err.message || 'Gagal mengambil lokasi terbaru.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const addDevice = () => {
    const nextIndex = deviceList.length + 1;
    const nextName = nextIndex === 1 ? 'Anak 1' : nextIndex === 2 ? 'Anak 2' : `Device ${String.fromCharCode(64 + nextIndex)}`;
    const nextList = [...deviceList, nextName];
    setDeviceList(nextList);
    setSelectedDevice(nextName);
    localStorage.setItem(TRACKER_DEVICE_KEY, JSON.stringify(nextList));
  };

  const renameSelectedDevice = () => {
    const nextName = renameDraft.trim();
    if (!nextName || nextName === selectedDevice) return;

    const oldName = selectedDevice;
    const updatedList = deviceList.map((device) => (device === oldName ? nextName : device));
    const savedLocation = localStorage.getItem(`ranstal_tracker_${oldName}`);

    setDeviceList(updatedList);
    setSelectedDevice(nextName);
    setRenameDraft(nextName);
    localStorage.setItem(TRACKER_DEVICE_KEY, JSON.stringify(updatedList));

    if (savedLocation) {
      localStorage.setItem(`ranstal_tracker_${nextName}`, savedLocation);
      localStorage.removeItem(`ranstal_tracker_${oldName}`);
    }

    setDeviceProfile((prev) => {
      const nextProfile = { ...prev, label: nextName };
      localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(nextProfile));
      return nextProfile;
    });
  };

  const deleteSelectedDevice = () => {
    if (!selectedDevice) return;

    const nextList = deviceList.filter((device) => device !== selectedDevice);
    if (!nextList.length) {
      setDeviceList([deviceProfile.label]);
      setSelectedDevice(deviceProfile.label);
      localStorage.setItem(TRACKER_DEVICE_KEY, JSON.stringify([deviceProfile.label]));
      return;
    }

    setDeviceList(nextList);
    setSelectedDevice(nextList[0]);
    setRenameDraft(nextList[0]);
    localStorage.setItem(TRACKER_DEVICE_KEY, JSON.stringify(nextList));
    localStorage.removeItem(`ranstal_tracker_${selectedDevice}`);
  };

  const handleShareLocation = async () => {
    if (!location.latitude || !location.longitude) {
      setShareMessage('Lokasi belum tersedia, tunggu beberapa detik lagi.');
      return;
    }

    const shareLink = `${window.location.origin}${window.location.pathname}#/tracking?lat=${location.latitude.toFixed(5)}&lng=${location.longitude.toFixed(5)}`;
    const text = `Lokasi anak saat ini: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}\nMap: ${shareLink}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Lokasi anak saya',
          text,
          url: shareLink,
        });
        setShareMessage('Lokasi berhasil dibagikan');
        return;
      }

      await navigator.clipboard.writeText(text);
      setShareMessage('Link lokasi berhasil disalin ke clipboard');
    } catch {
      setShareMessage('Bagikan link lokasi lewat WhatsApp atau aplikasi pengiriman lain.');
    }
  };

  const hasLocation = typeof location.latitude === 'number' && typeof location.longitude === 'number';
  const mapUrl = hasLocation ? buildMapEmbed(location.latitude, location.longitude) : '';
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : 'https://www.google.com/maps';
  const shareLink = hasLocation
    ? `${window.location.origin}${window.location.pathname}#/tracking?lat=${location.latitude.toFixed(5)}&lng=${location.longitude.toFixed(5)}`
    : '';
  const whatsappText = hasLocation
    ? `Lokasi anak saat ini: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}%0AOpen Maps: ${encodeURIComponent(googleMapsUrl)}`
    : 'Saya sedang dalam perjalanan, mohon cek lokasi terbaru saya.';

  const statusBadge = useMemo(() => {
    if (!hasLocation) return 'Off';
    const ageMs = Date.now() - (location.timestamp || Date.now());
    if (location.accuracy && location.accuracy < 30 && ageMs <= 120000) return 'Aman';
    if (location.accuracy && location.accuracy < 90) return 'Terdeteksi';
    if (ageMs <= 180000) return 'Terdeteksi';
    return 'Off';
  }, [hasLocation, location.accuracy, location.timestamp]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 18px 88px', color: '#0f172a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '1px solid #e2e8f0',
            background: '#fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>FAMILY GPS</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Tracker Anak</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)', borderRadius: 22, padding: 18, color: '#fff', boxShadow: '0 18px 30px rgba(15, 23, 42, 0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', opacity: 0.8 }}>STATUS ANAK</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{selectedDevice}</div>
            </div>
            <div style={{ borderRadius: 999, background: 'rgba(255,255,255,0.14)', padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>
              {statusBadge}
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.9 }}>
            <Wifi size={14} /> {status}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {deviceList.map((device) => (
            <button
              key={device}
              onClick={() => setSelectedDevice(device)}
              style={{
                borderRadius: 999,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                border: selectedDevice === device ? '1px solid #14b8a6' : '1px solid #dbeafe',
                background: selectedDevice === device ? '#ecfeff' : '#fff',
                color: selectedDevice === device ? '#115e59' : '#334155',
                cursor: 'pointer',
              }}
            >
              {device}
            </button>
          ))}
          <button
            onClick={addDevice}
            style={{
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 700,
              border: '1px dashed #14b8a6',
              background: '#f0fdfa',
              color: '#115e59',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={14} /> Tambah device
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder="Nama device baru"
            style={{
              flex: 1,
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid #dbeafe',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={renameSelectedDevice}
            style={{
              borderRadius: 12,
              padding: '10px 14px',
              border: '1px solid #14b8a6',
              background: '#14b8a6',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Rename
          </button>
          <button
            onClick={deleteSelectedDevice}
            style={{
              borderRadius: 12,
              padding: '10px 14px',
              border: '1px solid #f87171',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
              <Users size={14} /> KELUARGA
            </div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800 }}>3 Orang</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
              <TimerReset size={14} /> TERAKHIR
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 800 }}>{toSafeDisplayTime(location.timestamp)}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
              <ShieldCheck size={14} /> ZONA
            </div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800 }}>Aman</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 22, border: '1px solid #e2e8f0', boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)', overflow: 'hidden' }}>
        {hasLocation ? (
          <iframe
            title="Map lokasi pengguna"
            src={mapUrl}
            style={{ width: '100%', height: 260, border: 0, display: 'block' }}
          />
        ) : (
          <div style={{ height: 260, display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#64748b', textAlign: 'center', padding: 20 }}>
            <div>
              <MapPinned size={36} style={{ marginBottom: 12, opacity: 0.8 }} />
              <div style={{ fontWeight: 700 }}>Menunggu sinyal GPS...</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
            <Compass size={14} /> LATITUDE
          </div>
          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>{formatCoord(location.latitude)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
            <Navigation size={14} /> LONGITUDE
          </div>
          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800 }}>{formatCoord(location.longitude)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
            <ShieldCheck size={14} /> AKURASI
          </div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{location.accuracy ? `${Math.round(location.accuracy)} m` : '-'}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
            <PhoneCall size={14} /> KECEPATAN
          </div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{location.speed ? `${location.speed.toFixed(1)} m/s` : '-'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={handleRefresh} className="btn-primary" style={{ flex: 1, borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>
          <RefreshCw size={16} style={{ marginRight: 8 }} /> Perbarui GPS
        </button>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ flex: 1, borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
        >
          <MapPinned size={16} style={{ marginRight: 8 }} /> Buka Map
        </a>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={handleShareLocation} className="btn-secondary" style={{ flex: 1, borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>
          <Share2 size={16} style={{ marginRight: 8 }} /> Bagikan Lokasi
        </button>
        <a
          href={shareLink || '#'}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ flex: 1, borderRadius: 14, padding: '14px 16px', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
        >
          <Navigation size={16} style={{ marginRight: 8 }} /> Link GPS
        </a>
      </div>

      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 16,
          width: '100%',
          padding: '14px 18px',
          borderRadius: 14,
          background: '#dcfce7',
          color: '#166534',
          fontWeight: 700,
          border: '1px solid #bbf7d0',
          textDecoration: 'none',
        }}
      >
        <PhoneCall size={16} /> Kirim lokasi ke orang tua
      </a>

      {shareMessage && (
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 12, background: '#ecfeff', color: '#0f766e', border: '1px solid #a5f3fc', fontSize: 12.5, fontWeight: 600 }}>
          {shareMessage}
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        {location.timestamp ? `Terakhir update: ${new Date(location.timestamp).toLocaleString('id-ID')}` : 'Menunggu update lokasi terkini.'}
      </div>
    </div>
  );
};

export default LocationTracker;
