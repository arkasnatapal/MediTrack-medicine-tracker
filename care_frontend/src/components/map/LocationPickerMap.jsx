import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Search, CheckCircle2, Building2, Sparkles, LocateFixed, RefreshCw, ChevronRight, Compass, ShieldAlert, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

const CARE_BACKEND_API = import.meta.env.VITE_CARE_API_URL || import.meta.env.VITE_CARE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api' : '/api');
const MAIN_BACKEND_API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : 'https://meditrack-backendalpha.vercel.app/api');

// Create Circular Marker Icons matching Client Map (Image 1 / Screenshot)
const createCustomDivIcon = (type, isVerified = false, isEmergency = false) => {
  if (type === 'USER_PIN') {
    return L.divIcon({
      className: 'custom-user-pin-marker',
      html: `
        <div class="relative flex items-center justify-center w-9 h-9">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <div class="relative w-8 h-8 bg-blue-600 text-white rounded-full border-2 border-white shadow-xl flex items-center justify-center text-xs font-bold">
            👤
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  }

  // Facility Red Circular Markers matching Screenshot
  const bgClass = isVerified ? 'bg-emerald-600' : 'bg-rose-600';
  const symbol = isEmergency ? '🚑' : '🏥';

  return L.divIcon({
    className: 'custom-facility-marker',
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 transition-transform hover:scale-125">
        <div class="${bgClass} w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export default function LocationPickerMap({ latitude, longitude, onLocationSelect, onHospitalSelect }) {
  const defaultLat = parseFloat(latitude) || 26.54;
  const defaultLng = parseFloat(longitude) || 88.71;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const localityLayerGroupRef = useRef(null);

  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityType, setFacilityType] = useState('ALL');
  const [currentCity, setCurrentCity] = useState('Jalpaiguri');
  const [searching, setSearching] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [selectedHospitalName, setSelectedHospitalName] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('');
  const [localityHospitals, setLocalityHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // 1. Initialize Leaflet Map with Satellite View tile matching Screenshot
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 11,
      scrollWheelZoom: true
    });

    // Base Layer 1: Satellite View matching Screenshot
    const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Base Layer 2: Standard OpenStreetMap
    const streetTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    satelliteTiles.addTo(map);

    L.control.layers({
      "Satellite View": satelliteTiles,
      "Street View": streetTiles
    }, null, { position: 'topright' }).addTo(map);

    const localityGroup = L.layerGroup().addTo(map);
    localityLayerGroupRef.current = localityGroup;

    // Selected Pin Marker
    const mainMarker = L.marker([defaultLat, defaultLng], {
      icon: createCustomDivIcon('USER_PIN'),
      draggable: true
    }).addTo(map);

    mainMarker.bindPopup(`
      <div style="font-size: 12px; font-weight: 600; color: #0f172a; padding: 2px;">
        👤 <strong>You Are Here</strong><br/>
        <span style="font-size: 10px; color: #0d9488;">Click any hospital marker to select & auto-fill details</span>
      </div>
    `);

    mainMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updatePinLocation(pos.lat, pos.lng, map, mainMarker);
    });

    map.on('click', (e) => {
      updatePinLocation(e.latlng.lat, e.latlng.lng, map, mainMarker);
    });

    mapInstanceRef.current = map;
    selectedMarkerRef.current = mainMarker;

    fetchAndRenderLocalityHospitals(defaultLat, defaultLng, facilityType, searchQuery, map, localityGroup);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const fetchAndRenderLocalityHospitals = async (
    lat = position[0],
    lng = position[1],
    fType = facilityType,
    q = searchQuery,
    mapObj = mapInstanceRef.current,
    groupObj = localityLayerGroupRef.current
  ) => {
    setLoadingHospitals(true);

    // Helper for 0.5km spatial threshold
    const calcDist = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    };

    // Check device local storage cache
    try {
      const rawCache = localStorage.getItem('meditrack_care_picker_cache');
      if (rawCache) {
        const cacheObj = JSON.parse(rawCache);
        if (
          cacheObj &&
          Array.isArray(cacheObj.facilities) &&
          cacheObj.facilities.length > 0 &&
          cacheObj.fType === fType &&
          cacheObj.q === q &&
          calcDist(lat, lng, cacheObj.lat, cacheObj.lng) <= 0.5
        ) {
          console.log('⚡ LocationPickerMap serving cached locality hospitals (delta < 0.5km).');
          setLocalityHospitals(cacheObj.facilities);
          if (groupObj) {
            renderHospitalMarkers(cacheObj.facilities, groupObj);
          }
          setLoadingHospitals(false);
          return;
        }
      }
    } catch (cacheErr) {
      console.warn('LocationPickerMap cache read error:', cacheErr);
    }

    try {
      let facilitiesList = [];
      const queryParams = `lat=${lat}&lng=${lng}&city=${encodeURIComponent(currentCity)}&facilityType=${encodeURIComponent(fType)}&query=${encodeURIComponent(q)}`;

      try {
        const res = await axios.get(`${CARE_BACKEND_API}/facilities?${queryParams}`);
        if (res.data) {
          facilitiesList = Array.isArray(res.data) ? res.data : (res.data.facilities || []);
        }
      } catch (e1) {
        console.warn('Care Backend fetch fallback to Main Backend:', e1.message);
        const res2 = await axios.get(`${MAIN_BACKEND_API}/care-network/facilities?${queryParams}`);
        if (res2.data && res2.data.facilities) {
          facilitiesList = res2.data.facilities;
        }
      }

      setLocalityHospitals(facilitiesList);
      if (groupObj) {
        renderHospitalMarkers(facilitiesList, groupObj);
      }

      if (facilitiesList.length > 0) {
        localStorage.setItem(
          'meditrack_care_picker_cache',
          JSON.stringify({ lat, lng, fType, q, facilities: facilitiesList, timestamp: Date.now() })
        );
      }
    } catch (e) {
      console.warn('Error fetching nearby facilities for registration map:', e.message);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const renderHospitalMarkers = (facs, groupObj) => {
    if (!groupObj) return;
    groupObj.clearLayers();

    facs.forEach((fac) => {
      const fLat = parseFloat(fac.latitude);
      const fLng = parseFloat(fac.longitude);
      if (isNaN(fLat) || isNaN(fLng)) return;

      const isVer = fac.isMediTrackVerified;
      const marker = L.marker([fLat, fLng], {
        icon: createCustomDivIcon('FACILITY', isVer, fac.emergencyAvailable)
      });

      const popupDiv = document.createElement('div');
      popupDiv.style.padding = '6px';
      popupDiv.style.maxWidth = '230px';
      popupDiv.innerHTML = `
        <div style="margin-bottom: 4px;">
          ${isVer ? 
            '<span style="font-size: 10px; background: #d1fae5; color: #065f46; font-weight: bold; padding: 2px 6px; border-radius: 4px;">✓ MEDITRACK VERIFIED</span>' : 
            '<span style="font-size: 10px; background: #ffedd5; color: #9a3412; font-weight: bold; padding: 2px 6px; border-radius: 4px;">⚠️ UNVERIFIED / NOT ON MEDITRACK</span>'
          }
        </div>
        <strong style="font-size: 13px; color: #0f172a; display: block; line-height: 1.3;">${fac.name}</strong>
        <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">📍 ${fac.address || fac.district || ''}</span>
        <span style="font-size: 10px; color: #0d9488; font-weight: bold; display: block; margin-top: 2px;">Distance: ${fac.distanceKm || '0.5'} km (~${fac.estimatedTravelTimeMinutes || 10} mins drive)</span>
        <button id="btn-select-fac-${fac.facilityId || fac._id || Math.random().toString(36).substr(2, 6)}" style="margin-top: 8px; width: 100%; padding: 7px; background: #2563eb; color: white; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          🎯 Select & Auto-Fill Form
        </button>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const btn = popupDiv.querySelector(`button`);
        if (btn) {
          btn.onclick = () => {
            handleHospitalSelectFromMarker(fac);
            marker.closePopup();
          };
        }
      });

      groupObj.addLayer(marker);
    });
  };

  const handleHospitalSelectFromMarker = (fac) => {
    const fLat = parseFloat(fac.latitude);
    const fLng = parseFloat(fac.longitude);

    setSelectedHospitalName(fac.name);
    setDetectedAddress(fac.address || fac.name);
    updatePinLocation(fLat, fLng);

    if (onHospitalSelect) {
      onHospitalSelect({
        name: fac.name,
        facilityType: fac.facilityType || 'DISTRICT_HOSPITAL',
        address: fac.address || `${fac.name}, ${fac.district || currentCity}`,
        district: fac.district || currentCity,
        state: fac.state || 'West Bengal',
        latitude: fLat.toString(),
        longitude: fLng.toString(),
        phone: fac.phone || '03561-220101'
      });
    }
  };

  const updatePinLocation = async (lat, lng, mapObj = mapInstanceRef.current, markerObj = selectedMarkerRef.current) => {
    const newLat = parseFloat(lat.toFixed(6));
    const newLng = parseFloat(lng.toFixed(6));

    setPosition([newLat, newLng]);

    if (markerObj) {
      markerObj.setLatLng([newLat, newLng]);
    }
    if (mapObj) {
      mapObj.flyTo([newLat, newLng], 12, { animate: true });
    }

    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`);
      if (res.data && res.data.display_name) {
        setDetectedAddress(res.data.display_name);
        const cityDetected = res.data.address?.city || res.data.address?.town || res.data.address?.county || res.data.address?.district || currentCity;
        setCurrentCity(cityDetected);

        if (markerObj) {
          markerObj.setPopupContent(`
            <div style="font-size: 12px; font-weight: 600; color: #0f172a;">
              📍 <strong>Selected Position</strong><br/>
              <span style="font-size: 10px; color: #0d9488; display: block; margin-top: 2px;">${res.data.display_name}</span>
            </div>
          `);
        }
        if (onLocationSelect) onLocationSelect(newLat, newLng, res.data.display_name);
      } else {
        if (onLocationSelect) onLocationSelect(newLat, newLng);
      }
    } catch (e) {
      if (onLocationSelect) onLocationSelect(newLat, newLng);
    }
  };

  useEffect(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      if (latNum !== 0 && lngNum !== 0 && (latNum !== position[0] || lngNum !== position[1])) {
        setPosition([latNum, lngNum]);
        if (selectedMarkerRef.current) {
          selectedMarkerRef.current.setLatLng([latNum, lngNum]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latNum, lngNum], 12);
        }
      }
    }
  }, [latitude, longitude]);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      if (searchQuery.trim()) {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
        if (res.data && res.data.length > 0) {
          const place = res.data[0];
          const pLat = parseFloat(place.lat);
          const pLng = parseFloat(place.lon);
          updatePinLocation(pLat, pLng);
          await fetchAndRenderLocalityHospitals(pLat, pLng, facilityType, searchQuery);
        } else {
          await fetchAndRenderLocalityHospitals(position[0], position[1], facilityType, searchQuery);
        }
      } else {
        await fetchAndRenderLocalityHospitals(position[0], position[1], facilityType, searchQuery);
      }
    } catch (err) {
      console.error('Search location error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleFacilityTypeChange = (e) => {
    const val = e.target.value;
    setFacilityType(val);
    fetchAndRenderLocalityHospitals(position[0], position[1], val, searchQuery);
  };

  const handleDetectGPS = () => {
    setFetchingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setFetchingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gLat = pos.coords.latitude;
        const gLng = pos.coords.longitude;
        updatePinLocation(gLat, gLng);
        fetchAndRenderLocalityHospitals(gLat, gLng, facilityType, searchQuery);
        setFetchingLocation(false);
      },
      async (err) => {
        // Fallback to IP Geolocation
        try {
          const ipRes = await axios.get('https://ipapi.co/json/');
          if (ipRes.data && ipRes.data.latitude && ipRes.data.longitude) {
            const ipLat = ipRes.data.latitude;
            const ipLng = ipRes.data.longitude;
            updatePinLocation(ipLat, ipLng);
            fetchAndRenderLocalityHospitals(ipLat, ipLng, facilityType, searchQuery);
          } else {
            alert('Could not detect GPS location: ' + err.message);
          }
        } catch (ipErr) {
          alert('Could not detect location via GPS or IP');
        } finally {
          setFetchingLocation(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openDirections = (lat, lng, name) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}+(${encodeURIComponent(name)})`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* HEADER & SEARCH BAR MATCHING SCREENSHOT */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Search className="w-7 h-7 text-blue-500" />
              <span>FIND PUBLIC HEALTHCARE</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Search suitable PHCs, CHCs, Rural Hospitals, ECG, X-Ray & Emergency Centers in <strong className="text-teal-300">{currentCity}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              📍 Location: {currentCity} (GPS Active)
            </span>

            {/* FETCH LOCATION GPS BUTTON */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={fetchingLocation}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              {fetchingLocation ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Fetching GPS...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-4 h-4 text-white" />
                  <span>FETCH CURRENT LOCATION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SEARCH & FACILITY FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit(e);
                }
              }}
              placeholder="Search by facility name, service (e.g. ECG, X-Ray, Blood Test), specialty or district..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 text-white shadow-inner"
            />
          </div>

          {/* FACILITY TYPE DROPDOWN */}
          <select
            value={facilityType}
            onChange={handleFacilityTypeChange}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none cursor-pointer border-slate-700 hover:border-blue-500 transition"
          >
            <option value="ALL">All Facility Types</option>
            <option value="PHC">Primary Health Centre (PHC)</option>
            <option value="CHC">Community Health Centre (CHC)</option>
            <option value="RURAL_HOSPITAL">Rural Hospital</option>
            <option value="DISTRICT_HOSPITAL">District Hospital</option>
          </select>

          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={searching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{searching ? 'Searching...' : 'Find Suitable Care'}</span>
          </button>
        </div>
      </div>

      {/* MAP & RANKED LIST SPLIT VIEW MATCHING SCREENSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LEAFLET SATELLITE MAP CONTAINER */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden h-[540px] relative">
          <div
            ref={mapContainerRef}
            className="h-full w-full relative z-0"
          />

          {/* MAP LEGEND OVERLAY MATCHING SCREENSHOT */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl text-[10px] font-bold text-slate-200 border border-slate-800 flex items-center gap-4 shadow-xl">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block shadow"></span> User
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block shadow"></span> MediTrack Verified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-full inline-block shadow"></span> Unverified Locality
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: RANKED HOSPITAL CARDS LIST MATCHING SCREENSHOT */}
        <div className="lg:col-span-5 space-y-3 h-[540px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1 mb-1">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Verified & Locality Hospitals</span>
            </h3>
            <span className="text-xs font-bold text-teal-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              {localityHospitals.length} Found
            </span>
          </div>

          {loadingHospitals ? (
            <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
              Fetching hospitals in {currentCity}...
            </div>
          ) : localityHospitals.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 text-xs">
              No hospitals found matching your search. Try searching another town or city.
            </div>
          ) : (
            localityHospitals.map((fac, idx) => {
              const isVer = fac.isMediTrackVerified;
              const isSelected = selectedHospitalName === fac.name;

              return (
                <div
                  key={fac.facilityId || fac._id || idx}
                  className={`p-4 rounded-3xl border transition-all shadow-md space-y-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* CARD HEADER: BADGE & DISTANCE ETA MATCHING SCREENSHOT */}
                  <div className="flex items-center justify-between gap-2">
                    {isVer ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black tracking-wider uppercase">
                        ✓ MEDITRACK VERIFIED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black tracking-wider uppercase">
                        ⚠️ UNVERIFIED / NOT ON MEDITRACK
                      </span>
                    )}

                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-400 block">
                        {fac.distanceKm ? `${fac.distanceKm} km` : 'Near'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        ~{fac.estimatedTravelTimeMinutes || Math.round((fac.distanceKm || 2) * 2.5)} mins drive
                      </span>
                    </div>
                  </div>

                  {/* HOSPITAL NAME & TYPE BADGE */}
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase mb-1 inline-block">
                      {fac.facilityType || 'HOSPITAL'}
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {fac.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{fac.address || `${fac.name}, ${currentCity}`}</span>
                    </p>
                  </div>

                  {/* PHYSICAL LOCALITY CALLOUT NOTE MATCHING SCREENSHOT */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 font-bold">ℹ</span>
                    <span>Physical locality hospital. Visible for offline visits. Select to auto-fill registration details.</span>
                  </div>

                  {/* ACTION BUTTONS: SELECT & AUTO-FILL FORM + DIRECTIONS MATCHING SCREENSHOT */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleHospitalSelectFromMarker(fac)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSelected ? '✓ Selected' : '🎯 Select & Auto-Fill Form'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDirections(fac.latitude, fac.longitude, fac.name)}
                      className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

