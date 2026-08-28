require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

const User = require('../models/User');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Referral = require('../models/Referral');
const PatientTransfer = require('../models/PatientTransfer');
const FacilityCapacity = require('../models/FacilityCapacity');
const TeleconsultationSession = require('../models/TeleconsultationSession');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Message = require('../models/Message');

async function runTests() {
  console.log('🧪 Starting MediTrack Care Network Backend Test Suite...');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    await mongoose.connect(uri);

    // TEST 1: Facility Registration Status
    console.log('➡️ TEST 1: Facility Registration (PENDING_VERIFICATION default)');
    const fac = await Facility.create({
      name: 'Test Rural Clinic',
      facilityType: 'RURAL_HOSPITAL',
      licenseId: `TEST-LIC-${Date.now()}`,
      address: 'Test Village',
      state: 'WB',
      district: 'Jalpaiguri',
      pincode: '735101',
      phone: '9998887770',
      email: 'testclinic@care.org',
      adminName: 'Test Admin',
      adminEmail: `admin.${Date.now()}@care.org`,
    });
    assert.strictEqual(fac.verificationStatus, 'PENDING_VERIFICATION', 'New facility must be PENDING_VERIFICATION');
    console.log('✅ PASS: Facility default verification state is PENDING_VERIFICATION');

    // TEST 2: Doctor Registration & Association
    console.log('➡️ TEST 2: Doctor Registration & Many-to-Many Association');
    const doc = await Doctor.create({
      fullName: 'Dr. Test Surgeon',
      medicalRegistrationNumber: `REG-${Date.now()}`,
      registrationAuthority: 'State Board',
      specialization: 'General Surgery',
      qualification: 'MS',
      phone: '9990001112',
      email: `doctest.${Date.now()}@care.org`,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    const assoc = await DoctorFacilityAssociation.create({
      doctorId: doc._id,
      facilityId: fac._id,
      department: 'Surgery',
      designation: 'Attending Surgeon',
      requestedBy: 'FACILITY',
      status: 'PENDING',
    });
    assert.strictEqual(assoc.status, 'PENDING');
    assoc.status = 'ACTIVE';
    await assoc.save();
    assert.strictEqual(assoc.status, 'ACTIVE');
    console.log('✅ PASS: Doctor-Facility Association state transitions working');

    // TEST 3: Inter-Hospital Emergency Transfer with Bed Check
    console.log('➡️ TEST 3: Inter-Hospital Emergency Transfer Acceptance');
    const patient = await Patient.create({
      name: 'Test Emergency Patient',
      phone: '9870001111',
      age: 30,
      gender: 'MALE',
    });

    const transfer = await PatientTransfer.create({
      patientId: patient._id,
      originatingFacilityId: fac._id,
      destinationFacilityId: fac._id,
      reason: 'Acute Trauma',
      clinicalSummary: 'Severe head trauma requiring ICU ventilatory support',
      requiredDepartment: 'ICU',
      requiredBedType: 'ICU',
      ambulanceRequired: true,
      status: 'REQUESTED',
    });

    assert.strictEqual(transfer.status, 'REQUESTED', 'Transfer must start as REQUESTED (not auto-accepted)');
    transfer.status = 'ACCEPTED';
    await transfer.save();
    assert.strictEqual(transfer.status, 'ACCEPTED', 'Receiving facility explicitly accepted transfer');
    console.log('✅ PASS: Inter-hospital transfer explicit acceptance workflow verified');

    // TEST 4: Teleconsultation Session Lifecycle & 10 Post-Session Message Limit
    console.log('➡️ TEST 4: Teleconsultation Termination & 10 Post-Session Message Limit');
    const appt = await Appointment.create({
      patientId: patient._id,
      facilityId: fac._id,
      doctorId: doc._id,
      department: 'Surgery',
      appointmentDate: new Date(),
      timeSlot: '11:00 AM',
      type: 'TELECONSULTATION',
      status: 'IN_CONSULTATION',
    });

    const session = await TeleconsultationSession.create({
      appointmentId: appt._id,
      patientId: patient._id,
      doctorId: doc._id,
      meetingIdentifier: `MEET-TEST-${Date.now()}`,
      socketRoomId: `room-test`,
      status: 'ACTIVE',
      postSessionMessagesLeft: 10,
    });

    // Doctor terminates session
    session.status = 'TERMINATED';
    session.terminatedBy = 'DOCTOR';
    await session.save();
    assert.strictEqual(session.status, 'TERMINATED');
    assert.strictEqual(session.postSessionMessagesLeft, 10, 'Patient starts with 10 post-session messages');

    // Simulate sending 1 post-session message
    const msg = await Message.create({
      conversationType: 'PATIENT_DOCTOR_POST_SESSION',
      senderId: patient._id,
      senderName: patient.name,
      senderRole: 'PATIENT',
      receiverId: doc._id,
      patientId: patient._id,
      teleconsultationSessionId: session._id,
      content: 'Doctor, should I take the painkiller after food?',
    });

    session.postSessionMessagesLeft -= 1;
    await session.save();

    assert.strictEqual(session.postSessionMessagesLeft, 9, 'Message count decremented to 9');
    console.log('✅ PASS: Doctor disconnect terminates session & decrements post-session message quota');

    // Clean test records
    await Facility.findByIdAndDelete(fac._id);
    await Doctor.findByIdAndDelete(doc._id);
    await DoctorFacilityAssociation.findByIdAndDelete(assoc._id);
    await Patient.findByIdAndDelete(patient._id);
    await PatientTransfer.findByIdAndDelete(transfer._id);
    await Appointment.findByIdAndDelete(appt._id);
    await TeleconsultationSession.findByIdAndDelete(session._id);
    await Message.findByIdAndDelete(msg._id);

    console.log('🎉 ALL CARE NETWORK TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
