const emergencyService = require('./emergency.service');

exports.getAIRecommendation = async (req, res) => {
    try {
        const { problemDescription, userLocation, nearbyHospitals } = req.body;
        
        // If frontend didn't send hospitals, we could fetch them here too, but frontend usually has them.
        // Let's assume frontend sends them or we fetch them if missing.
        let hospitalsData = nearbyHospitals;
        if (!hospitalsData || hospitalsData.length === 0) {
            hospitalsData = await emergencyService.fetchNearbyHospitals(userLocation.latitude, userLocation.longitude);
        }

        const aiResponse = await emergencyService.getAIRecommendation(problemDescription, userLocation, hospitalsData);
        res.json(aiResponse);
    } catch (error) {
        console.error('AI Recommendation Error:', error);
        res.status(500).json({ message: 'Failed to get AI recommendation' });
    }
};

exports.triggerEmergency = async (req, res) => {
  try {
    const { latitude, longitude, emergencyType } = req.body;
    const userId = req.user.id; // Assuming auth middleware adds user to req

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates required' });
    }

    const result = await emergencyService.triggerEmergency(userId, { latitude, longitude, emergencyType });
    res.status(201).json(result);
  } catch (error) {
    console.error('Trigger Emergency Error:', error);
    res.status(500).json({ message: 'Failed to trigger emergency' });
  }
};

exports.getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and Longitude required' });
    }

    const hospitals = await emergencyService.fetchNearbyHospitals(parseFloat(lat), parseFloat(lon));
    res.json(hospitals);
  } catch (error) {
    console.error('Fetch Hospitals Error:', error);
    res.status(500).json({ message: 'Failed to fetch hospitals' });
  }
};

exports.assignDoctor = async (req, res) => {
  try {
    const { emergencyId } = req.body;
    const result = await emergencyService.assignDoctor(emergencyId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign doctor' });
  }
};
