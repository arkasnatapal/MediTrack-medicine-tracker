const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const MedicineLog = require("../models/MedicineLog");

// GET /api/medicine-logs
router.get("/", auth, async (req, res) => {
  try {
    const logs = await MedicineLog.find({ userId: req.user.id })
      .sort({ scheduledTime: -1 })
      .populate("medicineId", "name")
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    console.error("Error fetching medicine logs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch medicine logs" });
  }
});

module.exports = router;
