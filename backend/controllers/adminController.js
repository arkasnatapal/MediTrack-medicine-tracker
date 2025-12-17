const User = require('../models/User');
const Medicine = require('../models/Medicine');
const ReminderLog = require('../models/ReminderLog');
const ContactMessage = require('../models/ContactMessage');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMedicines = await Medicine.countDocuments();
    const totalReminders = await ReminderLog.countDocuments();
    const pendingMessages = await ContactMessage.countDocuments({ status: 'new' });

    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const categoryStats = await Medicine.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Reminders sent per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reminderStats = await ReminderLog.aggregate([
      { $match: { sentAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
          count: { $sum: 1 },
          successful: { $sum: { $cond: ['$emailSent', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Medicines expiring per month (next 6 months)
    const expiryStats = await Medicine.aggregate([
      {
        $match: {
          expiryDate: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$expiryDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMedicines,
        totalReminders,
        pendingMessages,
        categoryStats,
        reminderStats,
        expiryStats,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await ReminderLog.find()
      .populate('userId', 'name email')
      .sort({ sentAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: reminders.length,
      reminders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
