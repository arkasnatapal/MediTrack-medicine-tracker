/**
 * FHIR R4 Bundle Service for MediTrack.
 * Supports transaction, collection, document, and searchset Bundles.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Construct a FHIR Bundle envelope around an array of resources.
 */
function createBundle({
  type = 'collection', // 'collection' | 'transaction' | 'document' | 'searchset'
  resources = [],
  id = null,
  total = null,
  link = []
}) {
  const bundleId = id || `bundle-${type}-${Date.now()}`;
  const entries = resources.map(res => {
    const rType = res.resourceType || 'Resource';
    const rId = res.id || `${rType.toLowerCase()}-${Date.now()}`;

    const entry = {
      fullUrl: res.fullUrl || `${rType}/${rId}`,
      resource: res
    };

    if (type === 'transaction') {
      entry.request = {
        method: res.id ? 'PUT' : 'POST',
        url: res.id ? `${rType}/${res.id}` : rType
      };
    }

    return entry;
  });

  const bundle = {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: [
        'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'
      ]
    },
    identifier: {
      system: 'https://meditrack.org/fhir/bundle-id',
      value: `IN-MEDITRACK-FHIR-${Math.floor(100000 + Math.random() * 900000)}`
    },
    type: type,
    total: total !== null ? total : entries.length,
    link: link.length > 0 ? link : undefined,
    entry: entries
  };

  const valResult = validateFhirResource(bundle);
  if (!valResult.valid) {
    console.warn('Generated Bundle warning:', valResult.errors);
  }

  return bundle;
}

/**
 * Generate complete Patient `$everything` FHIR Bundle containing all available patient records.
 */
function createPatientEverythingBundle(patientResource, childResources = []) {
  const allResources = [patientResource, ...childResources].filter(Boolean);
  return createBundle({
    type: 'collection',
    resources: allResources,
    id: `patient-everything-${patientResource.id}`
  });
}

module.exports = {
  createBundle,
  createPatientEverythingBundle
};
