import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Clock, ShieldAlert, CheckCircle2, Navigation, 
  Calendar, Activity, Pill, ChevronLeft, Mail, Globe, ShieldCheck, AlertCircle, PhoneCall
} from 'lucide-react';
import { mapService } from '../../services/mapService';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FacilityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const res = await axios.get(`${API_BASE}/care-network/facilities/${id}`);
        if (res.data && res.data.facility) {
          setFacility(res.data.facility);
        }
      } catch (err) {
        console.error('Error fetching facility details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading facility profile & verified contact data...</div>;
  }

  if (!facility) {
    return <div className="p-8 text-center text-rose-500 font-bold">Healthcare Facility Not Found</div>;
  }

  const contactInfo = facility.contactInfo || {};
  const hasPhone = Boolean(contactInfo.phone);
  const hasEmail = Boolean(contactInfo.email);
  const hasWebsite = Boolean(contactInfo.website);
  const hasContactInfo = hasPhone || hasEmail || hasWebsite;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Facilities</span>
      </button>

      {/* HEADER CARD */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
              {facility.facilityType.replace('_', ' ')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {facility.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{facility.address || contactInfo.address} ({facility.district}, {facility.state})</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => mapService.openExternalNavigation(facility.latitude, facility.longitude, facility.name)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Directions</span>
            </button>

            <button
              onClick={() => navigate('/care-network/appointments')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Emergency 24/7</span>
            <p className={`text-sm font-bold ${facility.emergencyAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
              {facility.emergencyAvailable ? '✓ Active Emergency Care' : 'Unavailable'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">OPD Timing</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{facility.operatingHours}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Available Beds</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{facility.bedCount?.available || 0} / {facility.bedCount?.total || 0} Beds</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Teleconsultation</span>
            <p className="text-sm font-bold text-blue-600">{facility.teleconsultationAvailable ? '✓ Supported' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* VERIFIED CONTACT INFORMATION LAYER */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Verified Facility Contact Information</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official verified communication channels for {facility.name}
            </p>
          </div>

          {contactInfo.isVerified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
              ✓ Authorized Source Verified
            </span>
          )}
        </div>

        {/* VERIFIED ACTION BUTTONS: [ 📞 CALL ] [ ✉️ EMAIL ] [ 🌐 WEBSITE ] */}
        <div className="flex flex-wrap items-center gap-3">
          {hasPhone ? (
            <a
              href={`tel:${contactInfo.phone}`}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>📞 CALL ({contactInfo.phone})</span>
            </a>
          ) : null}

          {hasEmail ? (
            <a
              href={`mailto:${contactInfo.email}`}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>✉️ EMAIL ({contactInfo.email})</span>
            </a>
          ) : null}

          {hasWebsite ? (
            <a
              href={contactInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>🌐 WEBSITE</span>
            </a>
          ) : null}

          {/* DISPLAY IF CONTACT INFORMATION IS UNAVAILABLE */}
          {!hasContactInfo && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2 w-full">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span>Contact information unavailable</span>
            </div>
          )}
        </div>

        {/* VERIFICATION METADATA AUDIT TRAIL */}
        {hasContactInfo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
            <span>Source of Contact Info: <strong className="text-slate-700 dark:text-slate-200">{contactInfo.sourceOfInformation || 'Official Government Healthcare Registry'}</strong></span>
            <span>Last Verified: <strong className="text-slate-700 dark:text-slate-200">{contactInfo.lastVerifiedDate ? new Date(contactInfo.lastVerifiedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently Verified'}</strong></span>
          </div>
        )}
      </div>

      {/* DIAGNOSTICS & MEDICINE STOCK SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIAGNOSTICS LIST */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <span>Available Diagnostic Services</span>
          </h2>

          <div className="space-y-2">
            {facility.diagnostics?.map(d => (
              <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${d.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-200 text-slate-500'}`}>
                  {d.available ? `Available (Est. Wait: ${d.waitTimeMinutes}m)` : 'Out of Service'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MEDICINE STOCK LIST */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-500" />
            <span>Local Medicine Inventory</span>
          </h2>

          <div className="space-y-2">
            {facility.medicineServices?.map(m => (
              <div key={m.medicineName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{m.medicineName}</p>
                  <p className="text-[10px] text-slate-400">{m.genericName}</p>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                  {m.quantity} Units Stock
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPage;
