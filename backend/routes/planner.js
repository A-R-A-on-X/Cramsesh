const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');
const { generateSchedule } = require('../services/ai');

const router = express.Router();

// Generate AI study schedule
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { goals, hoursPerDay } = req.body;
    const db = getDB();

    const lessons = await db.all(
      'SELECT id, title, estimated_minutes, difficulty, completed FROM lessons WHERE user_id = ? AND completed = 0',
      [req.user.id]
    );

    if (lessons.length === 0) return res.status(400).json({ error: 'No pending lessons to schedule' });

    const schedule = await generateSchedule(lessons, goals || 'Complete all lessons efficiently', hoursPerDay || 2);

    // Save schedule to DB
    const scheduleEntries = [];
    for (const day of schedule.schedule || []) {
      for (const session of day.sessions || []) {
        const matchingLesson = lessons.find(l => l.title.toLowerCase().includes(session.lesson_title?.toLowerCase()));
        const entryId = uuidv4();
        const date = new Date();
        date.setDate(date.getDate() + (day.date_offset || day.day - 1));

        await db.run(
          'INSERT INTO schedules (id, user_id, lesson_id, scheduled_date, time_slot, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)',
          [entryId, req.user.id, matchingLesson?.id || null, date.toISOString().split('T')[0],
           session.time_slot, session.duration_minutes || 30]
        );
        scheduleEntries.push({ id: entryId, ...session, date: date.toISOString().split('T')[0] });
      }
    }

    res.json({ schedule: schedule.schedule, overview: schedule.overview, entries: scheduleEntries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current schedule
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const schedules = await db.all(
      `SELECT s.*, l.title as lesson_title, l.estimated_minutes, l.difficulty
       FROM schedules s LEFT JOIN lessons l ON s.lesson_id = l.id
       WHERE s.user_id = ? ORDER BY s.scheduled_date ASC, s.time_slot ASC`,
      [req.user.id]
    );
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
