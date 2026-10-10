import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Save, RefreshCw, AlertTriangle, ShieldCheck, Pill, Backpack, Utensils, Baby, HeartPulse } from 'lucide-react';
import './Checklist.css';

const getActiveUserName = () => localStorage.getItem('moodify_currentUser') || localStorage.getItem('ranstal_currentUser') || '';

const TRAVEL_CATEGORIES = [
  { id: 'obat', name: 'Obat-obatan', icon: Pill, color: '#ef4444' },
  { id: 'p3k', name: 'P3K', icon: ShieldCheck, color: '#f97316' },
  { id: 'kebersihan', name: 'Kebersihan', icon: HeartPulse, color: '#10b981' },
  { id: 'dokumen', name: 'Dokumen', icon: Backpack, color: '#3b82f6' },
  { id: 'makanan', name: 'Makanan & Minuman', icon: Utensils, color: '#eab308' },
  { id: 'anak', name: 'Kebutuhan Anak', icon: Baby, color: '#8b5cf6' }
];

const DEFAULT_CHECKLIST_ITEMS = {
  obat: [
    { id: 'paracetamol', name: 'Paracetamol (demam/nyeri)', checked: false, urgent: true },
    { id: 'anti-mabuk', name: 'Obat anti-mabuk perjalanan', checked: false, urgent: true },
    { id: 'anti-diare', name: 'Obat anti-diare', checked: false, urgent: true },
    { id: 'anti-alergi', name: 'Obat anti-alergi', checked: false, urgent: true },
    { id: 'vitamin', name: 'Vitamin harian', checked: false, urgent: false },
    { id: 'antibiotik', name: 'Antibiotik (sesuai resep)', checked: false, urgent: false }
  ],
  p3k: [
    { id: 'plester', name: 'Plester luka', checked: false, urgent: true },
    { id: 'antiseptik', name: 'Cairan antiseptik', checked: false, urgent: true },
    { id: 'kasa', name: 'Kasa steril', checked: false, urgent: true },
    { id: 'gunting', name: 'Gunting kecil', checked: false, urgent: true },
    { id: 'pinset', name: 'Pinset', checked: false, urgent: false },
    { id: 'termometer', name: 'Termometer badan', checked: false, urgent: true },
    { id: 'masker', name: 'Masker wajah', checked: false, urgent: true },
    { id: 'sarung-tangan', name: 'Sarung tangan lateks', checked: false, urgent: false }
  ],
  kebersihan: [
    { id: 'sabun', name: 'Sabun cuci tangan', checked: false, urgent: true },
    { id: 'sanitizer', name: 'Hand sanitizer', checked: false, urgent: true },
    { id: 'tisu', name: 'Tisu basah & kering', checked: false, urgent: true },
    { id: 'sikat-gigi', name: 'Sikat gigi & pasta', checked: false, urgent: false },
    { id: 'handuk', name: 'Handuk kecil', checked: false, urgent: false },
    { id: 'pembalut', name: 'Pembalut (jika diperlukan)', checked: false, urgent: false }
  ],
  dokumen: [
    { id: 'ktp', name: 'KTP/Kartu Identitas', checked: false, urgent: true },
    { id: 'asuransi', name: 'Kartu asuransi kesehatan', checked: false, urgent: true },
    { id: 'rekam-medis', name: 'Rekam medis anak', checked: false, urgent: true },
    { id: 'kontak-darurat', name: 'Daftar kontak darurat', checked: false, urgent: true },
    { id: 'resep-obat', name: 'Resep obat (jika ada)', checked: false, urgent: false },
    { id: 'tiket', name: 'Tiket perjalanan', checked: false, urgent: true }
  ],
  makanan: [
    { id: 'air', name: 'Air mineral (minimal 2L)', checked: false, urgent: true },
    { id: 'snack-sehat', name: 'Snack sehat (biskuit, buah)', checked: false, urgent: false },
    { id: 'makanan-kering', name: 'Makanan kering awet', checked: false, urgent: false },
    { id: 'vitamin-c', name: 'Vitamin C tablet', checked: false, urgent: false },
    { id: 'elektrolit', name: 'Serbuk elektrolit', checked: false, urgent: false }
  ],
  anak: [
    { id: 'popok', name: 'Popok/wipes (jika diperlukan)', checked: false, urgent: true },
    { id: 'baju-ganti', name: 'Baju ganti (minimal 3 set)', checked: false, urgent: true },
    { id: 'jaket', name: 'Jaket/cardigan hangat', checked: false, urgent: true },
    { id: 'sepatu', name: 'Sepatu nyaman', checked: false, urgent: true },
    { id: 'topi', name: 'Topi penutup kepala', checked: false, urgent: false },
    { id: 'mainan', name: 'Mainan kecil', checked: false, urgent: false },
    { id: 'botol-susu', name: 'Botol susu/minum', checked: false, urgent: true }
  ]
};

