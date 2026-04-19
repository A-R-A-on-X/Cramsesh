const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');
const { generateQuiz } = require('../services/ai');

const router = express.Router();

// Generate quiz for a lesson
router.post('/generate/:lessonId', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const lesson = await db.get('SELECT * FROM lessons WHERE id = ? AND user_id = ?', [req.params.lessonId, req.user.id]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const { questionCount = 5 } = req.body;
    const quizData = await generateQuiz(lesson.content, lesson.title, questionCount);

    const quizId = uuidv4();
    await db.run(
      'INSERT INTO quizzes (id, lesson_id, user_id, questions) VALUES (?, ?, ?, ?)',
      [quizId, lesson.id, req.user.id, JSON.stringify(quizData.questions)]
    );

    res.json({ quizId, questions: quizData.questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz answers
router.post('/:quizId/submit', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const quiz = await db.get('SELECT * FROM quizzes WHERE id = ? AND user_id = ?', [req.params.quizId, req.user.id]);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = JSON.parse(quiz.questions);
    const { answers } = req.body; // array of selected answer indices

    let correct = 0;
    const results = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) correct++;
      return { ...q, userAnswer: answers[i], isCorrect };
    });

    const score = Math.round((correct / questions.length) * 100);

    await db.run('UPDATE quizzes SET score = ?, taken_at = ? WHERE id = ?',
      [score, new Date().toISOString(), quiz.id]);

    // XP based on score
    const xpEarned = Math.floor(score / 10) * 5;
    await db.run('UPDATE users SET xp = xp + ? WHERE id = ?', [xpEarned, req.user.id]);

    res.json({ score, correct, total: questions.length, xpEarned, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quiz history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const quizzes = await db.all(
      `SELECT q.id, q.score, q.taken_at, l.title as lesson_title 
       FROM quizzes q JOIN lessons l ON q.lesson_id = l.id
       WHERE q.user_id = ? AND q.taken_at IS NOT NULL ORDER BY q.taken_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
