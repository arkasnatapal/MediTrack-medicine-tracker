require('dotenv').config();
const mongoose = require('mongoose');
const Facility = require('../models/Facility');

async function listFacilities() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:Arka%402004@cluster0.a55xu4a.mongodb.net/meditrack_care_network?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('\n🏥 Connected to MongoDB. Querying Facilities...\n');

    const facilities = await Facility.find().sort({ facilityType: 1, name: 1 });

    console.log(`========================================================================================`);
    console.log(`TOTAL FACILITIES SEEDED IN CARE_BACKEND DB: ${facilities.length}`);
    console.log(`========================================================================================\n`);

    facilities.forEach((f, idx) => {
      console.log(`${idx + 1}. [${f.facilityType}] ${f.name}`);
      console.log(`   - Facility Mongo ID: ${f._id}`);
      console.log(`   - Custom Facility Code: ${f.facilityCode || 'N/A'}`);
      console.log(`   - District / Region: ${f.district || 'West Bengal'} • State: ${f.state || 'West Bengal'}`);
      console.log(`   - Status: ${f.verificationStatus} • Emergency 24/7: ${f.emergencyAvailable ? 'YES' : 'NO'}`);
      console.log(`   - Phone: ${f.contactPhone} • Email: ${f.contactEmail}`);
      console.log(`   --------------------------------------------------------------------------------------`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listing facilities:', err);
    process.exit(1);
  }
}

listFacilities();
