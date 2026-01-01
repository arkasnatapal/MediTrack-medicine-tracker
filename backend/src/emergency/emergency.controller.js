const emergencyService = require('./emergency.service');

exports.getAIRecommendation = async (req, res) => {
    try {
        const { problemDescription, userLocation, nearbyHospitals } = req.body;
        const userId = req.user.id; // Get ID from auth middleware
        
        // If frontend didn't send hospitals, we could fetch them here too, but frontend usually has them.
        // Let's assume frontend sends them or we fetch them if missing.
        let hospitalsData = nearbyHospitals;
        if (!hospitalsData || hospitalsData.length === 0) {
            hospitalsData = await emergencyService.fetchNearbyHospitals(userLocation.latitude, userLocation.longitude);
        }

        const aiResponse = await emergencyService.getAIRecommendation(problemDescription, userLocation, hospitalsData, userId);
        res.json(aiResponse);
    } catch (error) {
        console.error('AI Recommendation Error:', error);
        res.status(500).json({ message: 'Failed to get AI recommendation' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await emergencyService.getEmergencyHistory(userId);
        res.json(history);
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ message: 'Failed to fetch emergency history' });
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

exports.deleteEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await emergencyService.deleteEmergency(id, userId);
        if (!result) return res.status(404).json({ message: "Emergency record not found" });
        
        res.json({ message: "Record deleted successfully" });
    } catch (error) {
        console.error("Delete Emergency Error:", error);
        res.status(500).json({ message: "Failed to delete record" });
    }
};

exports.broadcastEmergency = async (req, res) => {
    try {
        const { description, location } = req.body;
        const userId = req.user.id;
        
        // 1. Get User's Emergency Contacts
        const User = require('../../models/User'); // Ensure correct path
        const user = await User.findById(userId).select('name email emergencyContacts');
        
        if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) {
            return res.status(400).json({ message: "No emergency contacts found. Please add them in Settings." });
        }

        const { sendEmail } = require('../../utils/sendEmail');
        
        // 2. Prepare Email Content
        const googleMapsLink = location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 'Location unavailable';
        const time = new Date().toLocaleString();
        
        const emailSubject = `🚨 SOS: EMERGENCY ALERT from ${user.name}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">🚨 EMERGENCY ALERT</h1>
                <p style="font-size: 16px;"><strong>${user.name}</strong> has triggered an emergency alert.</p>
                
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #991b1b;">Emergency Details</h3>
                    <p><strong>Description:</strong> ${description || "No description provided."}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Location:</strong> <a href="${googleMapsLink}" style="color: #dc2626; font-weight: bold;">View on Google Maps</a></p>
                </div>
                
                <p>Please contact them or emergency services immediately.</p>
                <p style="font-size: 12px; color: #666; margin-top: 30px;">Sent via MediTrack Emergency System</p>
            </div>
        `;

        // 3. Send Emails in Parallel
        const emailPromises = user.emergencyContacts.map(contact => 
            sendEmail({
                to: contact.email,
                subject: emailSubject,
                html: emailHtml
            })
        );

        const results = await Promise.all(emailPromises);
        const successCount = results.filter(r => r && r.success).length;

        res.json({ 
            success: true, 
            message: `Alert sent to ${successCount}/${user.emergencyContacts.length} contacts`,
            sentCount: successCount
        });

    } catch (error) {
        console.error("Broadcast Emergency Error:", error);
        res.status(500).json({ message: "Failed to broadcast emergency alert" });
    }
};
