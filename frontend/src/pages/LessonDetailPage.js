import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './LessonDetailPage.css';

export default function LessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/lessons/${id}`).then(r => setLesson(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await api.post(`/lessons/${id}/complete`);
      toast.success(`🎉 +${res.data.xpEarned} XP earned!`);
      setLesson(l => ({ ...l, completed: true }));
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCompleting(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await api.post(`/quiz/generate/${id}`, { questionCount: 5 });
      setQuiz(res.data);
      toast.success('Quiz generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Quiz generation failed. Is Ollama running?');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      return toast.error('Please answer all questions');
    }
    setSubmitting(true);
    try {
      const answersArr = quiz.questions.map((_, i) => answers[i] ?? -1);
      const res = await api.post(`/quiz/${quiz.quizId}/submit`, { answers: answersArr });
      setResult(res.data);
      refreshUser();
      toast.success(`Quiz done! Score: ${res.data.score}% (+${res.data.xpEarned} XP)`);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="lesson-detail"><div className="skeleton" style={{ height: 200, borderRadius: 16 }} /></div>;
  if (!lesson) return <div className="lesson-detail"><p>Lesson not found</p></div>;

  return (
    <div className="lesson-detail page-animate">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate('/lessons')}>← Back to Lessons</button>

      {/* Lesson header */}
      <div className="lesson-hero">
        <div className="lesson-hero-tags">
          <span className={`badge badge-${lesson.difficulty === 'easy' ? 'neutron' : lesson.difficulty === 'hard' ? 'nucleus' : 'ion'}`}>
            {lesson.difficulty}
          </span>
          <span className="badge badge-plasma">⏱ {lesson.estimated_minutes} min</span>
          {lesson.topic && <span className="badge" style={{ background: 'rgba(255,209,102,0.1)', color: 'var(--accent-photon)' }}>{lesson.topic}</span>}
          {lesson.completed && <span className="badge badge-neutron">✓ Completed</span>}
        </div>
        <h1 className="lesson-hero-title">{lesson.title}</h1>
        {lesson.summary && <p className="lesson-hero-summary">{lesson.summary}</p>}
      </div>

      {/* Lesson content */}
      <div className="lesson-content-card">
        <h2 className="content-heading">📖 Lesson Content</h2>
        <div className="lesson-body">
          {lesson.content.split('\n').map((para, i) =>
            para.trim() ? <p key={i}>{para}</p> : <br key={i} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="lesson-actions">
        {!lesson.completed && (
          <button className="btn btn-primary" onClick={handleComplete} disabled={completing}>
            {completing ? '⏳ Saving...' : '✅ Mark as Complete (+25 XP)'}
          </button>
        )}
        <button className="btn btn-plasma" onClick={handleGenerateQuiz} disabled={quizLoading}>
          {quizLoading ? '🤖 Generating Quiz...' : '🎯 Take Quiz'}
        </button>
      </div>

      {/* Quiz section */}
      {quiz && !result && (
        <div className="quiz-section">
          <h2 className="quiz-title">🎯 Quiz Time</h2>
          <div className="quiz-questions">
            {quiz.questions.map((q, qi) => (
              <div key={qi} className="quiz-question">
                <p className="q-text"><span className="q-num">Q{qi + 1}.</span> {q.question}</p>
                <div className="q-options">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      className={`q-option ${answers[qi] === oi ? 'selected' : ''}`}
                      onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                      <span>{opt.replace(/^[A-D]\)\s*/, '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmitQuiz}
            disabled={submitting || Object.keys(answers).length < quiz.questions.length}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      )}

      {/* Quiz results */}
      {result && (
        <div className="quiz-result">
          <div className="result-score-ring">
            <svg viewBox="0 0 100 100" width="120" height="120">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={result.score >= 70 ? '#39ff88' : result.score >= 50 ? '#ffd166' : '#ff6b9d'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.score / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="result-score-text">
              <span className="score-num">{result.score}%</span>
              <span className="score-label">{result.correct}/{result.total}</span>
            </div>
          </div>
          <h3 className="result-title">
            {result.score >= 80 ? '🎉 Excellent!' : result.score >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
          </h3>
          <p className="result-xp">+{result.xpEarned} XP earned</p>

          <div className="result-answers">
            {result.results.map((r, i) => (
              <div key={i} className={`result-item ${r.isCorrect ? 'correct' : 'wrong'}`}>
                <div className="ri-header">
                  <span className="ri-icon">{r.isCorrect ? '✅' : '❌'}</span>
                  <span className="ri-q">Q{i + 1}: {r.question}</span>
                </div>
                {!r.isCorrect && (
                  <div className="ri-explain">
                    <span>Correct: {r.options[r.correct]}</span>
                    <p className="ri-exp-text">{r.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-secondary" onClick={() => { setResult(null); setQuiz(null); setAnswers({}); }}>
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}
