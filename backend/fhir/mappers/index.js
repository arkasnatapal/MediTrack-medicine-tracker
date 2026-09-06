/**
 * Centralized HL7 FHIR R4 Mapper Registry
 * Exports all bi-directional resource converters for MediTrack.
 */

const patientMapper = require('./patientMapper');
const practitionerMapper = require('./practitionerMapper');
const organizationMapper = require('./organizationMapper');
const observationMapper = require('./observationMapper');
const conditionMapper = require('./conditionMapper');
const medicationMapper = require('./medicationMapper');
const allergyMapper = require('./allergyMapper');
const diagnosticReportMapper = require('./diagnosticReportMapper');
const documentReferenceMapper = require('./documentReferenceMapper');
const appointmentMapper = require('./appointmentMapper');
const encounterMapper = require('./encounterMapper');
const serviceRequestMapper = require('./serviceRequestMapper');
const taskMapper = require('./taskMapper');
const carePlanMapper = require('./carePlanMapper');
const procedureMapper = require('./procedureMapper');
const immunizationMapper = require('./immunizationMapper');
const communicationMapper = require('./communicationMapper');
const careTeamMapper = require('./careTeamMapper');
const relatedPersonMapper = require('./relatedPersonMapper');
const goalMapper = require('./goalMapper');
const consentMapper = require('./consentMapper');
const auditEventMapper = require('./auditEventMapper');
const provenanceMapper = require('./provenanceMapper');

module.exports = {
  ...patientMapper,
  ...practitionerMapper,
  ...organizationMapper,
  ...observationMapper,
  ...conditionMapper,
  ...medicationMapper,
  ...allergyMapper,
  ...diagnosticReportMapper,
  ...documentReferenceMapper,
  ...appointmentMapper,
  ...encounterMapper,
  ...serviceRequestMapper,
  ...taskMapper,
  ...carePlanMapper,
  ...procedureMapper,
  ...immunizationMapper,
  ...communicationMapper,
  ...relatedPersonMapper,
  ...goalMapper,
  ...consentMapper,
  ...auditEventMapper,
  ...provenanceMapper,
};
