/**
 * Smart Query Router Service
 * Classifies farmer queries into distinct agricultural domains.
 */
export function classifyQuery(message) {
  const text = (message || '').toLowerCase();

  const categories = {
    MARKET_PRICE: ['price', 'rate', 'mandi', 'market', 'cost per quintal', 'selling', 'ధర', 'రేటు', 'మార్కెట్', 'అమ్మకం'],
    FERTILIZER: ['fertilizer', 'urea', 'dap', 'mop', 'npk', 'nitrogen', 'phosphorus', 'potash', 'nutrient', 'ఎరువులు', 'యూరియా', 'డిఎపి'],
    PEST_DISEASE: ['pest', 'disease', 'thrips', 'whitefly', 'blight', 'fungus', 'leaf curl', 'yellowing', 'worm', 'spray', 'pesticide', 'పురుగులు', 'తెగులు', 'ముడత', 'నల్లి', 'మందులు'],
    IRRIGATION: ['irrigate', 'water', 'drip', 'sprinkler', 'moisture', 'flooding', 'నీరు', 'నీటి పారుదల', 'తడి', 'డ్రిప్'],
    SOIL: ['soil', 'ph', 'sand', 'clay', 'loam', 'manure', 'compost', 'మట్టి', 'నేల', 'సారం'],
    GOVERNMENT_SCHEME: ['scheme', 'pm-kisan', 'pmfby', 'subsidy', 'insurance', 'loan', 'kcc', 'రైతు భరోసా', 'పథకాలు', 'రుణం', 'బీమా'],
    FARM_EQUIPMENT: ['tractor', 'sprayer', 'harvester', 'equipment', 'rotavator', 'యంత్రాలు', 'ట్రాక్టర్', 'స్ప్రేయర్'],
    CROP: ['sowing', 'seed', 'yield', 'harvest', 'variety', 'crop', 'విత్తనాలు', 'పంట', 'కోత']
  };

  const detectedCategories = [];
  let detectedCrop = null;

  // Detect crops
  const cropKeywords = {
    Paddy: ['paddy', 'rice', 'వరి', 'అన్నం'],
    Tomato: ['tomato', 'టమోటా', 'టమాటా'],
    Chilli: ['chilli', 'chili', 'mirchi', 'మిరప'],
    Cotton: ['cotton', 'పత్తి'],
    Maize: ['maize', 'corn', 'మొక్కజొన్న'],
    Groundnut: ['groundnut', 'peanut', 'వేరుశనగ']
  };

  for (const [crop, keywords] of Object.entries(cropKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      detectedCrop = crop;
      break;
    }
  }

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => text.includes(k))) {
      detectedCategories.push(cat);
    }
  }

  const primaryCategory = detectedCategories[0] || 'GENERAL_AGRICULTURE';

  return {
    primaryCategory,
    categories: detectedCategories,
    crop: detectedCrop || 'ALL',
    needsMarket: detectedCategories.includes('MARKET_PRICE'),
    needsRag: !detectedCategories.includes('MARKET_PRICE')
  };
}
