const express = require('express');
const router = express.Router();
const {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getExpiringSoon,
  getStatistics,
} = require('../controllers/medicineController');
const authMiddleware = require('../middleware/authMiddleware');

const FamilyConnection = require("../models/FamilyConnection");
const Medicine = require("../models/Medicine");

router.use(authMiddleware);

// GET /api/medicines/family
router.get("/family", async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all active connections involving me
    const connections = await FamilyConnection.find({
      status: "active",
      $or: [{ inviter: userId }, { invitee: userId }],
    });

    const familyUserIds = new Set();
    connections.forEach((c) => {
      if (c.inviter.toString() === userId.toString() && c.invitee) {
        familyUserIds.add(c.invitee.toString());
      } else if (c.invitee && c.invitee.toString() === userId.toString()) {
        familyUserIds.add(c.inviter.toString());
      }
    });

    const idsArray = Array.from(familyUserIds);
    if (idsArray.length === 0) {
      return res.json({ success: true, myMeds: [], familyMeds: [] });
    }

    const myMeds = await Medicine.find({ user: userId }).sort({ expiryDate: 1 });
    const familyMeds = await Medicine.find({ user: { $in: idsArray } })
      .populate("user", "name email")
      .sort({ expiryDate: 1 });

    res.json({ success: true, myMeds, familyMeds });
  } catch (err) {
    console.error("Error fetching family medicines:", err);
    res.status(500).json({ success: false, message: "Failed to load family medicines" });
  }
});


router.post('/', addMedicine);
router.get('/', getMedicines);
router.get('/expiring-soon', getExpiringSoon);
router.get('/statistics', getStatistics);
router.get('/:id', getMedicineById);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;
