import { VERIFIED_FOODS } from '../../data/verifiedFoods';

// The first model is compact and covers common objects. Food-101 is loaded
// only if that model cannot map the image to the local catalog.
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
const QUICK_MODEL = 'Xenova/mobilevit-xx-small';
const FOOD_MODEL = 'onnx-community/swin-finetuned-food101-ONNX';

let transformersPromise;
const classifierPromises = new Map();

const getTransformers = () => {
  if (!transformersPromise) {
    transformersPromise = import(/* @vite-ignore */ TRANSFORMERS_URL)
      .then((transformers) => {
        transformers.env.allowLocalModels = false;
        return transformers;
      })
      .catch((error) => {
        transformersPromise = null;
        throw error;
      });
  }
  return transformersPromise;
};

const getClassifier = (modelId, options = {}) => {
  if (!classifierPromises.has(modelId)) {
    const promise = getTransformers()
      .then(({ pipeline }) => pipeline('image-classification', modelId, options))
      .catch((error) => {
        classifierPromises.delete(modelId);
        throw error;
      });
    classifierPromises.set(modelId, promise);
  }
  return classifierPromises.get(modelId);
};

export const prepareBrowserFoodRecognition = () => getClassifier(QUICK_MODEL);

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Map model-specific class names to the closest matching verified catalog item.
// Keep these explicit: generic labels such as "plate" must never become food.
const MODEL_LABEL_FOOD_IDS = new Map([
  ['loaf', 'roti-tawar'],
  ['french loaf', 'roti-tawar'],
  ['bread', 'roti-tawar'],
  ['white bread', 'roti-tawar'],
  ['sandwich bread', 'roti-tawar'],
  ['sourdough', 'roti-tawar'],
  ['bagel', 'roti-tawar'],
  ['brown bread', 'roti-gandum'],
  ['wholemeal bread', 'roti-gandum'],
  ['wheat bread', 'roti-gandum'],
  ['french toast', 'roti-bakar'],
  ['garlic bread', 'roti-bakar'],
  ['bread pudding', 'puding'],
  ['granny smith', 'apel'],
  ['banana', 'pisang-ambon'],
  ['bunch of bananas', 'pisang-ambon'],
  ['mashed potato', 'kentang-rebus'],
  ['boiled potato', 'kentang-rebus'],
  ['brown rice', 'nasi-merah'],
  ['rice', 'nasi-putih'],
  ['fried chicken', 'ayam-goreng'],
  ['chicken wings', 'ayam-goreng'],
  ['omelette', 'telur-dadar'],
  ['frozen yogurt', 'yogurt'],
  ['guacamole', 'alpukat'],
  ['grilled salmon', 'ikan-bakar'],
  ['water bottle', 'air-mineral'],
  ['bottle of water', 'air-mineral'],
  ['mineral water bottle', 'air-mineral'],
  ['milk bottle', 'susu-sapi'],
  ['glass of milk', 'susu-sapi']
]);

const findFoodForLabel = (label) => {
  // ImageNet labels often include synonyms, e.g. "French loaf, bread, breadstuff".
  const normalizedLabels = [...new Set(String(label || '').split(',').map(normalize).filter(Boolean))];
  for (const normalizedLabel of normalizedLabels) {
    const catalogMatch = VERIFIED_FOODS.find((food) => {
      const terms = [food.name, ...(food.terms || []), ...(food.searchTerms || [])];
      return terms.some((term) => {
        const normalizedTerm = normalize(term);
        return normalizedTerm === normalizedLabel
          || normalizedTerm.startsWith(`${normalizedLabel} `)
          || normalizedLabel.startsWith(`${normalizedTerm} `);
      });
    });

    if (catalogMatch) return catalogMatch;
    const mappedFoodId = MODEL_LABEL_FOOD_IDS.get(normalizedLabel);
    if (mappedFoodId) return VERIFIED_FOODS.find((food) => food.id === mappedFoodId);
  }

  return undefined;
};

const findPrediction = (predictions, minimumScore) => {
  for (const prediction of predictions || []) {
    const food = findFoodForLabel(prediction.label);
    if (food && prediction.score >= minimumScore) return { food, score: prediction.score };
  }
  return null;
};

export const recognizeFoodInBrowser = async (imageDataUrl, onStage = () => {}) => {
  const imageBlob = await fetch(imageDataUrl).then((response) => {
    if (!response.ok) throw new Error('Foto tidak dapat disiapkan untuk pengenalan.');
    return response.blob();
  });

  onStage('Mencocokkan foto dengan makanan dan minuman umum...');
  const quickClassifier = await getClassifier(QUICK_MODEL);
  const quickPredictions = await quickClassifier(imageBlob, { top_k: 10 });
  const quickMatch = findPrediction(quickPredictions, 0.055);
  if (quickMatch) return quickMatch;

  // Food-101 adds a specialist pass for dishes outside the quick model's
  // ImageNet labels. q4 keeps this fallback much smaller than the old CLIP.
  onStage('Memperluas pencarian hidangan dengan model Food-101 (unduhan pertama sekitar 60 MB)...');
  const foodClassifier = await getClassifier(FOOD_MODEL, { dtype: 'q4' });
  const foodPredictions = await foodClassifier(imageBlob, { top_k: 10 });
  return findPrediction(foodPredictions, 0.18);
};
