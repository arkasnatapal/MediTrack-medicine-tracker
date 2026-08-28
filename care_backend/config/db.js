const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ Care Network MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Care Network DB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
