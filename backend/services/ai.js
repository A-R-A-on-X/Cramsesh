const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Core chat function using Ollama (open-source LLM)
 */
async function chat(messages, options = {}) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model: MODEL,
      messages,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 1500,
      }
    }, { timeout: 60000 });

    return response.data.message.content;
  } catch (err) {
    // Fallback: try OpenRouter free tier if configured
    if (process.env.OPENROUTER_API_KEY) {
      return await chatViaOpenRouter(messages, options);
    }
    throw new Error(`AI service unavailable: ${err.message}. Make sure Ollama is running with: ollama serve && ollama pull ${MODEL}`);
  }
}

async function chatViaOpenRouter(messages, options = {}) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'meta-llama/llama-3-8b-instruct:free',
    messages,
    max_tokens: options.maxTokens || 1500,
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000
  });

  return response.data.choices[0].message.content;
}

/**
 * Generate structured lessons from study material content
 */
async function generateLessons(content, filename) {
  const prompt = `You are an expert educational content designer. Analyze the following study material and break it into clear, structured lessons.

Material: "${filename}"
Content: ${content.slice(0, 4000)}

Generate 3-5 lessons from this material. Return ONLY valid JSON (no markdown, no explanation):
{
  "lessons": [
    {
      "title": "Lesson title",
      "topic": "Main topic",
      "difficulty": "easy|medium|hard",
      "estimated_minutes": 20,
      "content": "Detailed lesson content with key concepts, explanations, and examples (300-500 words)",
      "summary": "2-3 sentence summary",
      "key_points": ["point 1", "point 2", "point 3"]
    }
  ]
}`;

  const response = await chat([{ role: 'user', content: prompt }], { temperature: 0.5 });
  
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // If parsing fails, return a basic structure
    return {
      lessons: [{
        title: `Introduction to ${filename}`,
        topic: 'General',
        difficulty: 'medium',
        estimated_minutes: 30,
        content: response,
        summary: 'AI-generated lesson from your uploaded material.',
        key_points: ['Review the material carefully', 'Take notes on key concepts', 'Practice with the quiz']
      }]
    };
  }
}

/**
 * Generate quiz questions from lesson content
 */
async function generateQuiz(lessonContent, lessonTitle, questionCount = 5) {
  const prompt = `Create a quiz for this lesson: "${lessonTitle}"

Content: ${lessonContent.slice(0, 2000)}

Generate exactly ${questionCount} multiple choice questions. Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

  const response = await chat([{ role: 'user', content: prompt }], { temperature: 0.4 });
  
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { questions: [] };
  }
}

/**
 * Generate a study schedule
 */
async function generateSchedule(lessons, userGoals, availableHoursPerDay) {
  const lessonSummaries = lessons.map(l => 
    `- "${l.title}" (${l.estimated_minutes} min, ${l.difficulty})`
  ).join('\n');

  const prompt = `Create a study schedule for these lessons:
${lessonSummaries}

User goals: ${userGoals}
Available hours per day: ${availableHoursPerDay}

Return ONLY valid JSON:
{
  "schedule": [
    {
      "day": 1,
      "date_offset": 0,
      "sessions": [
        {
          "lesson_title": "title",
          "time_slot": "09:00",
          "duration_minutes": 30,
          "tip": "study tip for this session"
        }
      ]
    }
  ],
  "overview": "Brief overview of the study plan"
}`;

  const response = await chat([{ role: 'user', content: prompt }], { temperature: 0.5 });
  
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { schedule: [], overview: response };
  }
}

/**
 * AI Tutor chat - answers questions based on material context
 */
async function tutorChat(userMessage, materialContext, chatHistory) {
  const systemPrompt = `You are CramSesh AI Tutor, an expert and encouraging study assistant. 
You help students understand their study materials deeply.
${materialContext ? `\nStudent's study material context:\n${materialContext.slice(0, 2000)}` : ''}

Guidelines:
- Be clear, encouraging, and educational
- Give examples when explaining concepts
- Break down complex ideas step by step
- If you don't know something from the material, say so honestly
- Keep responses focused and under 300 words unless more detail is needed`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];

  return await chat(messages, { temperature: 0.7 });
}

/**
 * Generate a summary of progress and weak areas
 */
async function analyzeProgress(completedLessons, quizScores, streakDays) {
  const prompt = `Analyze this student's learning progress and provide insights:

Completed lessons: ${completedLessons.map(l => l.title).join(', ')}
Quiz scores: ${quizScores.map(q => `${q.lesson}: ${q.score}%`).join(', ')}
Study streak: ${streakDays} days

Return ONLY valid JSON:
{
  "strengths": ["strength 1", "strength 2"],
  "weak_areas": ["area 1", "area 2"],
  "recommendation": "Personalized study recommendation",
  "next_steps": ["step 1", "step 2", "step 3"]
}`;

  const response = await chat([{ role: 'user', content: prompt }], { temperature: 0.6 });
  
  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      strengths: ['Keep up the great work!'],
      weak_areas: ['Review recent quiz topics'],
      recommendation: response,
      next_steps: ['Continue your current study plan']
    };
  }
}

module.exports = { chat, generateLessons, generateQuiz, generateSchedule, tutorChat, analyzeProgress };
