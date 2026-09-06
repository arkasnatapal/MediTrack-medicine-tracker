const axios = require('axios');

async function testFlow() {
  console.log('--- Testing Full Facility Ingestion & Search Flow ---');

  // 1. Login as facility admin
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: '6a99da124476ed249dbda696', role: 'FACILITY_ADMIN' },
    'meditrack_care_network_super_secret_key_2026',
    { expiresIn: '1h' }
  );
  const facilityId = '6a99da124476ed249dbda694';
  console.log('Using Facility Admin JWT Token for facilityId:', facilityId);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Ingest Sample Vital
  const testVital = {
    resourceType: "Observation",
    id: "vital-auto-linked-test-" + Date.now(),
    status: "final",
    subject: { reference: "Patient/sample-patient-001", display: "Test Patient" },
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }
        ]
      }
    ],
    code: {
      coding: [
        { system: "http://loinc.org", code: "8310-5", display: "Body Temperature" }
      ],
      text: "Body Temperature"
    },
    valueQuantity: {
      value: 38.6,
      unit: "C"
    },
    effectiveDateTime: new Date().toISOString()
  };

  console.log('\n2. Posting Ingestion Request to http://localhost:5001/fhir/Bundle/import...');
  try {
    const ingestRes = await axios.post('http://localhost:5001/fhir/Bundle/import', testVital, {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/fhir+json'
      }
    });
    console.log('Ingestion Response:', JSON.stringify(ingestRes.data, null, 2));
  } catch (e) {
    console.error('Ingestion error:', e.response?.data || e.message);
  }

  // 3. Search Observation with params as frontend does
  console.log('\n3. Searching Observation via GET http://localhost:5001/fhir/Observation...');
  const searchParams = facilityId ? { facilityId } : {};
  try {
    const searchRes = await axios.get('http://localhost:5001/fhir/Observation', {
      params: searchParams,
      headers: authHeaders
    });
    console.log(`Search Response HTTP ${searchRes.status}. Bundle Total: ${searchRes.data?.total}`);
    console.log('Search Entries:', JSON.stringify(searchRes.data?.entry || [], null, 2));
  } catch (e) {
    console.error('Search error:', e.response?.data || e.message);
  }
}

testFlow();
