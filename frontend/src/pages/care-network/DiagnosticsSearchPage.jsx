import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity, Search, MapPin, Clock, Building2, ChevronRight, CheckCircle2, 
  XCircle, Navigation, PhoneCall, RefreshCw, Sun, Moon, Sparkles, Filter, SlidersHorizontal, Phone, Eye, EyeOff
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

import { useTheme } from '../../context/ThemeContext';
import { locationService } from '../../services/locationService';
import { mapService } from '../../services/mapService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const commonDiagnostics = ['ALL', 'ECG', 'X-Ray', 'CT Scan', 'MRI', 'Blood Test', 'Ultrasound', 'Pathology'];

// Helper to auto-recenter map when user location or selected facility changes
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 12, { animate: true });
    }
  }, [center, map]);
  return null;
};

const DiagnosticsSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTest = searchParams.get('test') || 'ALL';

  const { theme, setTheme } = useTheme();

  const [selectedDiagnostic, setSelectedDiagnostic] = useState(initialTest);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(() => {
    const cached = locationService.getCachedLocation();
    return cached ? (cached.city || `${cached.latitude.toFixed(2)}, ${cached.longitude.toFixed(2)}`) : '';
  });
  const [userLocation, setUserLocation] = useState(() => locationService.getCachedLocation() || locationService.getDefaultLocation());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [diagnosticsList, setDiagnosticsList] = useState(() => locationService.getCachedFacilities('diagnostics') || []);
  const [loading, setLoading] = useState(() => !(locationService.getCachedFacilities('diagnostics')?.length > 0));
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [maxDistanceRadius, setMaxDistanceRadius] = useState('5');
  const [customRadiusInput, setCustomRadiusInput] = useState('');

  const effectiveMaxKm = useMemo(() => {
    if (maxDistanceRadius === 'ALL') return Infinity;
    if (maxDistanceRadius === 'CUSTOM') {
      const val = parseFloat(customRadiusInput);
      return isNaN(val) || val <= 0 ? Infinity : val;
    }
    return parseFloat(maxDistanceRadius);
  }, [maxDistanceRadius, customRadiusInput]);

  // Auto-expand radius if initial 5km radius has 0 facilities
  useEffect(() => {
    if (diagnosticsList && diagnosticsList.length > 0) {
      const currentCount = diagnosticsList.filter(item => {
        const d = typeof item.distanceKm === 'number' ? item.distanceKm : parseFloat(item.distanceKm) || 0;
        return maxDistanceRadius === 'ALL' || (maxDistanceRadius === 'CUSTOM' ? d <= (parseFloat(customRadiusInput) || Infinity) : d <= parseFloat(maxDistanceRadius));
      }).length;

      if (currentCount === 0) {
        const thresholds = [5, 10, 20, 30];
        for (const t of thresholds) {
          const count = diagnosticsList.filter(item => {
            const d = typeof item.distanceKm === 'number' ? item.distanceKm : parseFloat(item.distanceKm) || 0;
            return d <= t;
          }).length;
          if (count > 0) {
            setMaxDistanceRadius(String(t));
            return;
          }
        }
        setMaxDistanceRadius('ALL');
      }
    }
  }, [diagnosticsList]);

  useEffect(() => {
    initUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchDiagnostics(selectedDiagnostic, userLocation);
    }
  }, [selectedDiagnostic, userLocation]);

  const initUserLocation = async () => {
    const cachedLoc = locationService.getCachedLocation();
    const cachedDiags = locationService.getCachedFacilities('diagnostics');

    if (cachedDiags && cachedDiags.length > 0) {
      setDiagnosticsList(cachedDiags);
      setSelectedItem(cachedDiags[0]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let loc = userLocation || cachedLoc || locationService.getDefaultLocation();
    try {
      const currentLoc = await locationService.getCurrentLocation();
      if (currentLoc && typeof currentLoc.latitude === 'number') {
        loc = currentLoc;
      }
    } catch (err) {
      console.warn('Geolocation denied/unavailable, using default location:', err);
    }

    setUserLocation(loc);
    setLocationQuery(loc.city || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`);

    const locChanged = locationService.hasLocationChanged(loc, cachedLoc, 0.5);
    if (!locChanged && cachedDiags && cachedDiags.length > 0) {
      console.log('⚡ DiagnosticsSearchPage serving cached diagnostics (location delta < 0.5km).');
      setLoading(false);
      return;
    }

    locationService.saveCachedLocation(loc);
  };

  const fetchDiagnostics = async (name, loc = userLocation) => {
    const cachedLoc = locationService.getCachedLocation();
    const cachedDiags = locationService.getCachedFacilities('diagnostics');

    const locChanged = locationService.hasLocationChanged(loc, cachedLoc, 0.5);
    if (!locChanged && cachedDiags && cachedDiags.length > 0 && name === 'ALL') {
      console.log('⚡ DiagnosticsSearchPage serving cached diagnostics list.');
      setDiagnosticsList(cachedDiags);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queryParam = name === 'ALL' ? '' : name;
      const lat = loc ? loc.latitude : '';
      const lng = loc ? loc.longitude : '';
      const city = loc ? (loc.city || 'Jalpaiguri') : 'Jalpaiguri';
      
      const endpoint = `${API_BASE}/care-network/diagnostics?name=${encodeURIComponent(queryParam)}&lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`;
      const res = await axios.get(endpoint);
      
      if (res.data && res.data.diagnostics) {
        setDiagnosticsList(res.data.diagnostics);
        if (name === 'ALL') {
          locationService.saveCachedFacilities(res.data.diagnostics, loc, 'diagnostics');
        }
        if (res.data.diagnostics.length > 0) {
          setSelectedItem(res.data.diagnostics[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual Location Search (Nominatim OpenStreetMap Geocoding for Jalpaiguri, Pan-India & Global cities)
  const handleLocationSearchSubmit = async (e) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;

    setIsGeocoding(true);
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`;
      const response = await fetch(geoUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const newLoc = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            city: data[0].display_name.split(',')[0],
            region: data[0].display_name,
            isManual: true
          };
          setUserLocation(newLoc);
        } else {
          alert('Location not found. Please try searching with city, district or pin code.');
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Filter list by keyword, test tag, and distance radius
  const filteredDiagnostics = useMemo(() => {
    return diagnosticsList.filter(item => {
      const dist = typeof item.distanceKm === 'number' ? item.distanceKm : parseFloat(item.distanceKm) || 0;
      if (dist > effectiveMaxKm) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.facilityName.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        (item.availableDiagnostics && item.availableDiagnostics.some(d => d.toLowerCase().includes(q)))
      );
    });
  }, [diagnosticsList, effectiveMaxKm, searchQuery]);

  const mapCenter = selectedItem 
    ? [selectedItem.latitude, selectedItem.longitude] 
    : userLocation 
      ? [userLocation.latitude, userLocation.longitude] 
      : [26.54, 88.71];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen">
      
      {/* GLASSMOPHIC HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-r from-rose-50/90 via-pink-50/90 to-amber-50/90 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-slate-900/90 border border-rose-200/80 dark:border-slate-800/80 shadow-2xl p-6 sm:p-8 space-y-5 transition-all text-slate-900 dark:text-white">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/15 border border-rose-300/60 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Verified Diagnostic & Pathology Centers</span>
              </span>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                📍 Location: {userLocation?.city || 'Jalpaiguri'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              DIAGNOSTIC & SCAN CENTERS IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-500 to-purple-600">{(userLocation?.city || 'JALPAIGURI').toUpperCase()}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Showing verified standalone diagnostic centers, MRI/CT scan labs & pathology centers near your location with direct phone contact & Google Maps navigation.
            </p>
          </div>

          {/* Theme Toggle & Google Maps Direct Link */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <a
              href={`https://www.google.com/maps/search/diagnostic+centers+in+${encodeURIComponent(userLocation?.city || 'Jalpaiguri')}/@${userLocation?.latitude || 26.54},${userLocation?.longitude || 88.71},13z`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span className='text-white dark:text-white'>🗺️ Open in Google Maps</span>
            </a>

            
          </div>
        </div>

        {/* LOCATION SELECTOR & KEYWORD SEARCH FORM */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          
          {/* Location City Search */}
          <form onSubmit={handleLocationSearchSubmit} className="md:col-span-6 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-rose-500" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Type your city (e.g., Jalpaiguri, Siliguri, Kolkata)..."
                className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 backdrop-blur-md shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isGeocoding}
              className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              {isGeocoding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isGeocoding ? 'Locating...' : 'Set Location'}</span>
            </button>

            <button
              type="button"
              onClick={initUserLocation}
              className="px-3.5 py-3 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs backdrop-blur-md transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="Use Precise GPS Location"
            >
              📍 GPS
            </button>
          </form>

          {/* Diagnostic Keyword Filter Search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagnostic center name, lab, or test tag..."
              className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 backdrop-blur-md shadow-inner"
            />
          </div>
        </div>

        {/* DIAGNOSTIC CATEGORY PILLS */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Test:
          </span>
          {commonDiagnostics.map(diag => {
            const isSelected = selectedDiagnostic === diag;
            return (
              <button
                key={diag}
                onClick={() => setSelectedDiagnostic(diag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-rose-500/25 shadow-md'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-rose-400 backdrop-blur-md'
                }`}
              >
                {diag === 'ALL' ? '✨ All Diagnostic Services' : diag}
              </button>
            );
          })}
        </div>

        {/* DISTANCE RADIUS FILTER: PHONE DROPDOWN SELECT + DESKTOP PILLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-rose-200/50 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Distance Filter:</span>
            </span>

            {/* Mobile Dropdown Select (Visible on Phone Screens) */}
            <div className="sm:hidden flex items-center gap-2">
              <select
                value={maxDistanceRadius}
                onChange={(e) => setMaxDistanceRadius(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm cursor-pointer"
              >
                <option value="5">Within 5 km (Default)</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
                <option value="30">Within 30 km</option>
                <option value="ALL">All Distances</option>
                <option value="CUSTOM">Custom Range...</option>
              </select>

              {maxDistanceRadius === 'CUSTOM' && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-rose-400 dark:border-rose-500 rounded-xl px-2 py-0.5 shadow-inner">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={customRadiusInput}
                    onChange={(e) => setCustomRadiusInput(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-14 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <span className="text-[10px] font-bold text-slate-500">km</span>
                </div>
              )}
            </div>

            {/* Desktop Preset Buttons (Hidden on Phone, Visible on sm and up) */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Within 5 km', value: '5' },
                { label: 'Within 10 km', value: '10' },
                { label: 'Within 20 km', value: '20' },
                { label: 'Within 30 km', value: '30' },
                { label: 'All Distances', value: 'ALL' },
              ].map(preset => {
                const isActive = maxDistanceRadius === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setMaxDistanceRadius(preset.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                      isActive
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-rose-500/20'
                        : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              {/* Custom Distance Button & Input Field */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMaxDistanceRadius('CUSTOM')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                    maxDistanceRadius === 'CUSTOM'
                      ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-rose-500/20'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Custom Range
                </button>

                {maxDistanceRadius === 'CUSTOM' && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-rose-400 dark:border-rose-500 rounded-xl px-2 py-0.5 shadow-inner">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={customRadiusInput}
                      onChange={(e) => setCustomRadiusInput(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-16 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <span className="text-[10px] font-bold text-slate-500">km</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 self-start sm:self-auto">
            Filtered: ≤ {effectiveMaxKm === Infinity ? 'Any' : `${effectiveMaxKm} km`} ({filteredDiagnostics.length} found)
          </span>
        </div>

      </div>

      {/* SPLIT VIEW: LEAFLET INTERACTIVE MAP & SINGLE CARD DIAGNOSTIC LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEAFLET INTERACTIVE DIAGNOSTIC MAP */}
        <div className={`lg:col-span-7 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-xl overflow-hidden relative backdrop-blur-xl transition-all duration-300 flex flex-col ${isMapCollapsed ? 'h-14 lg:h-[560px]' : 'h-64 sm:h-80 lg:h-[560px]'}`}>
          {/* Mobile Collapse Header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 z-10 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>🧪 Diagnostic Map</span>
              <span className="text-[10px] font-normal text-slate-500">(Tap to minimize/scroll)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsMapCollapsed(!isMapCollapsed)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-bold shadow-sm active:scale-95 transition-all text-blue-600 dark:text-blue-400"
            >
              {isMapCollapsed ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show Map</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Minimize Map</span>
                </>
              )}
            </button>
          </div>

          {!isMapCollapsed && userLocation ? (
            <div className="flex-1 w-full relative min-h-0">
              <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MapRecenter center={mapCenter} />

                {/* USER LOCATION MARKER */}
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={mapService.getUserLocationIcon()}
                >
                  <Popup>
                    <div className="p-2 space-y-1 text-slate-900">
                      <div className="font-black text-xs text-blue-600">👤 Your Location</div>
                      <div className="text-[11px] font-semibold">{userLocation.city || 'Jalpaiguri'}</div>
                    </div>
                  </Popup>
                </Marker>

                {/* DIAGNOSTIC CENTER MARKERS */}
                {filteredDiagnostics.map((item, index) => {
                  return (
                    <Marker
                      key={`${item.facilityId}-${index}`}
                      position={[item.latitude, item.longitude]}
                      icon={mapService.getFacilityIcon(item.facilityType, false)}
                      eventHandlers={{
                        click: () => setSelectedItem(item)
                      }}
                    >
                      <Popup>
                        <div className="p-2.5 space-y-2 max-w-xs text-slate-900">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                              {item.facilityType.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600">
                              {item.distanceKm} km away
                            </span>
                          </div>

                          <h4 className="font-bold text-xs leading-snug">{item.facilityName}</h4>
                          <p className="text-[11px] text-slate-600 truncate">{item.address}</p>

                          <div className="flex flex-wrap gap-1 py-1">
                            {item.availableDiagnostics?.slice(0, 4).map(t => (
                              <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                ⚡ {t}
                              </span>
                            ))}
                          </div>

                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <a href={`tel:${item.phone}`} className="font-bold text-emerald-600 flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" /> {item.phone}
                            </a>
                            <button
                              onClick={() => mapService.openExternalNavigation(item.latitude, item.longitude, item.facilityName)}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3" /> Maps
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Map Overlay Badge */}
              <div className="absolute top-3 left-3 z-[400] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/60 dark:border-slate-700 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 shadow-md">
                {filteredDiagnostics.length} Diagnostic Centers in {userLocation?.city || 'Jalpaiguri'}
              </div>
            </div>
          ) : !isMapCollapsed ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold">
              Loading Diagnostic Map & Location...
            </div>
          ) : null}
        </div>

        {/* DIAGNOSTIC RESULTS CARDS LIST - SINGLE CARD PER CENTER WITH ALL TAGS */}
        <div className="lg:col-span-5 space-y-4 max-h-[560px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Diagnostic Centers in {userLocation?.city || 'Jalpaiguri'} ({filteredDiagnostics.length})
            </h2>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Sorted by Distance
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold backdrop-blur-md bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-white/40 dark:border-slate-800">
              Locating Jalpaiguri diagnostic centers...
            </div>
          ) : filteredDiagnostics.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold backdrop-blur-md bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-white/40 dark:border-slate-800 space-y-2">
              <Activity className="w-8 h-8 mx-auto text-slate-400" />
              <div>No diagnostic centers found for "{selectedDiagnostic}".</div>
              <button
                onClick={() => setSelectedDiagnostic('ALL')}
                className="text-xs text-rose-600 dark:text-rose-400 underline font-bold"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            filteredDiagnostics.map((item, idx) => {
              const isSelected = selectedItem?.facilityId === item.facilityId;
              return (
                <div
                  key={`${item.facilityId}-${idx}`}
                  onClick={() => setSelectedItem(item)}
                  className={`backdrop-blur-xl p-5 rounded-3xl border transition-all duration-300 cursor-pointer space-y-3 group ${
                    isSelected
                      ? 'bg-white/90 dark:bg-slate-800/95 border-rose-500/80 shadow-xl ring-2 ring-rose-500/20'
                      : 'bg-white/50 dark:bg-slate-900/50 border-white/60 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:border-rose-400/50'
                  }`}
                >
                  {/* TOP HEADER BAR: TYPE BADGE & NEAREST STATUS */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        🔬 {item.facilityType.replace('_', ' ')}
                      </span>

                      {item.isNearest && (
                        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                          📍 NEAREST ({item.distanceKm} KM)
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ✓ AVAILABLE
                    </span>
                  </div>

                  {/* CENTER NAME & LOCATION */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                      {item.facilityName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.address} • <span className="font-bold text-blue-600 dark:text-blue-400">{item.distanceKm} km away</span>
                    </p>
                  </div>

                  {/* ALL AVAILABLE DIAGNOSTIC TEST TAGS ON SINGLE CARD */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.availableDiagnostics?.map(t => (
                      <span
                        key={t}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300 border border-rose-500/20"
                      >
                        ⚡ {t}
                      </span>
                    ))}
                  </div>

                  {/* PHONE NUMBER & DIRECT ACTIONS BAR */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    
                    {/* PHONE NUMBER DISPLAY */}
                    <a
                      href={`tel:${item.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.phone || '+91 3561 224455'}</span>
                    </a>

                    <div className="flex items-center gap-2">
                      {/* MAPS BUTTON - DROPS EXACT LAT/LNG PIN ON GOOGLE MAPS */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          mapService.openExternalNavigation(item.latitude, item.longitude, item.facilityName);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Maps
                      </button>

                      {/* BOOK BUTTON */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/care-network/facility/${item.facilityId}`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all flex items-center gap-0.5 shadow-sm active:scale-95"
                      >
                        Book <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};

export default DiagnosticsSearchPage;
