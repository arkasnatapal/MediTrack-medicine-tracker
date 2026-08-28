const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Facility = require('../models/Facility');
const TeleconsultationSession = require('../models/TeleconsultationSession');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const Appointment = require('../models/Appointment');
const Referral = require('../models/Referral');
const { sendTeleconsultationEmail } = require('../services/emailService');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to Mongo:', mongoUri ? 'URI Present' : 'NO URI');
    await mongoose.connect(mongoUri);

    console.log('--- USERS ---');
    const users = await User.find().select('-password');
    console.log(`Found ${users.length} users:`, users.map(u => ({ id: u._id, name: u.name, role: u.role, docId: u.doctorId, facId: u.facilityId })));

    console.log('--- DOCTORS ---');
    const doctors = await Doctor.find();
    console.log(`Found ${doctors.length} doctors:`, doctors.map(d => ({ id: d._id, name: d.fullName, spec: d.specialization })));

    console.log('--- FACILITIES ---');
    const facilities = await Facility.find();
    console.log(`Found ${facilities.length} facilities:`, facilities.map(f => ({ id: f._id, name: f.name })));

    console.log('--- ASSOCIATIONS ---');
    const assocs = await DoctorFacilityAssociation.find();
    console.log(`Found ${assocs.length} associations:`, assocs);

    console.log('--- TELECONSULTATIONS ---');
    const teles = await TeleconsultationSession.find();
    console.log(`Found ${teles.length} teleconsultations:`, teles);

    console.log('--- APPOINTMENTS ---');
    const apps = await Appointment.find();
    console.log(`Found ${apps.length} appointments:`, apps);

    console.log('--- REFERRALS ---');
    const refs = await Referral.find();
    console.log(`Found ${refs.length} referrals:`, refs);

    // Test Email Sending
    console.log('\n--- TESTING EMAIL DISPATCH ---');
    const emailResult = await sendTeleconsultationEmail({
      to: 'meditrack.test@yopmail.com',
      patientName: 'Test Patient',
      hospitalName: 'Central District Hospital',
      doctorName: 'Rajesh Sharma',
      specialty: 'Cardiology Specialist',
      scheduledTime: 'Today at 5:00 PM',
      meetingLink: 'http://localhost:5173/care-network/teleconsultation?meetingId=MEET-TEST-123'
    });
    console.log('Email test result:', emailResult);

  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
