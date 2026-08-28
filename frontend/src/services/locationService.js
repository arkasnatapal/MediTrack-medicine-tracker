// Pan-India & Global Location Service with Geolocation API + IP-based fallback

export const locationService = {
  // Request current position from browser
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return locationService.getIPLocation().then(resolve).catch(reject);
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let city = 'Jalpaiguri';
          let region = 'West Bengal';

          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData && geoData.address) {
                city = geoData.address.city || geoData.address.town || geoData.address.suburb || geoData.address.county || geoData.address.district || 'Jalpaiguri';
                region = geoData.address.state || 'West Bengal';
              }
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding warning:', geoErr);
          }

          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
            city,
            region,
            timestamp: position.timestamp,
            isManual: false
          });
        },
        async (error) => {
          // If browser GPS permission denied/unavailable, try IP-based city location detection
          try {
            const ipLoc = await locationService.getIPLocation();
            resolve(ipLoc);
          } catch (ipErr) {
            reject({
              code: error.code,
              message: 'Location permission denied. Please search your city manually.'
            });
          }
        },
        options
      );
    });
  },

  // IP-based Geolocation fallback (Detects user city e.g. Jalpaiguri, Kolkata, Delhi, Amritsar, Chennai, etc.)
  getIPLocation: async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data && data.latitude && data.longitude) {
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || 'Detected City',
            region: data.region || 'Detected Region',
            country: data.country_name || 'India',
            isIPLocation: true,
            isManual: false
          };
        }
      }
    } catch (err) {
      console.warn('IP location fallback unavailable:', err.message);
    }

    // Default neutral center if completely unreachable
    return {
      latitude: 26.5400, // Jalpaiguri / North Bengal Coordinates as default
      longitude: 88.7100,
      city: 'Jalpaiguri',
      region: 'West Bengal',
      isManual: true
    };
  },

  getDefaultLocation: () => {
    return {
      latitude: 26.5400,
      longitude: 88.7100,
      city: 'Jalpaiguri',
      isManual: true
    };
  },

  // Calculate straight-line geographic distance in km
  calculateDistanceKm: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
};
