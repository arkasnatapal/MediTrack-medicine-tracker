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

exports.getAIRecommendation = async (problemDescription, userLocation, hospitals) => {
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

        return recommendationData;

    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error("AI Assistant unavailable");
    }
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

exports.fetchNearbyHospitals = async (lat, lon, radius = 5000) => {
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
    const response = await axios.post('https://overpass-api.de/api/interpreter', query);
    const hospitals = response.data.elements.map(el => {
        const hLat = el.lat || el.center.lat;
        const hLon = el.lon || el.center.lon;
        return {
          id: el.id,
          name: el.tags.name || 'Unknown Hospital',
          latitude: hLat,
          longitude: hLon,
          distance: getDistance(lat, lon, hLat, hLon)
        };
    });

    return hospitals.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Overpass API Error:', error.message);
    return []; 
  }
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
