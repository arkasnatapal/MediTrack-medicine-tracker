const hospitalService = require('./hospital-detail.service');

exports.getDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, lat, lon } = req.query; // Pass metadata from frontend if needed for generation

        if (!name) {
             return res.status(400).json({ message: "Hospital name is required for first-time fetching." });
        }

        const data = await hospitalService.getHospitalDetails(id, name, { lat, lon });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.refreshDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, lat, lon } = req.body;

        const data = await hospitalService.refreshHospitalDetails(id, name, { lat, lon });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
