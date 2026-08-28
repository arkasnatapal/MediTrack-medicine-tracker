require('dotenv').config();
const mongoose = require('mongoose');
const TeleconsultationSession = require('../models/TeleconsultationSession');

async function clearTeleconsultations() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:Arka%402004@cluster0.a55xu4a.mongodb.net/meditrack_care_network?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('🏥 Connected to MongoDB...');

    const result = await TeleconsultationSession.deleteMany({});
    console.log(`🧹 Deleted ${result.deletedCount} teleconsultation session(s) from MongoDB!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing teleconsultations:', err);
    process.exit(1);
  }
}

clearTeleconsultations();
