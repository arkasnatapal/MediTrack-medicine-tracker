import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function DoctorAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, registerDoctor } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    medicalRegistrationNumber: '',
    registrationAuthority: 'West Bengal Medical Council',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD, DM',
    experienceYears: '10',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Care Network Home
        </Link>
      </div>

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl my-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Doctor Portal</h2>
            <p className="text-xs text-slate-400">Individual Clinicians & Teleconsultants</p>
          </div>
        </div>

        {/* Toggle Mode Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Doctor Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'register' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Doctor Registration
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-cyan-500 outline-none"
                placeholder="doctor.rajesh@meditrack.care"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-cyan-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Authenticating...' : 'Sign In as Doctor'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Registered doctors enter <strong>PENDING_VERIFICATION</strong> status until verified by System Admin.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Dr. Rajesh Sharma" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Medical Registration No. *</label>
                <input type="text" name="medicalRegistrationNumber" value={formData.medicalRegistrationNumber} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="MCI-WB-2015-8891" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Registration Authority *</label>
                <input type="text" name="registrationAuthority" value={formData.registrationAuthority} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="State Medical Council" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Specialization *</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Cardiology" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Qualification *</label>
                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="MBBS, MD, DM" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Experience (Years)</label>
                <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Phone *</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="9870011223" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="doctor@meditrack.care" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="••••••••" />
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-2">
                <input type="checkbox" name="teleconsultationAvailable" checked={formData.teleconsultationAvailable} onChange={handleChange} id="tele-check" className="rounded bg-slate-950 border-slate-800 text-cyan-500" />
                <label htmlFor="tele-check" className="text-slate-300">Available for Teleconsultation Services</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 mt-4"
            >
              {loading ? 'Submitting Registration...' : 'Submit Doctor Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
