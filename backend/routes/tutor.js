const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');
const { tutorChat } = require('../services/ai');

const router = express.Router();

// Send message to AI tutor
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, materialId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const db = getDB();

    // Get material context if provided
    let materialContext = '';
    if (materialId) {
      const material = await db.get('SELECT content FROM materials WHERE id = ? AND user_id = ?', [materialId, req.user.id]);
      if (material) materialContext = material.content;
    }

    // Get recent chat history
    const history = await db.all(
      'SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );

    const response = await tutorChat(message, materialContext, history.reverse());

    // Save to history
    const userMsgId = uuidv4();
    const aiMsgId = uuidv4();
    await db.run(
      'INSERT INTO chat_history (id, user_id, role, content, material_id) VALUES (?, ?, ?, ?, ?)',
      [userMsgId, req.user.id, 'user', message, materialId || null]
    );
    await db.run(
      'INSERT INTO chat_history (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [aiMsgId, req.user.id, 'assistant', response]
    );

    res.json({ response, messageId: aiMsgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const history = await db.all(
      'SELECT id, role, content, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
      [req.user.id]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM chat_history WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
