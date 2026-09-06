import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, ShieldAlert, MapPin, Navigation, Clock, Activity, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { locationService } from '../../services/locationService';
import { routingService } from '../../services/routingService';
import { mapService } from '../../services/mapService';
import { useAppMode } from '../../context/AppModeContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmergencyPage = () => {
  const navigate = useNavigate();
  const { t } = useAppMode();
  // Initialize from device storage instantly if available
  const [location, setLocation] = useState(() => locationService.getCachedLocation() || locationService.getDefaultLocation());
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [emergencyFacilities, setEmergencyFacilities] = useState(() => locationService.getCachedFacilities('emergency') || []);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    const cachedFacs = locationService.getCachedFacilities('emergency');
    const cachedLoc = locationService.getCachedLocation();

    if (cachedFacs && cachedFacs.length > 0 && !selectedFacility) {
      handleSelectFacility(cachedFacs[0], cachedLoc || location);
    }

    const fetchLocationAndEmergencyFacilities = async () => {
      let freshLoc = location;
      try {
        const userPos = await locationService.getCurrentLocation();
        if (userPos && typeof userPos.latitude === 'number') {
          freshLoc = userPos;
        }
      } catch (err) {
        console.warn('Geolocation warning in EmergencyPage:', err);
      }

      setLocation(freshLoc);
      setLoadingLocation(false);

      // Check if location changed beyond threshold (0.5 km) or if no cached data
      const locChanged = locationService.hasLocationChanged(freshLoc, cachedLoc, 0.5);

      if (!locChanged && cachedFacs && cachedFacs.length > 0) {
        console.log('⚡ Location unchanged within 0.5km. Serving cached emergency hospitals instantly.');
        return;
      }

      // Save new location cache
      locationService.saveCachedLocation(freshLoc);

      try {
        const res = await axios.get(`${API_BASE}/care-network/facilities?emergency=true&lat=${freshLoc.latitude}&lng=${freshLoc.longitude}`);
        if (res.data && res.data.facilities) {
          const facilities = res.data.facilities;
          setEmergencyFacilities(facilities);
          locationService.saveCachedFacilities(facilities, freshLoc, 'emergency');

          if (facilities.length > 0) {
            handleSelectFacility(facilities[0], freshLoc);
          }
        }
      } catch (err) {
        console.error('Failed to load emergency facilities:', err);
      }
    };

    fetchLocationAndEmergencyFacilities();
  }, []);

  const handleSelectFacility = async (facility, userLoc = location) => {
    setSelectedFacility(facility);
    setLoadingRoute(true);

    if (userLoc && facility) {
      const route = await routingService.getRoute(
        { latitude: userLoc.latitude, longitude: userLoc.longitude },
        { latitude: facility.latitude, longitude: facility.longitude }
      );
      setRouteInfo(route);
    }
    setLoadingRoute(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 112 & 108 EMERGENCY BANNER */}
      <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 dark:from-rose-600 dark:via-red-600 dark:to-rose-700 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl border border-rose-200/80 dark:border-rose-700/60 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-white/20 text-rose-800 dark:text-white text-xs font-black uppercase border border-rose-300/60 dark:border-transparent">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-amber-300" />
              <span>National Emergency Response & Medical Ambulance (India)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-rose-950 dark:text-white">
              NATIONAL EMERGENCY ASSISTANCE
            </h1>
            <p className="text-sm text-rose-800 dark:text-rose-100 font-medium max-w-2xl">
              {t('emergencyNotice')} Dial 112 for Unified National Emergency Dispatch or 108 for Emergency Ambulance Services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:112"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white dark:bg-white dark:text-rose-700 font-black text-base text-center shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 flex-1 sm:flex-initial"
            >
              <PhoneCall className="w-5 h-5 text-white dark:text-rose-600" />
              <span>CALL 112</span>
            </a>

            <a
              href="tel:108"
              className="px-6 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-rose-900 border border-rose-300 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/40 font-black text-base text-center shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 flex-1 sm:flex-initial backdrop-blur-md"
            >
              <PhoneCall className="w-5 h-5 text-rose-600 dark:text-amber-300" />
              <span>CALL 108 (AMBULANCE)</span>
            </a>
          </div>
        </div>
      </div>

      {/* EMERGENCY FACILITY RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Facilities List */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              <span>Nearby Emergency Hospitals</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by Emergency Capability, ICU, ECG & Travel Duration
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {emergencyFacilities.map(f => {
              const isSelected = selectedFacility?.facilityId === f.facilityId;
              return (
                <div
                  key={f.facilityId}
                  onClick={() => handleSelectFacility(f)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      EMERGENCY 24/7
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{f.estimatedTravelTimeMinutes} mins ({f.distanceKm} km)</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {f.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {f.address}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {f.diagnostics?.map(d => d.available && (
                      <span key={d.name} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                        {d.name} ✓
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Route & Selected Facility Info */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFacility ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">Selected Emergency Facility</span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedFacility.name}</h2>
                  <p className="text-xs text-slate-500">{selectedFacility.address}</p>
                </div>

                <button
                  onClick={() => mapService.openExternalNavigation(selectedFacility.latitude, selectedFacility.longitude, selectedFacility.name)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Navigation</span>
                </button>
              </div>

              {/* ROUTE SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Time</span>
                  <p className="text-lg font-black text-rose-600">{routeInfo?.durationMinutes || selectedFacility.estimatedTravelTimeMinutes} Mins</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Driving Distance</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100">{routeInfo?.distanceKm || selectedFacility.distanceKm} Km</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Routing Engine</span>
                  <p className="text-xs font-bold text-blue-600 truncate">{routeInfo?.provider || 'OSRM'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Facility Contact</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedFacility.phone}</p>
                </div>
              </div>

              {/* SPECIALTIES & DIAGNOSTICS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Emergency Capabilities & Diagnostic Support</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFacility.specialties?.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                  {selectedFacility.diagnostics?.map(d => d.available && (
                    <span key={d.name} className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      {d.name} (Wait: {d.waitTimeMinutes}m)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
              Select an emergency facility on the left
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
