require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');

const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const OpdSchedule = require('../models/OpdSchedule');
const DoctorAttendance = require('../models/DoctorAttendance');
const Queue = require('../models/Queue');
const { evaluateOpdStatus, calculateWaitTime, getFacilityTime } = require('../services/opdScheduleEngine');

async function runOpdEngineTests() {
  console.log('🧪 Starting MediTrack OPD Schedule & Queue Engine Test Suite...');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    await mongoose.connect(uri);

    // TEST 1: Timezone-aware OPD Schedule Evaluation Logic
    console.log('➡️ TEST 1: Timezone & Operating Hours Schedule Evaluation');

    const testSchedule = {
      facilityId: new mongoose.Types.ObjectId(),
      department: 'General Medicine',
      timezone: 'Asia/Kolkata',
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      openTime: '09:00',
      closeTime: '13:00',
      breakStart: '11:30',
      breakEnd: '12:00',
      lastTokenTime: '12:30',
      closingWarningMinutes: 30,
      queueMode: 'SHARED_QUEUE',
      holidays: [{ date: '2026-10-02', description: 'Gandhi Jayanti' }],
    };

    // Test Open state (e.g. 10:00 AM)
    const openTimeDate = new Date('2026-09-15T10:00:00+05:30');
    const openStatus = evaluateOpdStatus(testSchedule, 'NONE', openTimeDate);
    assert.strictEqual(openStatus.opdStatus, 'OPEN', 'Status at 10:00 AM must be OPEN');
    assert.strictEqual(openStatus.registrationOpen, true);
    console.log('  ✓ 10:00 AM evaluated as OPEN with registration active');

    // Test Break state (e.g. 11:45 AM)
    const breakTimeDate = new Date('2026-09-15T11:45:00+05:30');
    const breakStatus = evaluateOpdStatus(testSchedule, 'NONE', breakTimeDate);
    assert.strictEqual(breakStatus.opdStatus, 'BREAK', 'Status at 11:45 AM must be BREAK');
    assert.strictEqual(breakStatus.registrationOpen, false);
    assert.strictEqual(breakStatus.breakRemainingMinutes, 15);
    console.log('  ✓ 11:45 AM evaluated as BREAK with 15 mins remaining');

    // Test Registration Cutoff state (e.g. 12:45 PM)
    const cutoffTimeDate = new Date('2026-09-15T12:45:00+05:30');
    const cutoffStatus = evaluateOpdStatus(testSchedule, 'NONE', cutoffTimeDate);
    assert.strictEqual(cutoffStatus.opdStatus, 'REGISTRATION_CLOSED', 'Status at 12:45 PM must be REGISTRATION_CLOSED');
    assert.strictEqual(cutoffStatus.registrationOpen, false);
    assert.strictEqual(cutoffStatus.queueActive, true);
    console.log('  ✓ 12:45 PM evaluated as REGISTRATION_CLOSED with existing queue active');

    // Test Closed state (e.g. 01:15 PM)
    const closedTimeDate = new Date('2026-09-15T13:15:00+05:30');
    const closedStatus = evaluateOpdStatus(testSchedule, 'NONE', closedTimeDate);
    assert.strictEqual(closedStatus.opdStatus, 'CLOSED', 'Status at 1:15 PM must be CLOSED');
    assert.strictEqual(closedStatus.registrationOpen, false);
    console.log('  ✓ 1:15 PM evaluated as CLOSED');

    // Test Holiday state
    const holidayDate = new Date('2026-10-02T10:00:00+05:30');
    const holidayStatus = evaluateOpdStatus(testSchedule, 'NONE', holidayDate);
    assert.strictEqual(holidayStatus.opdStatus, 'HOLIDAY', 'Status on 2026-10-02 must be HOLIDAY');
    assert.strictEqual(holidayStatus.registrationOpen, false);
    console.log('  ✓ Holiday date evaluated as HOLIDAY');

    // TEST 2: Manual Facility Override Precedence
    console.log('➡️ TEST 2: Manual Facility Override Precedence');
    const pausedOverride = evaluateOpdStatus(testSchedule, 'PAUSED', openTimeDate);
    assert.strictEqual(pausedOverride.opdStatus, 'PAUSED', 'Manual PAUSED override must take precedence');
    assert.strictEqual(pausedOverride.queueActive, false);
    console.log('  ✓ Manual PAUSED override enforced over scheduled OPEN state');

    // TEST 3: Multi-Doctor Dynamic Wait Time Calculation
    console.log('➡️ TEST 3: Dynamic Multi-Doctor Wait Estimation Engine');
    
    // Case 3a: 2 Active serving doctors, 4 patients ahead, 7 min avg, 5 min current patient
    const sharedWait = calculateWaitTime({
      opdStatusObj: openStatus,
      activeDoctorsCount: 2,
      doctorStatus: 'AVAILABLE',
      waitingCount: 4,
      averageConsultationMinutes: 7,
      currentPatientRemainingMinutes: 5,
      queueMode: 'SHARED_QUEUE',
    });
    // Formula: 5 + Math.ceil((4 * 7)/2) = 5 + 14 = 19 mins
    assert.strictEqual(sharedWait.estimatedWaitMinutes, 19, 'Shared wait with 2 active doctors must be 19 mins');
    console.log('  ✓ Shared queue with 2 active doctors calculated accurately (~19 mins)');

    // Case 3b: Doctor on break in doctor-specific queue
    const docBreakWait = calculateWaitTime({
      opdStatusObj: breakStatus,
      activeDoctorsCount: 1,
      doctorStatus: 'ON_BREAK',
      waitingCount: 2,
      averageConsultationMinutes: 7,
      currentPatientRemainingMinutes: 5,
      queueMode: 'DOCTOR_SPECIFIC_QUEUE',
    });
    // Formula: 5 + (2*7) + 15 break = 5 + 14 + 15 = 34 mins
    assert.strictEqual(docBreakWait.estimatedWaitMinutes, 34, 'Wait during doctor break must include break duration');
    console.log('  ✓ Doctor-specific break wait includes 15 min break offset (~34 mins)');

    // Case 3c: Doctor unavailable
    const unavailWait = calculateWaitTime({
      opdStatusObj: openStatus,
      activeDoctorsCount: 0,
      doctorStatus: 'UNAVAILABLE',
      waitingCount: 3,
      averageConsultationMinutes: 7,
      currentPatientRemainingMinutes: 7,
      queueMode: 'DOCTOR_SPECIFIC_QUEUE',
    });
    assert.strictEqual(unavailWait.estimatedWaitMinutes, null);
    assert.strictEqual(unavailWait.displayText, 'Unavailable');
    console.log('  ✓ Doctor unavailable returns displayText: "Unavailable" (never 0 mins)');

    // TEST 4: Doctor Check-in & Attendance Persistence
    console.log('➡️ TEST 4: Doctor Attendance Check-in & Job Termination');
    const fac = await Facility.create({
      name: 'Test OPD Hospital',
      facilityType: 'DISTRICT_HOSPITAL',
      licenseId: `TEST-OPD-LIC-${Date.now()}`,
      address: 'Test City',
      state: 'WB',
      district: 'Kolkata',
      pincode: '700001',
      phone: '9830098300',
      email: `hospital.${Date.now()}@opd.org`,
      adminName: 'OPD Admin',
      adminEmail: `admin.${Date.now()}@opd.org`,
    });

    const doc = await Doctor.create({
      fullName: 'Dr. OPD Specialist',
      medicalRegistrationNumber: `REG-OPD-${Date.now()}`,
      registrationAuthority: 'Medical Council',
      specialization: 'General Medicine',
      qualification: 'MD',
      phone: '9831198311',
      email: `doctor.${Date.now()}@opd.org`,
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await DoctorAttendance.create({
      doctorId: doc._id,
      facilityId: fac._id,
      department: 'General Medicine',
      date: todayStr,
      inTime: new Date(),
      status: 'AVAILABLE',
      notes: 'Morning shift entry',
    });

    assert.strictEqual(attendance.status, 'AVAILABLE');
    assert.ok(attendance.inTime);
    console.log('  ✓ Doctor in-time check-in recorded successfully');

    attendance.status = 'TERMINATED';
    attendance.outTime = new Date();
    await attendance.save();

    assert.strictEqual(attendance.status, 'TERMINATED');
    assert.ok(attendance.outTime);
    console.log('  ✓ Doctor job shift termination out-time recorded');

    // Clean up test documents
    await Facility.findByIdAndDelete(fac._id);
    await Doctor.findByIdAndDelete(doc._id);
    await DoctorAttendance.findByIdAndDelete(attendance._id);

    console.log('🎉 ALL OPD ENGINE TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ OPD Engine test failure:', err);
    process.exit(1);
  }
}

runOpdEngineTests();
