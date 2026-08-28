// Replaceable OSRM Routing Service with fallback distance matrix

export const routingService = {
  // Fetch driving route geometry and travel stats from OSRM public routing server
  getRoute: async (origin, destination) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('OSRM API HTTP error');

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(route.duration / 60);

        // Convert GeoJSON coordinates [lon, lat] to Leaflet format [lat, lon]
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        return {
          success: true,
          provider: 'OSRM (Open Source Routing Machine)',
          distanceKm,
          durationMinutes,
          coordinates,
          isApproximate: false
        };
      }
    } catch (err) {
      console.warn('OSRM routing request failed, using geographic estimation:', err.message);
    }

    // Fallback Geographic Approximation
    const dist = routingService.calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    return {
      success: true,
      provider: 'APPROXIMATE GEOGRAPHIC ESTIMATION',
      distanceKm: dist,
      durationMinutes: Math.round(dist * 2.5),
      coordinates: [
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude]
      ],
      isApproximate: true
    };
  },

  calculateHaversineDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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
