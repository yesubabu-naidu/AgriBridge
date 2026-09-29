import { query } from '../config/db.js';

export async function guardFarmerData(req, res, next) {
  try {
    const farmerId = req.user.id;
    if (req.body && typeof req.body === 'object') req.body.farmer_id = farmerId;
    if (req.query && typeof req.query === 'object') req.query.farmer_id = String(farmerId);
    const fieldId = req.body?.field_id;
    if (fieldId !== undefined && fieldId !== null) {
      const fields = await query('SELECT id FROM irrigation_fields WHERE id = ? AND farmer_id = ?', [fieldId, farmerId]);
      if (!fields.length) return res.status(404).json({ success: false, message: 'Field not found.' });
    }
    const conversationId = req.body?.conversationId || req.query?.conversationId;
    if (conversationId) {
      const conversations = await query('SELECT id FROM chat_conversations WHERE id = ? AND farmer_id = ?', [conversationId, farmerId]);
      if (!conversations.length) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    return next();
  } catch (error) {
    console.error('Farmer data access check failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to verify access.' });
  }
}
