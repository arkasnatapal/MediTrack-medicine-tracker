const DEFAULT_BACKEND_URL = 'http://localhost:5002';

export const SERVER_URL = (
  import.meta.env.VITE_INTEROP_API_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_BACKEND_URL
).replace(/\/$/, '');

export const API_BASE = `${SERVER_URL}/api/v1`;
export const FHIR_BASE = `${SERVER_URL}/fhir`;
