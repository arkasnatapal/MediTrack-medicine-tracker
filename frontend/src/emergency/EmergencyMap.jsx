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

const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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

const MapBackgroundClick = ({ onMapClick }) => {
  useMapEvents({
      click: (e) => {
           // We could handle background clicks here if needed to deselect
      },
  });
  return null;
};

const EmergencyMap = ({ userLocation, hospitals, selectedHospital, onHospitalClick }) => {
    const defaultCenter = [51.505, -0.09]; // Default fallback
    const center = userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter;

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
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
                            You are here
                        </Popup>
                    </Marker>
                    {/* Only re-center if NO hospital is selected, to avoid fighting with routing */}
                    {!selectedHospital && (
                         <RecenterMap lat={userLocation.latitude} lon={userLocation.longitude} />
                    )}
                </>
            )}

            {hospitals.map((hospital) => (
                <Marker 
                    key={hospital.id} 
                    position={[hospital.latitude, hospital.longitude]} 
                    icon={hospitalIcon}
                    opacity={selectedHospital && selectedHospital.id === hospital.id ? 1 : 0.7}
                    eventHandlers={{
                        click: () => onHospitalClick && onHospitalClick(hospital),
                    }}
                >
                    <Popup>
                        <strong>{hospital.name}</strong> <br />
                        {selectedHospital && selectedHospital.id === hospital.id && <span className="text-green-500 font-bold">Target Destination</span>} <br/>
                        Distance: {hospital.distance.toFixed(2)} km <br/>
                        <button 
                            className="mt-2 text-blue-600 underline text-sm"
                            onClick={() => onHospitalClick && onHospitalClick(hospital)}
                        >
                            View Details
                        </button>
                    </Popup>
                </Marker>
            ))}

            {selectedHospital && userLocation && (
                <Routing key={selectedHospital.id} userLocation={userLocation} destination={selectedHospital} />
            )}
        </MapContainer>
    );
};


export default EmergencyMap;
