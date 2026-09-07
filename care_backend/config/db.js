const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    const conn = await mongoose.connect(mongoUri);
    isConnected = !!conn.connections[0].readyState;
    console.log(`✅ Care Network MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Care Network DB Error: ${error.message}`);
  }
};

module.exports = connectDB;
