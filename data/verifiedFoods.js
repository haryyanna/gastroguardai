/**
 * Database makanan terverifikasi untuk travel health.
 * Sumber: USDA FoodData Central, Kemenkes RI, AKG 2000 kkal.
 * Fokus: Makanan aman untuk perjalanan wisata anak.
 */

const makeCatalogFood = ({ id, name, terms, category, emoji, calories, protein, fat, carbs, fiber, safetyTips, allergens }) => ({
  id,
  name,
  searchTerms: terms,
  category,
  emoji,
  calories,
  protein,
  fat,
  carbs,
  fiber,
  safetyTips,
  allergens,
  nutritionList: [
    { label: 'Kalori', value: `${calories} kkal`, desc: calories > 400 ? 'Tinggi' : calories > 200 ? 'Sedang' : 'Rendah' },
    { label: 'Protein', value: `${protein} gram`, desc: protein > 15 ? 'Tinggi' : protein > 8 ? 'Sedang' : 'Rendah' },
    { label: 'Lemak', value: `${fat} gram`, desc: fat > 15 ? 'Tinggi' : fat > 8 ? 'Sedang' : 'Rendah' },
    { label: 'Karbohidrat', value: `${carbs} gram`, desc: carbs > 50 ? 'Tinggi' : carbs > 25 ? 'Sedang' : 'Rendah' },
    { label: 'Serat', value: `${fiber} gram`, desc: fiber > 5 ? 'Tinggi' : fiber > 3 ? 'Sedang' : 'Rendah' }
  ],
  grade: (String(safetyTips).includes('Aman') || String(safetyTips).includes('Sangat Aman')) ? 'A' : 
         String(safetyTips).includes('Hati-hati') ? 'B' : 'C',
  gradeColor: (String(safetyTips).includes('Aman') || String(safetyTips).includes('Sangat Aman')) ? '#10b981' : 
              String(safetyTips).includes('Hati-hati') ? '#eab308' : '#ef4444',
  status: (String(safetyTips).includes('Aman') || String(safetyTips).includes('Sangat Aman')) ? 'Sangat Aman' : 
          String(safetyTips).includes('Hati-hati') ? 'Perlu Hati-hati' : 'Berisiko'
});

const getServingRecommendation = (food) => {
  const name = String(food?.name || '').toLowerCase();
  const category = String(food?.category || '').toLowerCase();

  if (name.includes('telur') || category.includes('protein')) return 'Sajikan dalam porsi sesuai usia, utamakan matang sempurna, dan lengkapi dengan sayur agar lebih seimbang.';
  if (name.includes('buah') || category.includes('buah')) return 'Cuci bersih sebelum dikonsumsi, sajikan dalam potongan aman, dan hindari menambahkan gula berlebih.';
  if (name.includes('nasi') || category.includes('karbohidrat')) return 'Sajikan dengan porsi sedang, seimbang dengan protein dan sayur, serta pastikan makanan tetap hangat dan bersih.';
  if (category.includes('sayur')) return 'Cuci bersih sebelum dimasak, sajikan saat masih segar, dan kombinasikan dengan protein agar lebih bernutrisi.';
  if (category.includes('minuman')) return 'Pilih minuman tanpa gula tambahan, jaga kebersihan wadah, dan pastikan hidrasi cukup.';
  return 'Sajikan dengan porsi sesuai usia anak, jaga kebersihan alat makan, dan kombinasikan dengan variasi gizi yang seimbang.';
};

const getAdditionalRecommendations = (food) => {
  const category = String(food?.category || '').toLowerCase();
  const base = [
    'Pastikan makanan dalam kondisi bersih, matang, dan aman untuk anak.',
    'Perhatikan alergi dan kandungan bahan tambahan seperti garam atau gula.',
    'Gunakan porsi kecil dan seimbang untuk perjalanan agar tidak mudah mual.'
  ];

  if (category.includes('karbohidrat')) base.unshift('Pilih porsi yang tidak terlalu berlemak agar lebih mudah dicerna.');
  if (category.includes('protein')) base.unshift('Cek tingkat kematangan dan pastikan daging atau telur sudah matang sempurna.');
  if (category.includes('sayur')) base.unshift('Cuci bersih sayuran sebelum dimasak agar aman dikonsumsi.');
  if (category.includes('minuman')) base.unshift('Utamakan minuman yang aman dan tidak terlalu manis untuk menjaga hidrasi.');

  return base;
};

