/**
 * Bidirectional Mapper: MediTrack Doctor / Provider <-> FHIR R4 Practitioner & PractitionerRole.
 */

const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack Doctor model to FHIR R4 Practitioner resource.
 */
function toFhirPractitioner(doctor) {
  if (!doctor) return null;

  const doc = doctor._doc || doctor;
  const id = String(doc._id || doc.id || 'practitioner-demo');
  const name = doc.fullName || doc.name || 'Medical Practitioner';

  const identifier = [
    {
      system: 'https://meditrack.org/fhir/practitioner-id',
      value: id
    }
  ];

  if (doc.medicalRegistrationNumber) {
    identifier.push({
      type: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MD', display: 'Medical License Number' }]
      },
      system: `https://medicalcouncil.in/${(doc.registrationAuthority || 'NMC').toLowerCase().replace(/\s+/g, '-')}`,
      value: doc.medicalRegistrationNumber
    });
  }

  const telecom = [];
  if (doc.email) telecom.push({ system: 'email', value: doc.email, use: 'work' });
  if (doc.phone) telecom.push({ system: 'phone', value: doc.phone, use: 'work' });

  const active = doc.verificationStatus === 'VERIFIED';

  const qualification = [];
  if (doc.qualification) {
    qualification.push({
      code: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD', display: doc.qualification }],
        text: doc.qualification
      }
    });
  }

  return {
    resourceType: 'Practitioner',
    id: id,
    identifier: identifier,
    active: active,
    name: [
      {
        use: 'official',
        text: name,
        prefix: ['Dr.']
      }
    ],
    telecom: telecom.length > 0 ? telecom : undefined,
    qualification: qualification.length > 0 ? qualification : undefined
  };
}

/**
 * Map MediTrack Doctor & Facility Association to FHIR R4 PractitionerRole resource.
 */
function toFhirPractitionerRole(doctor, facility = null, association = null) {
  if (!doctor) return null;

  const doc = doctor._doc || doctor;
  const docId = String(doc._id || doc.id || 'practitioner-demo');
  const roleId = `role-${docId}`;

  const practitionerRef = {
    reference: `Practitioner/${docId}`,
    display: doc.fullName || doc.name || 'Medical Doctor'
  };

  let organizationRef = undefined;
  if (facility) {
    const facDoc = facility._doc || facility;
    const facId = String(facDoc._id || facDoc.facilityId || facDoc.id || 'org-demo');
    organizationRef = {
      reference: `Organization/${facId}`,
      display: facDoc.name || 'Healthcare Facility'
    };
  }

  const code = [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/practitioner-role',
          code: 'doctor',
          display: 'Doctor'
        }
      ],
      text: association?.designation || 'Medical Officer'
    }
  ];

  const specialty = [];
  if (doc.specialization) {
    specialty.push({
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '309343006',
          display: doc.specialization
        }
      ],
      text: doc.specialization
    });
  }

  return {
    resourceType: 'PractitionerRole',
    id: roleId,
    active: doc.verificationStatus === 'VERIFIED',
    practitioner: practitionerRef,
    organization: organizationRef,
    code: code,
    specialty: specialty.length > 0 ? specialty : undefined
  };
}

/**
 * Convert FHIR Practitioner back into MediTrack Doctor record.
 */
function fromFhirPractitioner(fhirPractitioner) {
  if (!fhirPractitioner || fhirPractitioner.resourceType !== 'Practitioner') {
    throw new Error('Invalid FHIR Practitioner resource');
  }

  const validation = validateFhirResource(fhirPractitioner);
  if (!validation.valid) {
    throw new Error(`FHIR Practitioner Validation Failed: ${validation.errors.join(', ')}`);
  }

  let fullName = '';
  if (Array.isArray(fhirPractitioner.name) && fhirPractitioner.name.length > 0) {
    fullName = fhirPractitioner.name[0].text || fhirPractitioner.name[0].family || 'Dr. Unknown';
  }

  let phone = '';
  let email = '';
  if (Array.isArray(fhirPractitioner.telecom)) {
    const emailItem = fhirPractitioner.telecom.find(t => t.system === 'email');
    const phoneItem = fhirPractitioner.telecom.find(t => t.system === 'phone');
    if (emailItem) email = emailItem.value;
    if (phoneItem) phone = phoneItem.value;
  }

  let regNum = `REG-FHIR-${Math.floor(100000 + Math.random() * 900000)}`;
  if (Array.isArray(fhirPractitioner.identifier)) {
    const lic = fhirPractitioner.identifier.find(i => i.system?.includes('medicalcouncil') || i.type?.coding?.[0]?.code === 'MD');
    if (lic) regNum = lic.value;
  }

  return {
    fullName: fullName,
    email: email,
    phone: phone,
    medicalRegistrationNumber: regNum,
    registrationAuthority: 'National Medical Commission',
    specialization: 'General Medicine',
    qualification: 'MBBS',
    verificationStatus: fhirPractitioner.active ? 'VERIFIED' : 'PENDING_VERIFICATION',
    fhirId: fhirPractitioner.id
  };
}

module.exports = {
  toFhirPractitioner,
  toFhirPractitionerRole,
  fromFhirPractitioner
};
