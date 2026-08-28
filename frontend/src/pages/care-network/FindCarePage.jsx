import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, Navigation, Building2, Stethoscope, CheckCircle2, ChevronRight, Activity, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { locationService } from '../../services/locationService';
import { routingService } from '../../services/routingService';
import { mapService } from '../../services/mapService';
import { careRecommendationService } from '../../services/careRecommendationService';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FindCarePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [facilityType, setFacilityType] = useState('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    fetchLocationAndFacilities();
  }, [facilityType, emergencyOnly]);

  const fetchLocationAndFacilities = async () => {
    setLoading(true);
    let loc = locationService.getDefaultLocation();
    try {
      const userPos = await locationService.getCurrentLocation();
      loc = userPos;
    } catch (err) {
      // Fallback
    }
    setUserLocation(loc);

    try {
      const endpoint = `${API_BASE}/care-network/facilities?query=${encodeURIComponent(query)}&facilityType=${facilityType}&emergency=${emergencyOnly}&lat=${loc.latitude}&lng=${loc.longitude}&city=${encodeURIComponent(loc.city || 'Jalpaiguri')}`;
      const res = await axios.get(endpoint);
      if (res.data && res.data.facilities) {
        const ranked = careRecommendationService.rankFacilities({
          facilities: res.data.facilities,
          userLocation: loc,
          requiredService: query,
          isEmergency: emergencyOnly
        });
        setFacilities(ranked);
        if (ranked.length > 0) {
          handleSelectFacility(ranked[0], loc);
        }
      }
    } catch (err) {
      console.error('Error searching facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLocationAndFacilities();
  };

  const handleSelectFacility = async (facility, loc = userLocation) => {
    setSelectedFacility(facility);
    if (loc && facility) {
      const route = await routingService.getRoute(
        { latitude: loc.latitude, longitude: loc.longitude },
        { latitude: facility.latitude, longitude: facility.longitude }
      );
      if (route.coordinates) {
        setRouteCoordinates(route.coordinates);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-7 h-7 text-blue-600" />
              <span>FIND PUBLIC HEALTHCARE</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Search suitable PHCs, CHCs, Rural Hospitals, ECG, X-Ray & Emergency Centers in <strong>{userLocation?.city || 'Jalpaiguri'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              📍 Location: {userLocation?.city || 'Jalpaiguri'} (GPS Active)
            </span>
          </div>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by facility name, service (e.g. ECG, X-Ray, Blood Test), specialty or district..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Facility Types</option>
            <option value="PHC">Primary Health Centre (PHC)</option>
            <option value="CHC">Community Health Centre (CHC)</option>
            <option value="RURAL_HOSPITAL">Rural Hospital</option>
            <option value="DISTRICT_HOSPITAL">District Hospital</option>
          </select>

          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Find Suitable Care</span>
          </button>
        </form>
      </div>

      {/* MAP & RANKED LIST SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEAFLET MAP VIEW */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden h-[480px] relative">
          {userLocation && (
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={10}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Location Marker */}
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={mapService.getUserLocationIcon()}
              >
                <Popup>📍 You Are Here</Popup>
              </Marker>

              {/* Facility Markers */}
              {facilities.map(f => (
                <Marker
                  key={f.facilityId}
                  position={[f.latitude, f.longitude]}
                  icon={mapService.getFacilityIcon(f.facilityType, f.emergencyAvailable)}
                  eventHandlers={{
                    click: () => handleSelectFacility(f)
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">{f.name}</p>
                      <p className="text-slate-500">{f.facilityType} • {f.distanceKm} km</p>
                      <button
                        onClick={() => navigate(`/care-network/facility/${f.facilityId}`)}
                        className="mt-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[10px]"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* OSRM Route Line */}
              {routeCoordinates.length > 0 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#2563eb"
                  weight={5}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          )}

          <div className="absolute bottom-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span> User</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> PHC/CHC</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-600 rounded-full inline-block"></span> Emergency</span>
          </div>
        </div>

        {/* RANKED FACILITIES LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Recommended Facilities ({facilities.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Sorted by Suitability & Distance</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {facilities.map((f, index) => {
              const isSelected = selectedFacility?.facilityId === f.facilityId;
              const isClosest = f.isNearest || index === 0;

              return (
                <div
                  key={f.facilityId}
                  onClick={() => handleSelectFacility(f)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  {isClosest && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase shadow-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>📍 NEAREST FACILITY ({f.distanceKm} KM)</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                        {f.facilityType.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {f.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {f.distanceKm} km
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">~{f.estimatedTravelTimeMinutes} mins drive</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    📍 {f.address}
                  </p>

                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl">
                    💡 {f.recommendationReason}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        mapService.openExternalNavigation(f.latitude, f.longitude, f.name);
                      }}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/care-network/facility/${f.facilityId}`);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                    >
                      <span>Book / Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindCarePage;
