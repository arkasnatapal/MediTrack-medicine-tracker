import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldAlert, ArrowLeft, CheckCircle2, Lock, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function FacilityAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, registerFacility } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    facilityName: '',
    facilityType: 'PHC',
    licenseId: '',
    classification: 'GOVERNMENT',
    address: '',
    state: 'West Bengal',
    district: 'Jalpaiguri',
    pincode: '',
    latitude: '26.52',
    longitude: '88.73',
    phone: '',
    email: '',
    website: '',
    emergencyAvailable: true,
    departments: 'General OPD, Maternal Care, Emergency',
    diagnosticServices: 'ECG, Blood Test, Pathology',
    availableFacilities: 'Pharmacy, Ambulance',
    operatingHours: '24/7 Emergency & OPD',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
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
      const data = await login(formData.adminEmail, formData.password, 'FACILITY');
      if (data.user.verificationStatus === 'PENDING_VERIFICATION') {
        alert('Your facility registration is PENDING_VERIFICATION by System Admin. Limited preview mode granted.');
      }
      navigate('/facility/dashboard');
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
      await registerFacility(formData);
      alert('Facility Registration Submitted! Status: PENDING_VERIFICATION. System Admin approval required.');
      navigate('/facility/dashboard');
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

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl my-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Healthcare Facility Portal</h2>
            <p className="text-xs text-slate-400">PHC • CHC • Rural & District Hospitals • Diagnostic Centers</p>
          </div>
        </div>

        {/* Toggle Mode Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'login' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Facility Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === 'register' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Facility Registration
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Email</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-teal-500 outline-none"
                placeholder="phcadmin@meditrack.care"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-teal-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20"
            >
              {loading ? 'Authenticating...' : 'Sign In as Facility Admin'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Registered facilities will enter <strong>PENDING_VERIFICATION</strong> status until approved by System Admin.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Facility Name *</label>
                <input type="text" name="facilityName" value={formData.facilityName} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Rampur District Hospital" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Facility Type *</label>
                <select name="facilityType" value={formData.facilityType} onChange={handleChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                  <option value="PHC">Primary Health Centre (PHC)</option>
                  <option value="CHC">Community Health Centre (CHC)</option>
                  <option value="RURAL_HOSPITAL">Rural Hospital</option>
                  <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  <option value="GOVT_HOSPITAL">Government Hospital</option>
                  <option value="DIAGNOSTIC_CENTRE">Diagnostic Centre</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">License / Reg ID *</label>
                <input type="text" name="licenseId" value={formData.licenseId} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="LIC-2026-DH-09" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Classification</label>
                <select name="classification" value={formData.classification} onChange={handleChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                  <option value="GOVERNMENT">Government</option>
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC_PRIVATE_PARTNERSHIP">Public Private Partnership</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Main Hospital Road, Sub-division Complex" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">District *</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">PIN Code *</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="735101" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Phone *</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="03561-220101" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Facility Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="contact@hospital.gov.in" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Administrator Name *</label>
                <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="Dr. Somnath Chatterjee" />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Admin Email *</label>
                <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="hospitaladmin@meditrack.care" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="••••••••" />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 mb-1">Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg" placeholder="••••••••" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 mt-4"
            >
              {loading ? 'Submitting Registration...' : 'Submit Facility Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
