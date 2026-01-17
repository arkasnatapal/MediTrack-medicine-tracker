const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;

    // Update lastActive if > 1 minute ago
    const now = new Date();
    if (!user.lastActive || now - new Date(user.lastActive) > 60 * 1000) {
      await User.findByIdAndUpdate(user._id, { lastActive: now });
    }

    // [LIVING HEALTH OS] Log activity for Sleep Intelligence
    // Fire and forget - do not await
    const { logActivity } = require('./activityTracker');
    logActivity(user._id).catch(err => console.error('Activity Log Error:', err));


    next();
  } catch (error) {
    console.error('❌ Auth Middleware Error:', error);
    res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

module.exports = authMiddleware;
