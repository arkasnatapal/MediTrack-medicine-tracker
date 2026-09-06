/**
 * Comprehensive Automated Integration & Unit Test Suite for MediTrack HL7 FHIR R4 (4.0.1) Layer.
 */

const { validateFhirResource } = require('../fhir/validators/fhirValidator');

// Terminology
const { getLoincCode } = require('../fhir/terminology/loinc');
const { getSnomedCode } = require('../fhir/terminology/snomed');
const { getRxNormCode } = require('../fhir/terminology/rxnorm');
const { getUcumUnit } = require('../fhir/terminology/ucum');

// Mappers
const { toFhirPatient, fromFhirPatient } = require('../fhir/mappers/patientMapper');
const { toFhirPractitioner, toFhirPractitionerRole, fromFhirPractitioner } = require('../fhir/mappers/practitionerMapper');
const { toFhirOrganization, toFhirLocation, fromFhirOrganization } = require('../fhir/mappers/organizationMapper');
const { toFhirObservation, fromFhirObservation } = require('../fhir/mappers/observationMapper');
const { toFhirCondition, fromFhirCondition } = require('../fhir/mappers/conditionMapper');
const { toFhirMedicationRequest, fromFhirMedicationRequest, toFhirMedicationStatement } = require('../fhir/mappers/medicationMapper');
const { toFhirAllergyIntolerance, fromFhirAllergyIntolerance } = require('../fhir/mappers/allergyMapper');
const { toFhirDiagnosticReport, fromFhirDiagnosticReport } = require('../fhir/mappers/diagnosticReportMapper');
const { toFhirDocumentReference, fromFhirDocumentReference } = require('../fhir/mappers/documentReferenceMapper');
const { toFhirAppointment, fromFhirAppointment } = require('../fhir/mappers/appointmentMapper');
const { toFhirEncounter, fromFhirEncounter } = require('../fhir/mappers/encounterMapper');
const { toFhirServiceRequest, fromFhirServiceRequest } = require('../fhir/mappers/serviceRequestMapper');
const { toFhirTask, fromFhirTask } = require('../fhir/mappers/taskMapper');
const { toFhirCarePlan, fromFhirCarePlan } = require('../fhir/mappers/carePlanMapper');
const { toFhirProcedure, fromFhirProcedure } = require('../fhir/mappers/procedureMapper');
const { toFhirImmunization, fromFhirImmunization } = require('../fhir/mappers/immunizationMapper');
const { toFhirCommunication, fromFhirCommunication } = require('../fhir/mappers/communicationMapper');
const { toFhirCareTeam, fromFhirCareTeam } = require('../fhir/mappers/careTeamMapper');
const { toFhirRelatedPerson, fromFhirRelatedPerson } = require('../fhir/mappers/relatedPersonMapper');
const { toFhirGoal, fromFhirGoal } = require('../fhir/mappers/goalMapper');
const { toFhirConsent, fromFhirConsent } = require('../fhir/mappers/consentMapper');
const { toFhirAuditEvent, fromFhirAuditEvent } = require('../fhir/mappers/auditEventMapper');
const { toFhirProvenance, fromFhirProvenance } = require('../fhir/mappers/provenanceMapper');

// Services
const { createBundle, createPatientEverythingBundle } = require('../fhir/services/bundleService');

