require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const { authenticateToken } = require('./middleware/authMiddleware');
const fhirRoutes = require('./fhir/routes/fhirRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const encounterRoutes = require('./routes/encounterRoutes');
const observationRoutes = require('./routes/observationRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const triageRoutes = require('./routes/triageRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const clientRoutes = require('./routes/clientRoutes');
const sandboxRoutes = require('./routes/sandboxRoutes');

const auditRoutes = require('./routes/auditRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb', type: ['application/json', 'application/fhir+json', 'application/*+json'] }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Probes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'MediTrack Interoperability Platform Gateway & FHIR Server',
    version: '1.0.0',
    fhirVersion: '4.0.1',
    timestamp: new Date().toISOString()
  });
});

app.get('/readiness', (req, res) => {
  res.json({
    status: 'READY',
    database: 'CONNECTED',
    fhirEngine: 'ONLINE'
  });
});

// OAuth Auth Routes (Public)
app.use('/api/v1/auth', authRoutes);

// Protected API & FHIR Routes
app.use('/fhir', authenticateToken, fhirRoutes);
app.use('/api/v1/patients', authenticateToken, patientRoutes);
app.use('/api/v1/encounters', authenticateToken, encounterRoutes);
app.use('/api/v1/observations', authenticateToken, observationRoutes);
app.use('/api/v1/medications', authenticateToken, medicationRoutes);
app.use('/api/v1/triage', authenticateToken, triageRoutes);
app.use('/api/v1/webhooks', authenticateToken, webhookRoutes);
app.use('/api/v1/clients', authenticateToken, clientRoutes);
app.use('/api/v1/sandbox', authenticateToken, sandboxRoutes);
app.use('/api/v1/audit', authenticateToken, auditRoutes);


// Root fallback
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MediTrack FHIR-First Healthcare Interoperability Platform Gateway',
    fhirEndpoint: '/fhir',
    apiEndpoint: '/api/v1',
    documentation: '/docs'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MediTrack Interoperability Platform running on http://localhost:${PORT}`);
  console.log(`🏥 FHIR R4 Endpoint: http://localhost:${PORT}/fhir`);
  console.log(`🔑 REST API Gateway: http://localhost:${PORT}/api/v1`);
});

module.exports = app;
