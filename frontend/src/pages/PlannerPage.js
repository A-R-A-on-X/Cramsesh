import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import './PlannerPage.css';

export default function PlannerPage() {
  const [schedule, setSchedule] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [goals, setGoals] = useState('');
  const [hours, setHours] = useState(2);
  const [overview, setOverview] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/planner').then(r => setSchedule(r.data)).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/planner/generate', { goals, hoursPerDay: hours });
      setSchedule(await api.get('/planner').then(r => r.data));
      setOverview(res.data.overview || '');
      toast.success('Study schedule generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Schedule generation failed. Upload some materials first.');
    } finally {
      setGenerating(false);
    }
  };

  // Group schedule by date
  const grouped = schedule.reduce((acc, s) => {
    const d = s.scheduled_date || 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="planner-page page-animate">
      <div className="page-header">
        <h1 className="page-title">Study Planner</h1>
        <p className="page-subtitle">AI generates an optimal study schedule based on your goals</p>
      </div>

      {/* Generator card */}
      <div className="card generator-card">
        <h2 className="gen-title">🤖 Generate Schedule</h2>
        <div className="gen-fields">
          <div className="gen-field">
            <label>Study Goals</label>
            <input
              className="input"
              placeholder="e.g. Pass my final exam in 2 weeks"
              value={goals}
              onChange={e => setGoals(e.target.value)}
            />
          </div>
          <div className="gen-field gen-field-sm">
            <label>Hours/Day</label>
            <input
              className="input"
              type="number"
              min={1} max={12}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? '🤖 Generating...' : '⚡ Generate Schedule'}
        </button>
        {overview && <p className="gen-overview">{overview}</p>}
      </div>

      {/* Schedule */}
      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginTop: '1.5rem' }} />
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <div className="icon">📅</div>
          <h3>No schedule yet</h3>
          <p>Generate a schedule to start organized studying</p>
        </div>
      ) : (
        <div className="schedule-timeline">
          {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, sessions]) => (
            <div key={date} className="day-block">
              <div className="day-label">
                <span className="day-title">{formatDate(date)}</span>
                <span className="day-sub">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="day-sessions">
                {sessions.map(s => (
                  <div key={s.id} className={`session-card ${s.completed ? 'done' : ''}`}>
                    <div className="session-time">{s.time_slot || '—'}</div>
                    <div className="session-info">
                      <div className="session-title">{s.lesson_title || 'Study Session'}</div>
                      <div className="session-meta">⏱ {s.duration_minutes} min
                        {s.difficulty && <span className={`badge badge-${s.difficulty === 'easy' ? 'neutron' : s.difficulty === 'hard' ? 'nucleus' : 'ion'} badge-xs`}>{s.difficulty}</span>}
                      </div>
                    </div>
                    {s.completed && <span className="session-done">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
