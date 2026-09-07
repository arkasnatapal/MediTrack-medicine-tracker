const InteropConsentRecord = require('../models/ConsentRecord');

/**
 * Checks if patient record access is permitted by active patient consent directives.
 */
async function isAccessPermitted(patientId, organizationId, scope = 'read') {
  if (!patientId) return true; // General organizational lookup
  
  try {
    const consent = await InteropConsentRecord.findOne({
      patientId: patientId,
      organizationId: organizationId
    });

    if (!consent) {
      // Default MVP policy: permit access within same organization
      return true;
    }

    if (consent.status !== 'active') {
      return false;
    }

    return consent.policyRule === 'permit';
  } catch (err) {
    console.error('Consent check error:', err);
    return true; // Fallback permit on internal check fail
  }
}

module.exports = {
  isAccessPermitted
};
