const express = require('express');
const router = express.Router();
const MedicineInventory = require('../models/MedicineInventory');
const Facility = require('../models/Facility');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Public / Patient Medicine Availability Search across Facilities
router.get('/public-search', async (req, res) => {
  try {
    const { medicineName, facilityId, district } = req.query;
    if (!medicineName) {
      return res.status(400).json({ message: 'Medicine name parameter is required' });
    }

    const query = {
      medicineName: new RegExp(medicineName, 'i'),
      status: { $ne: 'EXPIRED' },
    };
    if (facilityId) query.facilityId = facilityId;

    const inventory = await MedicineInventory.find(query)
      .populate('facilityId')
      .sort({ quantity: -1 });

    if (inventory.length === 0) {
      return res.json({
        message: 'Availability not updated',
        results: [],
      });
    }

    res.json({
      message: 'Stock details fetched',
      results: inventory.map(item => ({
        medicineName: item.medicineName,
        genericName: item.genericName,
        strength: item.strength,
        dosageForm: item.dosageForm,
        quantity: item.quantity,
        status: item.status,
        facilityName: item.facilityId ? item.facilityId.name : 'Facility',
        facilityDistrict: item.facilityId ? item.facilityId.district : 'District',
        facilityPhone: item.facilityId ? item.facilityId.phone : '',
        lastUpdated: item.lastUpdated,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Facility Inventory List (Pharmacy Staff / Facility Admin)
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.facilityId) query.facilityId = req.user.facilityId;
    if (req.query.status) query.status = req.query.status;

    const inventory = await MedicineInventory.find(query)
      .populate('facilityId')
      .sort({ medicineName: 1 });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new Medicine Stock (Pharmacy Staff / Facility Admin)
router.post('/', protect, authorizeRoles('PHARMACY_STAFF', 'FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const {
      medicineName,
      genericName,
      strength,
      dosageForm,
      quantity,
      minimumThreshold,
      batchNumber,
      expiryDate,
      unitPrice,
    } = req.body;

    const item = await MedicineInventory.create({
      facilityId: req.user.facilityId,
      medicineName,
      genericName,
      strength,
      dosageForm,
      quantity: Number(quantity),
      minimumThreshold: Number(minimumThreshold) || 50,
      batchNumber,
      expiryDate: new Date(expiryDate),
      unitPrice: Number(unitPrice) || 0,
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'ADD_INVENTORY', 'CareMedicineInventory', item._id, `Added ${quantity} units of ${medicineName}`);

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Stock Item
router.put('/:id', protect, authorizeRoles('PHARMACY_STAFF', 'FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const item = await MedicineInventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Medicine stock item not found' });

    Object.assign(item, req.body);
    await item.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_INVENTORY', 'CareMedicineInventory', item._id, `Updated stock for ${item.medicineName}`);

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
