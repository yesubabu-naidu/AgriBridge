import { query } from './config/db.js';

const knowledgeEntries = [
  // 1. Paddy / Rice Fertilizer & Cultivation
  {
    title: 'Paddy Fertilizer & NPK Application Schedule',
    category: 'FERTILIZER',
    crop: 'Paddy',
    language: 'en',
    keywords: 'paddy rice fertilizer urea DAP MOP NPK basal dressing tillering panicle',
    content: `For optimal Paddy (Rice) yield, apply NPK in split doses. Basal dressing during final puddling: 50% Nitrogen, 100% Phosphorus (DAP/SSP), and 50% Potash (MOP). Apply remaining 25% Nitrogen (Urea) at active tillering stage (20-25 days after transplanting) and final 25% Nitrogen + 50% Potash at panicle initiation stage (40-45 days). Ensure field has shallow water (2-3 cm) during fertilizer application.`,
    source: 'ICAR National Rice Research Institute & PJTSAU Agronomy Guide'
  },
  {
    title: 'వరి సాగు మరియు ఎరువుల మోతాదు గైడ్ (Paddy Fertilizer Telugu)',
    category: 'FERTILIZER',
    crop: 'Paddy',
    language: 'te',
    keywords: 'వరి ఎరువులు యూరియా డీఏపీ పొటాష్ నాట్లు దమ్ము డిఎపి సమగ్ర ఎరువులు',
    content: `వరి పంటలో నత్రజని, భాస్వరం, పొటాష్ ఎరువులను సరైన సమయంలో వేయడం ఎంతో ముఖ్యం. ఆఖరి దమ్ములో పొలానికి ఎకరాకు డీఏపీ 50 కేజీలు, పొటాష్ 25 కేజీలు మరియు యూరియా 25 కేజీలు వేయాలి. నాటిన 20-25 రోజులకు (పిలకల దశలో) ఎకరాకు 35 కేజీల యూరియా చల్లాలి. చిరుపొట్ట లేదా ఈనె దశలో (40-45 రోజులు) మిగిలిన 35 కేజీల యూరియా మరియు 25 కేజీల పొటాష్ ఎరువును వేయాలి.`,
    source: 'ఆచార్య ఎన్.జి. రంగా వ్యవసాయ విశ్వవిద్యాలయం (ANGRAU)'
  },

  // 2. Tomato Cultivation & Leaf Curl Virus
  {
    title: 'Tomato Pest & Disease Identification (Leaf Curl Virus & Blight)',
    category: 'PEST_DISEASE',
    crop: 'Tomato',
    language: 'en',
    keywords: 'tomato leaf curl yellowing whitefly blight early late fungus pesticide insecticide neem oil',
    content: `Tomato Leaf Curl Virus causes puckering and yellowing of upward curling leaves, transmitted by Whiteflies (Bemisia tabaci). Control whiteflies early using yellow sticky traps (15-20/acre) and spray Imidacloprid 17.8% SL @ 0.5 ml/L or Neem Oil (10,000 ppm) @ 3 ml/L. For Early/Late Blight (brown circular leaf spots), spray Mancozeb 75% WP @ 2g/L or Copper Oxychloride 50% WP @ 3g/L.`,
    source: 'Indian Institute of Horticultural Research (IIHR)'
  },
  {
    title: 'టమోటా ఆకుముడత మరియు తెగుళ్ళ నివారణ (Tomato Leaf Curl Telugu)',
    category: 'PEST_DISEASE',
    crop: 'Tomato',
    language: 'te',
    keywords: 'టమోటా ఆకు ముడత తెల్లదోమ నివారణ మందులు వేప నూనె తెగులు',
    content: `టమోటాలో ఆకుముడత వైరస్ తెల్లదోమ ద్వారా వ్యాపిస్తుంది. దీని నివారణకు ఎకరాకు 15-20 పసుపు రంగు జిగురు అట్టలను అమర్చాలి. ఇమిడాక్లోప్రిడ్ 17.8% ఎస్.ఎల్ మందును లీటరు నీటికి 0.5 మి.లీ చొప్పున లేదా వేప నూనె (10,000 ppm) 3 మి.లీ పిచికారీ చేయాలి. ఆకుమచ్చ లేదా ఎండు తెగులు ఉంటే మ్యాంకోజెబ్ 2 గ్రాములు లీటరు నీటికి కలిపి చల్లాలి.`,
    source: 'ఉద్యానవన శాఖ ఆంధ్రప్రదేశ్'
  },

  // 3. Chilli Thrips & Dieback Control
  {
    title: 'Chilli Thrips & Dieback Anthracnose Management',
    category: 'PEST_DISEASE',
    crop: 'Chilli',
    language: 'en',
    keywords: 'chilli thrips black thrips leaf curling upward down fruit rot dieback spirotetramat azoxystrobin',
    content: `Chilli Thrips cause leaves to curl upwards with boat-shaped narrow lamina. Spray Fipronil 5% SC @ 2 ml/L or Spinetoram 11.7% SC @ 1 ml/L. For Fruit Rot / Anthracnose (black circular spots on chillies and dieback of twigs), spray Azoxystrobin 23% SC @ 1 ml/L or Difenoconazole 25% EC @ 1 ml/L during cool morning hours.`,
    source: 'Chilli Research Station, Guntur'
  },
  {
    title: 'మిరప తామర పురుగులు మరియు కాయకుళ్ళు నివారణ (Chilli Pest Control Telugu)',
    category: 'PEST_DISEASE',
    crop: 'Chilli',
    language: 'te',
    keywords: 'మిరప తామర పురుగులు ముడత కాయకుళ్ళు కొమ్మఎండు తెగులు గుంటూరు మిరప',
    content: `మిరప సాగులో తామర పురుగుల వలన ఆకులు పైకి ముడుచుకుపోతాయి. నివారణకు ఫిప్రోనిల్ 5% ఎస్.సి 2 మి.లీ లేదా స్పైటోరామ్ 1 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయాలి. కాయకుళ్ళు మరియు కొమ్మఎండు తెగులు నివారణకు అజోక్సిస్ట్రోబిన్ 1 మి.లీ లేదా డైఫెనోకోనజోల్ 1 మి.లీ పిచికారీ చేయాలి.`,
    source: 'మిరప పరిశోధనా స్థానం, గుంటూరు'
  },

  // 4. Soil Testing & Amendment
  {
    title: 'Soil Testing, pH Balancing & Organic Matter Enhancement',
    category: 'SOIL',
    crop: 'ALL',
    language: 'en',
    keywords: 'soil testing pH acidity alkalinity lime gypsum organic carbon compost FYM green manure',
    content: `Ideal soil pH for most crops is between 6.5 and 7.5. Acidic soils (pH < 6.0) require Agricultural Lime (Calcium Carbonate) application @ 200-500 kg/acre. Alkaline soils (pH > 8.0) require Gypsum application @ 500 kg/acre with adequate leaching. Incorporate 5-10 tonnes of Farmyard Manure (FYM) or grow Green Manure crops (Daincha/Sunnhemp) to boost soil organic carbon above 0.75%.`,
    source: 'Central Soil Salinity Research Institute'
  },

  // 5. Irrigation & Water Management
  {
    title: 'Smart Drip Irrigation Scheduling & Fertigation Guidelines',
    category: 'IRRIGATION',
    crop: 'ALL',
    language: 'en',
    keywords: 'drip irrigation fertigation water saving moisture timing morning evening flow rate',
    content: `Drip irrigation achieves 90% water application efficiency compared to 50% in flood irrigation. Run drip systems during early morning (6:00 AM - 8:30 AM) to minimize evaporative losses. Inject water-soluble fertilizers (19:19:19, 13:0:45, Calcium Nitrate) through fertigation venturi systems in 3 equal pulses: 15 min clean water flush, 30 min fertigation injection, 15 min clean water line flush.`,
    source: 'National Mission on Micro Irrigation (NMMI)'
  },

  // 6. Organic Farming & Jeevamrutham
  {
    title: 'Organic Jeevamrutham Preparation & Bio-Fertilizers',
    category: 'GENERAL_AGRICULTURE',
    crop: 'ALL',
    language: 'en',
    keywords: 'organic jeevamrutham cow dung urine jaggery pulse flour natural farming Subhash Palekar',
    content: `To prepare 200 Litres of Liquid Jeevamrutham for 1 acre: Mix 10 kg native cow dung, 10 Litres cow urine, 2 kg Jaggery (gud), 2 kg pulse flour (besan), and 100g fertile bund soil in 200L water. Stir well clockwise 3 times daily and keep shaded under a jute bag for 48-72 hours. Apply through irrigation water or spray 10% filtered solution twice monthly.`,
    source: 'Natural Farming Development Board'
  },
  {
    title: 'జీవామృతం తయారీ విధానం మరియు ప్రకృతి వ్యవసాయం (Jeevamrutham Telugu)',
    category: 'GENERAL_AGRICULTURE',
    crop: 'ALL',
    language: 'te',
    keywords: 'జీవామృతం తయారీ ప్రకృతి వ్యవసాయం ఆవు పేడ మూత్రం బెల్లం సెనగపిండి',
    content: `ఒక ఎకరాకు 200 లీటర్ల జీవామృతం తయారీ: 10 కేజీల నాటు ఆవు పేడ, 10 లీటర్ల ఆవు మూత్రం, 2 కేజీల పాత బెల్లం, 2 కేజీల సెనగపిండి మరియు పిడికెడు పొలం గట్టు మట్టిని 200 లీటర్ల నీటిలో కలపాలి. 48 నుండి 72 గంటల పాటు నీడలో ఉంచి రోజుకు మూడు సార్లు కర్రతో తిప్పాలి. దీనిని నీటి పారుదల ద్వారా లేదా 10% ద్రావణాన్ని పిచికారీ చేయవచ్చు.`,
    source: 'రైతు సాధికార సంస్థ (RySS AP)'
  },

  // 7. Government Agriculture Schemes
  {
    title: 'PM-KISAN, PMFBY Crop Insurance & Government Subsidies',
    category: 'GOVERNMENT_SCHEME',
    crop: 'ALL',
    language: 'en',
    keywords: 'PM-KISAN PMFBY crop insurance subsidy Rythu Bharosa soil health card KCC loan',
    content: `Key Government Agricultural Benefits: 1) PM-KISAN / Rythu Bharosa provides direct financial assistance of ₹13,500/year to landholding farmers. 2) PMFBY Crop Insurance covers non-preventable yield losses at 1.5% - 2% premium for food & oilseed crops. 3) Kisan Credit Card (KCC) provides short-term crop loans up to ₹3 Lakhs at 4% effective interest rate upon timely repayment.`,
    source: 'Ministry of Agriculture & Farmers Welfare, Govt of India'
  },
  {
    title: 'రైతు భరోసా, పీఎం కిసాన్ మరియు పంట బీమా పథకాలు (Government Schemes Telugu)',
    category: 'GOVERNMENT_SCHEME',
    crop: 'ALL',
    language: 'te',
    keywords: 'రైతు భరోసా పీఎం కిసాన్ పంట బీమా కెసిసి రుణాలు ప్రభుత్వం',
    content: `ప్రభుత్వ రైతు సంక్షేమ పథకాలు: 1) వైఎస్సార్ రైతు భరోసా - పీఎం కిసాన్ ద్వారా అర్హులైన రైతులకు ఏడాదికి ₹13,500 పెట్టుబడి సహాయం అందుతుంది. 2) ప్రధానమంత్రి ఫసల్ బీమా యోజన (PMFBY) ద్వారా అతి స్వల్ప ప్రీమియంతో పంట నష్టపరిహారం లభిస్తుంది. 3) కిసాన్ క్రెడిట్ కార్డ్ (KCC) ద్వారా 4% వడ్డీకే రూ. 3 లక్షల వరకు పంట రుణం పొందవచ్చు.`,
    source: 'ఆంధ్రప్రదేశ్ వ్యవసాయ శాఖ'
  }
];

async function seed() {
  console.log('🌱 Seeding Agricultural Knowledge RAG database...');
  
  // Clear existing entries to prevent duplication
  await query('DELETE FROM agriculture_knowledge');

  for (const item of knowledgeEntries) {
    await query(
      'INSERT INTO agriculture_knowledge (title, category, crop, language, content, keywords, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item.title, item.category, item.crop, item.language, item.content, item.keywords, item.source]
    );
  }

  // Also seed farmer agricultural context for farmer_id = 1 if missing
  await query(
    `INSERT INTO farmer_agricultural_context
     (farmer_id, location, district, state, country, primary_crops, soil_type, irrigation_method, season)
     VALUES (1, 'Ongole', 'Prakasam', 'Andhra Pradesh', 'India', 'Paddy, Tomato, Chilli, Cotton', 'Loamy', 'Drip', 'Kharif')
     ON CONFLICT (farmer_id)
     DO UPDATE SET location = EXCLUDED.location`
  );

  console.log('✅ Agricultural Knowledge Base & Context seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed Error:', err.message);
  process.exit(1);
});
