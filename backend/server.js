require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const lessonsRoutes = require('./routes/lessons');
const plannerRoutes = require('./routes/planner');
const tutorRoutes = require('./routes/tutor');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quiz');

const { initDB } = require('./services/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'CramSesh API', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Init DB then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CramSesh API running on http://localhost:${PORT}`);
    console.log(`🤖 AI Model: ${process.env.OLLAMA_MODEL || 'llama3'} via Ollama`);
    console.log(`📂 Uploads: ${path.resolve(uploadDir)}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
