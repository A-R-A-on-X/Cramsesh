const axios = require('axios');

const MODEL = process.env.OLLAMA_MODEL || 'llama3-8b-8192';

async function chat(messages, options = {}) {
  try {
    const headers = {};
    headers['Authorization'] = 'Bearer ' + process.env.GROQ_API_KEY;
    headers['Content-Type'] = 'application/json';

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: MODEL,
        messages: messages,
        max_tokens: options.maxTokens || 800,
        temperature: options.temperature || 0.7
      },
      {
        headers: headers,
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI Error:', err.response?.data || err.message);
    throw new Error('AI service failed: ' + (err.response?.data?.error?.message || err.message));
  }
}

async function generateLessons(content, filename) {
  const prompt = `You are an expert educational content designer. Analyze the following study material and break it into clear structured lessons.

Material: "${filename}"
Content: ${content.slice(0, 3000)}

Generate 3 lessons. Return ONLY valid JSON no markdown no extra text:
{
  "lessons": [
    {
      "title": "Lesson title",
      "topic": "Main topic",
      "difficulty": "easy",
      "estimated_minutes": 20,
      "content": "Detailed lesson content 200 to 300 words",
      "summary": "2 sentence summary",
      "key_points": ["point 1", "point 2", "point 3"]
    }
  ]
}`;

  const response = await chat([{ role: 'user', content: prompt }], { maxTokens: 800 });

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      lessons: [{
        title: 'Introduction to ' + filename,
        topic: 'General',
        difficulty: 'medium',
        estimated_minutes: 30,
        content: response,
        summary: 'AI generated lesson from your uploaded material.',
        key_points: ['Review the material carefully', 'Take notes on key concepts', 'Practice with the quiz']
      }]
    };
  }
}

async function generateQuiz(lessonContent, lessonTitle, questionCount) {
  questionCount = questionCount || 5;
  const prompt = `Create a quiz for this lesson: "${lessonTitle}"

Content: ${lessonContent.slice(0, 1500)}

Generate exactly ${questionCount} multiple choice questions. Return ONLY valid JSON no markdown:
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

  const response = await chat([{ role: 'user', content: prompt }], { maxTokens: 800 });

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { questions: [] };
  }
}

async function generateSchedule(lessons, userGoals, availableHoursPerDay) {
  const lessonSummaries = lessons.map(function(l) {
    return '- "' + l.title + '" (' + l.estimated_minutes + ' min, ' + l.difficulty + ')';
  }).join('\n');

  const prompt = `Create a study schedule for these lessons:
${lessonSummaries}

User goals: ${userGoals}
Available hours per day: ${availableHoursPerDay}

Return ONLY valid JSON no markdown:
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
          "tip": "study tip"
        }
      ]
    }
  ],
  "overview": "Brief overview"
}`;

  const response = await chat([{ role: 'user', content: prompt }], { maxTokens: 800 });

  try {
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { schedule: [], overview: response };
  }
}

async function tutorChat(userMessage, materialContext, chatHistory) {
  const context = materialContext ? '\nStudent material context:\n' + materialContext.slice(0, 1500) : '';
  const systemPrompt = 'You are CramSesh AI Tutor, an expert and encouraging study assistant. You help students understand their study materials deeply.' + context + '\n\nBe clear, encouraging, and educational. Keep responses under 200 words.';

  const messages = [{ role: 'system', content: systemPrompt }];
  const recentHistory = chatHistory.slice(-6);
  for (let i = 0; i < recentHistory.length; i++) {
    messages.push({ role: recentHistory[i].role, content: recentHistory[i].content });
  }
  messages.push({ role: 'user', content: userMessage });

  return await chat(messages, { maxTokens: 600 });
}

async function analyzeProgress(completedLessons, quizScores, streakDays) {
  const lessonTitles = completedLessons.map(function(l) { return l.title; }).join(', ');
  const scoreList = quizScores.map(function(q) { return q.lesson + ': ' + q.score + '%'; }).join(', ');

  const prompt = `Analyze this student learning progress:

Completed lessons: ${lessonTitles}
Quiz scores: ${scoreList}
Study streak: ${streakDays} days

Return ONLY valid JSON no markdown:
{
  "strengths": ["strength 1", "strength 2"],
  "weak_areas": ["area 1", "area 2"],
  "recommendation": "Personalized recommendation",
  "next_steps": ["step 1", "step 2", "step 3"]
}`;

  const response = await chat([{ role: 'user', content: prompt }], { maxTokens: 600 });

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
