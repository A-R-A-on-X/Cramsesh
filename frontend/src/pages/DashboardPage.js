import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './DashboardPage.css';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLessons, setRecentLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/progress'),
      api.get('/lessons')
    ]).then(([progRes, lessonsRes]) => {
      setStats(progRes.data.stats);
      setRecentLessons(lessonsRes.data.slice(0, 4));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const levelNames = ['Novice', 'Learner', 'Scholar', 'Analyst', 'Expert', 'Master', 'Sage', 'Oracle', 'Legend', 'Infinite'];
  const levelName = levelNames[(user?.level || 1) - 1] || 'Novice';

  return (
    <div className="dashboard page-animate">
      {/* Hero greeting */}
      <div className="dash-hero">
        <div className="hero-text">
          <h1 className="hero-greeting">
            Welcome back, <span className="hero-name">{user?.username}</span>
          </h1>
          <p className="hero-sub">
            {stats?.streak > 0
              ? `🔥 ${stats.streak}-day streak — keep the momentum!`
              : 'Ready to start a new study session?'}
          </p>
        </div>
        <div className="hero-level">
          <div className="level-ring">
            <svg viewBox="0 0 80 80" className="ring-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="url(#ringGrad)" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - (stats?.completionRate || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6c63ff" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="ring-inner">
              <span className="ring-level">Lv.{user?.level}</span>
              <span className="ring-name">{levelName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="📖" label="Total Lessons" value={stats?.totalLessons || 0} color="#6c63ff" />
          <StatCard icon="✅" label="Completed" value={stats?.completedLessons || 0} color="#39ff88"
            sub={`${stats?.completionRate || 0}% done`} />
          <StatCard icon="🎯" label="Avg Quiz Score" value={stats?.avgQuizScore ? `${stats.avgQuizScore}%` : 'N/A'} color="#00d4ff" />
          <StatCard icon="⚡" label="Total XP" value={stats?.xp || 0} color="#ffd166"
            sub={`Level ${stats?.level || 1}`} />
        </div>
      )}

      {/* Quick actions */}
      <div className="dash-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/materials" className="quick-card">
            <div className="qc-icon">📤</div>
            <div className="qc-label">Upload Material</div>
            <div className="qc-sub">PDF, DOCX, or image</div>
          </Link>
          <Link to="/tutor" className="quick-card">
            <div className="qc-icon">🤖</div>
            <div className="qc-label">Ask AI Tutor</div>
            <div className="qc-sub">Get instant help</div>
          </Link>
          <Link to="/planner" className="quick-card">
            <div className="qc-icon">📅</div>
            <div className="qc-label">Plan Schedule</div>
            <div className="qc-sub">AI-optimized plan</div>
          </Link>
          <Link to="/progress" className="quick-card">
            <div className="qc-icon">📊</div>
            <div className="qc-label">View Progress</div>
            <div className="qc-sub">Insights & analysis</div>
          </Link>
        </div>
      </div>

      {/* Recent lessons */}
      <div className="dash-section">
        <div className="section-header">
          <h2 className="section-title">Recent Lessons</h2>
          <Link to="/lessons" className="see-all">See all →</Link>
        </div>
        {recentLessons.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>No lessons yet</h3>
            <p>Upload a study material to auto-generate lessons</p>
            <Link to="/materials" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Upload Material
            </Link>
          </div>
        ) : (
          <div className="lessons-list">
            {recentLessons.map(lesson => (
              <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="lesson-row">
                <div className="lesson-row-icon">
                  {lesson.completed ? '✅' : '📖'}
                </div>
                <div className="lesson-row-info">
                  <div className="lesson-row-title">{lesson.title}</div>
                  <div className="lesson-row-meta">
                    <span className={`badge badge-${lesson.difficulty === 'easy' ? 'neutron' : lesson.difficulty === 'hard' ? 'nucleus' : 'ion'}`}>
                      {lesson.difficulty}
                    </span>
                    <span className="meta-item">⏱ {lesson.estimated_minutes} min</span>
                  </div>
                </div>
                <div className={`lesson-row-status ${lesson.completed ? 'done' : ''}`}>
                  {lesson.completed ? 'Done' : 'Study →'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
