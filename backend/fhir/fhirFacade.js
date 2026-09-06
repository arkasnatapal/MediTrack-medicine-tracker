/**
 * MediTrack Developer FHIR SDK & Facade
 * Provides a clean, chainable, developer-friendly API for working with FHIR R4 resources.
 * 
 * Example Usage:
 *   const fhir = require('./fhir/fhirFacade');
 *   const patient = await fhir.patient('695ccf404947e9276ac11cb6').get();
 *   const bundle = await fhir.patient('695ccf404947e9276ac11cb6').everything();
 *   const vitals = await fhir.vitals().search({ name: 'Arka' });
 */

const fhirService = require('./services/fhirService');
const { validateFhirResource } = require('./validators/fhirValidator');

const fhirFacade = {
  /**
   * Patient operations facade.
   */
  patient: (patientId) => ({
    get: async () => fhirService.getResource('Patient', patientId),
    everything: async () => fhirService.getPatientEverythingBundle(patientId),
  }),

  /**
   * Search helper facade.
   */
  search: async (resourceType, queryParams = {}) => {
    return fhirService.searchResources(resourceType, queryParams);
  },

  /**
   * Vitals & Labs helper facade.
   */
  vitals: (patientId) => ({
    search: async (additionalParams = {}) => {
      const params = { ...additionalParams };
      if (patientId) params.patient = patientId;
      return fhirService.searchResources('Observation', params);
    }
  }),

  /**
   * Diagnoses helper facade.
   */
  diagnoses: (patientId) => ({
    search: async (additionalParams = {}) => {
      const params = { ...additionalParams };
      if (patientId) params.patient = patientId;
      return fhirService.searchResources('Condition', params);
    }
  }),

  /**
   * Referrals helper facade.
   */
  referrals: (patientId) => ({
    search: async (additionalParams = {}) => {
      const params = { ...additionalParams };
      if (patientId) params.patient = patientId;
      return fhirService.searchResources('ServiceRequest', params);
    }
  }),

  /**
   * Ingest and validate external FHIR payload.
   */
  import: async (fhirJson) => {
    return fhirService.importBundle(fhirJson);
  },

  /**
   * Validate a resource against HL7 FHIR R4 schema definitions.
   */
  validate: (resource) => {
    return validateFhirResource(resource);
  }
};

module.exports = fhirFacade;
