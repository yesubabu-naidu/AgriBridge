import express from 'express';
import { query } from '../config/db.js';
import { generateLLMResponse } from '../services/llmService.js';
import { getRelevantKnowledge } from '../services/ragService.js';
import { classifyQuery } from '../services/queryRouter.js';
import { getMarketPrice } from '../services/marketService.js';
import { aiSecurityMiddleware } from '../middleware/aiSecurity.js';

const router = express.Router();

// Apply security middleware to chat endpoint
router.use(aiSecurityMiddleware);

// POST /api/ai/chat - AgriAI Chatbot Core Endpoint
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      conversationId: inputConvId,
      language = 'en',
      farmer_id = 1
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const cleanMessage = message.trim();

    // 1. Fetch or create farmer context
    let farmerContext = {
      location: 'Ongole',
      district: 'Prakasam',
      state: 'Andhra Pradesh',
      primary_crops: 'Paddy, Tomato, Chilli',
      soil_type: 'Loamy',
      irrigation_method: 'Drip',
      season: 'Kharif'
    };

    const contextRows = await query('SELECT * FROM farmer_agricultural_context WHERE farmer_id = ?', [farmer_id]);
    if (contextRows && contextRows.length > 0) {
      farmerContext = contextRows[0];
    }

    // 2. Classify Query Intent
    const classification = classifyQuery(cleanMessage);

    // 3. Gather Context from RAG and Market APIs
    let ragResult = { context: '', sources: [] };
    let marketData = null;

    if (classification.needsMarket) {
      marketData = await getMarketPrice({
        crop: classification.crop !== 'ALL' ? classification.crop : 'Tomato',
        location: farmerContext.location,
        state: farmerContext.state
      });
    }

    // Always fetch RAG knowledge for agronomic depth
    ragResult = await getRelevantKnowledge({
      queryText: cleanMessage,
      category: classification.primaryCategory,
      crop: classification.crop,
      language: language
    });

    // 4. Build System Prompt incorporating Farmer Context
    const systemPrompt = `You are AgriAI, the intelligent agricultural expert assistant inside AgriBridge.
Farmer Profile Context:
- Location: ${farmerContext.district}, ${farmerContext.location}, ${farmerContext.state}
- Cultivated Crops: ${farmerContext.primary_crops}
- Soil Type: ${farmerContext.soil_type}
- Irrigation Method: ${farmerContext.irrigation_method}
- Current Season: ${farmerContext.season}`;

    // 5. Generate LLM Answer
    const answer = await generateLLMResponse({
      prompt: cleanMessage,
      systemPrompt,
      language,
      ragContext: ragResult.context,
      marketData
    });

    // 6. Manage Conversation Storage in MySQL
    let conversationId = inputConvId;
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const title = cleanMessage.length > 30 ? `${cleanMessage.substr(0, 30)}...` : cleanMessage;
      await query(
        'INSERT INTO chat_conversations (id, farmer_id, title, language) VALUES (?, ?, ?, ?)',
        [conversationId, farmer_id, title, language]
      );
    }

    // Store user message
    const userMsgId = `msg_user_${Date.now()}`;
    await query(
      'INSERT INTO chat_messages (id, conversation_id, role, content, category) VALUES (?, ?, ?, ?, ?)',
      [userMsgId, conversationId, 'user', cleanMessage, classification.primaryCategory]
    );

    // Store assistant message
    const assistantMsgId = `msg_ai_${Date.now() + 1}`;
    await query(
      'INSERT INTO chat_messages (id, conversation_id, role, content, category, sources_json) VALUES (?, ?, ?, ?, ?, ?)',
      [assistantMsgId, conversationId, 'assistant', answer, classification.primaryCategory, JSON.stringify(ragResult.sources)]
    );

    res.json({
      success: true,
      answer,
      conversationId,
      language,
      category: classification.primaryCategory,
      sources: ragResult.sources,
      usedMarketData: !!marketData,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('AgriAI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, the AgriAI assistant is temporarily unavailable. Please try again in a moment.',
      error: error.message
    });
  }
});

// GET /api/ai/history - Fetch farmer's chat conversations & thread messages
router.get('/history', async (req, res) => {
  try {
    const farmer_id = req.query.farmer_id || 1;
    const conversationId = req.query.conversationId;

    if (conversationId) {
      const messages = await query(
        'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      const parsedMessages = messages.map(m => ({
        ...m,
        sources: m.sources_json ? JSON.parse(m.sources_json) : []
      }));
      return res.json({ success: true, messages: parsedMessages });
    }

    const conversations = await query(
      'SELECT * FROM chat_conversations WHERE farmer_id = ? ORDER BY updated_at DESC LIMIT 15',
      [farmer_id]
    );

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/ai/clear - Clear conversation history
router.delete('/clear', async (req, res) => {
  try {
    const { conversationId, farmer_id = 1 } = req.body;

    if (conversationId) {
      await query('DELETE FROM chat_conversations WHERE id = ? AND farmer_id = ?', [conversationId, farmer_id]);
    } else {
      await query('DELETE FROM chat_conversations WHERE farmer_id = ?', [farmer_id]);
    }

    res.json({ success: true, message: 'Conversation history cleared successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ai/suggested-questions - Return dynamic context-aware questions
router.get('/suggested-questions', (req, res) => {
  const language = req.query.language || 'en';

  if (language === 'te') {
    return res.json({
      success: true,
      questions: [
        '🌾 నా నేలకు ఏ పంట బాగా సరిపోతుంది?',
        '💧 నేను ఈ రోజు వరి చేనుకి నీరు పారించవచ్చా?',
        '🌱 టమోటా పంటలో ఎరువుల మోతాదు ఎంత?',
        '🐛 నా మిరప ఆకులు ముడుచుకుపోతున్నాయి, ఏ మందు చల్లాలి?',
        '💰 ఈ రోజు టమోటా మరియు మిరప మార్కెట్ ధర ఎంత?',
        '🌾 పంట దిగుబడిని ఎలా పెంచుకోవాలి?',
        '📜 ప్రభుత్వ రైతు భరోసా పథకం వివరాలు ఇవ్వండి'
      ]
    });
  }

  res.json({
    success: true,
    questions: [
      '🌾 What is the best crop for my loamy soil?',
      '💧 Should I irrigate my paddy field today?',
      '🌱 What fertilizer schedule is best for Tomato?',
      '🐛 My chilli leaves are curling upward. What pest spray to use?',
      '💰 What is today\'s market price for Tomato & Chilli?',
      '🌾 How can I double my crop yield organically?',
      '📜 Tell me about PM-KISAN & PMFBY insurance benefits'
    ]
  });
});

export default router;
