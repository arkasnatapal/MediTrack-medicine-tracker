const store = require('../services/dataStore');
const InteropClinicalResource = require('../models/ClinicalResource');

/**
 * Aggregates all clinical records for a given patient into a FHIR R4 Bundle (searchset).
 */
async function generatePatientEverythingBundle(organizationId, patientFhirId) {
  let records = [];
  try {
    if (require('mongoose').connection.readyState === 1) {
      records = await InteropClinicalResource.find({
        organizationId,
        $or: [
          { resourceType: 'Patient', fhirId: patientFhirId },
          { patientId: patientFhirId }
        ]
      });
    } else {
      records = await store.findClinicalResources({
        organizationId,
        $or: [
          { resourceType: 'Patient', fhirId: patientFhirId },
          { patientId: patientFhirId }
        ]
      });
    }
  } catch (e) {
    records = await store.findClinicalResources({
      organizationId,
      $or: [
        { resourceType: 'Patient', fhirId: patientFhirId },
        { patientId: patientFhirId }
      ]
    });
  }

  const entries = records.map(r => ({
    fullUrl: `http://localhost:5002/fhir/${r.resourceType}/${r.fhirId}`,
    resource: r.resource
  }));

  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    timestamp: new Date().toISOString(),
    entry: entries
  };
}

module.exports = {
  generatePatientEverythingBundle
};

