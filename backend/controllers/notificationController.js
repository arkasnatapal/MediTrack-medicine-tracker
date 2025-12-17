const Notification = require('../models/Notification');
const Medicine = require('../models/Medicine');

// Helper to create a notification
exports.createNotification = async (userId, title, message, type = 'info', actionLink = '') => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      actionLink
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check for expiring medicines and create notifications if needed
    // This is a "lazy check" - we check when the user asks for notifications
    const medicines = await Medicine.find({ user: userId });
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    for (const med of medicines) {
      const expiryDate = new Date(med.expiryDate);
      
      // Check if already expired
      if (expiryDate < today) {
        // Check if we already notified about this recently (optional optimization, skipping for simplicity or using a flag)
        // For now, we'll just check if a similar notification exists to avoid spamming every refresh
        const exists = await Notification.findOne({
          user: userId,
          type: 'error',
          message: { $regex: med.name },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // within last 24h
        });

        if (!exists) {
          await Notification.create({
            user: userId,
            title: 'Medicine Expired',
            message: `${med.name} has expired on ${expiryDate.toLocaleDateString()}. Please dispose of it safely.`,
            type: 'error',
            actionLink: '/medicines'
          });
        }
      } 
      // Check if expiring soon (within 3 days)
      else if (expiryDate <= threeDaysFromNow) {
        const exists = await Notification.findOne({
          user: userId,
          type: 'warning',
          message: { $regex: med.name },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!exists) {
          await Notification.create({
            user: userId,
            title: 'Expiring Soon',
            message: `${med.name} is expiring on ${expiryDate.toLocaleDateString()}.`,
            type: 'warning',
            actionLink: '/medicines'
          });
        }
      }
    }

    // 2. Fetch all notifications
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a notification as read
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure user owns notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all as read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear all notifications
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
