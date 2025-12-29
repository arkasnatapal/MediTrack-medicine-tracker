// Middleware to ensure user is female and authenticated
module.exports = (req, res, next) => {
    // optimize: req.user should be populated by auth middleware (verifyToken)
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.gender !== 'female') {
        return res.status(403).json({ message: 'Access forbidden: Feature available for female users only.' });
    }

    next();
};
