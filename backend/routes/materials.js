const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { getDB } = require('../services/database');
const authMiddleware = require('../middleware/auth');
const { generateLessons } = require('../services/ai');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not supported. Use PDF, DOCX, TXT, or images.'));
  }
});

async function extractText(filePath, mimetype, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      return `[Image file: ${originalName}. Text extraction not available for images.]`;
    }
  } catch (err) {
    console.error('Text extraction error:', err.message);
    return '';
  }
}

// Upload material
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const db = getDB();
    const content = await extractText(req.file.path, req.file.mimetype, req.file.originalname);
    const materialId = uuidv4();

    await db.run(
      'INSERT INTO materials (id, user_id, filename, original_name, file_type, content, size) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [materialId, req.user.id, req.file.filename, req.file.originalname, req.file.mimetype, content, req.file.size]
    );

    // Auto-generate lessons from the material
    let lessons = [];
    if (content && content.length > 100) {
      try {
        const aiLessons = await generateLessons(content, req.file.originalname);
        for (const lesson of aiLessons.lessons) {
          const lessonId = uuidv4();
          await db.run(
            `INSERT INTO lessons (id, user_id, material_id, title, content, summary, topic, difficulty, estimated_minutes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [lessonId, req.user.id, materialId, lesson.title, lesson.content,
             lesson.summary, lesson.topic, lesson.difficulty, lesson.estimated_minutes]
          );
          lessons.push({ id: lessonId, ...lesson });
        }
      } catch (aiErr) {
        console.error('AI lesson generation failed:', aiErr.message);
      }
    }

    // Award XP for uploading
    await db.run('UPDATE users SET xp = xp + 10 WHERE id = ?', [req.user.id]);

    res.status(201).json({
      material: { id: materialId, filename: req.file.originalname, size: req.file.size },
      lessons,
      xpEarned: 10,
      message: `Material uploaded! ${lessons.length} lessons generated.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all materials for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const materials = await db.all(
      'SELECT id, filename, original_name, file_type, size, uploaded_at FROM materials WHERE user_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete material
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const material = await db.get('SELECT * FROM materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', material.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.run('DELETE FROM materials WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM lessons WHERE material_id = ?', [req.params.id]);

    res.json({ message: 'Material and related lessons deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
