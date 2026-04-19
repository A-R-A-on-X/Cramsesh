const express = require('express');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const XP_PER_LESSON = 25;
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];

function calcLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

// Get all lessons for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lessons = await db.all(
      `SELECT l.*, m.original_name as material_name 
       FROM lessons l 
       LEFT JOIN materials m ON l.material_id = m.id
       WHERE l.user_id = ? ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single lesson
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lesson = await db.get(
      'SELECT * FROM lessons WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark lesson as complete
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lesson = await db.get(
      'SELECT * FROM lessons WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.completed) return res.json({ message: 'Already completed', xpEarned: 0 });

    await db.run(
      'UPDATE lessons SET completed = 1, completed_at = ? WHERE id = ?',
      [new Date().toISOString(), req.params.id]
    );

    await db.run('UPDATE users SET xp = xp + ? WHERE id = ?', [XP_PER_LESSON, req.user.id]);

    const user = await db.get('SELECT xp FROM users WHERE id = ?', [req.user.id]);
    const newLevel = calcLevel(user.xp);
    await db.run('UPDATE users SET level = ? WHERE id = ?', [newLevel, req.user.id]);

    res.json({
      message: 'Lesson completed!',
      xpEarned: XP_PER_LESSON,
      totalXP: user.xp,
      level: newLevel
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
