/**
 * Bidirectional Mapper: MediTrack Facility / HealthcareFacility <-> FHIR R4 Organization & Location.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack Facility to FHIR R4 Organization resource.
 */
function toFhirOrganization(facility) {
  if (!facility) return null;

  const doc = facility._doc || facility;
  const id = String(doc._id || doc.facilityId || doc.id || 'org-demo');
  const name = doc.name || 'Healthcare Facility';

  const identifier = [
    {
      system: 'https://meditrack.org/fhir/facility-id',
      value: id
    }
  ];

  if (doc.licenseId) {
    identifier.push({
      type: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'TAX', display: 'Facility License ID' }]
      },
      system: 'https://abdm.gov.in/facility-registry',
      value: doc.licenseId
    });
  }

  // Organization Type
  const typeCode = (doc.facilityType || 'OTHER').toUpperCase();
  const typeMap = {
    PHC: { code: 'prov', display: 'Primary Health Centre (PHC)' },
    CHC: { code: 'prov', display: 'Community Health Centre (CHC)' },
    RURAL_HOSPITAL: { code: 'hosp', display: 'Rural Hospital' },
    DISTRICT_HOSPITAL: { code: 'hosp', display: 'District Hospital' },
    GOVT_HOSPITAL: { code: 'hosp', display: 'Government Hospital' },
    PUBLIC_HEALTHCARE: { code: 'govt', display: 'Public Healthcare Agency' },
    DIAGNOSTIC_CENTRE: { code: 'dept', display: 'Diagnostic Laboratory' }
  };

  const orgType = typeMap[typeCode] || { code: 'other', display: doc.facilityType || 'Healthcare Facility' };

  const telecom = [];
  if (doc.phone) telecom.push({ system: 'phone', value: doc.phone, use: 'work' });
  if (doc.email) telecom.push({ system: 'email', value: doc.email, use: 'work' });
  if (doc.website) telecom.push({ system: 'url', value: doc.website, use: 'work' });

  const address = [
    {
      use: 'work',
      text: doc.address || '',
      city: doc.district || doc.city || undefined,
      state: doc.state || undefined,
      postalCode: doc.pincode || undefined,
      country: 'IND'
    }
  ];

  return {
    resourceType: 'Organization',
    id: id,
    identifier: identifier,
    active: doc.verificationStatus === 'VERIFIED',
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: orgType.code,
            display: orgType.display
          }
        ],
        text: doc.facilityType || 'Healthcare Provider'
      }
    ],
    name: name,
    telecom: telecom.length > 0 ? telecom : undefined,
    address: address
  };
}

/**
 * Convert MediTrack Facility & Bed Capacity to FHIR R4 Location resource.
 */
function toFhirLocation(facility, capacity = null) {
  if (!facility) return null;

  const doc = facility._doc || facility;
  const facId = String(doc._id || doc.facilityId || doc.id || 'org-demo');
  const locId = `loc-${facId}`;
  const name = `${doc.name || 'Facility'} - Main Campus`;

  let position = undefined;
  if (doc.latitude && doc.longitude) {
    position = {
      latitude: doc.latitude,
      longitude: doc.longitude
    };
  }

  // Extensions for bed capacity if provided
  const extension = [];
  if (capacity) {
    const capDoc = capacity._doc || capacity;
    extension.push({
      url: 'https://meditrack.org/fhir/StructureDefinition/location-bed-capacity',
      extension: [
        { url: 'emergencyBeds', valueInteger: capDoc.emergencyBeds || 0 },
        { url: 'generalBeds', valueInteger: capDoc.generalBeds || 0 },
        { url: 'icuBeds', valueInteger: capDoc.icuBeds || 0 },
        { url: 'oxygenBeds', valueInteger: capDoc.oxygenBeds || 0 },
        { url: 'ventilators', valueInteger: capDoc.ventilatorsAvailable || 0 }
      ]
    });
  }

  return {
    resourceType: 'Location',
    id: locId,
    status: doc.verificationStatus === 'VERIFIED' ? 'active' : 'suspended',
    name: name,
    description: `${doc.facilityType || 'Facility'} operating ${doc.operatingHours || '24/7'}`,
    mode: 'instance',
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: 'HOSP',
            display: doc.facilityType || 'Hospital'
          }
        ]
      }
    ],
    telecom: doc.phone ? [{ system: 'phone', value: doc.phone }] : undefined,
    address: {
      text: doc.address,
      city: doc.district,
      state: doc.state,
      postalCode: doc.pincode
    },
    position: position,
    managingOrganization: {
      reference: `Organization/${facId}`,
      display: doc.name
    },
    extension: extension.length > 0 ? extension : undefined
  };
}

/**
 * Convert FHIR Organization back to MediTrack Facility record.
 */
function fromFhirOrganization(fhirOrg) {
  if (!fhirOrg || fhirOrg.resourceType !== 'Organization') {
    throw new Error('Invalid FHIR Organization resource');
  }

  const validation = validateFhirResource(fhirOrg);
  if (!validation.valid) {
    throw new Error(`FHIR Organization Validation Failed: ${validation.errors.join(', ')}`);
  }

  let name = fhirOrg.name || 'Healthcare Facility';
  let phone = '';
  let email = '';
  if (Array.isArray(fhirOrg.telecom)) {
    const emailItem = fhirOrg.telecom.find(t => t.system === 'email');
    const phoneItem = fhirOrg.telecom.find(t => t.system === 'phone');
    if (emailItem) email = emailItem.value;
    if (phoneItem) phone = phoneItem.value;
  }

  let address = '';
  let district = 'District';
  let state = 'State';
  let pincode = '000000';

  if (Array.isArray(fhirOrg.address) && fhirOrg.address.length > 0) {
    const addr = fhirOrg.address[0];
    address = addr.text || addr.line?.join(' ') || 'Main Healthcare Center Address';
    if (addr.city) district = addr.city;
    if (addr.state) state = addr.state;
    if (addr.postalCode) pincode = addr.postalCode;
  }

  let licenseId = `LIC-FHIR-${Math.floor(100000 + Math.random() * 900000)}`;
  if (Array.isArray(fhirOrg.identifier)) {
    const lic = fhirOrg.identifier.find(i => i.type?.coding?.[0]?.code === 'TAX');
    if (lic) licenseId = lic.value;
  }

  return {
    name: name,
    facilityType: 'DISTRICT_HOSPITAL',
    licenseId: licenseId,
    address: address,
    district: district,
    state: state,
    pincode: pincode,
    phone: phone || '+91 9876543210',
    email: email || 'facility@meditrack.org',
    adminName: 'Admin Officer',
    adminEmail: email || 'admin@meditrack.org',
    verificationStatus: fhirOrg.active ? 'VERIFIED' : 'PENDING_VERIFICATION',
    fhirId: fhirOrg.id
  };
}

module.exports = {
  toFhirOrganization,
  toFhirLocation,
  fromFhirOrganization
};
