import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowLeft, Lock, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@meditrack.care');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, 'ADMIN');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid System Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-4 sm:p-6 relative selection:bg-teal-600 selection:text-white font-sans transition-colors duration-300">
      <div className="atmospheric-bg" />

      {/* Top Left Navigation Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          to="/" 
          className="btn-arrow-secondary text-xs py-2 px-4 bg-[var(--bg-pill)] border-[var(--border-card)] text-[var(--text-main)] shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Back to Care Portal</span>
        </Link>
      </div>

      {/* Top Right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 rounded-full bg-[var(--bg-pill)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-main)] hover:border-teal-500 transition-all shadow-md"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-700" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] p-8 sm:p-10 rounded-[32px] shadow-2xl relative z-10 my-12 transition-colors duration-300">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner mb-6">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight mb-1">System Admin Access</h2>
        <p className="text-xs text-[var(--text-muted)] mb-8 font-medium">Platform oversight, facility verification & security audit log review.</p>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5 font-semibold">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm outline-none font-sans transition focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm outline-none font-sans transition focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-arrow-primary w-full py-3.5 text-sm font-bold mt-4 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as System Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
