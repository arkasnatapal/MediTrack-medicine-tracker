require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Facility = require('./models/Facility');
const Doctor = require('./models/Doctor');
const DoctorFacilityAssociation = require('./models/DoctorFacilityAssociation');
const FacilityCapacity = require('./models/FacilityCapacity');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Queue = require('./models/Queue');
const Referral = require('./models/Referral');
const PatientTransfer = require('./models/PatientTransfer');
const DiagnosticOrder = require('./models/DiagnosticOrder');
const MedicineInventory = require('./models/MedicineInventory');
const CareJourneyEvent = require('./models/CareJourneyEvent');
const TeleconsultationSession = require('./models/TeleconsultationSession');
const AuditLog = require('./models/AuditLog');

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    await mongoose.connect(uri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing Care Network test collections
    await User.deleteMany({ role: { $ne: 'PATIENT' } });
    await Facility.deleteMany({});
    await Doctor.deleteMany({});
    await DoctorFacilityAssociation.deleteMany({});
    await FacilityCapacity.deleteMany({});
    await Patient.deleteMany({ phone: { $in: ['9876543210', '9811223344'] } });
    await Appointment.deleteMany({});
    await Queue.deleteMany({});
    await Referral.deleteMany({});
    await PatientTransfer.deleteMany({});
    await DiagnosticOrder.deleteMany({});
    await MedicineInventory.deleteMany({});
    await CareJourneyEvent.deleteMany({});

    console.log('🧹 Purged previous seed records.');

    // 1. System Admin
    await User.create({
      name: 'MediTrack System Admin',
      email: 'admin@meditrack.care',
      phone: '9900000000',
      password: 'admin123',
      role: 'SYSTEM_ADMIN',
      verificationStatus: 'VERIFIED',
    });

    // 2. Healthcare Facilities Across 5 Tiers
    const phcA = await Facility.create({
      name: 'Primary Health Centre (PHC A) - Rampur',
      facilityType: 'PHC',
      licenseId: 'LIC-PHC-2026-001',
      classification: 'GOVERNMENT',
      address: 'Station Road, Rampur Sub-district',
      state: 'West Bengal',
      district: 'Jalpaiguri',
      pincode: '735101',
      latitude: 26.54,
      longitude: 88.72,
      phone: '03561-220101',
      email: 'phca.rampur@wbhealth.gov.in',
      emergencyAvailable: true,
      departments: ['General OPD', 'Maternal & Child Care', 'Immunization'],
      diagnosticServices: ['Blood Test', 'Sputum Test', 'ECG'],
      operatingHours: '08:00 AM - 08:00 PM (Emergency 24/7)',
      adminName: 'Dr. Alok Nath',
      adminEmail: 'phcadmin@meditrack.care',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const chcB = await Facility.create({
      name: 'Community Health Centre (CHC B) - DBC Road',
      facilityType: 'CHC',
      licenseId: 'LIC-CHC-2026-102',
      classification: 'GOVERNMENT',
      address: 'DBC Road, Block B',
      state: 'West Bengal',
      district: 'Jalpaiguri',
      pincode: '735102',
      latitude: 26.53,
      longitude: 88.71,
      phone: '03561-224455',
      email: 'chcb.dbcroad@wbhealth.gov.in',
      emergencyAvailable: true,
      departments: ['General OPD', 'Pediatrics', 'Obstetrics', 'Dental'],
      diagnosticServices: ['X-Ray', 'Ultrasound', 'Biochemistry'],
      operatingHours: '24/7 Emergency & OPD Services',
      adminName: 'Dr. Rina Das',
      adminEmail: 'chcadmin@meditrack.care',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const rhC = await Facility.create({
      name: 'Rural Hospital Rajganj Sub-Division',
      facilityType: 'RURAL_HOSPITAL',
      licenseId: 'LIC-RH-2026-405',
      classification: 'GOVERNMENT',
      address: 'Main Highway, Rajganj',
      state: 'West Bengal',
      district: 'Jalpaiguri',
      pincode: '735134',
      latitude: 26.58,
      longitude: 88.65,
      phone: '03561-229988',
      email: 'rural.rajganj@wbhealth.gov.in',
      emergencyAvailable: true,
      departments: ['General Surgery', 'Orthopedics', 'OPD', 'Maternity Ward'],
      diagnosticServices: ['ECG', 'X-Ray', 'Routine Blood & Urine'],
      operatingHours: '24/7 Rural Emergency Hub',
      adminName: 'Dr. Subhash Sen',
      adminEmail: 'rhadmin@meditrack.care',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const districtHospD = await Facility.create({
      name: 'Jalpaiguri District Hospital & Super Specialty Unit',
      facilityType: 'DISTRICT_HOSPITAL',
      licenseId: 'LIC-DH-2026-909',
      classification: 'GOVERNMENT',
      address: 'Hospital Road, Central Division',
      state: 'West Bengal',
      district: 'Jalpaiguri',
      pincode: '735102',
      latitude: 26.52,
      longitude: 88.73,
      phone: '03561-230999',
      email: 'districthospital@wbhealth.gov.in',
      emergencyAvailable: true,
      departments: ['Cardiology', 'Emergency Trauma', 'Neurology', 'Pediatrics', 'General Surgery', 'ICU'],
      diagnosticServices: ['ECG', 'X-Ray', 'CT Scan', 'MRI', 'Pathology Lab', 'Ultrasound'],
      operatingHours: '24/7 Apex Emergency & Trauma Unit',
      adminName: 'Dr. Somnath Chatterjee',
      adminEmail: 'hospitaladmin@meditrack.care',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    });

    const tertiaryHospE = await Facility.create({
      name: 'Apex Multi-Specialty AIIMS Referral Hub',
      facilityType: 'GOVT_HOSPITAL',
      licenseId: 'LIC-TER-2026-777',
      classification: 'GOVERNMENT',
      address: 'Medical College Campus, North Hub',
      state: 'West Bengal',
      district: 'Jalpaiguri',
      pincode: '734001',
      latitude: 26.71,
      longitude: 88.43,
      phone: '0353-258000',
      email: 'referralhub@apexhealth.gov.in',
      emergencyAvailable: true,
      departments: ['Cardiothoracic Surgery', 'Neurosurgery', 'Oncology', 'Organ Transplant', 'Advanced ICU'],
      diagnosticServices: ['PET-CT', '3T MRI', 'Cath Lab', 'Genetic Diagnostics', 'Histopathology'],
      operatingHours: '24/7 Tertiary Referral Apex Hospital',
      adminName: 'Dr. Vikram Malhotra',
      adminEmail: 'tertiaryadmin@meditrack.care',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    });

    // Facility Admin Users
    await User.create({
      name: 'Dr. Alok Nath',
      email: 'phcadmin@meditrack.care',
      phone: '9830111222',
      password: 'facility123',
      role: 'FACILITY_ADMIN',
      facilityId: phcA._id,
      verificationStatus: 'VERIFIED',
    });

    await User.create({
      name: 'Dr. Somnath Chatterjee',
      email: 'hospitaladmin@meditrack.care',
      phone: '9830999888',
      password: 'facility123',
      role: 'FACILITY_ADMIN',
      facilityId: districtHospD._id,
      verificationStatus: 'VERIFIED',
    });

    // Bed Capacities
    await FacilityCapacity.create({
      facilityId: phcA._id,
      emergencyBeds: { total: 10, occupied: 2, available: 8 },
      generalBeds: { total: 30, occupied: 15, available: 15 },
      icuBeds: { total: 0, occupied: 0, available: 0 },
      oxygenBeds: { total: 5, occupied: 2, available: 3 },
    });

    await FacilityCapacity.create({
      facilityId: chcB._id,
      emergencyBeds: { total: 20, occupied: 5, available: 15 },
      generalBeds: { total: 50, occupied: 30, available: 20 },
      icuBeds: { total: 2, occupied: 1, available: 1 },
      oxygenBeds: { total: 15, occupied: 5, available: 10 },
    });

    await FacilityCapacity.create({
      facilityId: rhC._id,
      emergencyBeds: { total: 25, occupied: 10, available: 15 },
      generalBeds: { total: 80, occupied: 50, available: 30 },
      icuBeds: { total: 5, occupied: 2, available: 3 },
      oxygenBeds: { total: 20, occupied: 10, available: 10 },
    });

    await FacilityCapacity.create({
      facilityId: districtHospD._id,
      emergencyBeds: { total: 50, occupied: 28, available: 22 },
      generalBeds: { total: 300, occupied: 220, available: 80 },
      icuBeds: { total: 20, occupied: 18, available: 2 },
      oxygenBeds: { total: 60, occupied: 45, available: 15 },
      ventilatorsAvailable: 4,
    });

    await FacilityCapacity.create({
      facilityId: tertiaryHospE._id,
      emergencyBeds: { total: 80, occupied: 40, available: 40 },
      generalBeds: { total: 600, occupied: 450, available: 150 },
      icuBeds: { total: 50, occupied: 42, available: 8 },
      oxygenBeds: { total: 100, occupied: 70, available: 30 },
      ventilatorsAvailable: 15,
    });

    // Doctors
    const docAUser = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'doctor.rajesh@meditrack.care',
      phone: '9870011223',
      password: 'doctor123',
      role: 'DOCTOR',
      verificationStatus: 'VERIFIED',
    });

    const doctorA = await Doctor.create({
      userId: docAUser._id,
      fullName: 'Dr. Rajesh Sharma',
      email: 'doctor.rajesh@meditrack.care',
      phone: '9870011223',
      qualification: 'MD Cardiology, MBBS',
      medicalRegistrationNumber: 'MCI-WB-2015-8891',
      registrationAuthority: 'West Bengal Medical Council',
      specialization: 'Cardiology',
      yearsOfExperience: 14,
      primaryFacilityId: districtHospD._id,
      consultationFee: 0,
      verificationStatus: 'VERIFIED',
    });

    docAUser.doctorId = doctorA._id;
    await docAUser.save();

    const docBUser = await User.create({
      name: 'Dr. Priya Banerjee',
      email: 'doctor.priya@meditrack.care',
      phone: '9870099887',
      password: 'doctor123',
      role: 'DOCTOR',
      verificationStatus: 'VERIFIED',
    });

    const doctorB = await Doctor.create({
      userId: docBUser._id,
      fullName: 'Dr. Priya Banerjee',
      email: 'doctor.priya@meditrack.care',
      phone: '9870099887',
      qualification: 'MBBS, DNB General Medicine',
      medicalRegistrationNumber: 'MCI-WB-2018-4412',
      registrationAuthority: 'West Bengal Medical Council',
      specialization: 'General Medicine',
      yearsOfExperience: 8,
      primaryFacilityId: phcA._id,
      consultationFee: 0,
      verificationStatus: 'VERIFIED',
    });

    docBUser.doctorId = doctorB._id;
    await docBUser.save();

    await DoctorFacilityAssociation.create({
      doctorId: doctorA._id,
      facilityId: districtHospD._id,
      department: 'Cardiology',
      designation: 'Senior Consultant Cardiologist',
      employmentType: 'FULL_TIME',
      requestedBy: 'FACILITY',
      status: 'ACTIVE',
    });

    await DoctorFacilityAssociation.create({
      doctorId: doctorB._id,
      facilityId: phcA._id,
      department: 'General OPD',
      designation: 'Medical Officer',
      employmentType: 'FULL_TIME',
      requestedBy: 'FACILITY',
      status: 'ACTIVE',
    });

    // 5. Seed Patients, Appointments, Teleconsultations & Referrals
    const samplePatient1 = await Patient.create({
      name: 'Anish Ray',
      phone: '9876543210',
      email: 'anish.ray@example.com',
      age: 45,
      gender: 'MALE',
    });

    const samplePatient2 = await Patient.create({
      name: 'Meera Mukherjee',
      phone: '9811223344',
      email: 'meera.m@example.com',
      age: 52,
      gender: 'FEMALE',
    });

    await Appointment.create({
      patientId: samplePatient2._id,
      facilityId: phcA._id,
      doctorId: doctorB._id,
      department: 'General Medicine',
      appointmentDate: new Date(),
      timeSlot: '09:30 AM',
      type: 'TELECONSULTATION',
      symptoms: 'High fever & persistent cough',
      triageLevel: 'NORMAL',
      status: 'CONFIRMED',
    });

    await Appointment.create({
      patientId: samplePatient1._id,
      facilityId: districtHospD._id,
      doctorId: doctorA._id,
      department: 'Cardiology',
      appointmentDate: new Date(),
      timeSlot: '10:30 AM',
      type: 'IN_PERSON',
      symptoms: 'Chest pain on exertion & palpitation',
      triageLevel: 'URGENT',
      status: 'CONFIRMED',
    });

    await Appointment.create({
      patientId: samplePatient2._id,
      facilityId: districtHospD._id,
      doctorId: doctorA._id,
      department: 'Cardiology',
      appointmentDate: new Date(),
      timeSlot: '11:15 AM',
      type: 'TELECONSULTATION',
      symptoms: 'BP fluctuation & shortness of breath',
      triageLevel: 'NORMAL',
      status: 'CHECKED_IN',
    });

    // Seed Teleconsultation Sessions
    const meetId1 = `MEET-${Date.now()}-101`;
    await TeleconsultationSession.create({
      patientName: 'Meera Mukherjee',
      patientPhone: '9811223344',
      patientEmail: 'meera.m@example.com',
      facilityId: districtHospD._id,
      facilityName: districtHospD.name,
      doctorId: doctorA._id,
      doctorName: doctorA.fullName,
      specialty: 'Cardiology',
      symptoms: 'Hypertension & Recurrent Angina episodes',
      meetingIdentifier: meetId1,
      socketRoomId: `room-${meetId1}`,
      meetingLink: `http://localhost:5173/care-network/teleconsultation?meetingId=${meetId1}`,
      scheduledTime: 'Today at 4:00 PM',
      status: 'CONFIRMED',
      postSessionMessagesLeft: 10,
      postSessionMessagesSent: 0,
      postSessionMessages: [
        {
          sender: 'PATIENT',
          text: 'Doctor, should I continue taking Sorbitrate 5mg daily or only during chest pain?',
          timestamp: new Date(Date.now() - 3600000),
        }
      ]
    });

    const meetIdPriya = `MEET-${Date.now()}-105`;
    await TeleconsultationSession.create({
      patientName: 'Arundhati Sen',
      patientPhone: '9833221100',
      patientEmail: 'arundhati.sen@example.com',
      facilityId: phcA._id,
      facilityName: phcA.name,
      doctorId: doctorB._id,
      doctorName: doctorB.fullName,
      specialty: 'General Medicine',
      symptoms: 'High fever 102F, chills, and viral body ache',
      meetingIdentifier: meetIdPriya,
      socketRoomId: `room-${meetIdPriya}`,
      meetingLink: `http://localhost:5173/care-network/teleconsultation?meetingId=${meetIdPriya}`,
      scheduledTime: 'Today at 4:30 PM',
      status: 'CONFIRMED',
      postSessionMessagesLeft: 10,
      postSessionMessagesSent: 0,
      postSessionMessages: [
        {
          sender: 'PATIENT',
          text: 'Dr. Priya, fever reduced slightly after paracetamol. Should I take electrolyte oral solution?',
          timestamp: new Date(Date.now() - 1800000),
        }
      ]
    });

    const meetId2 = `MEET-${Date.now()}-102`;
    await TeleconsultationSession.create({
      patientName: 'Subhasish Roy',
      patientPhone: '9833445566',
      patientEmail: 'subhasish.roy@example.com',
      facilityId: districtHospD._id,
      facilityName: districtHospD.name,
      specialty: 'General Medicine',
      symptoms: 'Abnormal ECG report & vertigo from PHC Rampur',
      meetingIdentifier: meetId2,
      socketRoomId: `room-${meetId2}`,
      meetingLink: `http://localhost:5173/care-network/teleconsultation?meetingId=${meetId2}`,
      scheduledTime: 'Today at 5:30 PM',
      status: 'PENDING',
      postSessionMessagesLeft: 10,
      postSessionMessagesSent: 0,
    });

    // Seed Referrals
    await Referral.create({
      patientId: samplePatient1._id,
      referringDoctorId: doctorB._id,
      referringFacilityId: phcA._id,
      receivingFacilityId: districtHospD._id,
      department: 'Cardiology',
      reason: 'Specialist opinion required for suspected CAD & Echocardiogram',
      urgency: 'URGENT',
      clinicalNotes: 'ECG shows ST segment depression in V3-V6.',
      requestedServices: ['Echocardiography', 'Cardiology Consult'],
      status: 'SENT',
    });

    console.log('✅ Seed completed successfully across 5 healthcare facility tiers!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedDB();
