import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, ShieldAlert, ArrowLeft, CheckCircle2, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function DoctorAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, registerDoctor } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: 'Dr. Rajesh Mukherjee',
    medicalRegistrationNumber: 'WBMC-78421-REG',
    registrationAuthority: 'West Bengal Medical Council',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experienceYears: '12',
    phone: '+91 98300 12345',
    email: 'doctor.rajesh@meditrack.care',
    password: 'password123',
    confirmPassword: 'password123',
    languages: 'English, Bengali, Hindi',
    consultationType: 'BOTH',
    teleconsultationAvailable: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(formData.email, formData.password, 'DOCTOR');
      if (data.user.verificationStatus === 'PENDING_VERIFICATION') {
        alert('Your Doctor registration is PENDING_VERIFICATION by System Admin. Limited clinical preview granted.');
      }
      navigate('/doctor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await registerDoctor(formData);
      alert('Doctor Registration Submitted! Status: PENDING_VERIFICATION. Requires System Admin approval before full practice.');
      navigate('/doctor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-4 sm:p-6 relative selection:bg-teal-600 selection:text-white font-sans transition-colors duration-300">
      <div className="atmospheric-bg" />

      {/* Top Left Navigation Link */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
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

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-10 rounded-[32px] shadow-2xl relative z-10 my-12 transition-colors duration-300">
        
        {/* Header Title */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Doctor Portal</h2>
            <p className="text-xs text-[var(--text-muted)] tracking-wide mt-0.5 font-medium">Individual Clinicians & Teleconsultants</p>
          </div>
        </div>

        {/* Dynamic Mode Selector Tabs */}
        <div className="flex bg-[var(--bg-pill)] p-1.5 rounded-2xl mb-8 border border-[var(--border-card)]">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'login' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Doctor Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'register' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Doctor Registration
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-medium mb-6 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5">Doctor Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm outline-none transition focus:border-teal-500"
                placeholder="doctor.rajesh@meditrack.care"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm outline-none transition focus:border-teal-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-arrow-primary w-full py-3.5 text-sm font-bold mt-4 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Doctor'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 mb-5 flex items-center gap-2.5 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Registered doctors will enter <strong>PENDING_VERIFICATION</strong> status until approved by System Admin.</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="Dr. Rajesh Mukherjee" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Reg Number *</label>
                <input type="text" name="medicalRegistrationNumber" value={formData.medicalRegistrationNumber} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="WBMC-78421-REG" />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Specialization *</label>
                <select name="specialization" value={formData.specialization} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs">
                  <option value="Cardiology">Cardiology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Teleconsult Specialist">Teleconsult Specialist</option>
                </select>
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Qualification *</label>
                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="MBBS, MD, DM" />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="+91 98300 12345" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="doctor.rajesh@meditrack.care" />
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="••••••••" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="••••••••" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-arrow-primary w-full py-3.5 text-sm font-bold mt-4 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Submitting Registration...' : 'Register Doctor Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
