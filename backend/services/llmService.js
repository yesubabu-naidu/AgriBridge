import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Configurable LLM Provider Service
 * Supports Google Gemini, OpenAI-compatible APIs, or Ollama, with graceful fallback.
 */
export async function generateLLMResponse({ prompt, systemPrompt, language = 'en', ragContext = '', marketData = null }) {
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LLM_MODEL || 'gemini-1.5-flash';
  const baseUrl = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/';

  const fullSystemPrompt = `${systemPrompt || 'You are AgriAI, a helpful, practical agricultural assistant for farmers.'}
Language requested: ${language === 'te' ? 'Telugu (తెలుగు)' : 'English'}.
${ragContext ? `\n[VERIFIED AGRONOMIC KNOWLEDGE BASE]\n${ragContext}` : ''}
${marketData ? `\n[LIVE MARKET MANDI PRICES]\n${JSON.stringify(marketData)}` : ''}

CRITICAL RULES:
1. Speak in simple, respectful, and easy-to-understand language for farmers.
2. Structure recommendations clearly using bullet points and emojis.
3. NEVER invent market prices or factual agricultural data that is not present in verified sources.
4. For crop diseases/pests, advise appropriate safety equipment when spraying chemicals and mention organic alternatives (e.g. Neem oil, Jeevamrutham).
5. If language is Telugu, answer naturally in clear Telugu (తెలుగు) without translating technical chemical terms incorrectly.`;

  if (apiKey) {
    try {
      // Attempt call to OpenAI / Gemini OpenAI-compatible endpoint
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        console.warn('LLM API returned status:', response.status);
      }
    } catch (err) {
      console.warn('LLM API connection note:', err.message);
    }
  }

  // Smart Agronomic Reasoning Fallback Engine (when API key is unconfigured or offline)
  return fallbackAgronomicReasoning({ prompt, language, ragContext, marketData });
}

function fallbackAgronomicReasoning({ prompt, language, ragContext, marketData }) {
  const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(prompt);

  if (ragContext) {
    if (isTelugu) {
      return `🌱 **రైతు సోదరులకు సలహా (AgriAI Agronomic Guidance)**:\n\n${ragContext.split('\n\n')[0]}\n\n💡 **ముఖ్య గమనిక**: క్రిమిసంహారకాలు లేదా ఎరువులు పిచికారీ చేసేటప్పుడు రక్షణ ముసుగు ధరించండి మరియు స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.`;
    }
    return `🌱 **AgriAI Agronomic Guidance**:\n\nBased on verified agronomic records:\n${ragContext.split('\n\n')[0]}\n\n💡 **Agronomic Safety Note**: Always wear protective gear when applying agricultural sprays and adhere to recommended dosage per acre.`;
  }

  if (marketData) {
    if (marketData.available) {
      return isTelugu
        ? `💰 **నేటి మార్కెట్ ధరల వివరాలు (${marketData.commodity})**:\n- జిల్లా / మార్కెట్: ${marketData.market}\n- సగటు ధర: ₹${marketData.price_per_quintal}/క్వింటాల్ (₹${(marketData.price_per_quintal/100).toFixed(0)}/కేజీ)\n- కనీస - గరిష్ట ధర: ₹${marketData.min_price} - ₹${marketData.max_price}`
        : `💰 **Live Market Price Update (${marketData.commodity})**:\n- Market / District: ${marketData.market}\n- Average Price: ₹${marketData.price_per_quintal} / Quintal (₹${(marketData.price_per_quintal/100).toFixed(0)} / kg)\n- Price Range: ₹${marketData.min_price} - ₹${marketData.max_price} per Quintal`;
    } else {
      return isTelugu
        ? `⚠️ ప్రస్తుతం ఈ పంటకు సంబంధించిన లైవ్ మార్కెట్ ధరల డేటా లభించలేదు. దయచేసి స్థానిక వ్యవసాయ మార్కెట్ యార్డ్‌ను సంప్రదించండి.`
        : `⚠️ Verified live market prices for this commodity are currently unavailable. Please consult your local Agricultural Produce Market Committee (APMC) mandi for exact daily rates.`;
    }
  }


  if (isTelugu) {
    return `🌾 **రైతు భరోసా సలహా (AgriAI Assistant)**:\n\nమీ ప్రశ్న స్వీకరించబడింది. పంటల సాగు, నేల యాజమాన్యం, ఎరువుల మోతాదు మరియు పిచికారీ విధానాలపై మీకు సమగ్ర సమాచారం అందించడానికి సిద్ధంగా ఉన్నాను.\n\n- **వరి / టమోటా / మిరప**: సరైన సమయంలో ఎరువులు (NPK) చల్లడం ద్వారా దిగుబడి పెరుగుతుంది.\n- **సందేహాలు**: తెగులు మచ్చల లక్షణాలను లేదా పంట పేరును పేర్కొనండి.`;
  }

  return `🌾 **AgriAI Assistant Guidance**:\n\nThank you for asking! For optimal farm yields:\n- **Soil & Nutrient Management**: Perform soil test before sowing to balance pH (6.5 - 7.5).\n- **Fertilizer Split Application**: Apply Nitrogen in split doses during basal, tillering, and flowering stages.\n- **Pest Management**: Use yellow sticky traps early and spray organic Neem Oil (10,000 ppm) at first sign of sucking pests.\n\nPlease feel free to specify your crop (Paddy, Tomato, Chilli, Cotton) for exact advice!`;
}
