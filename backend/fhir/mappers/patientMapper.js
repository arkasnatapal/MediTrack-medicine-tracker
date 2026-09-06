/**
 * Bidirectional Mapper: MediTrack Patient (User / PatientRecord) <-> FHIR R4 Patient Resource.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Convert MediTrack User / PatientRecord to FHIR R4 Patient resource.
 */
function toFhirPatient(userOrRecord) {
  if (!userOrRecord) return null;

  const doc = userOrRecord._doc || userOrRecord;
  const id = String(doc._id || doc.id || 'patient-demo');
  
  // Format Name
  const fullName = doc.name || doc.fullName || 'Anonymous Patient';
  const nameParts = fullName.trim().split(' ');
  const familyName = nameParts.length > 1 ? nameParts.pop() : '';
  const givenNames = nameParts;

  // Format Telecom
  const telecom = [];
  if (doc.email) {
    telecom.push({ system: 'email', value: doc.email, use: 'home' });
  }
  const phone = doc.phoneNumber || doc.phone;
  if (phone) {
    telecom.push({ system: 'phone', value: phone, use: 'mobile' });
  }

  // Format Identifiers (including ABHA Number & Address if available)
  const identifier = [
    {
      system: 'https://meditrack.org/fhir/patient-id',
      value: id
    }
  ];

  if (doc.memberId) {
    identifier.push({
      system: 'https://meditrack.org/fhir/member-id',
      value: doc.memberId
    });
  }

  if (doc.abhaNumber) {
    identifier.push({
      type: {
        coding: [
          { system: 'https://abdm.gov.in/fhir/identifier-type', code: 'ABHA_NUMBER', display: 'ABHA Number' }
        ]
      },
      system: 'https://abdm.gov.in/abha-number',
      value: doc.abhaNumber
    });
  }

  if (doc.abhaAddress) {
    identifier.push({
      type: {
        coding: [
          { system: 'https://abdm.gov.in/fhir/identifier-type', code: 'ABHA_ADDRESS', display: 'ABHA Address' }
        ]
      },
      system: 'https://abdm.gov.in/abha-address',
      value: doc.abhaAddress
    });
  }

  // Format Gender
  let gender = 'unknown';
  const gStr = String(doc.gender || '').toLowerCase();
  if (gStr === 'male' || gStr === 'm') gender = 'male';
  else if (gStr === 'female' || gStr === 'f') gender = 'female';
  else if (gStr === 'other' || gStr === 'o') gender = 'other';

  // Format Date of Birth
  let birthDate = undefined;
  if (doc.dateOfBirth) {
    const d = new Date(doc.dateOfBirth);
    if (!isNaN(d.getTime())) {
      birthDate = d.toISOString().split('T')[0];
    }
  } else if (doc.age && typeof doc.age === 'number') {
    const estimatedYear = new Date().getFullYear() - doc.age;
    birthDate = `${estimatedYear}-01-01`;
  }

  // Format Address
  const addressText = doc.address || doc.location || '';
  const addressList = addressText ? [
    {
      use: 'home',
      text: addressText,
      city: doc.city || undefined,
      state: doc.state || undefined,
      postalCode: doc.pincode || undefined
    }
  ] : [];

  // Emergency Contact / RelatedPerson
  const contact = [];
  if (Array.isArray(doc.emergencyContacts) && doc.emergencyContacts.length > 0) {
    doc.emergencyContacts.forEach(c => {
      contact.push({
        relationship: [{ text: c.relation || 'Emergency Contact' }],
        name: { text: c.name },
        telecom: [
          { system: 'phone', value: c.phoneNumber },
          { system: 'email', value: c.email }
        ]
      });
    });
  } else if (doc.emergencyContact && doc.emergencyContact.name) {
    contact.push({
      relationship: [{ text: doc.emergencyContact.relation || 'Emergency Contact' }],
      name: { text: doc.emergencyContact.name },
      telecom: [{ system: 'phone', value: doc.emergencyContact.phone }]
    });
  }

  // Language communication
  const lang = doc.settings?.appearance?.language || 'en';
  const communication = [
    {
      language: {
        coding: [{ system: 'urn:ietf:bcp:47', code: lang }]
      },
      preferred: true
    }
  ];

  const resource = {
    resourceType: 'Patient',
    id: id,
    identifier: identifier,
    active: true,
    name: [
      {
        use: 'official',
        text: fullName,
        family: familyName || undefined,
        given: givenNames.length > 0 ? givenNames : undefined
      }
    ],
    telecom: telecom.length > 0 ? telecom : undefined,
    gender: gender,
    birthDate: birthDate,
    address: addressList.length > 0 ? addressList : undefined,
    communication: communication,
    contact: contact.length > 0 ? contact : undefined
  };

  // Clean undefined keys
  Object.keys(resource).forEach(key => resource[key] === undefined && delete resource[key]);

  return resource;
}

/**
 * Convert FHIR R4 Patient resource back into MediTrack User / PatientRecord model attributes.
 */
function fromFhirPatient(fhirPatient) {
  if (!fhirPatient || fhirPatient.resourceType !== 'Patient') {
    throw new Error('Invalid FHIR Patient resource');
  }

  const validation = validateFhirResource(fhirPatient);
  if (!validation.valid) {
    throw new Error(`FHIR Patient Validation Failed: ${validation.errors.join(', ')}`);
  }

  let fullName = '';
  if (Array.isArray(fhirPatient.name) && fhirPatient.name.length > 0) {
    const n = fhirPatient.name[0];
    fullName = n.text || `${(n.given || []).join(' ')} ${n.family || ''}`.trim();
  }

  let email = '';
  let phone = '';
  if (Array.isArray(fhirPatient.telecom)) {
    const emailItem = fhirPatient.telecom.find(t => t.system === 'email');
    const phoneItem = fhirPatient.telecom.find(t => t.system === 'phone');
    if (emailItem) email = emailItem.value;
    if (phoneItem) phone = phoneItem.value;
  }

  let abhaNumber = null;
  let abhaAddress = null;
  if (Array.isArray(fhirPatient.identifier)) {
    const abhaNumItem = fhirPatient.identifier.find(i => i.system === 'https://abdm.gov.in/abha-number');
    const abhaAddrItem = fhirPatient.identifier.find(i => i.system === 'https://abdm.gov.in/abha-address');
    if (abhaNumItem) abhaNumber = abhaNumItem.value;
    if (abhaAddrItem) abhaAddress = abhaAddrItem.value;
  }

  let gender = fhirPatient.gender || 'unknown';

  let address = '';
  if (Array.isArray(fhirPatient.address) && fhirPatient.address.length > 0) {
    const addr = fhirPatient.address[0];
    address = addr.text || [addr.line?.join(' '), addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');
  }

  return {
    name: fullName,
    email: email,
    phone: phone,
    gender: gender,
    address: address,
    dateOfBirth: fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : undefined,
    abhaNumber: abhaNumber,
    abhaAddress: abhaAddress,
    fhirId: fhirPatient.id
  };
}

module.exports = {
  toFhirPatient,
  fromFhirPatient
};
