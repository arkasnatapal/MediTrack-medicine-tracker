import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, Navigation, Building2, Stethoscope, CheckCircle2, ChevronRight, Activity, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { locationService } from '../../services/locationService';
import { routingService } from '../../services/routingService';
import { mapService } from '../../services/mapService';
import { careRecommendationService } from '../../services/careRecommendationService';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Map auto-bounds controller to keep view focused strictly on user locality
const MapController = ({ center, facilities }) => {
  const map = useMap();
  useEffect(() => {
    if (center && facilities && facilities.length > 0) {
      const validPoints = facilities
        .filter(f => f.latitude && f.longitude && (f.distanceKm === undefined || f.distanceKm <= 100))
        .map(f => [f.latitude, f.longitude]);
      
      if (validPoints.length > 0) {
        validPoints.push([center.latitude, center.longitude]);
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } else {
        map.setView([center.latitude, center.longitude], 12);
      }
    } else if (center) {
      map.setView([center.latitude, center.longitude], 12);
    }
  }, [center, facilities]);
  return null;
};

const FindCarePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [facilityType, setFacilityType] = useState('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(() => locationService.getCachedLocation() || locationService.getDefaultLocation());
  const [facilities, setFacilities] = useState(() => locationService.getCachedFacilities('findcare') || []);
  const [loading, setLoading] = useState(() => !(locationService.getCachedFacilities('findcare')?.length > 0));
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    fetchLocationAndFacilities();
  }, [facilityType, emergencyOnly]);

  const fetchLocationAndFacilities = async () => {
    const cachedFacs = locationService.getCachedFacilities('findcare');
    const cachedLoc = locationService.getCachedLocation();

    if (cachedFacs && cachedFacs.length > 0 && !query && facilityType === 'ALL' && !emergencyOnly) {
      setFacilities(cachedFacs);
      setLoading(false);
      if (!selectedFacility) {
        handleSelectFacility(cachedFacs[0], cachedLoc || userLocation);
      }
    } else {
      setLoading(true);
    }

    let freshLoc = userLocation || cachedLoc || locationService.getDefaultLocation();
    try {
      const userPos = await locationService.getCurrentLocation();
      if (userPos && typeof userPos.latitude === 'number') {
        freshLoc = userPos;
      }
    } catch (err) {
      // Fallback
    }
    setUserLocation(freshLoc);

    const locChanged = locationService.hasLocationChanged(freshLoc, cachedLoc, 0.5);

    if (!locChanged && cachedFacs && cachedFacs.length > 0 && !query && facilityType === 'ALL' && !emergencyOnly) {
      console.log('⚡ FindCarePage serving cached facilities (location delta < 0.5km).');
      setLoading(false);
      return;
    }

    locationService.saveCachedLocation(freshLoc);

    try {
      const endpoint = `${API_BASE}/care-network/facilities?query=${encodeURIComponent(query)}&facilityType=${facilityType}&emergency=${emergencyOnly}&lat=${freshLoc.latitude}&lng=${freshLoc.longitude}&city=${encodeURIComponent(freshLoc.city || 'Jalpaiguri')}`;
      const res = await axios.get(endpoint);
      if (res.data && res.data.facilities) {
        const hospitalOnlyFacilities = res.data.facilities.filter(f => {
          const fType = (f.facilityType || '').toUpperCase();
          const n = (f.name || '').toLowerCase();
          const dist = f.distanceKm !== undefined ? f.distanceKm : 0;
          return (
            fType !== 'DIAGNOSTIC_CENTER' &&
            fType !== 'DIAGNOSTIC_CENTRE' &&
            fType !== 'PATHOLOGY_LAB' &&
            fType !== 'IMAGING_CENTER' &&
            !n.includes('diagnostic') &&
            !n.includes('pathology lab') &&
            !n.includes('scan center') &&
            !n.includes('imaging hub') &&
            dist <= 100
          );
        });

        const ranked = careRecommendationService.rankFacilities({
          facilities: hospitalOnlyFacilities,
          userLocation: freshLoc,
          requiredService: query,
          isEmergency: emergencyOnly
        });
        setFacilities(ranked);
        if (!query && facilityType === 'ALL' && !emergencyOnly) {
          locationService.saveCachedFacilities(ranked, freshLoc, 'findcare');
        }
        if (ranked.length > 0) {
          handleSelectFacility(ranked[0], freshLoc);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
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
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-cyan-50/90 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700 shadow-md p-6 sm:p-8 rounded-3xl space-y-4 text-slate-900 dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span>FIND PUBLIC HEALTHCARE</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Search suitable PHCs, CHCs, Rural Hospitals, ECG, X-Ray & Emergency Centers in <strong>{userLocation?.city || 'Jalpaiguri'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-blue-900 dark:text-slate-300 px-3 py-1 bg-blue-100/80 dark:bg-slate-700/50 rounded-full border border-blue-200 dark:border-slate-600">
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

              <MapController center={userLocation} facilities={facilities} />

              {/* User Location Marker */}
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={mapService.getUserLocationIcon()}
              >
                <Popup>📍 You Are Here</Popup>
              </Marker>

              {/* Facility Markers */}
              {facilities.map(f => {
                const isVerified = f.isMediTrackVerified !== false && f.canSelect !== false;
                return (
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
                        <div className="flex items-center gap-1 mb-1">
                          {isVerified ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                              ✓ MediTrack Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                              ⚠️ Unverified / Not on MediTrack
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900">{f.name}</p>
                        <p className="text-slate-500">{f.facilityType} • {f.distanceKm} km</p>
                        {isVerified ? (
                          <button
                            onClick={() => navigate('/care-network/appointments', {
                              state: {
                                facilityId: f.facilityId || f._id,
                                facilityName: f.name,
                                city: f.city || userLocation?.city || 'Jalpaiguri'
                              }
                            })}
                            className="mt-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[10px] w-full"
                          >
                            View & Book
                          </button>
                        ) : (
                          <div className="mt-1 text-[9px] text-slate-500 bg-slate-100 p-1 rounded">
                            Visit offline. Online booking disabled.
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

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
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> MediTrack Verified</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span> Unverified Locality</span>
          </div>
        </div>

        {/* RANKED FACILITIES LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Locality Facilities ({facilities.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Verified & Locality Hospitals</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {facilities.map((f, index) => {
              const isSelected = selectedFacility?.facilityId === f.facilityId;
              const isClosest = f.isNearest || index === 0;
              const isVerified = f.isMediTrackVerified !== false && f.canSelect !== false;

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
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isClosest && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase shadow-sm">
                        <MapPin className="w-3 h-3" />
                        <span>📍 NEAREST ({f.distanceKm} KM)</span>
                      </span>
                    )}

                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase border border-teal-300 dark:border-teal-700">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        <span>MediTrack Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase border border-amber-300 dark:border-amber-700">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                        <span>Unverified / Not on MediTrack</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                        {f.facilityType ? f.facilityType.replace('_', ' ') : 'HOSPITAL'}
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

                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    {isVerified 
                      ? `💡 ${f.recommendationReason || 'Verified MediTrack Partner Facility with online queue & booking'}` 
                      : 'ℹ️ Physical locality hospital. Visible for offline visits. Online MediTrack booking is disabled until hospital registers.'}
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

                    {isVerified ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/care-network/appointments', {
                            state: {
                              facilityId: f.facilityId || f._id,
                              facilityName: f.name,
                              city: f.city || userLocation?.city || 'Jalpaiguri'
                            }
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                      >
                        <span>Book / Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold rounded-lg text-xs flex items-center gap-1 cursor-not-allowed"
                        title="Unverified facility: Booking disabled"
                      >
                        <span>Offline Visit Only</span>
                      </button>
                    )}
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
