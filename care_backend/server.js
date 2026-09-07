// MediTrack Care Network Server - Updated 2026-09-06 T17:47
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');


// Route imports
const authRoutes = require('./routes/authRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const associationRoutes = require('./routes/associationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const referralRoutes = require('./routes/referralRoutes');
const transferRoutes = require('./routes/transferRoutes');
const teleconsultationRoutes = require('./routes/teleconsultationRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const careJourneyRoutes = require('./routes/careJourneyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const livekitRoutes = require('./routes/livekitRoutes');

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

// Express CORS Configuration via Environment Variables & express cors package
const allowedOriginsFromEnv = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [];

const allowedOriginsList = Array.from(new Set([
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'https://meditrack-ultimate.vercel.app',
  'https://meditrack-care-frontend.vercel.app',
  'https://meditrack-care.vercel.app',
  'https://meditrack-backendalpha.vercel.app',
  'https://meditrack-careback.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:3000',
  ...allowedOriginsFromEnv,
])).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      allowedOriginsList.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-user-id',
    'x-facility-id',
    'X-CSRF-Token',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version'
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Explicit header middleware fallback for Vercel/serverless request contexts
app.use((req, res, next) => {
  const origin = req.headers.origin || process.env.CLIENT_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-facility-id, X-CSRF-Token, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: '50mb', type: ['application/json', 'application/fhir+json', 'application/*+json'] }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Ensure uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch (e) {}
}
app.use('/uploads', express.static(uploadsDir));

// Ensure Database Connection for Serverless Execution
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Care DB connection error:', err.message);
    next(err);
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'MediTrack Care Network Provider Backend', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/facility-doctors', associationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/teleconsultations', teleconsultationRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/care-journey', careJourneyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/livekit', livekitRoutes);

// HL7 FHIR Interoperability API Routes (Shared Core - Instant Fast Resolved V4)
let fhirRoutes;
try {
  fhirRoutes = require('./fhir/routes/fhirRoutes');
} catch (e) {
  try {
    fhirRoutes = require('../backend/fhir/routes/fhirRoutes');
  } catch (err) {
    console.error('❌ Error loading FHIR routes:', e.message);
  }
}
if (fhirRoutes) {
  app.use('/fhir', fhirRoutes);
  app.use('/api/fhir', fhirRoutes);
  console.log('✅ FHIR R4 routes mounted at /fhir and /api/fhir');
} else {
  console.error('❌ WARNING: FHIR routes failed to mount!');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Care Backend Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is currently in use. Please stop the existing process using port ${PORT} and retry.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🏥 MediTrack Care Network Backend running on http://localhost:${PORT}`);
  });
}

process.on('SIGTERM', () => {
  server.close(() => console.log('Care Backend server shut down cleanly.'));
});

module.exports = app;
