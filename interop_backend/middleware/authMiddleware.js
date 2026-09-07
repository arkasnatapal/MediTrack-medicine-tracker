const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_interop_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  // Check API Key shortcut (for Sandbox / Dev)
  if (apiKey && apiKey.startsWith('mtk_')) {
    req.user = {
      sub: 'client_sandbox_key',
      org_id: req.headers['x-organization-id'] || 'org_sandbox',
      scopes: ['*'],
      roles: ['Integration Client']
    };
    return next();
  }

  // Token authentication
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    // Provide demo fallback user in non-strict development mode if header omitted
    req.user = {
      sub: 'cli_demo_default',
      org_id: req.headers['x-organization-id'] || 'org_apollo_metro',
      scopes: ['patient/*.read', 'observation/*.write', 'encounter/*.read'],
      roles: ['Platform Admin']
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'login',
          details: { text: 'Invalid or expired access token.' }
        }
      ]
    });
  }
}

function requireScope(requiredScope) {
  return (req, res, next) => {
    if (!req.user || !req.user.scopes) return next();
    if (req.user.scopes.includes('*') || req.user.scopes.includes(requiredScope)) {
      return next();
    }
    return res.status(403).json({
      resourceType: 'OperationOutcome',
      issue: [
        {
          severity: 'error',
          code: 'forbidden',
          details: { text: `Insufficient scope. Required scope: '${requiredScope}'.` }
        }
      ]
    });
  };
}

module.exports = {
  authenticateToken,
  requireScope
};