const normalizeFoodData = (food) => {
  if (!food || typeof food !== 'object') return food;

  const safetyText = String(food.safetyTips || 'Aman');
  const normalizedTerms = Array.isArray(food.searchTerms)
    ? food.searchTerms
    : Array.isArray(food.terms)
      ? food.terms
      : [];

  const normalized = {
    ...food,
    searchTerms: normalizedTerms,
    safetyTips: safetyText,
    allergens: food.allergens || 'Tidak ada',
    nutritionList: Array.isArray(food.nutritionList) && food.nutritionList.length
      ? food.nutritionList
      : [
          { label: 'Kalori', value: `${Number(food.calories) || 0} kkal`, desc: Number(food.calories) > 400 ? 'Tinggi' : Number(food.calories) > 200 ? 'Sedang' : 'Rendah' },
          { label: 'Protein', value: `${Number(food.protein) || 0} gram`, desc: Number(food.protein) > 15 ? 'Tinggi' : Number(food.protein) > 8 ? 'Sedang' : 'Rendah' },
          { label: 'Lemak', value: `${Number(food.fat) || 0} gram`, desc: Number(food.fat) > 15 ? 'Tinggi' : Number(food.fat) > 8 ? 'Sedang' : 'Rendah' },
          { label: 'Karbohidrat', value: `${Number(food.carbs) || 0} gram`, desc: Number(food.carbs) > 50 ? 'Tinggi' : Number(food.carbs) > 25 ? 'Sedang' : 'Rendah' },
          { label: 'Serat', value: `${Number(food.fiber) || 0} gram`, desc: Number(food.fiber) > 5 ? 'Tinggi' : Number(food.fiber) > 3 ? 'Sedang' : 'Rendah' }
        ],
    grade: (safetyText.includes('Aman') || safetyText.includes('Sangat Aman')) ? 'A' : safetyText.includes('Hati-hati') ? 'B' : 'C',
    gradeColor: (safetyText.includes('Aman') || safetyText.includes('Sangat Aman')) ? '#10b981' : safetyText.includes('Hati-hati') ? '#eab308' : '#ef4444',
    status: (safetyText.includes('Aman') || safetyText.includes('Sangat Aman')) ? 'Sangat Aman' : safetyText.includes('Hati-hati') ? 'Perlu Hati-hati' : 'Berisiko',
    servingRecommendation: getServingRecommendation(food),
    additionalRecommendations: getAdditionalRecommendations(food),
    isFood: true
  };

  return normalized;
};

