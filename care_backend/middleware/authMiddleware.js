const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meditrack_care_network_super_secret_key_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (req.user.verificationStatus === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account is suspended. Access denied.' });
    }
    if (req.user.role === 'DOCTOR' && !req.user.doctorId) {
      const Doctor = require('../models/Doctor');
      const doc = await Doctor.findOne({ userId: req.user._id });
      if (doc) {
        req.user.doctorId = doc._id;
        User.findByIdAndUpdate(req.user._id, { doctorId: doc._id }).catch(() => {});
      }
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized - Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Log security violation
      AuditLog.create({
        userId: req.user ? req.user._id : null,
        userName: req.user ? req.user.name : 'Unknown',
        userRole: req.user ? req.user.role : 'UNKNOWN',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetEntity: req.originalUrl,
        details: `Role ${req.user ? req.user.role : 'None'} attempted to access ${req.originalUrl}`,
      });
      return res.status(403).json({
        message: `Forbidden - Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

const logAudit = async (userId, userName, userRole, action, targetEntity, targetId, details, ipAddress = '127.0.0.1') => {
  try {
    await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      targetEntity,
      targetId: targetId ? targetId.toString() : '',
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { protect, authorizeRoles, logAudit };
