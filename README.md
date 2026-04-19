# ⚛️ CramSesh — AI-Powered Study Planner

> Upload your notes. Let AI generate lessons, quizzes, and a study schedule. Chat with your AI tutor. Earn XP. Study smarter.

---

## 🗂 Project Structure

```
cramsesh/
├── backend/          # Node.js + Express API
│   ├── routes/       # Auth, materials, lessons, quiz, tutor, planner, progress
│   ├── services/     # Database (SQLite), AI (Ollama/Llama 3)
│   ├── middleware/   # JWT auth
│   ├── uploads/      # Uploaded files (auto-created)
│   └── server.js
│
└── frontend/         # React app
    └── src/
        ├── pages/    # Dashboard, Materials, Lessons, Tutor, Planner, Progress
        ├── components/ # Layout, AtomLogo
        ├── context/  # Auth context
        └── utils/    # Axios API client
```

---

## 🚀 Quick Start

### 1. Install Ollama (Open-Source AI)

Ollama runs Llama 3 locally — completely free, no API key needed.

**macOS / Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:** Download from https://ollama.ai

Then pull the model and start the server:
```bash
ollama pull llama3
ollama serve
```
> Ollama runs at `http://localhost:11434` by default.
> `llama3` requires ~4.7GB disk. For lower-spec machines, use `ollama pull llama3:8b` or `ollama pull mistral`.

---

### 2. Backend Setup

```bash
cd cramsesh/backend
npm install
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd cramsesh/frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## ⚙️ Configuration (backend/.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend port |
| `JWT_SECRET` | `cramsesh_secret` | **Change this in production!** |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | AI model name |
| `DB_PATH` | `./cramsesh.db` | SQLite database path |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size |
| `UPLOAD_DIR` | `./uploads` | File storage directory |

### Optional: OpenRouter Fallback

If you can't run Ollama locally, set `OPENROUTER_API_KEY` in `.env` to use the free Llama 3 tier via [openrouter.ai](https://openrouter.ai) as a fallback.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📤 **Material Upload** | Upload PDF, DOCX, TXT, or images |
| 🤖 **AI Lesson Generation** | Llama 3 auto-generates structured lessons from your documents |
| 📖 **Lesson Viewer** | Read lessons with difficulty tags and time estimates |
| 🎯 **AI Quiz** | Auto-generated multiple-choice quizzes with explanations |
| 🗓 **Study Planner** | AI builds a personalized schedule based on your goals |
| 💬 **AI Tutor Chat** | Chat with Llama 3, grounded in your uploaded materials |
| 📊 **Progress Tracker** | XP, levels, streaks, completion rates, quiz score charts |
| 🔒 **Auth** | JWT-based login/register |
| 🌑 **Design** | Deep-space sci-fi UI with Orbitron font + animated atom logo |

---

## 🤖 AI Stack

- **Model:** Meta Llama 3 (8B) via [Ollama](https://ollama.ai)
- **Fallback:** Meta Llama 3 8B via OpenRouter (free tier)
- **Tasks:** Lesson generation, quiz creation, schedule planning, tutoring, progress analysis
- **No OpenAI / paid APIs required**

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- SQLite (via `sqlite` / `sqlite3`)
- JWT authentication
- Multer (file uploads)
- pdf-parse + mammoth (text extraction)
- Axios (Ollama communication)

**Frontend**
- React 18 + React Router v6
- Recharts (progress charts)
- React Dropzone (file upload UI)
- React Hot Toast (notifications)
- Custom CSS with CSS variables (no Tailwind / MUI)

---

## 📡 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/materials/upload      ← uploads file + generates lessons
GET    /api/materials
DELETE /api/materials/:id

GET    /api/lessons
GET    /api/lessons/:id
POST   /api/lessons/:id/complete

POST   /api/quiz/generate/:lessonId
POST   /api/quiz/:quizId/submit
GET    /api/quiz/history

POST   /api/tutor/chat
GET    /api/tutor/history
DELETE /api/tutor/history

POST   /api/planner/generate
GET    /api/planner

GET    /api/progress
GET    /api/progress/analysis
```

---

## 🚢 Production Notes

1. Replace `JWT_SECRET` with a strong random string
2. Use PostgreSQL instead of SQLite for multi-user scale (swap the `database.js` service)
3. Store uploads on S3 / Cloudflare R2 instead of local disk
4. Run Ollama on a GPU server for faster inference
5. Add HTTPS via nginx / Caddy reverse proxy
6. Set `REACT_APP_API_URL` in frontend env to your backend URL

---

## 🔮 Planned Features (from SRS Appendix)
- [ ] Mobile app (React Native)
- [ ] Social learning / shared sessions
- [ ] Voice-based AI tutor
- [ ] Spaced repetition scheduling
- [ ] Export study notes as PDF

---

Made with ⚛️ by Group 6 | CramSesh
