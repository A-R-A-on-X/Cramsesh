const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const db = getDB();
    const existing = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) return res.status(409).json({ error: 'Email or username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.run(
      'INSERT INTO users (id, username, email, password, last_active) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, hashed, new Date().toISOString()]
    );

    const token = jwt.sign({ id, username, email }, process.env.JWT_SECRET || 'cramsesh_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({ token, user: { id, username, email, xp: 0, level: 1, streak: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Update streak logic
    const lastActive = user.last_active ? new Date(user.last_active) : null;
    const now = new Date();
    let streak = user.streak;
    if (lastActive) {
      const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) streak += 1;
      else if (diffDays > 1) streak = 1;
    } else {
      streak = 1;
    }

    await db.run('UPDATE users SET last_active = ?, streak = ? WHERE id = ?', 
      [now.toISOString(), streak, user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'cramsesh_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...safeUser } = { ...user, streak };
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT id, username, email, xp, level, streak, last_active, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
