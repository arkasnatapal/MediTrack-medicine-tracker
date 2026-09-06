/**
 * Bidirectional Mapper: MediTrack Uploaded Documents / Attachments <-> FHIR R4 DocumentReference Resource.
 */

const { getLoincCode } = require('../terminology/loinc');
const { validateFhirResource } = require('../validators/fhirValidator');

/**
 * Map MediTrack File Upload / Medical Document to FHIR R4 DocumentReference.
 */
function toFhirDocumentReference({
  id = null,
  patientId,
  documentType = 'LAB_REPORT_DOCUMENT', // 'PRESCRIPTION_DOCUMENT' | 'DISCHARGE_SUMMARY' | 'REFERRAL_DOCUMENT' | 'LAB_REPORT_DOCUMENT'
  title,
  fileUrl,
  mimeType = 'application/pdf',
  createdDate = new Date().toISOString(),
  authorId = null,
  status = 'current'
}) {
  const docId = String(id || `doc-${patientId}-${Date.now()}`);
  const loincInfo = getLoincCode(documentType, documentType);

  const type = {
    coding: [
      {
        system: loincInfo.system,
        code: loincInfo.code,
        display: loincInfo.display
      }
    ],
    text: title || loincInfo.display
  };

  const subject = {
    reference: `Patient/${patientId}`
  };

  const author = authorId ? [{ reference: `Practitioner/${authorId}` }] : undefined;

  const content = [
    {
      attachment: {
        contentType: mimeType,
        url: fileUrl,
        title: title || loincInfo.display,
        creation: new Date(createdDate).toISOString()
      }
    }
  ];

  return {
    resourceType: 'DocumentReference',
    id: docId,
    status: status,
    type: type,
    subject: subject,
    date: new Date(createdDate).toISOString(),
    author: author,
    content: content
  };
}

/**
 * Convert FHIR DocumentReference back into MediTrack Document object.
 */
function fromFhirDocumentReference(fhirDocRef) {
  if (!fhirDocRef || fhirDocRef.resourceType !== 'DocumentReference') {
    throw new Error('Invalid FHIR DocumentReference resource');
  }

  const validation = validateFhirResource(fhirDocRef);
  if (!validation.valid) {
    throw new Error(`FHIR DocumentReference Validation Failed: ${validation.errors.join(', ')}`);
  }

  const title = fhirDocRef.content?.[0]?.attachment?.title || fhirDocRef.type?.text || 'Clinical Document';
  const fileUrl = fhirDocRef.content?.[0]?.attachment?.url || '';
  const patientRef = fhirDocRef.subject?.reference || '';
  const patientId = patientRef.replace('Patient/', '');

  return {
    fhirId: fhirDocRef.id,
    patientId: patientId,
    title: title,
    fileUrl: fileUrl,
    mimeType: fhirDocRef.content?.[0]?.attachment?.contentType || 'application/pdf',
    status: fhirDocRef.status,
    createdDate: fhirDocRef.date
  };
}

module.exports = {
  toFhirDocumentReference,
  fromFhirDocumentReference
};