const VERIFIED_FOODS = [
  { id: 'nasi-putih', name: 'Nasi Putih', terms: ['nasi putih', 'white rice'], category: 'Karbohidrat', emoji: '🍚', calories: 204, protein: 4, fat: 0.4, carbs: 44, fiber: 0.6, safetyTips: 'Aman, mudah dicerna, sumber energi utama', allergens: 'Tidak ada' },
  { id: 'nasi-merah', name: 'Nasi Merah', terms: ['nasi merah', 'brown rice'], category: 'Karbohidrat', emoji: '🍚', calories: 216, protein: 5, fat: 1.8, carbs: 45, fiber: 1.8, safetyTips: 'Sangat Aman, lebih tinggi serat dan nutrisi dari nasi putih', allergens: 'Tidak ada' },
  { id: 'roti-gandum', name: 'Roti Gandum', terms: ['roti gandum', 'whole wheat bread'], category: 'Karbohidrat', emoji: '🍞', calories: 247, protein: 13, fat: 3.4, carbs: 41, fiber: 6, safetyTips: 'Aman, sumber serat baik untuk pencernaan perjalanan', allergens: 'Gluten' },
  { id: 'roti-tawar', name: 'Roti Tawar', terms: ['roti tawar', 'white bread'], category: 'Karbohidrat', emoji: '🍞', calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7, safetyTips: 'Aman, pilih whole grain untuk nutrisi lebih baik', allergens: 'Gluten' },
  { id: 'bihun', name: 'Bihun', terms: ['bihun', 'rice vermicelli'], category: 'Karbohidrat', emoji: '🍜', calories: 360, protein: 8, fat: 1, carbs: 80, fiber: 2, safetyTips: 'Aman, mudah dicerna, cocok untuk anak', allergens: 'Tidak ada' },
  { id: 'mie-goreng', name: 'Mie Goreng', terms: ['mie goreng', 'fried noodles'], category: 'Karbohidrat', emoji: '🍝', calories: 380, protein: 12, fat: 15, carbs: 50, fiber: 3, safetyTips: 'Hati-hati, tinggi lemak dan garam, pilih yang tidak terlalu berminyak', allergens: 'Gluten, Telur' },
  { id: 'mie-rebus', name: 'Mie Rebus', terms: ['mie rebus', 'boiled noodles'], category: 'Karbohidrat', emoji: '🍜', calories: 220, protein: 8, fat: 5, carbs: 38, fiber: 2, safetyTips: 'Lebih aman dari mie goreng, pastikan matang sempurna', allergens: 'Gluten, Telur' },
  { id: 'kentang-rebus', name: 'Kentang Rebus', terms: ['kentang rebus', 'boiled potato'], category: 'Karbohidrat', emoji: '🥔', calories: 87, protein: 2, fat: 0.1, carbs: 20, fiber: 1.8, safetyTips: 'Sangat Aman, mudah dicerna, sumber energi baik', allergens: 'Tidak ada' },
  { id: 'kentang-goreng', name: 'Kentang Goreng', terms: ['kentang goreng', 'french fries'], category: 'Karbohidrat', emoji: '🍟', calories: 312, protein: 4, fat: 15, carbs: 41, fiber: 3.8, safetyTips: 'Hati-hati, tinggi lemak, pastikan minyak bersih dan segar', allergens: 'Tidak ada' },
  { id: 'singkong-rebus', name: 'Singkong Rebus', terms: ['singkong rebus', 'boiled cassava'], category: 'Karbohidrat', emoji: '🥔', calories: 160, protein: 1.4, fat: 0.3, carbs: 38, fiber: 1.8, safetyTips: 'Aman, pastikan matang sempurna untuk menghindari racun', allergens: 'Tidak ada' },
  { id: 'pisang-goreng', name: 'Pisang Goreng', terms: ['pisang goreng', 'fried banana'], category: 'Karbohidrat', emoji: '🍌', calories: 280, protein: 2, fat: 14, carbs: 35, fiber: 2.5, safetyTips: 'Hati-hati, tinggi lemak, pilih minyak bersih', allergens: 'Tidak ada' },
  { id: 'pisang-ambon', name: 'Pisang Ambon', terms: ['pisang ambon', 'ambon banana'], category: 'Buah', emoji: '🍌', calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, safetyTips: 'Sangat Aman, sumber kalium dan energi cepat', allergens: 'Tidak ada' },
  { id: 'pisang-cavendish', name: 'Pisang Cavendish', terms: ['pisang cavendish', 'cavendish banana'], category: 'Buah', emoji: '🍌', calories: 95, protein: 1.2, fat: 0.3, carbs: 25, fiber: 2.8, safetyTips: 'Sangat Aman, mudah dibawa, tahan lama', allergens: 'Tidak ada' },
  { id: 'apel', name: 'Apel', terms: ['apel', 'apple'], category: 'Buah', emoji: '🍎', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, safetyTips: 'Sangat Aman, cuci bersih, kaya vitamin dan serat', allergens: 'Tidak ada' },
  { id: 'jeruk', name: 'Jeruk', terms: ['jeruk', 'orange'], category: 'Buah', emoji: '🍊', calories: 47, protein: 0.9, fat: 0.1, carbs: 12, fiber: 2.4, safetyTips: 'Sangat Aman, kaya vitamin C untuk imunitas', allergens: 'Tidak ada' },
  { id: 'mangga', name: 'Mangga', terms: ['mangga', 'mango'], category: 'Buah', emoji: '🥭', calories: 60, protein: 0.8, fat: 0.4, carbs: 15, fiber: 1.6, safetyTips: 'Aman, kaya vitamin A, hindari yang terlalu asam untuk anak sensitif', allergens: 'Tidak ada' },
  { id: 'semangka', name: 'Semangka', terms: ['semangka', 'watermelon'], category: 'Buah', emoji: '🍉', calories: 30, protein: 0.6, fat: 0.2, carbs: 8, fiber: 0.4, safetyTips: 'Sangat Aman, hidrasi tinggi, pastikan higienis saat potong', allergens: 'Tidak ada' },
  { id: 'anggur', name: 'Anggur', terms: ['anggur', 'grape'], category: 'Buah', emoji: '🍇', calories: 69, protein: 0.7, fat: 0.2, carbs: 18, fiber: 0.9, safetyTips: 'Aman, cuci bersih, waspada tersedak untuk anak kecil', allergens: 'Tidak ada' },
  { id: 'stroberi', name: 'Stroberi', terms: ['stroberi', 'strawberry'], category: 'Buah', emoji: '🍓', calories: 32, protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2, safetyTips: 'Sangat Aman, cuci bersih, kaya antioksidan', allergens: 'Tidak ada' },
  { id: 'blueberry', name: 'Blueberry', terms: ['blueberry', 'blueberries'], category: 'Buah', emoji: '🫐', calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4, safetyTips: 'Sangat Aman, superfood untuk otak dan imunitas', allergens: 'Tidak ada' },
  { id: 'kiwi', name: 'Kiwi', terms: ['kiwi', 'kiwifruit'], category: 'Buah', emoji: '🥝', calories: 61, protein: 1.1, fat: 0.5, carbs: 15, fiber: 3, safetyTips: 'Aman, kaya vitamin C, waspada alergi untuk beberapa anak', allergens: 'Tidak ada' },
  { id: 'pepaya', name: 'Pepaya', terms: ['pepaya', 'papaya'], category: 'Buah', emoji: '🧡', calories: 43, protein: 0.5, fat: 0.3, carbs: 11, fiber: 1.7, safetyTips: 'Sangat Aman, baik untuk pencernaan', allergens: 'Tidak ada' },
  { id: 'naga', name: 'Buah Naga', terms: ['buah naga', 'dragon fruit'], category: 'Buah', emoji: '🐉', calories: 60, protein: 1.2, fat: 0.4, carbs: 14, fiber: 2.5, safetyTips: 'Sangat Aman, hidrasi dan serat tinggi', allergens: 'Tidak ada' },
  { id: 'alpukat', name: 'Alpukat', terms: ['alpukat', 'avocado'], category: 'Buah', emoji: '🥑', calories: 160, protein: 2, fat: 15, carbs: 9, fiber: 7, safetyTips: 'Sangat Aman, lemak sehat untuk perkembangan anak', allergens: 'Tidak ada' },
  { id: 'pear', name: 'Pir', terms: ['pir', 'pear'], category: 'Buah', emoji: '🍐', calories: 57, protein: 0.4, fat: 0.1, carbs: 15, fiber: 3.1, safetyTips: 'Sangat Aman, serat tinggi, cuci bersih', allergens: 'Tidak ada' },
  { id: 'sirsak', name: 'Sirsak', terms: ['sirsak', 'soursop'], category: 'Buah', emoji: '🍈', calories: 66, protein: 1, fat: 0.3, carbs: 17, fiber: 3.3, safetyTips: 'Aman, kaya antioksidan', allergens: 'Tidak ada' },
  { id: 'duku', name: 'Duku', terms: ['duku', 'langsat'], category: 'Buah', emoji: '🍈', calories: 70, protein: 1, fat: 0.2, carbs: 18, fiber: 2, safetyTips: 'Aman, waspada biji yang keras', allergens: 'Tidak ada' },
  { id: 'rambutan', name: 'Rambutan', terms: ['rambutan', 'rambutan'], category: 'Buah', emoji: '🍈', calories: 82, protein: 1, fat: 0.5, carbs: 20, fiber: 1.5, safetyTips: 'Aman, waspada biji yang keras', allergens: 'Tidak ada' },
  { id: 'salak', name: 'Salak', terms: ['salak', 'snake fruit'], category: 'Buah', emoji: '🍈', calories: 82, protein: 1.2, fat: 0.4, carbs: 20, fiber: 2, safetyTips: 'Hati-hati, bisa menyebabkan sembelit jika berlebihan', allergens: 'Tidak ada' },
  { id: 'ayam-goreng', name: 'Ayam Goreng', terms: ['ayam goreng', 'fried chicken'], category: 'Protein', emoji: '🍗', calories: 320, protein: 25, fat: 18, carbs: 8, fiber: 0, safetyTips: 'Hati-hati, tinggi lemak, pastikan matang sempurna', allergens: 'Tidak ada' },
  { id: 'ayam-rebus', name: 'Ayam Rebus', terms: ['ayam rebus', 'boiled chicken'], category: 'Protein', emoji: '🍗', calories: 240, protein: 27, fat: 5, carbs: 0, fiber: 0, safetyTips: 'Sangat Aman, protein tinggi, lemak rendah', allergens: 'Tidak ada' },
  { id: 'ayam-bakar', name: 'Ayam Bakar', terms: ['ayam bakar', 'grilled chicken'], category: 'Protein', emoji: '🍗', calories: 280, protein: 26, fat: 12, carbs: 4, fiber: 0, safetyTips: 'Aman, pastikan tidak gosong dan matang sempurna', allergens: 'Tidak ada' },
  { id: 'telur-rebus', name: 'Telur Rebus', terms: ['telur rebus', 'boiled egg'], category: 'Protein', emoji: '🥚', calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, safetyTips: 'Sangat Aman, protein berkualitas tinggi', allergens: 'Telur' },
  { id: 'telur-dadar', name: 'Telur Dadar', terms: ['telur dadar', 'fried egg'], category: 'Protein', emoji: '🥚', calories: 180, protein: 12, fat: 14, carbs: 1, fiber: 0, safetyTips: 'Aman, gunakan minyak minimal', allergens: 'Telur' },
  { id: 'ikan-goreng', name: 'Ikan Goreng', terms: ['ikan goreng', 'fried fish'], category: 'Protein', emoji: '🐟', calories: 290, protein: 24, fat: 18, carbs: 5, fiber: 0, safetyTips: 'Hati-hati, waspati durian, pastikan matang sempurna', allergens: 'Ikan' },
  { id: 'ikan-rebus', name: 'Ikan Rebus', terms: ['ikan rebus', 'boiled fish'], category: 'Protein', emoji: '🐟', calories: 200, protein: 26, fat: 8, carbs: 0, fiber: 0, safetyTips: 'Sangat Aman, omega-3 untuk perkembangan otak', allergens: 'Ikan' },
  { id: 'ikan-bakar', name: 'Ikan Bakar', terms: ['ikan bakar', 'grilled fish'], category: 'Protein', emoji: '🐟', calories: 250, protein: 25, fat: 12, carbs: 3, fiber: 0, safetyTips: 'Aman, pastikan tidak gosong', allergens: 'Ikan' },
  { id: 'tahu-goreng', name: 'Tahu Goreng', terms: ['tahu goreng', 'fried tofu'], category: 'Protein', emoji: '🧊', calories: 270, protein: 16, fat: 18, carbs: 8, fiber: 2, safetyTips: 'Hati-hati, tinggi lemak, pilih minyak bersih', allergens: 'Kedelai' },
  { id: 'tahu-rebus', name: 'Tahu Rebus', terms: ['tahu rebus', 'boiled tofu'], category: 'Protein', emoji: '🧊', calories: 140, protein: 15, fat: 8, carbs: 3, fiber: 2, safetyTips: 'Sangat Aman, protein nabati rendah lemak', allergens: 'Kedelai' },
  { id: 'tempe-goreng', name: 'Tempe Goreng', terms: ['tempe goreng', 'fried tempeh'], category: 'Protein', emoji: '🧊', calories: 290, protein: 18, fat: 20, carbs: 10, fiber: 6, safetyTips: 'Hati-hati, tinggi lemak, pilih minyak bersih', allergens: 'Kedelai' },
  { id: 'tempe-rebus', name: 'Tempe Rebus', terms: ['tempe rebus', 'boiled tempeh'], category: 'Protein', emoji: '🧊', calories: 190, protein: 19, fat: 10, carbs: 8, fiber: 6, safetyTips: 'Sangat Aman, probiotik alami untuk pencernaan', allergens: 'Kedelai' },
  { id: 'sapi-lada-hitam', name: 'Daging Sapi Lada Hitam', terms: ['daging sapi lada hitam', 'beef pepper steak'], category: 'Protein', emoji: '🥩', calories: 350, protein: 28, fat: 22, carbs: 8, fiber: 1, safetyTips: 'Hati-hati, tinggi lemak, pastikan matang sempurna', allergens: 'Tidak ada' },
  { id: 'sapi-rebus', name: 'Daging Sapi Rebus', terms: ['daging sapi rebus', 'boiled beef'], category: 'Protein', emoji: '🥩', calories: 250, protein: 26, fat: 12, carbs: 0, fiber: 0, safetyTips: 'Sangat Aman, protein dan zat besi tinggi', allergens: 'Tidak ada' },
  { id: 'udang-goreng', name: 'Udang Goreng', terms: ['udang goreng', 'fried shrimp'], category: 'Protein', emoji: '🦐', calories: 280, protein: 24, fat: 15, carbs: 8, fiber: 0, safetyTips: 'Hati-hati, alergi tinggi untuk beberapa anak', allergens: 'Udang, Kerang' },
  { id: 'udang-rebus', name: 'Udang Rebus', terms: ['udang rebus', 'boiled shrimp'], category: 'Protein', emoji: '🦐', calories: 180, protein: 26, fat: 5, carbs: 1, fiber: 0, safetyTips: 'Hati-hati, alergi tinggi untuk beberapa anak', allergens: 'Udang, Kerang' },
  { id: 'sayur-sop', name: 'Sayur Sop', terms: ['sayur sop', 'vegetable soup'], category: 'Sayuran', emoji: '🥣', calories: 80, protein: 4, fat: 2, carbs: 12, fiber: 3, safetyTips: 'Sangat Aman, nutrisi lengkap, hidrasi tinggi', allergens: 'Tidak ada' },
  { id: 'sayur-asem', name: 'Sayur Asem', terms: ['sayur asem', 'tamarind vegetable soup'], category: 'Sayuran', emoji: '🥣', calories: 70, protein: 3, fat: 1.5, carbs: 14, fiber: 3, safetyTips: 'Sangat Aman, segar dan menyegarkan', allergens: 'Tidak ada' },
  { id: 'sayur-bayam', name: 'Sayur Bayam', terms: ['sayur bayam', 'spinach soup'], category: 'Sayuran', emoji: '🥬', calories: 60, protein: 3, fat: 2, carbs: 10, fiber: 3.5, safetyTips: 'Sangat Aman, zat besi tinggi untuk darah', allergens: 'Tidak ada' },
  { id: 'kangkung', name: 'Tumis Kangkung', terms: ['tumis kangkung', 'stir-fried water spinach'], category: 'Sayuran', emoji: '🥬', calories: 90, protein: 3, fat: 5, carbs: 10, fiber: 2.5, safetyTips: 'Aman, pastikan dicuci bersih', allergens: 'Tidak ada' },
  { id: 'capcay', name: 'Capcay', terms: ['capcay', 'mixed vegetables'], category: 'Sayuran', emoji: '🥦', calories: 85, protein: 4, fat: 4, carbs: 12, fiber: 3, safetyTips: 'Sangat Aman, variasi sayuran lengkap', allergens: 'Tidak ada' },
  { id: 'gado-gado', name: 'Gado-Gado', terms: ['gado gado', 'indonesian salad'], category: 'Sayuran', emoji: '🥗', calories: 250, protein: 8, fat: 15, carbs: 20, fiber: 4, safetyTips: 'Hati-hati, bumbu kacang tinggi lemak', allergens: 'Kacang' },
  { id: 'pecel', name: 'Pecel', terms: ['pecel', 'vegetable with peanut sauce'], category: 'Sayuran', emoji: '🥗', calories: 280, protein: 8, fat: 18, carbs: 22, fiber: 4, safetyTips: 'Hati-hati, bumbu kacang tinggi lemak', allergens: 'Kacang' },
  { id: 'karedok', name: 'Karedok', terms: ['karedok', 'raw vegetable salad'], category: 'Sayuran', emoji: '🥗', calories: 200, protein: 6, fat: 12, carbs: 18, fiber: 4, safetyTips: 'Hati-hati, sayuran mentah pastikan higienis', allergens: 'Kacang' },
  { id: 'lalapan', name: 'Lalapan', terms: ['lalapan', 'fresh vegetables'], category: 'Sayuran', emoji: '🥬', calories: 50, protein: 2, fat: 0.5, carbs: 10, fiber: 3, safetyTips: 'Hati-hati, sayuran mentah pastikan dicuci bersih', allergens: 'Tidak ada' },
  { id: 'brokoli', name: 'Brokoli', terms: ['brokoli', 'broccoli'], category: 'Sayuran', emoji: '🥦', calories: 55, protein: 3.7, fat: 0.6, carbs: 11, fiber: 5.1, safetyTips: 'Sangat Aman, superfood untuk imunitas', allergens: 'Tidak ada' },
  { id: 'wortel', name: 'Wortel', terms: ['wortel', 'carrot'], category: 'Sayuran', emoji: '🥕', calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8, safetyTips: 'Sangat Aman, vitamin A untuk mata', allergens: 'Tidak ada' },
  { id: 'tomat', name: 'Tomat', terms: ['tomat', 'tomato'], category: 'Sayuran', emoji: '🍅', calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, safetyTips: 'Sangat Aman, antioksidan tinggi', allergens: 'Tidak ada' },
  { id: 'mentimun', name: 'Mentimun', terms: ['mentimun', 'cucumber'], category: 'Sayuran', emoji: '🥒', calories: 16, protein: 0.7, fat: 0.1, carbs: 4, fiber: 0.5, safetyTips: 'Sangat Aman, hidrasi tinggi, cuci bersih', allergens: 'Tidak ada' },
  { id: 'selada', name: 'Selada', terms: ['selada', 'lettuce'], category: 'Sayuran', emoji: '🥬', calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, fiber: 1.3, safetyTips: 'Sangat Aman, pastikan dicuci bersih', allergens: 'Tidak ada' },
  { id: 'jagung-rebus', name: 'Jagung Rebus', terms: ['jagung rebus', 'boiled corn'], category: 'Sayuran', emoji: '🌽', calories: 96, protein: 3.4, fat: 1.5, carbs: 21, fiber: 2.4, safetyTips: 'Aman, sumber karbohidrat kompleks', allergens: 'Tidak ada' },
  { id: 'jagung-bakar', name: 'Jagung Bakar', terms: ['jagung bakar', 'grilled corn'], category: 'Sayuran', emoji: '🌽', calories: 120, protein: 3.8, fat: 2.5, carbs: 24, fiber: 2.8, safetyTips: 'Aman, pastikan tidak gosong', allergens: 'Tidak ada' },
  { id: 'buncis', name: 'Buncis', terms: ['buncis', 'green beans'], category: 'Sayuran', emoji: '🥬', calories: 31, protein: 1.8, fat: 0.1, carbs: 7, fiber: 2.7, safetyTips: 'Sangat Aman, serat tinggi', allergens: 'Tidak ada' },
  { id: 'terong', name: 'Terong', terms: ['terong', 'eggplant'], category: 'Sayuran', emoji: '🍆', calories: 35, protein: 1, fat: 0.2, carbs: 8.6, fiber: 2.5, safetyTips: 'Aman, hindari terlalu banyak minyak saat dimasak', allergens: 'Tidak ada' },
  { id: 'susu-sapi', name: 'Susu Sapi', terms: ['susu sapi', 'cow milk'], category: 'Minuman', emoji: '🥛', calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0, safetyTips: 'Aman, pastikan higienis dan dalam masa kadaluarsa', allergens: 'Susu, Laktosa' },
  { id: 'yogurt', name: 'Yogurt', terms: ['yogurt', 'yoghurt'], category: 'Minuman', emoji: '🥣', calories: 59, protein: 10, fat: 0.4, carbs: 3.6, fiber: 0, safetyTips: 'Sangat Aman, probiotik untuk pencernaan', allergens: 'Susu, Laktosa' },
  { id: 'keju', name: 'Keju', terms: ['keju', 'cheese'], category: 'Minuman', emoji: '🧀', calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0, safetyTips: 'Hati-hati, tinggi lemak dan garam', allergens: 'Susu, Laktosa' },
  { id: 'air-mineral', name: 'Air Mineral', terms: ['air mineral', 'mineral water'], category: 'Minuman', emoji: '💧', calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, safetyTips: 'Sangat Aman, pilih yang tertutup dan higienis', allergens: 'Tidak ada' },
  { id: 'air-kelapa', name: 'Air Kelapa', terms: ['air kelapa', 'coconut water'], category: 'Minuman', emoji: '🥥', calories: 19, protein: 0.7, fat: 0.2, carbs: 4, fiber: 1, safetyTips: 'Sangat Aman, elektrolit alami untuk hidrasi', allergens: 'Tidak ada' },
  { id: 'teh-tawar', name: 'Teh Tawar', terms: ['teh tawar', 'unsweetened tea'], category: 'Minuman', emoji: '🍵', calories: 2, protein: 0, fat: 0, carbs: 0.7, fiber: 0, safetyTips: 'Aman, hindari kafein berlebihan untuk anak', allergens: 'Tidak ada' },
  { id: 'jus-jeruk', name: 'Jus Jeruk', terms: ['jus jeruk', 'orange juice'], category: 'Minuman', emoji: '🍊', calories: 45, protein: 0.7, fat: 0.2, carbs: 10.4, fiber: 0.2, safetyTips: 'Aman, vitamin C tinggi, hindari gula tambahan', allergens: 'Tidak ada' },
  { id: 'bubur-ayam', name: 'Bubur Ayam', terms: ['bubur ayam', 'chicken congee'], category: 'Karbohidrat', emoji: '🥣', calories: 180, protein: 8, fat: 5, carbs: 28, fiber: 1, safetyTips: 'Sangat Aman, mudah dicerna untuk anak', allergens: 'Tidak ada' },
  { id: 'bubur-kacang-hijau', name: 'Bubur Kacang Hijau', terms: ['bubur kacang hijau', 'mung bean porridge'], category: 'Karbohidrat', emoji: '🥣', calories: 150, protein: 6, fat: 0.5, carbs: 32, fiber: 4, safetyTips: 'Sangat Aman, serat tinggi', allergens: 'Kacang' },
  { id: 'bubur-kacang-merah', name: 'Bubur Kacang Merah', terms: ['bubur kacang merah', 'red bean porridge'], category: 'Karbohidrat', emoji: '🥣', calories: 160, protein: 7, fat: 0.5, carbs: 34, fiber: 5, safetyTips: 'Sangat Aman, serat dan protein tinggi', allergens: 'Kacang' },
  { id: 'ketupat', name: 'Ketupat', terms: ['ketupat', 'rice cake'], category: 'Karbohidrat', emoji: '🥥', calories: 200, protein: 4, fat: 0.5, carbs: 44, fiber: 1, safetyTips: 'Aman, sumber energi, pastikan higienis', allergens: 'Tidak ada' },
  { id: 'lontong', name: 'Lontong', terms: ['lontong', 'compressed rice cake'], category: 'Karbohidrat', emoji: '🥥', calories: 210, protein: 4, fat: 0.5, carbs: 46, fiber: 1, safetyTips: 'Aman, sumber energi, pastikan higienis', allergens: 'Tidak ada' },
  { id: 'bakso', name: 'Bakso', terms: ['bakso', 'meatball soup'], category: 'Protein', emoji: '🍜', calories: 320, protein: 18, fat: 15, carbs: 30, fiber: 2, safetyTips: 'Hati-hati, pastikan daging segar dan higienis', allergens: 'Tidak ada' },
  { id: 'soto', name: 'Soto', terms: ['soto', 'indonesian soup'], category: 'Protein', emoji: '🍲', calories: 280, protein: 16, fat: 12, carbs: 28, fiber: 2, safetyTips: 'Aman, pastikan kuah dan bahan higienis', allergens: 'Tidak ada' },
  { id: 'rawon', name: 'Rawon', terms: ['rawon', 'beef soup'], category: 'Protein', emoji: '🍲', calories: 300, protein: 20, fat: 14, carbs: 25, fiber: 2, safetyTips: 'Aman, pastikan daging matang sempurna', allergens: 'Tidak ada' },
  { id: 'rendang', name: 'Rendang', terms: ['rendang', 'beef rendang'], category: 'Protein', emoji: '🥩', calories: 350, protein: 22, fat: 25, carbs: 8, fiber: 1, safetyTips: 'Hati-hati, tinggi lemak, pastikan matang sempurna', allergens: 'Tidak ada' },
  { id: 'sate-ayam', name: 'Sate Ayam', terms: ['sate ayam', 'chicken satay'], category: 'Protein', emoji: '🍢', calories: 290, protein: 24, fat: 16, carbs: 12, fiber: 1, safetyTips: 'Hati-hati, pastikan matang sempurna', allergens: 'Tidak ada' },
  { id: 'sate-kambing', name: 'Sate Kambing', terms: ['sate kambing', 'goat satay'], category: 'Protein', emoji: '🍢', calories: 320, protein: 22, fat: 22, carbs: 8, fiber: 0, safetyTips: 'Hati-hati, tinggi lemak dan kolesterol', allergens: 'Tidak ada' },
  { id: 'martabak-manis', name: 'Martabak Manis', terms: ['martabak manis', 'sweet pancake'], category: 'Karbohidrat', emoji: '🥞', calories: 380, protein: 8, fat: 18, carbs: 48, fiber: 2, safetyTips: 'Hati-hati, tinggi gula dan lemak', allergens: 'Telur, Susu' },
  { id: 'martabak-telur', name: 'Martabak Telur', terms: ['martabak telur', 'savory pancake'], category: 'Protein', emoji: '🥞', calories: 320, protein: 14, fat: 22, carbs: 20, fiber: 1, safetyTips: 'Hati-hati, tinggi lemak', allergens: 'Telur' },
  { id: 'roti-bakar', name: 'Roti Bakar', terms: ['roti bakar', 'toast'], category: 'Karbohidrat', emoji: '🍞', calories: 290, protein: 8, fat: 12, carbs: 38, fiber: 2, safetyTips: 'Hati-hati, tinggi gula jika diberi topping manis', allergens: 'Gluten, Susu' },
  { id: 'kerupuk', name: 'Kerupuk', terms: ['kerupuk', 'crackers'], category: 'Snack', emoji: '🍘', calories: 450, protein: 6, fat: 20, carbs: 60, fiber: 2, safetyTips: 'Hati-hati, tinggi lemak dan garam', allergens: 'Tidak ada' },
  { id: 'keripik-singkong', name: 'Keripik Singkong', terms: ['keripik singkong', 'cassava chips'], category: 'Snack', emoji: '🍘', calories: 480, protein: 2, fat: 25, carbs: 58, fiber: 3, safetyTips: 'Hati-hati, tinggi lemak dan garam', allergens: 'Tidak ada' },
  { id: 'kue-basah', name: 'Kue Basah', terms: ['kue basah', 'traditional cake'], category: 'Snack', emoji: '🧁', calories: 250, protein: 4, fat: 12, carbs: 32, fiber: 1, safetyTips: 'Hati-hati, pastikan higienis dan segar', allergens: 'Telur, Susu' },
  { id: 'kue-kering', name: 'Kue Kering', terms: ['kue kering', 'cookies'], category: 'Snack', emoji: '🍪', calories: 480, protein: 6, fat: 24, carbs: 60, fiber: 2, safetyTips: 'Hati-hati, tinggi gula dan lemak', allergens: 'Telur, Susu' },
  { id: 'coklat', name: 'Coklat', terms: ['coklat', 'chocolate'], category: 'Snack', emoji: '🍫', calories: 546, protein: 4.9, fat: 31, carbs: 61, fiber: 7, safetyTips: 'Hati-hati, tinggi gula dan lemak, batasi porsi', allergens: 'Susu' },
  { id: 'es-krim', name: 'Es Krim', terms: ['es krim', 'ice cream'], category: 'Snack', emoji: '🍦', calories: 207, protein: 3.5, fat: 11, carbs: 24, fiber: 0.5, safetyTips: 'Hati-hati, tinggi gula, bisa menyebabkan batuk', allergens: 'Susu' },
  { id: 'puding', name: 'Puding', terms: ['puding', 'pudding'], category: 'Snack', emoji: '🍮', calories: 150, protein: 2, fat: 5, carbs: 25, fiber: 0.5, safetyTips: 'Aman, pilih yang rendah gula', allergens: 'Susu, Telur' },
  { id: 'agar-agar', name: 'Agar-Agar', terms: ['agar agar', 'gelatin dessert'], category: 'Snack', emoji: '🍮', calories: 80, protein: 0.5, fat: 0.1, carbs: 20, fiber: 0.5, safetyTips: 'Sangat Aman, rendah kalori', allergens: 'Tidak ada' }
];

const findVerifiedFood = (searchTerm) => {
  const term = String(searchTerm ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!term) return undefined;

  const match = VERIFIED_FOODS.find((food) => {
    const normalized = normalizeFoodData(food);
    const name = String(normalized?.name ?? '').toLowerCase();
    const searchTerms = Array.isArray(normalized?.searchTerms) ? normalized.searchTerms : [];
    const aliases = [name, ...searchTerms.map((item) => String(item ?? '').toLowerCase())]
      .map((item) => item.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const termWords = term.split(' ').filter((word) => word.length > 2);

    return aliases.some((alias) => alias.includes(term) || term.includes(alias))
      || (termWords.length > 0 && aliases.some((alias) => termWords.every((word) => alias.includes(word))));
  });

  return match ? normalizeFoodData(match) : undefined;
};

export { VERIFIED_FOODS, findVerifiedFood, normalizeFoodData, getServingRecommendation, getAdditionalRecommendations };