async function runFhirTestSuite() {
  console.log('====================================================');
  console.log('🚀 MEDITRACK HL7 FHIR R4 (4.0.1) AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  // 1. Patient -> FHIR Patient
  try {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Ramesh Kumar',
      email: 'ramesh@example.com',
      phoneNumber: '+91 9876543210',
      gender: 'male',
      dateOfBirth: new Date('1985-04-12'),
      address: '12 MG Road, Sector 4, Jalpaiguri, West Bengal',
      abhaNumber: '14-8201-9304-8192',
      abhaAddress: 'rameshkumar@abdm'
    };
    const fhirPat = toFhirPatient(mockUser);
    const val = validateFhirResource(fhirPat);
    assert(val.valid && fhirPat.resourceType === 'Patient', 'Patient -> FHIR Patient Mapping & Validation');
    const backUser = fromFhirPatient(fhirPat);
    assert(backUser.email === 'ramesh@example.com' && backUser.abhaNumber === '14-8201-9304-8192', 'FHIR Patient -> MediTrack User Bi-directional Conversion');
  } catch (e) {
    assert(false, `Patient mapping exception: ${e.message}`);
  }

  // 2. Doctor -> Practitioner & PractitionerRole
  try {
    const mockDoctor = {
      _id: '507f1f77bcf86cd799439022',
      fullName: 'Dr. Ananya Sharma',
      medicalRegistrationNumber: 'MCI-WB-2021-84920',
      registrationAuthority: 'West Bengal Medical Council',
      specialization: 'Cardiology',
      qualification: 'MD Cardiology, MBBS',
      email: 'dr.ananya@meditrack.org',
      phone: '+91 9123456789',
      verificationStatus: 'VERIFIED'
    };
    const fhirPrac = toFhirPractitioner(mockDoctor);
    const valPrac = validateFhirResource(fhirPrac);
    assert(valPrac.valid && fhirPrac.resourceType === 'Practitioner', 'Doctor -> Practitioner Mapping & Validation');

    const fhirRole = toFhirPractitionerRole(mockDoctor);
    const valRole = validateFhirResource(fhirRole);
    assert(valRole.valid && fhirRole.resourceType === 'PractitionerRole', 'Doctor -> PractitionerRole Mapping & Validation');
  } catch (e) {
    assert(false, `Doctor mapping exception: ${e.message}`);
  }

  // 3. Hospital -> Organization & Location
  try {
    const mockFacility = {
      _id: '507f1f77bcf86cd799439033',
      name: 'District Hospital Jalpaiguri',
      facilityType: 'DISTRICT_HOSPITAL',
      licenseId: 'LIC-FAC-IN-WB-99182',
      address: 'Hospital Road, Central Jalpaiguri',
      district: 'Jalpaiguri',
      state: 'West Bengal',
      pincode: '735101',
      phone: '+91 3561 220011',
      email: 'contact@dhjalpaiguri.gov.in',
      verificationStatus: 'VERIFIED'
    };
    const fhirOrg = toFhirOrganization(mockFacility);
    const valOrg = validateFhirResource(fhirOrg);
    assert(valOrg.valid && fhirOrg.name === 'District Hospital Jalpaiguri', 'Facility -> Organization Mapping & Validation');

    const fhirLoc = toFhirLocation(mockFacility, { emergencyBeds: 10, generalBeds: 50, icuBeds: 5 });
    const valLoc = validateFhirResource(fhirLoc);
    assert(valLoc.valid && fhirLoc.resourceType === 'Location', 'Facility -> Location Mapping & Bed Capacity Extension');
  } catch (e) {
    assert(false, `Facility mapping exception: ${e.message}`);
  }

  // 4. Vitals -> Observation
  try {
    const fhirTemp = toFhirObservation({
      patientId: '507f1f77bcf86cd799439011',
      type: 'BODY_TEMP',
      value: 37.5,
      unit: 'cel'
    });
    const valTemp = validateFhirResource(fhirTemp);
    assert(valTemp.valid && fhirTemp.code.coding[0].code === '8310-5', 'Vitals Temperature -> Observation LOINC (8310-5) Validation');

    const fhirBP = toFhirObservation({
      patientId: '507f1f77bcf86cd799439011',
      type: 'BLOOD_PRESSURE',
      value: { systolic: 120, diastolic: 80 }
    });
    const valBP = validateFhirResource(fhirBP);
    assert(valBP.valid && fhirBP.component.length === 2, 'Vitals Blood Pressure -> Observation Component Validation');
  } catch (e) {
    assert(false, `Vitals mapping exception: ${e.message}`);
  }

  // 5. Diagnosis -> Condition
  try {
    const fhirCond = toFhirCondition({
      patientId: '507f1f77bcf86cd799439011',
      conditionName: 'Essential Hypertension',
      clinicalStatus: 'active'
    });
    const valCond = validateFhirResource(fhirCond);
    assert(valCond.valid && fhirCond.code.coding[0].code === '59621000', 'Diagnosis -> Condition SNOMED CT (59621000) Validation');
  } catch (e) {
    assert(false, `Condition mapping exception: ${e.message}`);
  }

  // 6. Prescription -> MedicationRequest & MedicationStatement
  try {
    const fhirReq = toFhirMedicationRequest({
      patientId: '507f1f77bcf86cd799439011',
      medicineName: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Twice daily'
    });
    const valReq = validateFhirResource(fhirReq);
    assert(valReq.valid && fhirReq.medicationCodeableConcept.coding[0].code === '161', 'Prescription -> MedicationRequest RxNorm (161) Validation');

    const fhirStmt = toFhirMedicationStatement({
      patientId: '507f1f77bcf86cd799439011',
      medicineName: 'Metformin'
    });
    const valStmt = validateFhirResource(fhirStmt);
    assert(valStmt.valid && fhirStmt.resourceType === 'MedicationStatement', 'Medicine -> MedicationStatement Validation');
  } catch (e) {
    assert(false, `Medication mapping exception: ${e.message}`);
  }

  // 7. Allergy -> AllergyIntolerance
  try {
    const fhirAlg = toFhirAllergyIntolerance({
      patientId: '507f1f77bcf86cd799439011',
      substanceName: 'Penicillin',
      criticality: 'high'
    });
    const valAlg = validateFhirResource(fhirAlg);
    assert(valAlg.valid && fhirAlg.code.coding[0].code === '373270004', 'Allergy -> AllergyIntolerance SNOMED CT (373270004) Validation');
  } catch (e) {
    assert(false, `Allergy mapping exception: ${e.message}`);
  }

  // 8. Lab -> DiagnosticReport
  try {
    const fhirDiag = toFhirDiagnosticReport({
      patientId: '507f1f77bcf86cd799439011',
      testName: 'Hemoglobin',
      observationIds: ['obs-hb-1'],
      reportUrl: 'https://meditrack.org/reports/hb-report.pdf'
    });
    const valDiag = validateFhirResource(fhirDiag);
    assert(valDiag.valid && fhirDiag.resourceType === 'DiagnosticReport', 'Lab Report -> DiagnosticReport Validation');
  } catch (e) {
    assert(false, `DiagnosticReport mapping exception: ${e.message}`);
  }

  // 9. Document -> DocumentReference
  try {
    const fhirDoc = toFhirDocumentReference({
      patientId: '507f1f77bcf86cd799439011',
      title: 'Discharge Summary',
      fileUrl: 'https://meditrack.org/uploads/discharge.pdf'
    });
    const valDoc = validateFhirResource(fhirDoc);
    assert(valDoc.valid && fhirDoc.resourceType === 'DocumentReference', 'Document -> DocumentReference Validation');
  } catch (e) {
    assert(false, `DocumentReference mapping exception: ${e.message}`);
  }

  // 10. Appointment & Encounter
  try {
    const fhirAppt = toFhirAppointment({
      _id: '507f1f77bcf86cd799439044',
      patientId: '507f1f77bcf86cd799439011',
      facilityName: 'PHC Jalpaiguri',
      date: '2026-09-10',
      time: '10:00 AM',
      tokenNumber: 15,
      status: 'BOOKED'
    });
    const valAppt = validateFhirResource(fhirAppt);
    assert(valAppt.valid && fhirAppt.resourceType === 'Appointment', 'Appointment -> FHIR Appointment Validation');

    const fhirEnc = toFhirEncounter({
      patientId: '507f1f77bcf86cd799439011',
      encounterClass: 'AMB',
      department: 'General OPD'
    });
    const valEnc = validateFhirResource(fhirEnc);
    assert(valEnc.valid && fhirEnc.resourceType === 'Encounter', 'Visit -> FHIR Encounter Validation');
  } catch (e) {
    assert(false, `Appointment/Encounter mapping exception: ${e.message}`);
  }

  // 11. Referral -> ServiceRequest & Task
  try {
    const fhirSR = toFhirServiceRequest({
      _id: '507f1f77bcf86cd799439055',
      patientId: '507f1f77bcf86cd799439011',
      department: 'Cardiology',
      reason: 'Chest pain evaluation',
      urgency: 'URGENT',
      status: 'SENT'
    });
    const valSR = validateFhirResource(fhirSR);
    assert(valSR.valid && fhirSR.resourceType === 'ServiceRequest', 'Referral -> ServiceRequest Validation');

    const fhirTask = toFhirTask({
      _id: '507f1f77bcf86cd799439055',
      patientId: '507f1f77bcf86cd799439011',
      status: 'SENT'
    });
    const valTask = validateFhirResource(fhirTask);
    assert(valTask.valid && fhirTask.resourceType === 'Task', 'Referral Lock -> FHIR Task Validation');
  } catch (e) {
    assert(false, `Referral mapping exception: ${e.message}`);
  }

  // 12. CarePlan, Procedure, Immunization, Communication, CareTeam, RelatedPerson, Goal, Consent, AuditEvent, Provenance
  try {
    const fhirCp = toFhirCarePlan({ patientId: '507f1f77bcf86cd799439011', title: 'Hypertension Care Plan' });
    const valCp = validateFhirResource(fhirCp);
    assert(valCp.valid, 'CarePlan Resource Validation');

    const fhirProc = toFhirProcedure({ patientId: '507f1f77bcf86cd799439011', procedureName: 'ECG Examination' });
    const valProc = validateFhirResource(fhirProc);
    assert(valProc.valid, 'Procedure Resource Validation');

    const fhirImm = toFhirImmunization({ patientId: '507f1f77bcf86cd799439011', vaccineName: 'COVID-19 Booster' });
    const valImm = validateFhirResource(fhirImm);
    assert(valImm.valid, 'Immunization Resource Validation');

    const fhirComm = toFhirCommunication({ patientId: '507f1f77bcf86cd799439011', content: 'Take medicine after meals' });
    const valComm = validateFhirResource(fhirComm);
    assert(valComm.valid, 'Communication Resource Validation');

    const fhirTeam = toFhirCareTeam({ patientId: '507f1f77bcf86cd799439011', name: 'Primary Care Team' });
    const valTeam = validateFhirResource(fhirTeam);
    assert(valTeam.valid, 'CareTeam Resource Validation');

    const fhirRel = toFhirRelatedPerson({ patientId: '507f1f77bcf86cd799439011', name: 'Sita Kumar', relationship: 'Spouse' });
    const valRel = validateFhirResource(fhirRel);
    assert(valRel.valid, 'RelatedPerson Resource Validation');

    const fhirGoal = toFhirGoal({ patientId: '507f1f77bcf86cd799439011', description: 'BP under 120/80' });
    const valGoal = validateFhirResource(fhirGoal);
    assert(valGoal.valid, 'Goal Resource Validation');

    const fhirConsent = toFhirConsent({ patientId: '507f1f77bcf86cd799439011', purpose: 'OPD Review' });
    const valConsent = validateFhirResource(fhirConsent);
    assert(valConsent.valid, 'Consent Resource Validation');

    const fhirAudit = toFhirAuditEvent({ action: 'READ', resourceType: 'Patient', resourceId: '507f1f77bcf86cd799439011' });
    const valAudit = validateFhirResource(fhirAudit);
    assert(valAudit.valid, 'AuditEvent Resource Validation');

    const fhirProv = toFhirProvenance({ targetResourceId: '507f1f77bcf86cd799439011', provenanceType: 'AI_GENERATED' });
    const valProv = validateFhirResource(fhirProv);
    assert(valProv.valid, 'Provenance Resource Validation');
  } catch (e) {
    assert(false, `Extended FHIR resources mapping exception: ${e.message}`);
  }

  // 13. Bundle Generation & Invalid Resource Rejection
  try {
    const samplePat = toFhirPatient({ name: 'Test', email: 'test@example.com' });
    const bundle = createBundle({ type: 'collection', resources: [samplePat] });
    const valBundle = validateFhirResource(bundle);
    assert(valBundle.valid && bundle.entry.length === 1, 'FHIR Collection Bundle Generation & Validation');

    const invalidRes = { resourceType: 'InvalidType', status: 'unknown' };
    const valInvalid = validateFhirResource(invalidRes);
    assert(!valInvalid.valid && valInvalid.errors.length > 0, 'FHIR Validator Invalid Resource Rejection Test');
  } catch (e) {
    assert(false, `Bundle generation exception: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runFhirTestSuite();
}

module.exports = runFhirTestSuite;
