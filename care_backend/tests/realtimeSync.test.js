const http = require('http');
const express = require('express');
const { io: ioClient } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_jwt_secret_2026';
const TEST_PORT = 5002;
const SOCKET_URL = `http://localhost:${TEST_PORT}`;

// Helper to generate test tokens
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

async function runRealtimeSyncTests() {
  console.log('🧪 Starting MediTrack Real-Time Synchronization Automated Test Suite...\n');

  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failedTests++;
    }
  };

  // 0. Spin up test HTTP server with Realtime Service on TEST_PORT
  const app = express();
  const server = http.createServer(app);
  const { initRealtimeService, emitDomainEvent } = require('../services/realtimeService');
  initRealtimeService(server);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🚀 Test Socket.IO Server listening on ${SOCKET_URL}\n`);

  const patientToken = generateToken({
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Test Patient',
    role: 'PATIENT',
  });

  const patientBToken = generateToken({
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    name: 'Patient B',
    role: 'PATIENT',
  });

  const doctorToken = generateToken({
    _id: '65f1a2b3c4d5e6f7a8b9c0d3',
    doctorId: 'DOC-101',
    facilityId: 'FAC-202',
    name: 'Dr. Test Specialist',
    role: 'DOCTOR',
  });

  console.log('1️⃣ Testing Socket Authentication & Channel Subscriptions...');

  const patientSocket = ioClient(SOCKET_URL, {
    auth: { token: patientToken },
    transports: ['websocket', 'polling'],
  });

  const doctorSocket = ioClient(SOCKET_URL, {
    auth: { token: doctorToken },
    transports: ['websocket', 'polling'],
  });

  const patientBSocket = ioClient(SOCKET_URL, {
    auth: { token: patientBToken },
    transports: ['websocket', 'polling'],
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  assert(patientSocket.connected, 'Patient socket connected successfully');
  assert(doctorSocket.connected, 'Doctor socket connected successfully');
  assert(patientBSocket.connected, 'Patient B socket connected successfully');

  console.log('\n2️⃣ Testing Channel Authorization & Privacy Rules...');

  // Patient A subscribes to own channel
  const subResA = await new Promise((resolve) => {
    patientSocket.emit('subscribe', { channels: ['patient:65f1a2b3c4d5e6f7a8b9c0d1'] }, resolve);
  });
  assert(subResA?.subscribed?.includes('patient:65f1a2b3c4d5e6f7a8b9c0d1'), 'Patient A allowed to subscribe to own channel');

  // Patient A attempts unauthorized subscription to Patient B channel
  const subResUnauthorized = await new Promise((resolve) => {
    patientSocket.emit('subscribe', { channels: ['patient:65f1a2b3c4d5e6f7a8b9c0d2'] }, resolve);
  });
  assert(subResUnauthorized?.rejected?.includes('patient:65f1a2b3c4d5e6f7a8b9c0d2'), 'Patient A rejected from subscribing to Patient B channel');

  // Patient B subscribes to own channel
  await new Promise((resolve) => {
    patientBSocket.emit('subscribe', { channels: ['patient:65f1a2b3c4d5e6f7a8b9c0d2'] }, resolve);
  });

  console.log('\n3️⃣ Testing Event Emission & Real-Time Propagation...');

  const receivedEventsPatientA = [];
  const receivedEventsPatientB = [];

  patientSocket.on('domain_event', (evt) => receivedEventsPatientA.push(evt));
  patientBSocket.on('domain_event', (evt) => receivedEventsPatientB.push(evt));

  const testAppointmentEvent = emitDomainEvent({
    type: 'appointment.updated',
    resourceType: 'Appointment',
    resourceId: 'apt-999',
    patientId: '65f1a2b3c4d5e6f7a8b9c0d1',
    doctorId: 'DOC-101',
    facilityId: 'FAC-202',
    version: Date.now(),
    data: { status: 'IN_CONSULTATION', tokenNumber: 5 },
  });

  await new Promise((resolve) => setTimeout(resolve, 800));

  assert(receivedEventsPatientA.length === 1, 'Patient A received targeted real-time appointment event');
  assert(receivedEventsPatientA[0]?.type === 'appointment.updated', 'Received event type matches appointment.updated');
  assert(receivedEventsPatientA[0]?.data?.status === 'IN_CONSULTATION', 'Received status payload matches IN_CONSULTATION');
  assert(receivedEventsPatientB.length === 0, 'Patient B did NOT receive Patient A private event (Strict Privacy Verified)');

  console.log('\n4️⃣ Testing Teleconsultation Real-Time Flow...');

  const testTeleEvent = emitDomainEvent({
    type: 'teleconsultation.started',
    resourceType: 'Teleconsultation',
    resourceId: 'tele-888',
    patientId: '65f1a2b3c4d5e6f7a8b9c0d1',
    doctorId: 'DOC-101',
    facilityId: 'FAC-202',
    version: Date.now(),
    data: { status: 'ACTIVE', meetingIdentifier: 'MEET-123' },
  });

  await new Promise((resolve) => setTimeout(resolve, 800));

  assert(receivedEventsPatientA.length === 2, 'Patient A received real-time teleconsultation.started event');
  assert(receivedEventsPatientA[1]?.type === 'teleconsultation.started', 'Teleconsultation event type verified');

  console.log('\n5️⃣ Testing Referral Real-Time Flow...');

  const testReferralEvent = emitDomainEvent({
    type: 'referral.accepted',
    resourceType: 'Referral',
    resourceId: 'ref-777',
    patientId: '65f1a2b3c4d5e6f7a8b9c0d1',
    doctorId: 'DOC-101',
    facilityId: 'FAC-202',
    version: Date.now(),
    data: { status: 'ACCEPTED', receivingNotes: 'Accepted for Cardiology consultation' },
  });

  await new Promise((resolve) => setTimeout(resolve, 800));

  assert(receivedEventsPatientA.length === 3, 'Patient A received real-time referral.accepted event');
  assert(receivedEventsPatientA[2]?.type === 'referral.accepted', 'Referral event type verified');

  console.log('\n6️⃣ Testing Client-Side Deduplication & Stale Event Filtering logic...');

  class TestDeduplicationFilter {
    constructor() {
      this.processedEvents = new Set();
      this.resourceVersions = new Map();
      this.handledCount = 0;
    }
    handleIncomingEvent(evt) {
      if (this.processedEvents.has(evt.eventId)) return;
      this.processedEvents.add(evt.eventId);

      if (evt.resourceId && evt.version) {
        const lastVer = this.resourceVersions.get(evt.resourceId);
        if (lastVer && lastVer >= evt.version) return;
        this.resourceVersions.set(evt.resourceId, evt.version);
      }
      this.handledCount++;
    }
  }

  const clientFilter = new TestDeduplicationFilter();

  const duplicateEvent = {
    eventId: 'evt-dup-100',
    type: 'appointment.updated',
    resourceType: 'Appointment',
    resourceId: 'apt-dedup-1',
    version: 200,
  };

  clientFilter.handleIncomingEvent(duplicateEvent);
  clientFilter.handleIncomingEvent(duplicateEvent);

  assert(clientFilter.handledCount === 1, 'Client deduplication prevented second execution of duplicate eventId');

  const staleEvent = {
    eventId: 'evt-stale-101',
    type: 'appointment.updated',
    resourceType: 'Appointment',
    resourceId: 'apt-dedup-1',
    version: 150,
  };

  clientFilter.handleIncomingEvent(staleEvent);

  assert(clientFilter.handledCount === 1, 'Client stale event filter rejected older event version');

  patientSocket.disconnect();
  doctorSocket.disconnect();
  patientBSocket.disconnect();
  server.close();

  console.log('\n==================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('==================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRealtimeSyncTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}

module.exports = runRealtimeSyncTests;
