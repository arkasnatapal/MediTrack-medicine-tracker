const { GoogleGenerativeAI } = require('@google/generative-ai');
const HospitalDetail = require('./hospital-detail.model');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.5-flash";

exports.getHospitalDetails = async (hospitalId, name, locationData) => {
    // 1. Check Database first
    let details = await HospitalDetail.findOne({ hospitalId });
    
    // Check if data is stale (older than 7 days) - Optional logic, for now we stick to manual refresh or missing data
    if (details) {
        return details;
    }

    // 2. If not found, Generate via AI
    return await generateHospitalDetails(hospitalId, name, locationData);
};

exports.refreshHospitalDetails = async (hospitalId, name, locationData) => {
    return await generateHospitalDetails(hospitalId, name, locationData);
};

const generateHospitalDetails = async (hospitalId, name, locationData) => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        
        const locationStr = locationData ? `Lat: ${locationData.lat}, Lon: ${locationData.lon}` : "Nearby";

        const prompt = `
        ACT AS: Healthcare Data Researcher.
        TASK: Gather/Simulate detailed information for the hospital named "${name}" located at/near ${locationStr}.
        
        Since this is a demo environment and we don't have real-time web access to this specific hospital, 
        GENERATE REALISTIC, HIGH-QUALITY DATA based on this hospital's likely profile (General Hospital, Eye Care, Trauma Center, etc. inferred from name).
        
        OUTPUT JSON ONLY:
        {
            "description": "2-3 sentences describing the hospital's reputation and key focus.",
            "address": "A realistic address string",
            "rating": 4.5,
            "emergencyServices": ["24/7 Trauma", "Ambulance", "ICU"],
            "specialties": ["Cardiology", "Neurology", "Orthopedics"],
            "doctors": [
                { "name": "Dr. [Name]", "specialty": "[Specialty]", "experience": "15 years", "availability": "Mon-Fri" },
                { "name": "Dr. [Name]", "specialty": "[Specialty]", "experience": "8 years", "availability": "On Call" },
                { "name": "Dr. [Name]", "specialty": "[Specialty]", "experience": "12 years", "availability": "Tue-Sat" },
                { "name": "Dr. [Name]", "specialty": "[Specialty]", "experience": "20 years", "availability": "Mon-Wed-Fri" }
            ],
            "contactNumber": "+1-xxx-xxx-xxxx",
            "website": "www.[hospitalname].com",
            "insuranceAccepted": ["BlueCross", "Aetna", "Medicare", "Private"]
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        
        let aiData;
        try {
            aiData = JSON.parse(text);
        } catch (e) {
            console.error("AI Parse Error", e);
            // Fallback
            aiData = {
                description: `A leading healthcare facility providing comprehensive care in ${name}.`,
                address: "Address unavailable",
                rating: 4.0,
                specialties: ["General Medicine", "Emergency"],
                doctors: [{ name: "Dr. On Call", specialty: "General", experience: "5+ years", availability: "24/7" }]
            };
        }

        // Save/Update in Database
        const updatedDetail = await HospitalDetail.findOneAndUpdate(
            { hospitalId },
            {
                hospitalId,
                name,
                ...aiData,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        return updatedDetail;

    } catch (error) {
        console.error("AI Hospital Details Error:", error);
        throw new Error("Failed to retrieve hospital details.");
    }
};
