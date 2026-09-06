/**
 * Bidirectional Mapper: MediTrack Diagnostic Orders / Lab Reports <-> FHIR R4 DiagnosticReport Resource.
 */

const { getLoincCode } = require('../terminology/loinc');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack Lab Report or Diagnostic Order to FHIR R4 DiagnosticReport.
 */
function toFhirDiagnosticReport({
  id = null,
  patientId,
  testName, // e.g. "Complete Blood Count", "Lipid Profile", "HbA1c"
  category = 'LAB', // 'LAB' | 'RAD' | 'CARD'
  status = 'final',
  effectiveDateTime = new Date().toISOString(),
  performerId = null,
  observationIds = [], // Array of Observation resource IDs
  reportUrl = null,
  conclusion = ''
}) {
  const diagId = String(id || `diag-${patientId}-${Date.now()}`);
  const loincInfo = getLoincCode(testName, testName);

  const categoryCoding = [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: category === 'RADIOLOGY' ? 'RAD' : 'LAB',
          display: category === 'RADIOLOGY' ? 'Radiology' : 'Laboratory'
        }
      ]
    }
  ];

  const code = {
    coding: [
      {
        system: loincInfo.system,
        code: loincInfo.code,
        display: loincInfo.display
      }
    ],
    text: testName || loincInfo.display
  };

  const subject = {
    reference: `Patient/${patientId}`
  };

  const result = observationIds.map(obsId => ({
    reference: `Observation/${obsId}`
  }));

  const performer = performerId ? [{ reference: `Practitioner/${performerId}` }] : undefined;

  const presentedForm = reportUrl ? [
    {
      contentType: reportUrl.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      url: reportUrl,
      title: `${testName} Official Report`
    }
  ] : undefined;

  return {
    resourceType: 'DiagnosticReport',
    id: diagId,
    status: status,
    category: categoryCoding,
    code: code,
    subject: subject,
    effectiveDateTime: new Date(effectiveDateTime).toISOString(),
    issued: new Date().toISOString(),
    performer: performer,
    result: result.length > 0 ? result : undefined,
    conclusion: conclusion || undefined,
    presentedForm: presentedForm
  };
}

/**
 * Convert FHIR DiagnosticReport back into MediTrack diagnostic object.
 */
function fromFhirDiagnosticReport(fhirDiag) {
  if (!fhirDiag || fhirDiag.resourceType !== 'DiagnosticReport') {
    throw new Error('Invalid FHIR DiagnosticReport resource');
  }

  const validation = validateFhirResource(fhirDiag);
  if (!validation.valid) {
    throw new Error(`FHIR DiagnosticReport Validation Failed: ${validation.errors.join(', ')}`);
  }

  const testName = fhirDiag.code?.text || fhirDiag.code?.coding?.[0]?.display || 'Laboratory Test';
  const patientRef = fhirDiag.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');
  const reportUrl = fhirDiag.presentedForm?.[0]?.url || null;

  return {
    fhirId: fhirDiag.id,
    patientId: patientId,
    testName: testName,
    status: fhirDiag.status,
    reportUrl: reportUrl,
    effectiveDateTime: fhirDiag.effectiveDateTime
  };
}

module.exports = {
  toFhirDiagnosticReport,
  fromFhirDiagnosticReport
};
