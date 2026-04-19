import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AtomLogo from './AtomLogo';
import './Layout.css';

const navItems = [
  { path: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { path: '/materials', icon: '📂', label: 'Materials' },
  { path: '/lessons', icon: '📖', label: 'Lessons' },
  { path: '/tutor', icon: '🤖', label: 'AI Tutor' },
  { path: '/planner', icon: '📅', label: 'Planner' },
  { path: '/progress', icon: '📊', label: 'Progress' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const xpToNextLevel = [100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
  const prevXP = user?.level > 1 ? xpToNextLevel[user.level - 2] : 0;
  const nextXP = xpToNextLevel[Math.min((user?.level || 1) - 1, xpToNextLevel.length - 1)];
  const xpPct = Math.min(100, Math.round(((user?.xp - prevXP) / (nextXP - prevXP)) * 100)) || 0;

  return (
    <div className={`app-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <AtomLogo size={36} animated />
          {!collapsed && (
            <div className="brand">
              <span className="brand-name">CramSesh</span>
              <span className="brand-tagline">AI Study Planner</span>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* User card */}
        {!collapsed && user && (
          <div className="user-card">
            <div className="user-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-level">
                <span className="level-badge">Lv. {user.level}</span>
                <span className="xp-text">{user.xp} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Streak indicator */}
        {!collapsed && user?.streak > 0 && (
          <div className="streak-badge">
            🔥 {user.streak} day streak
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
