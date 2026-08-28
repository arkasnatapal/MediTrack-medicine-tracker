// Map Service providing Leaflet custom icon definitions and external navigation links
import L from 'leaflet';

export const mapService = {
  // Custom Icon Makers
  getUserLocationIcon: () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <div class="relative w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
            👤
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  },

  getFacilityIcon: (facilityType = 'PHC', isEmergency = false) => {
    const bg = isEmergency ? 'bg-rose-600' : facilityType === 'DISTRICT_HOSPITAL' ? 'bg-purple-600' : 'bg-emerald-600';
    const symbol = isEmergency ? '🚑' : '🏥';

    return L.divIcon({
      className: 'custom-facility-marker',
      html: `
        <div class="relative flex items-center justify-center w-9 h-9">
          <div class="${bg} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">
            ${symbol}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  },

  // Open external Google Maps navigation for exact location pin & driving directions
  openExternalNavigation: (lat, lng, name = 'Diagnostic Center') => {
    const url = `https://www.google.com/maps?q=${lat},${lng}+(${encodeURIComponent(name)})`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
