const Medicine = require('../models/Medicine');
const { createNotification } = require('../utils/notifications');

exports.addMedicine = async (req, res) => {
  try {
    const medicineData = { ...req.body, userId: req.user._id };
    
    // Map frontend mfgDate to backend manufactureDate
    if (req.body.mfgDate) {
      medicineData.manufactureDate = req.body.mfgDate;
    }
    
    // If form is provided but category is not, use form as category for backward compatibility
    if (req.body.form && !req.body.category) {
      medicineData.category = req.body.form;
    }

    const medicine = await Medicine.create(medicineData);

    await createNotification({
      userId: req.user._id,
      type: "medicine_created",
      title: "Medicine added",
      message: `You added "${medicine.name}" (${medicine.form || ""}).`,
      severity: "success",
      meta: {
        medicineId: medicine._id,
        name: medicine.name,
        expiryDate: medicine.expiryDate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      medicine,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ 
      userId: req.user._id, 
      patientType: { $ne: 'family' } 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const FamilyConnection = require('../models/FamilyConnection');
    
    // First, try to find the medicine
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check if user owns this medicine
    if (medicine.userId.toString() === req.user._id.toString()) {
      return res.json({ success: true, medicine });
    }

    // Check if user has family access to this medicine
    const familyConnection = await FamilyConnection.findOne({
      status: 'active',
      $or: [
        { inviter: req.user._id, invitee: medicine.userId },
        { invitee: req.user._id, inviter: medicine.userId }
      ]
    });

    if (familyConnection) {
      return res.json({ success: true, medicine });
    }

    // User doesn't have access
    return res.status(403).json({ 
      success: false, 
      message: 'You do not have permission to view this medicine' 
    });
  } catch (error) {
    console.error('Error in getMedicineById:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Map frontend mfgDate to backend manufactureDate
    if (req.body.mfgDate) {
      updateData.manufactureDate = req.body.mfgDate;
    }

    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await createNotification({
      userId: req.user._id,
      type: "general",
      title: "Medicine updated",
      message: `You updated details for "${medicine.name}".`,
      severity: "info",
      meta: {
        medicineId: medicine._id,
      },
    });

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      medicine,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const Reminder = require('../models/Reminder');
    const { deleteCalendarEvent } = require('../utils/googleCalendar');

    // Find the medicine first to ensure it exists and belongs to user
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Find all reminders associated with this medicine
    const reminders = await Reminder.find({ medicine: medicine._id });

    // Delete Google Calendar events for each reminder
    for (const reminder of reminders) {
      if (reminder.googleEventId) {
        try {
          // Use the user ID from the reminder (should be same as req.user._id but safer)
          await deleteCalendarEvent(req.user._id, reminder.googleEventId);
        } catch (calErr) {
          console.error(`Failed to delete calendar event for reminder ${reminder._id}:`, calErr);
        }
      }
    }

    // Delete all reminders associated with this medicine
    await Reminder.deleteMany({ medicine: medicine._id });

    // [NEW] LOGGING HOOK
    const MedicineLog = require('../models/MedicineLog');
    await MedicineLog.deleteMany({ medicineId: medicine._id });

    // Delete the medicine
    await Medicine.deleteOne({ _id: medicine._id });

    await createNotification({
      userId: req.user._id,
      type: "medicine_deleted",
      title: "Medicine deleted",
      message: `You deleted "${medicine.name}".`,
      severity: "warning",
      meta: {
        medicineId: medicine._id,
        name: medicine.name,
      },
    });

    res.json({
      success: true,
      message: 'Medicine and associated reminders deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getExpiringSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const medicines = await Medicine.find({
      userId: req.user._id,
      patientType: { $ne: 'family' },
      expiryDate: { $lte: futureDate, $gte: new Date() },
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments({ 
      userId: req.user._id,
      patientType: { $ne: 'family' }
    });
    
    const expiringSoon = await Medicine.countDocuments({
      userId: req.user._id,
      patientType: { $ne: 'family' },
      expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $gte: new Date() },
    });

    const expired = await Medicine.countDocuments({
      userId: req.user._id,
      patientType: { $ne: 'family' },
      expiryDate: { $lt: new Date() },
    });

    const categoryStats = await Medicine.aggregate([
      { $match: { userId: req.user._id, patientType: { $ne: 'family' } } },
      { $group: { _id: { $ifNull: ['$form', '$category'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      statistics: {
        totalMedicines,
        expiringSoon,
        expired,
        categoryStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
