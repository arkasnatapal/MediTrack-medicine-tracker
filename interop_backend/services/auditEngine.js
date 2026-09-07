const InteropAuditEvent = require('../models/AuditEvent');

/**
 * Creates an asynchronous HIPAA-compliant audit log entry.
 */
async function logAuditEvent({ type, action, actor, resourceType, resourceId, requestPath, method, statusCode, outcome, details, ipAddress }) {
  try {
    await InteropAuditEvent.create({
      type: type || 'REST-API',
      action: action || 'R',
      actor: actor || { name: 'Anonymous', role: 'Unknown', orgId: 'org_default' },
      resourceType: resourceType || 'Unknown',
      resourceId: resourceId || 'N/A',
      requestPath,
      method,
      statusCode: statusCode || 200,
      outcome: outcome || '0',
      details: details || '',
      ipAddress: ipAddress || '127.0.0.1'
    });
  } catch (err) {
    console.error('Audit Log recording failed:', err.message);
  }
}

module.exports = {
  logAuditEvent
};
