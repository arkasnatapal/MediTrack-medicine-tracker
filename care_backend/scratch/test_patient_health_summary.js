const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function testEndpoint() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    const patientRecord = await db.collection('patientrecords').findOne({ name: /ARKA/i });

    if (!patientRecord) {
      console.log('Patient record not found');
      process.exit(1);
    }

    console.log('Testing lookup for patient ID:', patientRecord._id.toString());

    // Make an HTTP request to local backend or test function directly
    const http = require('http');
    const req = http.get(`http://localhost:5001/api/appointments/patient-health-summary/${patientRecord._id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\n--- API HEALTH SUMMARY RESPONSE ---');
          console.log('Success:', json.success);
          console.log('Patient Name:', json.patient?.name);
          console.log('MediTrack Linked:', json.mediTrackUser?.isLinked, 'Score:', json.mediTrackUser?.healthScore, 'State:', json.mediTrackUser?.healthState);
          console.log('Active Medications Count:', json.activeMedications?.length);
          if (json.activeMedications?.length > 0) {
            console.log('Sample Med:', json.activeMedications[0].name, 'Dosage:', json.activeMedications[0].dosage);
          }
          console.log('Previous Reports Count:', json.previousReports?.length);
          if (json.previousReports?.length > 0) {
            console.log('Sample Report:', json.previousReports[0].folderName, 'Domain:', json.previousReports[0].domain);
          }
          console.log('Genetic & Inborn Issues Count:', json.geneticAndInbornIssues?.length);
          if (json.geneticAndInbornIssues?.length > 0) {
            console.log('Sample Genetic Insight:', json.geneticAndInbornIssues[0].condition);
          }
          console.log('Ayurvedic Dosha:', json.ayurvedicAndLifestyle?.dosha);
          process.exit(0);
        } catch (e) {
          console.error('Failed to parse JSON response:', data);
          process.exit(1);
        }
      });
    });

    req.on('error', err => {
      console.error('HTTP Request failed:', err.message);
      process.exit(1);
    });

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testEndpoint();
