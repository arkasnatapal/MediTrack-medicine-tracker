const axios = require('axios');
const Emergency = require('./emergency.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mock Doctor Data for MVP
const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. John Smith', department: 'Cardiology', status: 'available' },
  { id: 2, name: 'Dr. Sarah Johnson', department: 'Trauma', status: 'available' },
  { id: 3, name: 'Dr. Emily Davis', department: 'Pulmonology', status: 'available' },
  { id: 4, name: 'Dr. Michael Wilson', department: 'Gynecology', status: 'available' },
  { id: 5, name: 'Dr. Robert Brown', department: 'Neurology', status: 'available' },
  { id: 6, name: 'Dr. Linda Taylor', department: 'Emergency', status: 'available' }
];

const DEPARTMENT_MAP = {
  chest_pain: 'Cardiology',
  accident: 'Trauma',
  breathing: 'Pulmonology',
  pregnancy: 'Gynecology',
  seizure: 'Neurology',
  default: 'Emergency'
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

exports.getAIRecommendation = async (problemDescription, userLocation, hospitals, userId) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Provide more context to the AI
        const hospitalList = hospitals
            .slice(0, 10) // Give top 10 to give AI some choice
            .map(h => JSON.stringify({ name: h.name, distance: h.distance.toFixed(2) + " km", id: h.id }))
            .join('\n');

        const prompt = `
You are an expert medical triage AI assistant.
User Location: Lat ${userLocation.latitude}, Lon ${userLocation.longitude}
User Problem: "${problemDescription}"

Available Hospitals (sorted by distance):
${hospitalList}

Task:
1. Analyze the user's problem.
2. Select 3 distinct hospitals from the list above:
    - **best**: The most suitable hospital for the specific problem (e.g., Eye hospital for eye issues, Trauma center for accidents). If no specific match, pick the highest quality general hospital nearby.
    - **closest**: The physically nearest hospital (usually the first one, but verify its suitability).
    - **alternative**: A good backup option (maybe a bit further but good).
3. Provide a brief reason for each.
4. Provide 3-5 critical First Aid steps or immediate actions the user should take while waiting or traveling.

Output strictly in this JSON format (no markdown, just raw JSON):
{
  "best": { "name": "Exact Name", "reason": "Why this is best", "distance": "distance string" },
  "closest": { "name": "Exact Name", "reason": "Why this is closest", "distance": "distance string" },
  "alternative": { "name": "Exact Name", "reason": "Why this is a good alternative", "distance": "distance string" },
  "first_aid": [
    "Step 1: Do this...",
    "Step 2: Don't do this...",
    "Step 3: ..."
  ]
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim(); // Clean potential markdown

        let recommendationData;
        try {
            recommendationData = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse AI JSON:", text);
            // Fallback if JSON fails
            recommendationData = {
                best: { name: hospitals[0]?.name, reason: "Closest available option (AI parse error)", distance: hospitals[0]?.distance },
                closest: { name: hospitals[0]?.name, reason: "Nearest facility", distance: hospitals[0]?.distance },
                alternative: { name: hospitals[1]?.name || hospitals[0]?.name, reason: "Alternative option", distance: hospitals[1]?.distance },
                first_aid: ["Stay calm", "Call emergency services if critical", "Move to a safe location"]
            };
        }

        // SAVE HISTORY TO DB
        if (userId) {
             const newEmergency = new Emergency({
                 userId,
                 latitude: userLocation.latitude,
                 longitude: userLocation.longitude,
                 emergencyType: 'default', 
                 description: problemDescription,
                 aiAnalysis: recommendationData,
                 assignedHospital: recommendationData.best,
                 status: 'completed'
             });
             await newEmergency.save();
        }

        return recommendationData;

    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error("AI Assistant unavailable");
    }
};

exports.getEmergencyHistory = async (userId) => {
    return await Emergency.find({ userId }).sort({ createdAt: -1 });
};

exports.triggerEmergency = async (userId, data) => {
  // Keeping this for legacy compatibility or if we decide to log AI requests later
  // For the new requirement, we might not strictly need this if we don't save to DB.
  // But let's leave it as is to avoid breaking anything else that might rely on it.
  const { latitude, longitude, emergencyType } = data;
  
  const requiredDept = DEPARTMENT_MAP[emergencyType] || 'Emergency';
  const doctor = MOCK_DOCTORS.find(d => d.department === requiredDept && d.status === 'available') 
                 || MOCK_DOCTORS.find(d => d.department === 'Emergency');

  const emergency = new Emergency({
    userId,
    latitude,
    longitude,
    emergencyType,
    assignedDoctor: doctor,
    status: 'assigned' 
  });

  await emergency.save();
  return emergency;
};

exports.fetchNearbyHospitals = async (lat, lon, radius = 25000) => {
  let registeredFacilities = [];
  const mongoose = require('mongoose');

  // 1. Fetch MediTrack Registered Facilities from MongoDB
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const rawFacs = await mongoose.connection.collection('facilities').find({}).toArray();
      registeredFacilities = rawFacs.map(fac => {
        const hLat = parseFloat(fac.latitude) || lat;
        const hLon = parseFloat(fac.longitude) || lon;
        const dist = getDistance(lat, lon, hLat, hLon);
        return {
          id: fac._id.toString(),
          _id: fac._id.toString(),
          name: fac.name,
          latitude: hLat,
          longitude: hLon,
          distance: dist,
          isMediTrackVerified: true,
          verificationStatus: fac.verificationStatus || 'VERIFIED',
          canSelect: true,
          badgeText: 'MediTrack Verified',
          address: fac.address || 'MediTrack Healthcare Network',
          phone: fac.phone || '+91 108',
          operatingHours: fac.operatingHours || '24/7 OPD & Emergency'
        };
      });
    }
  } catch (err) {
    console.warn('Could not query MongoDB facilities collection:', err.message);
  }

  // 2. Query Overpass API for all locality hospitals in the area
  let osmHospitals = [];
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      way["amenity"="hospital"](around:${radius},${lat},${lon});
      relation["amenity"="hospital"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: {
        'User-Agent': 'MediTrack-Emergency-Service/1.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000
    });

    if (response.data && response.data.elements) {
      osmHospitals = response.data.elements.map(el => {
        const hLat = el.lat || (el.center && el.center.lat) || lat;
        const hLon = el.lon || (el.center && el.center.lon) || lon;
        const rawName = el.tags?.name || 'Local Public Hospital / Clinic';
        const dist = getDistance(lat, lon, hLat, hLon);

        // Check if matched with registered MongoDB facility
        const matched = registeredFacilities.find(rf => 
          rf.name.toLowerCase().includes(rawName.toLowerCase()) || 
          rawName.toLowerCase().includes(rf.name.toLowerCase()) ||
          getDistance(rf.latitude, rf.longitude, hLat, hLon) < 0.3
        );

        if (matched) {
          return null; // Skip duplicate since registered facility is already present
        }

        return {
          id: `OSM-${el.id}`,
          name: rawName,
          latitude: hLat,
          longitude: hLon,
          distance: dist,
          isMediTrackVerified: false,
          verificationStatus: 'UNVERIFIED',
          canSelect: false,
          badgeText: 'Unverified / Not on MediTrack',
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || `Locality Facility (${dist.toFixed(1)} km)`,
          phone: el.tags?.phone || 'Offline Visit Only',
          operatingHours: 'Public Locality Hospital'
        };
      }).filter(Boolean);
    }
  } catch (error) {
    console.warn('Overpass API Error in emergency service:', error.message);
  }

  // Combine registered verified facilities and OSM unverified locality hospitals
  const combined = [...registeredFacilities, ...osmHospitals];
  return combined.sort((a, b) => a.distance - b.distance);
};

exports.assignDoctor = async (emergencyId) => {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) throw new Error('Emergency not found');
  
  if (emergency.assignedDoctor) return emergency;

  const requiredDept = DEPARTMENT_MAP[emergency.emergencyType] || 'Emergency';
  const doctor = MOCK_DOCTORS.find(d => d.department === requiredDept && d.status === 'available');

  emergency.assignedDoctor = doctor;
  emergency.status = 'assigned';
  await emergency.save();
  return emergency;
};

exports.deleteEmergency = async (emergencyId, userId) => {
    return await Emergency.findOneAndDelete({ _id: emergencyId, userId });
};
