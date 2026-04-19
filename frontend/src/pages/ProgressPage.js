import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import api from '../utils/api';
import './ProgressPage.css';

const LEVEL_NAMES = ['Novice', 'Learner', 'Scholar', 'Analyst', 'Expert', 'Master', 'Sage', 'Oracle', 'Legend', 'Infinite'];
const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    api.get('/progress').then(r => {
      setProgress(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const res = await api.get('/progress/analysis');
      setAnalysis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="progress-page page-animate">
        <div className="page-header">
          <h1 className="page-title">Progress</h1>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  const stats = progress?.stats || {};
  const level = stats.level || 1;
  const xp = stats.xp || 0;
  const prevXP = level > 1 ? XP_THRESHOLDS[level - 2] : 0;
  const nextXP = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)];
  const xpPct = Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100)) || 0;
  const levelName = LEVEL_NAMES[level - 1] || 'Novice';

  const radialData = [{ name: 'Completion', value: stats.completionRate || 0, fill: '#6c63ff' }];
  const quizData = (progress?.recentQuizzes || []).map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score,
    lesson: q.lesson_title
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="chart-tooltip">
          <p className="tt-lesson">{payload[0]?.payload?.lesson}</p>
          <p className="tt-score">{payload[0]?.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="progress-page page-animate">
      <div className="page-header">
        <h1 className="page-title">Progress & Analytics</h1>
        <p className="page-subtitle">Track your learning journey</p>
      </div>

      {/* Level + XP hero */}
      <div className="progress-hero">
        <div className="level-display">
          <div className="level-circle">
            <svg viewBox="0 0 140 140" width="140" height="140">
              <defs>
                <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6c63ff" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(108,99,255,0.1)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r="58" fill="none"
                stroke="url(#xpGrad)" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - xpPct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
              />
            </svg>
            <div className="level-center">
              <span className="lc-num">{level}</span>
              <span className="lc-word">Level</span>
            </div>
          </div>
          <div className="level-text">
            <h2 className="level-name">{levelName}</h2>
            <p className="xp-display">{xp.toLocaleString()} XP</p>
            <div className="xp-bar" style={{ width: 200, margin: '0.5rem 0' }}>
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="xp-next">{nextXP - xp} XP to Level {level + 1}</p>
          </div>
        </div>

        <div className="streak-display">
          <div className="streak-fire">🔥</div>
          <div className="streak-num">{stats.streak || 0}</div>
          <div className="streak-label">Day Streak</div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="progress-stats">
        {[
          { icon: '📂', label: 'Materials', value: stats.totalMaterials || 0, color: '#6c63ff' },
          { icon: '📖', label: 'Total Lessons', value: stats.totalLessons || 0, color: '#00d4ff' },
          { icon: '✅', label: 'Completed', value: stats.completedLessons || 0, color: '#39ff88' },
          { icon: '🎯', label: 'Avg Quiz Score', value: stats.avgQuizScore ? `${stats.avgQuizScore}%` : '—', color: '#ffd166' },
        ].map(s => (
          <div key={s.label} className="prog-stat-card" style={{ '--c': s.color }}>
            <span className="ps-icon">{s.icon}</span>
            <span className="ps-value">{s.value}</span>
            <span className="ps-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Completion donut */}
        <div className="card chart-card">
          <h3 className="chart-title">Lesson Completion</h3>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                innerRadius="60%" outerRadius="90%"
                data={[
                  { name: 'Done', value: stats.completionRate || 0, fill: '#39ff88' },
                  { name: 'Remaining', value: 100 - (stats.completionRate || 0), fill: 'rgba(255,255,255,0.05)' }
                ]}
                startAngle={90} endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-pct">{stats.completionRate || 0}%</span>
              <span className="donut-label">Done</span>
            </div>
          </div>
        </div>

        {/* Quiz scores */}
        <div className="card chart-card chart-wide">
          <h3 className="chart-title">Recent Quiz Scores</h3>
          {quizData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Take quizzes to see your scores here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {quizData.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 80 ? '#39ff88' : entry.score >= 60 ? '#ffd166' : '#ff6b9d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card ai-analysis-card">
        <div className="analysis-header">
          <h3 className="chart-title" style={{ marginBottom: 0 }}>🤖 AI Analysis</h3>
          {!analysis && (
            <button className="btn btn-plasma btn-sm" onClick={loadAnalysis} disabled={analysisLoading}>
              {analysisLoading ? '⏳ Analyzing...' : 'Analyze My Progress'}
            </button>
          )}
        </div>

        {analysisLoading && (
          <div className="analysis-loading">
            <div className="atom-spin" style={{ width: 40, height: 40 }} />
            <p>AI is analyzing your progress...</p>
          </div>
        )}

        {analysis && (
          <div className="analysis-content fade-in">
            <div className="analysis-grid">
              <div className="analysis-section strengths">
                <h4>💪 Strengths</h4>
                <ul>{analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="analysis-section weak-areas">
                <h4>📚 Areas to Improve</h4>
                <ul>{analysis.weak_areas?.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>

            <div className="analysis-rec">
              <h4>💡 Recommendation</h4>
              <p>{analysis.recommendation}</p>
            </div>

            {analysis.next_steps?.length > 0 && (
              <div className="next-steps">
                <h4>🚀 Next Steps</h4>
                <ol>{analysis.next_steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
            )}

            <button className="btn btn-secondary btn-sm" onClick={() => setAnalysis(null)} style={{ marginTop: '1rem' }}>
              Refresh Analysis
            </button>
          </div>
        )}

        {!analysis && !analysisLoading && (
          <p className="analysis-hint">Get AI-powered insights about your study patterns and areas to focus on.</p>
        )}
      </div>
    </div>
  );
}
