const express = require('express');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');
const { analyzeProgress } = require('../services/ai');

const router = express.Router();

// Get progress dashboard data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    const totalLessons = await db.get('SELECT COUNT(*) as count FROM lessons WHERE user_id = ?', [req.user.id]);
    const completedLessons = await db.get('SELECT COUNT(*) as count FROM lessons WHERE user_id = ? AND completed = 1', [req.user.id]);
    const totalMaterials = await db.get('SELECT COUNT(*) as count FROM materials WHERE user_id = ?', [req.user.id]);
    const quizScores = await db.all(
      `SELECT q.score, l.title FROM quizzes q JOIN lessons l ON q.lesson_id = l.id
       WHERE q.user_id = ? AND q.score IS NOT NULL ORDER BY q.taken_at DESC LIMIT 10`,
      [req.user.id]
    );

    const avgScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((s, q) => s + q.score, 0) / quizScores.length)
      : 0;

    const completionRate = totalLessons.count > 0
      ? Math.round((completedLessons.count / totalLessons.count) * 100)
      : 0;

    res.json({
      user: { ...user, password: undefined },
      stats: {
        totalLessons: totalLessons.count,
        completedLessons: completedLessons.count,
        completionRate,
        totalMaterials: totalMaterials.count,
        avgQuizScore: avgScore,
        streak: user.streak,
        xp: user.xp,
        level: user.level
      },
      recentQuizzes: quizScores
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get AI-powered analysis of progress
router.get('/analysis', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT streak FROM users WHERE id = ?', [req.user.id]);
    const completedLessons = await db.all(
      'SELECT title FROM lessons WHERE user_id = ? AND completed = 1',
      [req.user.id]
    );
    const quizScores = await db.all(
      `SELECT q.score, l.title as lesson FROM quizzes q JOIN lessons l ON q.lesson_id = l.id
       WHERE q.user_id = ? AND q.score IS NOT NULL`,
      [req.user.id]
    );

    if (completedLessons.length === 0) {
      return res.json({
        strengths: ['You\'re getting started!'],
        weak_areas: ['Complete some lessons to get insights'],
        recommendation: 'Upload your first study material and start your learning journey!',
        next_steps: ['Upload a study material', 'Generate your first lesson', 'Set a daily study goal']
      });
    }

    const analysis = await analyzeProgress(completedLessons, quizScores, user.streak);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
