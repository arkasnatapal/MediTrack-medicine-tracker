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

// Middleware
app.use(cors({
  origin: true, // Dynamically reflect origin to avoid CORS blockage during dev
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Ensure uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch (e) {}
}
app.use('/uploads', express.static(uploadsDir));

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

server.listen(PORT, () => {
  console.log(`🏥 MediTrack Care Network Backend running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => console.log('Care Backend server shut down cleanly.'));
});

module.exports = { app, server };
