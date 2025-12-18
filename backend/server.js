require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const medicineRoutes = require('./routes/medicineRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { startCronJobs } = require('./jobs/cronJobs');
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
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const googleRoutes = require("./routes/googleRoutes");
app.use("/api/google", googleRoutes);

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start cron jobs
startCronJobs();

const { startReminderScheduler } = require("./jobs/reminderScheduler");
startReminderScheduler();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
