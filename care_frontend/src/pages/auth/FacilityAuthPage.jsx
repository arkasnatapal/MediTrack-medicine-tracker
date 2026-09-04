import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldAlert, ArrowLeft, CheckCircle2, Lock, Mail, Phone, MapPin, Globe, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import { useTheme } from '../../hooks/useTheme';

export default function FacilityAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, registerFacility } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    facilityName: 'Jalpaiguri District Healthcare Centre',
    facilityType: 'DISTRICT_HOSPITAL',
    licenseId: `LIC-WB-${Math.floor(1000 + Math.random() * 9000)}`,
    classification: 'GOVERNMENT',
    address: 'Hospital Road, District Campus, Jalpaiguri',
    state: 'West Bengal',
    district: 'Jalpaiguri',
    pincode: '735101',
    latitude: '26.5400',
    longitude: '88.7100',
    phone: '+91 3561 222100',
    email: 'info@jalpaiguri-health.gov.in',
    website: 'https://www.wbhealth.gov.in',
    emergencyAvailable: true,
    departments: 'General OPD, Maternal Care, Emergency, ICU',
    diagnosticServices: 'ECG, Blood Test, Pathology, X-Ray',
    availableFacilities: 'Pharmacy, Ambulance, Oxygen Support',
    operatingHours: '24/7 Emergency & OPD',
    adminName: 'Dr. Somnath Chatterjee',
    adminEmail: 'facility.admin@meditrack.care',
    password: 'password123',
    confirmPassword: 'password123',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const [autoFilledHospital, setAutoFilledHospital] = useState(null);

  const handleLocationSelect = (lat, lng, addressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: prev.address ? prev.address : (addressSuggestion || prev.address),
    }));
  };

  const handleHospitalSelect = (hospitalInfo) => {
    setFormData(prev => ({
      ...prev,
      facilityName: hospitalInfo.name || prev.facilityName,
      facilityType: hospitalInfo.facilityType || prev.facilityType,
      licenseId: prev.licenseId ? prev.licenseId : `LIC-${(hospitalInfo.facilityId || Date.now().toString()).slice(-8).toUpperCase()}`,
      address: hospitalInfo.address || prev.address,
      district: hospitalInfo.district || prev.district || 'Jalpaiguri',
      state: hospitalInfo.state || prev.state || 'West Bengal',
      latitude: hospitalInfo.latitude || prev.latitude,
      longitude: hospitalInfo.longitude || prev.longitude,
      phone: hospitalInfo.phone || prev.phone || '03561-220101',
    }));
    setAutoFilledHospital(hospitalInfo.name);
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

      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-10 rounded-[32px] shadow-2xl relative z-10 my-12 transition-colors duration-300">
        
        {/* Header Title */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Healthcare Facility Portal</h2>
            <p className="text-xs text-[var(--text-muted)] tracking-wide mt-0.5 font-medium">PHC • CHC • District Hospitals • Public Healthcare Units</p>
          </div>
        </div>

        {/* Dynamic Mode Tabs */}
        <div className="flex bg-[var(--bg-pill)] p-1.5 rounded-2xl mb-8 border border-[var(--border-card)] max-w-md">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'login' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Facility Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'register' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Facility Registration
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-medium mb-6 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1.5">Administrator Email</label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm outline-none transition focus:border-teal-500"
                placeholder="facility.admin@meditrack.care"
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
              <span>{loading ? 'Authenticating...' : 'Sign In as Facility Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 mb-5 flex items-center gap-2.5 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Registered facilities will enter <strong>PENDING_VERIFICATION</strong> status until approved by System Admin.</span>
            </div>

            {autoFilledHospital && (
              <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 mb-5 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Auto-filled details for: <strong className="text-[var(--text-main)]">🏥 {autoFilledHospital}</strong>
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full font-bold">✓ Form Updated</span>
              </div>
            )}

            {/* LOCATION PICKER MAP */}
            <div className="mb-6 bg-[var(--bg-pill)] p-4 rounded-2xl border border-[var(--border-card)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-600 dark:text-teal-400 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-teal-500" /> Locality Hospital Pin & Location Fetcher
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Click Fetch Location or any marker to auto-fill</span>
              </div>
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationSelect={handleLocationSelect}
                onHospitalSelect={handleHospitalSelect}
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Facility Name *</label>
                <input type="text" name="facilityName" value={formData.facilityName} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="Rampur District Hospital" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Facility Type *</label>
                <select name="facilityType" value={formData.facilityType} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs">
                  <option value="PHC">Primary Health Centre (PHC)</option>
                  <option value="CHC">Community Health Centre (CHC)</option>
                  <option value="RURAL_HOSPITAL">Rural Hospital</option>
                  <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  <option value="GOVT_HOSPITAL">Government Hospital</option>
                  <option value="PUBLIC_HEALTHCARE">Public Health Centre</option>
                  <option value="DIAGNOSTIC_CENTRE">Diagnostic Centre</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">License / Reg ID *</label>
                <input type="text" name="licenseId" value={formData.licenseId} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="LIC-2026-DH-09" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Classification</label>
                <select name="classification" value={formData.classification} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs">
                  <option value="GOVERNMENT">Government / Public</option>
                  <option value="TRUST">Trust / Non-Profit</option>
                  <option value="SEMI_GOVT">Semi-Government</option>
                  <option value="PRIVATE_AFFILIATED">Private Affiliated</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Admin Email *</label>
                <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="facility.admin@meditrack.care" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-[var(--text-main)] mb-1">Admin Name *</label>
                <input type="text" name="adminName" value={formData.adminName} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-xs" placeholder="Dr. Somnath Chatterjee" />
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
              <span>{loading ? 'Submitting Registration...' : 'Register Facility Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
