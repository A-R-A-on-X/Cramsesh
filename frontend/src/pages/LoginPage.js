import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AtomLogo from '../components/AtomLogo';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.email || !form.password) {
    toast.error('Please fill in all fields');
    return;
  }
  setLoading(true);
  try {
    await login(form.email, form.password);
    toast.success('Welcome back!');
    navigate('/dashboard');
  } catch (err) {
    if (err.response) {
      if (err.response.status === 401) {
        toast.error('Email or password is incorrect');
      } else if (err.response.status === 404) {
        toast.error('No account found with this email');
      } else {
        toast.error(err.response.data?.error || 'Login failed');
      }
    } else if (err.request) {
      toast.error('Cannot reach server. Please try again later');
    } else {
      toast.error('Something went wrong. Please try again');
    }
    setLoading(false);
    return;
  }
  setLoading(false);
};

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <AtomLogo size={64} animated />
        </div>
        <h1 className="auth-title">CramSesh</h1>
        <p className="auth-sub">Sign in to your study command center</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
