require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const ayurvedicRoutes = require('./routes/ayurvedicRoutes'); // New Route
const medicineRoutes = require('./routes/medicineRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
// [REMOVED] cron job imports
const connectDB = require('./config/db');

// Connect to database
connectDB();


const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir);
  } catch (err) {
    console.log('Could not create uploads directory (likely read-only filesystem), skipping.');
  }
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb', type: ['application/json', 'application/fhir+json', 'application/*+json'] }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MediTrack API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/auth/google", googleAuthRoutes);
app.use('/api/medicines', require('./routes/medicineOrganizationRoutes'));
app.use('/api/medicines', medicineRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ayurvedic', ayurvedicRoutes); // Register Route
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ai', require('./routes/aiMedicineRoutes'));
app.use('/api/chat-sessions', require('./routes/chatSessionRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/ai-reminders', require('./routes/aiReminderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/pending-reminders', require('./routes/pendingReminderRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard/intelligence', require('./routes/intelligenceRoutes'));
app.use('/api/medicine-catalog', require('./routes/medicineCatalogRoutes'));
app.use('/api/daily-review', require('./routes/dailyReviewRoutes'));
app.use('/api/medicine-logs', require('./routes/medicineLogRoutes'));
app.use('/api/cron', require('./routes/cronRoutes'));
app.use('/api/women-health', require('./routes/womenHealth.routes'));
app.use('/api/emergency', require('./src/emergency/emergency.routes'));
app.use('/api/hospital-details', require('./src/hospital-detail/hospital-detail.routes'));
app.use('/api/checkups', require('./routes/checkupRoutes'));
app.use('/api/care-network', require('./routes/careNetworkRoutes'));
app.use('/api/abdm', require('./routes/abdmRoutes'));

const fhirRoutes = require('./fhir/routes/fhirRoutes');
app.use('/fhir', fhirRoutes);
app.use('/api/fhir', fhirRoutes);

const googleRoutes = require("./routes/googleRoutes");
app.use("/api/google", googleRoutes);
app.use('/api/nutrition', require('./routes/nutritionRoutes'));

// Error handling middleware
app.use(errorMiddleware);
// Note: activityTracker is best integrated into the Application's auth middleware 
// or applied to specific routes. We will integrate it into the Auth Middleware in the next step.


// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// [REMOVED] Automatic cron startup
// Cron jobs are now triggered via HTTP endpoints in /api/cron

// [REMOVED] Initialize Living Health OS Workers
// require('./src/living-os/workers');

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is currently in use. Stop any process occupying port ${PORT} before retrying.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

module.exports = app;