const Checklist = () => {
  const [selectedCategory, setSelectedCategory] = useState('obat');
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST_ITEMS);
  const [newItemName, setNewItemName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    // Load saved checklist from localStorage
    const username = getActiveUserName();
    if (username) {
      const userKey = `moodify_data_${username}`;
      try {
        const savedData = localStorage.getItem(userKey);
        if (savedData) {
          const userData = JSON.parse(savedData);
          if (userData.checklist) {
            setChecklistItems(userData.checklist);
          }
        }
      } catch (e) {
        console.error('Error loading checklist:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Calculate completion rate
    const totalItems = Object.values(checklistItems).flat().length;
    const checkedItems = Object.values(checklistItems).flat().filter(item => item.checked).length;
    setCompletionRate(totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0);
  }, [checklistItems]);

  const saveChecklist = () => {
    const username = getActiveUserName();
    if (username) {
      const userKey = `moodify_data_${username}`;
      try {
        const savedData = localStorage.getItem(userKey);
        const userData = savedData ? JSON.parse(savedData) : {};
        userData.checklist = checklistItems;
        localStorage.setItem(userKey, JSON.stringify(userData));
        localStorage.setItem('moodify_currentUser', username);
        alert('Checklist berhasil disimpan!');
      } catch (e) {
        console.error('Error saving checklist:', e);
      }
    }
  };

  const toggleItem = (category, itemId) => {
    setChecklistItems(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  const addItem = () => {
    if (newItemName.trim()) {
      const newItem = {
        id: `custom-${Date.now()}`,
        name: newItemName.trim(),
        checked: false,
        urgent: true
      };
      setChecklistItems(prev => ({
        ...prev,
        [selectedCategory]: [...prev[selectedCategory], newItem]
      }));
      setNewItemName('');
      setShowAddForm(false);
    }
  };

  const deleteItem = (category, itemId) => {
    setChecklistItems(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }));
  };

  const resetChecklist = () => {
    if (confirm('Apakah Anda yakin ingin mereset checklist ke kondisi awal?')) {
      setChecklistItems(DEFAULT_CHECKLIST_ITEMS);
    }
  };

  const currentItems = checklistItems[selectedCategory] || [];
  const categoryInfo = TRAVEL_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className="checklist-container">
      <header className="checklist-header">
        <div className="feature-heading">
          <Backpack className="feature-heading-icon" />
          <h2 className="title">Checklist Perjalanan</h2>
        </div>
        <p className="subtitle">Daftar perlengkapan penting untuk keselamatan anak selama perjalanan wisata</p>
      </header>

      {/* Progress Overview */}
      <div className="progress-overview glass-card">
        <div className="progress-header">
          <span className="progress-label">Kelengkapan Perlengkapan</span>
          <span className="progress-percentage">{completionRate}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionRate}%`, backgroundColor: completionRate === 100 ? '#10b981' : '#3b82f6' }}
          />
        </div>
        <p className="progress-hint">
          {completionRate === 100 ? '🎉 Sempurna! Semua perlengkapan sudah siap.' : 
           completionRate >= 70 ? '👍 Bagus! Tinggal sedikit lagi.' :
           completionRate >= 40 ? '⚠️ Perlu diperhatikan, masih banyak yang kurang.' :
           '❗ Segera lengkapi perlengkapan penting!'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {TRAVEL_CATEGORIES.map(category => {
          const Icon = category.icon;
          const items = checklistItems[category.id] || [];
          const checkedCount = items.filter(item => item.checked).length;
          
          return (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              style={{ 
                borderColor: selectedCategory === category.id ? category.color : '#e2e8f0',
                backgroundColor: selectedCategory === category.id ? `${category.color}15` : 'white'
              }}
            >
              <Icon size={20} color={category.color} />
              <span className="category-name">{category.name}</span>
              <span className="category-count">{checkedCount}/{items.length}</span>
            </button>
          );
        })}
      </div>

      {/* Urgent Items Alert */}
      {currentItems.some(item => item.urgent && !item.checked) && (
        <div className="urgent-alert glass-card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <AlertTriangle size={20} color="#ef4444" />
          <span className="urgent-text">Ada {currentItems.filter(item => item.urgent && !item.checked).length} item mendesak yang belum dicentang!</span>
        </div>
      )}

      {/* Checklist Items */}
      <div className="checklist-items glass-card">
        <div className="items-header">
          <h3 style={{ color: categoryInfo?.color }}>
            {categoryInfo?.name}
          </h3>
          <div className="header-actions">
            <button 
              className="icon-btn" 
              onClick={() => setShowAddForm(!showAddForm)}
              title="Tambah item"
            >
              <Plus size={18} />
            </button>
            <button 
              className="icon-btn" 
              onClick={resetChecklist}
              title="Reset checklist"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="add-item-form">
            <input
              type="text"
              placeholder="Nama item baru..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <button className="btn-primary" onClick={addItem}>
              <Plus size={16} />
              Tambah
            </button>
          </div>
        )}

        <div className="items-list">
          {currentItems.length === 0 ? (
            <p className="empty-state">Belum ada item dalam kategori ini</p>
          ) : (
            currentItems.map(item => (
              <div 
                key={item.id}
                className={`checklist-item ${item.checked ? 'checked' : ''} ${item.urgent ? 'urgent' : ''}`}
                onClick={() => toggleItem(selectedCategory, item.id)}
              >
                <div className="item-left">
                  {item.checked ? (
                    <CheckCircle2 size={22} color="#10b981" />
                  ) : (
                    <Circle size={22} color={item.urgent ? '#ef4444' : '#cbd5e1'} />
                  )}
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    {item.urgent && !item.checked && (
                      <span className="urgent-badge">Mendesak</span>
                    )}
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(selectedCategory, item.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <button className="btn-primary save-btn" onClick={saveChecklist}>
        <Save size={18} />
        Simpan Checklist
      </button>
    </div>
  );
};

export default Checklist;
