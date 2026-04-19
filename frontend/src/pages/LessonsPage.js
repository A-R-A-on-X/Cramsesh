import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './LessonsPage.css';

const DIFF_CONFIG = {
  easy: { color: 'neutron', label: 'Easy' },
  medium: { color: 'ion', label: 'Medium' },
  hard: { color: 'nucleus', label: 'Hard' },
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | completed

  useEffect(() => {
    api.get('/lessons').then(r => setLessons(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = lessons.filter(l => {
    if (filter === 'pending') return !l.completed;
    if (filter === 'completed') return l.completed;
    return true;
  });

  return (
    <div className="lessons-page page-animate">
      <div className="page-header">
        <h1 className="page-title">My Lessons</h1>
        <p className="page-subtitle">{lessons.length} lessons • {lessons.filter(l => l.completed).length} completed</p>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {['all', 'pending', 'completed'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lessons-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="lesson-card skeleton" style={{ height: '160px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <h3>{filter === 'all' ? 'No lessons yet' : `No ${filter} lessons`}</h3>
          {filter === 'all' && <p>Upload a study material to auto-generate lessons</p>}
          {filter === 'all' && (
            <Link to="/materials" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Upload Material
            </Link>
          )}
        </div>
      ) : (
        <div className="lessons-grid">
          {filtered.map(lesson => {
            const diff = DIFF_CONFIG[lesson.difficulty] || DIFF_CONFIG.medium;
            return (
              <Link to={`/lessons/${lesson.id}`} key={lesson.id} className={`lesson-card ${lesson.completed ? 'completed' : ''}`}>
                <div className="lc-header">
                  <span className={`badge badge-${diff.color}`}>{diff.label}</span>
                  {lesson.completed && <span className="done-badge">✓ Done</span>}
                </div>
                <h3 className="lc-title">{lesson.title}</h3>
                {lesson.summary && <p className="lc-summary">{lesson.summary}</p>}
                <div className="lc-footer">
                  <span className="lc-meta">⏱ {lesson.estimated_minutes} min</span>
                  {lesson.topic && <span className="lc-topic">{lesson.topic}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
