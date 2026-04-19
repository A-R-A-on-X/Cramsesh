import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AtomLogo from '../components/AtomLogo';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created! Welcome to CramSesh 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
          <AtomLogo size={56} animated />
        </div>
        <h1 className="auth-title">Join CramSesh</h1>
        <p className="auth-sub">Your AI-powered study journey starts here</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input className="input" type="text" placeholder="StudyWarrior42"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Confirm</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
