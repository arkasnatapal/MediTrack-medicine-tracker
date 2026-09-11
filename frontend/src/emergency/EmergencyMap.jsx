import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const verifiedHospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [28, 45],
    iconAnchor: [14, 45],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const unverifiedHospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [22, 36],
    iconAnchor: [11, 36],
    popupAnchor: [1, -30],
    shadowSize: [36, 36]
});

const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) {
            map.flyTo([lat, lon], 14);
        }
    }, [lat, lon, map]);
    return null;
};

const Routing = ({ userLocation, destination }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !destination) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.latitude, userLocation.longitude),
        L.latLng(destination.latitude, destination.longitude)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: function() { return null; }, // Hide default markers, we have our own
      lineOptions: {
          styles: [{ color: '#3b82f6', weight: 6, opacity: 0.7 }]
      }
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, userLocation, destination]);

  return null;
};

const EmergencyMap = ({ userLocation, hospitals, selectedHospital, onHospitalClick }) => {
    const defaultCenter = [26.54, 88.71]; // Default fallback
    const center = userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter;

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
             <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street View">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite View">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>
            
            {userLocation && (
                <>
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>
                            <strong>📍 You are here</strong>
                        </Popup>
                    </Marker>
                    {!selectedHospital && (
                         <RecenterMap lat={userLocation.latitude} lon={userLocation.longitude} />
                    )}
                </>
            )}

            {hospitals.map((hospital) => {
                const isVerified = hospital.isMediTrackVerified !== false && hospital.canSelect !== false;
                const markerIcon = isVerified ? verifiedHospitalIcon : unverifiedHospitalIcon;

                return (
                    <Marker 
                        key={hospital.id} 
                        position={[hospital.latitude, hospital.longitude]} 
                        icon={markerIcon}
                        opacity={selectedHospital && selectedHospital.id === hospital.id ? 1 : (isVerified ? 0.9 : 0.6)}
                        eventHandlers={{
                            click: () => isVerified && onHospitalClick && onHospitalClick(hospital),
                        }}
                    >
                        <Popup>
                            <div className="p-1 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {isVerified ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                                            ✓ MediTrack Verified
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                                            ⚠️ Unverified / Not on MediTrack
                                        </span>
                                    )}
                                </div>
                                <strong className="text-slate-900 block text-sm">{hospital.name}</strong>
                                {selectedHospital && selectedHospital.id === hospital.id && (
                                    <span className="text-blue-600 font-bold block text-[11px]">🎯 Target Destination</span>
                                )}
                                <p className="text-slate-500">Distance: {hospital.distance ? hospital.distance.toFixed(2) : '3.5'} km</p>
                                
                                {isVerified ? (
                                    <button 
                                        className="mt-2 w-full px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow"
                                        onClick={() => onHospitalClick && onHospitalClick(hospital)}
                                    >
                                        View Details & Book
                                    </button>
                                ) : (
                                    <div className="mt-2 text-[10px] text-slate-500 bg-amber-50 p-1.5 rounded border border-amber-200">
                                        ℹ️ Physical locality hospital. Not registered on MediTrack — online selection disabled. Visit offline.
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {selectedHospital && userLocation && (
                <Routing key={selectedHospital.id} userLocation={userLocation} destination={selectedHospital} />
            )}
        </MapContainer>
    );
};


export default EmergencyMap;
