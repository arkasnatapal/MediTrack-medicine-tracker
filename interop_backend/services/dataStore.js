const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { mapPatientToFhir, mapObservationToFhir, mapEncounterToFhir, mapConditionToFhir, mapMedicationRequestToFhir, mapDiagnosticReportToFhir } = require('../fhir/mappers/resourceMapper');

// In-Memory Data Repositories for ultra-fast response & offline resiliency
const memoryStore = {
  organizations: [],
  clients: [],
  clinicalResources: [],
  webhooks: [],
  webhookLogs: [],
  auditLogs: [],
  consents: []
};

// Seed initial default dataset
function seedInitialData() {
  if (memoryStore.organizations.length > 0) return;

  console.log('📦 Seeding MediTrack Interop Platform initial dataset into memory store...');

  // 1. Seed Organizations
  memoryStore.organizations.push(
    {
      _id: 'org_apollo_metro',
      identifier: 'org_apollo_metro',
      name: 'Apollo Metro Hospital & Heart Center',
      type: 'prov',
      active: true,
      phone: '+91-11-29876543',
      email: 'interop@apollometro.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'org_max_healthcare',
      identifier: 'org_max_healthcare',
      name: 'Max Super Speciality Hospital',
      type: 'prov',
      active: true,
      phone: '+91-11-49871100',
      email: 'fhir@maxhealthcare.in',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  // 2. Seed Default OAuth Clients
  const secretHashDemo = bcrypt.hashSync('sec_demo', 8);
  memoryStore.clients.push(
    {
      _id: 'cli_apollo_metro_981273',
      clientId: 'cli_apollo_metro_981273',
      clientSecretHash: secretHashDemo,
      rawSecret: 'sec_demo',
      name: 'Apollo Metro EHR Integration Engine',
      organizationId: 'org_apollo_metro',
      scopes: ['patient/*.read', 'patient/*.write', 'observation/*.read', 'observation/*.write', 'encounter/*.read', 'medication/*.read'],
      role: 'Enterprise Hospital Client',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cli_demo_default',
      clientId: 'cli_demo_default',
      clientSecretHash: secretHashDemo,
      rawSecret: 'sec_demo',
      name: 'MediTrack Developer Sandbox Client',
      organizationId: 'org_apollo_metro',
      scopes: ['*'],
      role: 'Platform Admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  // 3. Seed Clinical Resources
  // Patient 1: Rahul Verma
  const p1 = mapPatientToFhir({
    name: 'Rahul Verma',
    firstName: 'Rahul',
    lastName: 'Verma',
    phone: '+91-9876543210',
    email: 'rahul.verma@example.com',
    gender: 'male',
    birthDate: '1988-04-12',
    abhaNumber: '14-8201-9304-8192',
    address: { street: '42 Ring Road, Lajpat Nagar', city: 'New Delhi', state: 'Delhi' }
  }, 'Patient-Rahul-Verma');

  // Patient 2: Ananya Sharma
  const p2 = mapPatientToFhir({
    name: 'Ananya Sharma',
    firstName: 'Ananya',
    lastName: 'Sharma',
    phone: '+91-9123456789',
    email: 'ananya.sharma@example.com',
    gender: 'female',
    birthDate: '1995-09-24',
    abhaNumber: '91-3049-1182-4401',
    address: { street: '15 MG Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka' }
  }, 'Patient-Ananya-Sharma');

  // Patient 3: Test Patient
  const p3 = mapPatientToFhir({
    name: 'Test Patient',
    firstName: 'Test',
    lastName: 'Patient',
    phone: '+91-9000000000',
    gender: 'male',
    birthDate: '1990-01-01'
  }, 'Patient-Test-001');

  memoryStore.clinicalResources.push(
    { organizationId: 'org_apollo_metro', resourceType: 'Patient', fhirId: 'Patient-Rahul-Verma', patientId: 'Patient-Rahul-Verma', status: 'active', resource: p1, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Patient', fhirId: 'Patient-Ananya-Sharma', patientId: 'Patient-Ananya-Sharma', status: 'active', resource: p2, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Patient', fhirId: 'Patient-Test-001', patientId: 'Patient-Test-001', status: 'active', resource: p3, createdAt: new Date() },
    { organizationId: 'org_test', resourceType: 'Patient', fhirId: 'Patient-Test-001', patientId: 'Patient-Test-001', status: 'active', resource: p3, createdAt: new Date() }
  );

  // Observations
  const obs1 = mapObservationToFhir({ patientId: 'Patient-Rahul-Verma', loincCode: '8310-5', display: 'Body temperature', value: 38.2, unit: 'Cel' }, 'Obs-Rahul-Temp');
  const obs2 = mapObservationToFhir({ patientId: 'Patient-Rahul-Verma', loincCode: '8480-6', display: 'Systolic blood pressure', value: 135, unit: 'mm[Hg]' }, 'Obs-Rahul-BP');
  const obs3 = mapObservationToFhir({ patientId: 'Patient-Ananya-Sharma', loincCode: '2339-0', display: 'Glucose [Mass/volume] in Blood', value: 110, unit: 'mg/dL' }, 'Obs-Ananya-Glucose');
  const obs4 = mapObservationToFhir({ patientId: 'Patient-Ananya-Sharma', loincCode: '8837-1', display: 'Heart rate', value: 72, unit: '/min' }, 'Obs-Ananya-HR');

  memoryStore.clinicalResources.push(
    { organizationId: 'org_apollo_metro', resourceType: 'Observation', fhirId: 'Obs-Rahul-Temp', patientId: 'Patient-Rahul-Verma', status: 'final', resource: obs1, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Observation', fhirId: 'Obs-Rahul-BP', patientId: 'Patient-Rahul-Verma', status: 'final', resource: obs2, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Observation', fhirId: 'Obs-Ananya-Glucose', patientId: 'Patient-Ananya-Sharma', status: 'final', resource: obs3, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Observation', fhirId: 'Obs-Ananya-HR', patientId: 'Patient-Ananya-Sharma', status: 'final', resource: obs4, createdAt: new Date() }
  );

  // Encounters
  const enc1 = mapEncounterToFhir({ patientId: 'Patient-Rahul-Verma', reason: 'Acute Fever and High Blood Pressure Checkup', classCode: 'AMB' }, 'Encounter-Rahul-001');
  const enc2 = mapEncounterToFhir({ patientId: 'Patient-Ananya-Sharma', reason: 'Routine Diabetes Follow-up & Vitals Assessment', classCode: 'AMB' }, 'Encounter-Ananya-002');
  memoryStore.clinicalResources.push(
    { organizationId: 'org_apollo_metro', resourceType: 'Encounter', fhirId: 'Encounter-Rahul-001', patientId: 'Patient-Rahul-Verma', status: 'finished', resource: enc1, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Encounter', fhirId: 'Encounter-Ananya-002', patientId: 'Patient-Ananya-Sharma', status: 'finished', resource: enc2, createdAt: new Date() }
  );

  // Conditions
  const cond1 = mapConditionToFhir({ patientId: 'Patient-Rahul-Verma', snomedCode: '59621000', display: 'Essential hypertension' }, 'Cond-Rahul-Hypertension');
  const cond2 = mapConditionToFhir({ patientId: 'Patient-Ananya-Sharma', snomedCode: '44054006', display: 'Type 2 diabetes mellitus' }, 'Cond-Ananya-Diabetes');
  memoryStore.clinicalResources.push(
    { organizationId: 'org_apollo_metro', resourceType: 'Condition', fhirId: 'Cond-Rahul-Hypertension', patientId: 'Patient-Rahul-Verma', status: 'active', resource: cond1, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'Condition', fhirId: 'Cond-Ananya-Diabetes', patientId: 'Patient-Ananya-Sharma', status: 'active', resource: cond2, createdAt: new Date() }
  );

  // Medications
  const med1 = mapMedicationRequestToFhir({ patientId: 'Patient-Rahul-Verma', rxNormCode: '312961', medicationName: 'Paracetamol 500 MG Oral Tablet', dosageText: '1 tablet every 8 hours as needed for fever' }, 'MedReq-Rahul-Paracetamol');
  const med2 = mapMedicationRequestToFhir({ patientId: 'Patient-Ananya-Sharma', rxNormCode: '860975', medicationName: 'Metformin hydrochloride 500 MG Oral Tablet', dosageText: '1 tablet twice daily with meals' }, 'MedReq-Ananya-Metformin');
  memoryStore.clinicalResources.push(
    { organizationId: 'org_apollo_metro', resourceType: 'MedicationRequest', fhirId: 'MedReq-Rahul-Paracetamol', patientId: 'Patient-Rahul-Verma', status: 'active', resource: med1, createdAt: new Date() },
    { organizationId: 'org_apollo_metro', resourceType: 'MedicationRequest', fhirId: 'MedReq-Ananya-Metformin', patientId: 'Patient-Ananya-Sharma', status: 'active', resource: med2, createdAt: new Date() }
  );

  // 4. Seed Webhook Subscriptions
  memoryStore.webhooks.push({
    _id: 'wh_apollo_01',
    organizationId: 'org_apollo_metro',
    name: 'Apollo Metro EHR Event Listener',
    url: 'http://localhost:5002/api/v1/sandbox/webhook-echo',
    secret: 'whsec_981273891723891723891723',
    events: ['patient.created', 'observation.created', 'encounter.finished'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 5. Seed Delivery Logs
  memoryStore.webhookLogs.push({
    _id: 'whlog_01',
    subscriptionId: 'wh_apollo_01',
    organizationId: 'org_apollo_metro',
    event: 'patient.created',
    eventId: 'evt_1725628190_ab12',
    targetUrl: 'http://localhost:5002/api/v1/sandbox/webhook-echo',
    payload: { id: 'evt_1725628190_ab12', event: 'patient.created', organizationId: 'org_apollo_metro', data: p1 },
    statusCode: 200,
    success: true,
    attempt: 1,
    latencyMs: 14,
    createdAt: new Date()
  });

  // 6. Seed Audit Events
  memoryStore.auditLogs.push(
    {
      _id: 'audit_01',
      type: 'FHIR-READ',
      action: 'R',
      actor: { name: 'Apollo Metro EHR Engine', role: 'Integration Client', orgId: 'org_apollo_metro' },
      resourceType: 'Patient',
      resourceId: 'Patient-Rahul-Verma',
      requestPath: '/fhir/Patient/Patient-Rahul-Verma',
      method: 'GET',
      statusCode: 200,
      outcome: '0',
      details: 'Patient demographics read by authorized integration client.',
      ipAddress: '127.0.0.1',
      timestamp: new Date()
    },
    {
      _id: 'audit_02',
      type: 'OAUTH-TOKEN',
      action: 'E',
      actor: { name: 'cli_apollo_metro_981273', role: 'Enterprise Hospital Client', orgId: 'org_apollo_metro' },
      resourceType: 'AuthToken',
      resourceId: 'token_jwt',
      requestPath: '/api/v1/auth/token',
      method: 'POST',
      statusCode: 200,
      outcome: '0',
      details: 'OAuth 2.0 Client Credentials access token generated successfully.',
      ipAddress: '127.0.0.1',
      timestamp: new Date()
    }
  );

  console.log(`✅ Memory store seeded: ${memoryStore.clinicalResources.length} FHIR resources, ${memoryStore.clients.length} clients, ${memoryStore.webhooks.length} webhooks.`);
}

// Auto-run seed
seedInitialData();

// Store API Access methods
const store = {
  // Clinical Resources
  async findClinicalResources(filter = {}, limit = 100) {
    let result = memoryStore.clinicalResources.filter(item => {
      if (filter.organizationId && item.organizationId !== filter.organizationId) return false;
      if (filter.resourceType && item.resourceType !== filter.resourceType) return false;
      if (filter.fhirId && item.fhirId !== filter.fhirId) return false;
      if (filter.patientId && item.patientId !== filter.patientId) return false;
      if (filter.status && item.status !== filter.status) return false;
      if (filter['resource.name.0.text'] && filter['resource.name.0.text'].$regex) {
        const regex = new RegExp(filter['resource.name.0.text'].$regex, filter['resource.name.0.text'].$options || 'i');
        const text = item.resource?.name?.[0]?.text || '';
        if (!regex.test(text)) return false;
      }
      return true;
    });

    // Handle $or filtering (e.g. for $everything)
    if (filter.$or && Array.isArray(filter.$or)) {
      result = memoryStore.clinicalResources.filter(item => {
        if (filter.organizationId && item.organizationId !== filter.organizationId) return false;
        return filter.$or.some(clause => {
          if (clause.resourceType && item.resourceType !== clause.resourceType) return false;
          if (clause.fhirId && item.fhirId !== clause.fhirId) return false;
          if (clause.patientId && item.patientId !== clause.patientId) return false;
          return true;
        });
      });
    }

    return result.slice(0, limit);
  },

  async findOneClinicalResource(filter) {
    const list = await this.findClinicalResources(filter, 1);
    return list[0] || null;
  },

  async saveClinicalResource(recordData) {
    const existingIndex = memoryStore.clinicalResources.findIndex(r =>
      r.organizationId === recordData.organizationId &&
      r.resourceType === recordData.resourceType &&
      r.fhirId === recordData.fhirId
    );

    const record = {
      _id: existingIndex >= 0 ? memoryStore.clinicalResources[existingIndex]._id : 'rec_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      organizationId: recordData.organizationId,
      resourceType: recordData.resourceType,
      fhirId: recordData.fhirId,
      patientId: recordData.patientId || null,
      status: recordData.status || 'active',
      resource: recordData.resource,
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      memoryStore.clinicalResources[existingIndex] = record;
    } else {
      record.createdAt = new Date();
      memoryStore.clinicalResources.push(record);
    }

    return record;
  },

  async deleteClinicalResources(filter) {
    const beforeCount = memoryStore.clinicalResources.length;
    memoryStore.clinicalResources = memoryStore.clinicalResources.filter(item => {
      if (filter.organizationId && item.organizationId !== filter.organizationId) return true;
      if (filter.resourceType && item.resourceType !== filter.resourceType) return true;
      if (filter.fhirId && item.fhirId !== filter.fhirId) return true;
      return false;
    });
    return { deletedCount: beforeCount - memoryStore.clinicalResources.length };
  },

  // API Clients
  async findClients(filter = {}) {
    return memoryStore.clients.filter(c => {
      if (filter.organizationId && c.organizationId !== filter.organizationId) return false;
      if (filter.clientId && c.clientId !== filter.clientId) return false;
      if (filter.active !== undefined && c.active !== filter.active) return false;
      return true;
    });
  },

  async findOneClient(filter) {
    const clients = await this.findClients(filter);
    return clients[0] || null;
  },

  async createClient(clientData) {
    const newClient = {
      _id: 'cli_' + Date.now(),
      clientId: clientData.clientId,
      clientSecretHash: clientData.clientSecretHash,
      rawSecret: clientData.rawSecret,
      name: clientData.name,
      organizationId: clientData.organizationId,
      scopes: clientData.scopes || ['patient/*.read'],
      role: clientData.role || 'Integration Client',
      active: clientData.active !== undefined ? clientData.active : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.clients.push(newClient);
    return newClient;
  },

  // Webhooks
  async findWebhooks(filter = {}) {
    return memoryStore.webhooks.filter(w => {
      if (filter.organizationId && w.organizationId !== filter.organizationId) return false;
      if (filter._id && w._id !== filter._id) return false;
      if (filter.events && Array.isArray(w.events)) {
        if (!w.events.includes(filter.events)) return false;
      }
      if (filter.active !== undefined && w.active !== filter.active) return false;
      return true;
    });
  },

  async createWebhook(data) {
    const sub = {
      _id: 'wh_' + Date.now(),
      organizationId: data.organizationId,
      name: data.name,
      url: data.url,
      secret: data.secret,
      events: data.events,
      active: data.active !== undefined ? data.active : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.webhooks.push(sub);
    return sub;
  },

  async deleteWebhook(id, orgId) {
    const before = memoryStore.webhooks.length;
    memoryStore.webhooks = memoryStore.webhooks.filter(w => !(w._id === id && w.organizationId === orgId));
    return { deletedCount: before - memoryStore.webhooks.length };
  },

  // Webhook Logs
  async findWebhookLogs(filter = {}, limit = 50) {
    return memoryStore.webhookLogs
      .filter(l => !filter.organizationId || l.organizationId === filter.organizationId)
      .reverse()
      .slice(0, limit);
  },

  async createWebhookLog(logData) {
    const log = {
      _id: 'whlog_' + Date.now(),
      ...logData,
      createdAt: new Date()
    };
    memoryStore.webhookLogs.push(log);
    return log;
  },

  // Audit Logs
  async findAuditLogs(filter = {}, limit = 100) {
    return memoryStore.auditLogs
      .filter(a => !filter.orgId || a.actor?.orgId === filter.orgId)
      .reverse()
      .slice(0, limit);
  },

  async createAuditLog(logData) {
    const entry = {
      _id: 'audit_' + Date.now(),
      ...logData,
      timestamp: new Date()
    };
    memoryStore.auditLogs.push(entry);
    return entry;
  },

  // Organizations
  async findOneOrganization(filter) {
    return memoryStore.organizations.find(o => o.identifier === filter.identifier || o._id === filter.identifier) || null;
  },

  async saveOrganization(orgData) {
    let org = memoryStore.organizations.find(o => o.identifier === orgData.identifier);
    if (org) {
      Object.assign(org, orgData, { updatedAt: new Date() });
    } else {
      org = { _id: orgData.identifier || 'org_' + Date.now(), ...orgData, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.organizations.push(org);
    }
    return org;
  }
};

module.exports = store;
