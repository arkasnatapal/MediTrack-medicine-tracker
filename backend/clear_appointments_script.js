const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';

async function clearAllAppointments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;

    const collectionsToClear = ['appointments', 'careappointments', 'queues', 'carequeues', 'queuestatuses'];

    for (const colName of collectionsToClear) {
      try {
        const result = await db.collection(colName).deleteMany({});
        console.log(`Cleared ${result.deletedCount} documents from collection: ${colName}`);
      } catch (err) {
        console.log(`Note on clearing ${colName}: ${err.message}`);
      }
    }

    console.log('All appointment and queue collections cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing appointments:', error);
    process.exit(1);
  }
}

clearAllAppointments();
