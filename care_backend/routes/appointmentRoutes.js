const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/Patient');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Queue = require('../models/Queue');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get appointments list for facility or doctor
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'FACILITY_ADMIN' || req.user.role === 'FACILITY_STAFF') {
      const facId = req.user.facility?._id || req.user.facilityId?._id || req.user.facilityId;
      if (facId) query.facilityId = facId;
    } else if (req.user.role === 'DOCTOR') {
      const docId = req.user.doctor?._id || req.user.doctorId?._id || req.user.doctorId;
      if (docId) query.doctorId = docId;
    }

    if (req.query.status) query.status = req.query.status;

    let appointments = await Appointment.find(query)
      .populate('patientId')
      .populate('doctorId')
      .populate('facilityId')
      .sort({ createdAt: -1 })
      .lean();

    if (appointments.length === 0) {
      appointments = await Appointment.find({})
        .populate('patientId')
        .populate('doctorId')
        .populate('facilityId')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Format output so patient name and facility name are always available
    const formatted = appointments.map(apt => ({
      ...apt,
      patientId: apt.patientId && apt.patientId.name ? apt.patientId : { _id: apt.patientId, name: apt.patientName || 'Patient' },
      facilityId: apt.facilityId && apt.facilityId.name ? apt.facilityId : { _id: apt.facilityId, name: apt.facilityName || 'Public Healthcare Centre' },
      patientName: apt.patientId?.name || apt.patientName || 'Patient',
      facilityName: apt.facilityId?.name || apt.facilityName || 'Public Healthcare Centre'
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book / Create Appointment (Patient or Reception Staff)
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      patientAge,
      patientGender,
      facilityId,
      doctorId,
      department,
      appointmentDate,
      timeSlot,
      type,
      symptoms,
      triageLevel,
    } = req.body;

    let patient = await PatientRecord.findOne({ phone: patientPhone });
    if (!patient) {
      patient = await PatientRecord.create({
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
        age: patientAge,
        gender: patientGender,
      });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      facilityId,
      doctorId: doctorId || null,
      department: department || 'General Medicine',
      appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(),
      timeSlot: timeSlot || '10:00 AM',
      type: type || 'IN_PERSON',
      symptoms,
      triageLevel: triageLevel || 'NORMAL',
      status: 'CONFIRMED',
    });

    const facility = await Facility.findById(facilityId);
    const doctor = doctorId ? await Doctor.findById(doctorId) : null;

    // Log Care Journey Event
    await CareJourneyEvent.create({
      patientId: patient._id,
      eventType: type === 'TELECONSULTATION' ? 'SPECIALIST_CONSULTATION' : 'PHC_CONSULTATION',
      facilityId,
      facilityName: facility ? facility.name : 'Healthcare Facility',
      doctorId,
      doctorName: doctor ? doctor.fullName : 'Duty Doctor',
      title: `${type === 'TELECONSULTATION' ? 'Teleconsultation' : 'Appointment'} Booked at ${facility ? facility.name : 'Facility'}`,
      description: `Department: ${department}. Symptoms: ${symptoms || 'None specified'}`,
      relatedAppointmentId: appointment._id,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Appointment Status (Check-in, Start Consult, Complete, Reschedule, Cancel, Issue Prescription)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, notes, prescription } = req.body;
    const mongoose = require('mongoose');
    // Clear module cache to guarantee latest PDF design rendering
    delete require.cache[require.resolve('../../backend/utils/pdfService')];
    const { generatePrescriptionPDF } = require('../../backend/utils/pdfService');
    const { sendPrescriptionEmail } = require('../../backend/utils/email');

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId')
      .populate('doctorId');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    if (notes) appointment.notes = notes;

    let pdfDataUrl = null;
    let pdfBuffer = null;

    if (prescription) {
      const isOffline = prescription.isOfflinePrescription || false;
      const diagStr = prescription.diagnosis || (isOffline ? 'Offline OPD Prescription' : 'General Consultation');
      const medsList = prescription.medicines || [];
      const adviceStr = prescription.advice || '';
      const docName = appointment.doctorId?.fullName ? (appointment.doctorId.fullName.startsWith('Dr.') ? appointment.doctorId.fullName : `Dr. ${appointment.doctorId.fullName}`) : 'Duty Medical Officer';
      const docSpec = appointment.doctorId?.specialization || 'General OPD Specialist';
      const docReg = appointment.doctorId?.medicalRegistrationNumber || 'MCI-VERIFIED';
      const facName = appointment.facilityId?.name || 'Public Healthcare Center';
      const patientName = appointment.patientId?.name || 'Patient';
      const patientEmail = appointment.patientId?.email;

      // Generate PDF
      try {
        const pdfResult = await generatePrescriptionPDF({
          patientName,
          patientAge: appointment.patientId?.age || '',
          patientGender: appointment.patientId?.gender || '',
          doctorName: docName,
          doctorSpecialization: docSpec,
          medicalRegistrationNumber: docReg,
          facilityName: facName,
          department: appointment.department || 'General OPD',
          tokenNumber: appointment.tokenNumber || 1,
          date: new Date().toLocaleDateString(),
          diagnosis: diagStr,
          medicines: medsList,
          advice: adviceStr,
          isOfflinePrescription: isOffline
        });

        pdfBuffer = pdfResult.pdfBuffer;
        pdfDataUrl = pdfResult.dataUrl;
      } catch (pdfErr) {
        console.warn('PDF generation warning:', pdfErr.message);
      }

      appointment.prescription = {
        isOfflinePrescription: isOffline,
        diagnosis: diagStr,
        medicines: medsList,
        advice: adviceStr,
        pdfDataUrl: pdfDataUrl,
        createdAt: new Date(),
      };

      // Store in prescriptions collection for patient DB lookup
      try {
        await mongoose.connection.collection('prescriptions').insertOne({
          patientId: appointment.patientId?._id || appointment.patientId,
          appointmentId: appointment._id,
          facilityName: facName,
          department: appointment.department || 'General OPD',
          doctorName: docName,
          doctorSpecialization: docSpec,
          tokenNumber: appointment.tokenNumber || 1,
          date: new Date().toLocaleDateString(),
          diagnosis: diagStr,
          medicines: medsList,
          advice: adviceStr,
          isOfflinePrescription: isOffline,
          pdfDataUrl: pdfDataUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (pDbErr) {
        console.warn('Prescription DB insertion warning:', pDbErr.message);
      }

      // Send Email with PDF attachment
      if (patientEmail) {
        sendPrescriptionEmail({
          to: patientEmail,
          patientName,
          doctorName: docName,
          facilityName: facName,
          department: appointment.department || 'General OPD',
          date: new Date().toLocaleDateString(),
          pdfBuffer,
          isOfflinePrescription: isOffline
        }).catch(err => console.error('Prescription email error:', err.message));
      }
    }

    await appointment.save();

    // Auto-create Care Journey timeline event on completion or prescription
    if (status === 'COMPLETED' || prescription) {
      const isOffline = prescription?.isOfflinePrescription || false;
      const docName = appointment.doctorId?.fullName ? (appointment.doctorId.fullName.startsWith('Dr.') ? appointment.doctorId.fullName : `Dr. ${appointment.doctorId.fullName}`) : 'Doctor';

      await CareJourneyEvent.create({
        patientId: appointment.patientId?._id || appointment.patientId,
        eventType: prescription ? 'PRESCRIPTION_ISSUED' : 'SPECIALIST_CONSULTATION',
        facilityId: appointment.facilityId?._id || appointment.facilityId,
        facilityName: appointment.facilityId?.name || 'Healthcare Center',
        doctorId: appointment.doctorId ? appointment.doctorId._id : null,
        doctorName: docName,
        title: prescription
          ? `${isOffline ? '📋 Offline Handwritten Prescription Issued' : '📄 Digital OPD Prescription Issued'} by ${docName}`
          : `Consultation Completed at ${appointment.facilityId?.name}`,
        description: prescription
          ? `Diagnosis: ${prescription.diagnosis || 'Clinical Consultation'}. Medicines: ${(prescription.medicines || []).map(m => m.name).join(', ') || 'N/A'}`
          : notes || 'Consultation completed.',
        pdfDataUrl: pdfDataUrl,
        prescriptionDetails: prescription,
        relatedAppointmentId: appointment._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_APPOINTMENT_STATUS', 'CareAppointment', appointment._id, `Changed status to ${status}`);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Assign / Allocate Doctor to Appointment by Hospital
router.put('/:id/assign-doctor', protect, async (req, res) => {
  try {
    const { doctorId } = req.body;
    const mongoose = require('mongoose');
    const { sendDoctorAssignedEmail } = require('../../backend/utils/email');

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    let doctor = null;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId);
    }

    appointment.doctorId = doctorId || null;
    await appointment.save();

    const docName = doctor ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : 'Duty Medical Officer';
    const spec = doctor ? doctor.specialization : 'General Specialist';
    const patientName = appointment.patientId?.name || req.body.patientName || 'Patient';
    const patientEmail = appointment.patientId?.email || req.body.patientEmail;
    const facilityName = appointment.facilityId?.name || 'Healthcare Facility';
    const dept = appointment.department || 'General OPD';
    const formattedDate = appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Today';
    const timeSlot = appointment.timeSlot || '09:30 AM';

    // Cross-sync back to main backend 'appointments' collection
    try {
      await mongoose.connection.collection('appointments').updateMany(
        {
          patientId: appointment.patientId?._id || appointment.patientId,
          tokenNumber: appointment.tokenNumber,
          department: dept
        },
        {
          $set: {
            doctorId: doctorId ? doctorId.toString() : 'DUTY_DOC',
            doctorName: docName,
            doctorSpecialization: spec,
            updatedAt: new Date()
          }
        }
      );
    } catch (syncErr) {
      console.warn('Sync doctor to main appointments warning:', syncErr.message);
    }

    // Create In-App Notification in client database
    const patientUserId = appointment.patientId?._id || appointment.patientId;
    if (patientUserId) {
      try {
        await mongoose.connection.collection('notifications').insertOne({
          user: patientUserId,
          type: 'general',
          title: `👨‍⚕️ Doctor Allocated: ${docName}`,
          message: `${docName} (${spec}) has been allocated for your appointment at ${facilityName} for ${dept}. Token #${appointment.tokenNumber || 1}`,
          severity: 'success',
          read: false,
          meta: {
            appointmentId: appointment._id,
            doctorId: doctorId,
            doctorName: docName,
            facilityName: facilityName
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (notifErr) {
        console.warn('Failed to insert in-app notification:', notifErr.message);
      }
    }

    // Send Email to patient
    if (patientEmail) {
      sendDoctorAssignedEmail({
        to: patientEmail,
        patientName,
        doctorName: docName,
        specialization: spec,
        facilityName,
        department: dept,
        date: formattedDate,
        time: timeSlot,
        tokenNumber: appointment.tokenNumber
      }).catch(err => console.error('Email error:', err.message));
    }

    // Log Care Journey timeline event
    await CareJourneyEvent.create({
      patientId: patientUserId,
      eventType: 'SPECIALIST_CONSULTATION',
      facilityId: appointment.facilityId?._id || appointment.facilityId,
      facilityName,
      doctorId: doctor ? doctor._id : null,
      doctorName: docName,
      title: `Doctor ${docName} Allocated for Token #${appointment.tokenNumber}`,
      description: `Hospital assigned ${docName} (${spec}) for ${dept} OPD Consultation.`,
      relatedAppointmentId: appointment._id
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'ASSIGN_DOCTOR_APPOINTMENT', 'CareAppointment', appointment._id, `Assigned doctor ${docName}`);

    const updatedApp = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId')
      .populate('doctorId');

    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delay / Reschedule Appointment by Hospital
router.put('/:id/delay', protect, async (req, res) => {
  try {
    const { appointmentDate, timeSlot, delayReason, status = 'RESCHEDULED' } = req.body;
    const mongoose = require('mongoose');
    const { sendAppointmentDelayedEmail } = require('../../backend/utils/email');

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId')
      .populate('doctorId');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (delayReason) appointment.notes = delayReason;
    appointment.status = status;
    await appointment.save();

    const patientName = appointment.patientId?.name || 'Patient';
    const patientEmail = appointment.patientId?.email;
    const facilityName = appointment.facilityId?.name || 'Healthcare Facility';
    const dept = appointment.department || 'General OPD';
    const docName = appointment.doctorId ? (appointment.doctorId.fullName.startsWith('Dr.') ? appointment.doctorId.fullName : `Dr. ${appointment.doctorId.fullName}`) : null;
    const formattedDate = appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : (appointmentDate || 'Today');
    const timeStr = timeSlot || appointment.timeSlot || '09:30 AM';

    // Cross-sync back to main backend 'appointments' collection
    try {
      await mongoose.connection.collection('appointments').updateMany(
        {
          patientId: appointment.patientId?._id || appointment.patientId,
          tokenNumber: appointment.tokenNumber,
          department: dept
        },
        {
          $set: {
            date: formattedDate,
            time: timeStr,
            notes: delayReason || 'Appointment delayed by hospital',
            status: status,
            isDelayed: true,
            delayReason: delayReason || 'Hospital schedule update',
            updatedAt: new Date()
          }
        }
      );
    } catch (syncErr) {
      console.warn('Sync delay to main appointments warning:', syncErr.message);
    }

    // Create In-App Notification in client database
    const patientUserId = appointment.patientId?._id || appointment.patientId;
    if (patientUserId) {
      try {
        await mongoose.connection.collection('notifications').insertOne({
          user: patientUserId,
          type: 'general',
          title: `⚠️ Appointment Schedule Updated / Delayed`,
          message: `Your appointment at ${facilityName} for ${dept} has been rescheduled to ${formattedDate} at ${timeStr}. Note: ${delayReason || 'Hospital delay'}`,
          severity: 'warning',
          read: false,
          meta: {
            appointmentId: appointment._id,
            facilityName: facilityName,
            newDate: formattedDate,
            newTime: timeStr,
            delayReason: delayReason
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (notifErr) {
        console.warn('Failed to insert delay notification:', notifErr.message);
      }
    }

    // Send Email to patient
    if (patientEmail) {
      sendAppointmentDelayedEmail({
        to: patientEmail,
        patientName,
        doctorName: docName,
        facilityName,
        department: dept,
        newDate: formattedDate,
        newTime: timeStr,
        reason: delayReason,
        tokenNumber: appointment.tokenNumber
      }).catch(err => console.error('Email error:', err.message));
    }

    // Log Care Journey timeline event
    await CareJourneyEvent.create({
      patientId: patientUserId,
      eventType: 'PHC_CONSULTATION',
      facilityId: appointment.facilityId?._id || appointment.facilityId,
      facilityName,
      doctorId: appointment.doctorId?._id || null,
      doctorName: docName || 'Duty Doctor',
      title: `Appointment Rescheduled for Token #${appointment.tokenNumber}`,
      description: `New time: ${formattedDate} at ${timeStr}. Reason: ${delayReason || 'Hospital schedule adjustment'}`,
      relatedAppointmentId: appointment._id
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'DELAY_APPOINTMENT', 'CareAppointment', appointment._id, `Delayed appointment to ${formattedDate} ${timeStr}`);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get facility bed admission requests for hospital portal
router.get('/bed-bookings/all', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const bookings = await mongoose.connection.collection('bedadmissions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital Staff Approve Bed Admission & Allot Specific Bed Number (Occupies 1 Bed)
router.put('/bed-bookings/:id/approve', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { allottedBedType, allottedBedNumber, hospitalNotes } = req.body;
    const mongoose = require('mongoose');

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      objectId = id;
    }

    const booking = await mongoose.connection.collection('bedadmissions').findOne({ _id: objectId });
    if (!booking) {
      return res.status(404).json({ message: 'Bed admission request not found' });
    }

    const bedTypeLabel = allottedBedType || booking.requestedBedType || 'GENERAL_WARD';
    const bedNo = allottedBedNumber || `BED-${Math.floor(10 + Math.random() * 90)}`;

    await mongoose.connection.collection('bedadmissions').updateOne(
      { _id: objectId },
      {
        $set: {
          status: 'APPROVED_BED_ALLOTTED',
          allottedBedType: bedTypeLabel,
          allottedBedNumber: bedNo,
          hospitalNotes: hospitalNotes || 'Bed allocated & reserved by hospital admission desk.',
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Decrement available bed count by 1
    try {
      await mongoose.connection.collection('healthcarefacilities').updateOne(
        { $or: [{ facilityId: booking.facilityId }, { name: booking.facilityName }] },
        { $inc: { 'bedCount.available': -1 } }
      );
      await mongoose.connection.collection('facilities').updateOne(
        { name: booking.facilityName },
        { $inc: { 'capacity.beds.available': -1 } }
      );
    } catch (bErr) {
      console.warn('Bed decrement warning:', bErr.message);
    }

    // Log Care Journey Event
    try {
      await CareJourneyEvent.create({
        patientId: booking.patientId,
        eventType: 'EMERGENCY',
        facilityId: booking.facilityId,
        facilityName: booking.facilityName,
        title: `🟢 Bed Allotted: ${bedTypeLabel.replace('_', ' ')} #${bedNo} at ${booking.facilityName}`,
        description: `Hospital admission confirmed. Bed ${bedNo} reserved. Pass #${booking.admissionPassNumber}.`,
        relatedAppointmentId: booking._id
      });
    } catch (cjErr) {
      console.warn('Care journey event warning:', cjErr.message);
    }

    // Send In-App Notification to Patient
    try {
      if (booking.patientId) {
        let patObjId;
        try { patObjId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { patObjId = booking.patientId; }
        await mongoose.connection.collection('notifications').insertOne({
          user: patObjId,
          type: 'general',
          title: `🟢 Hospital Bed Allotted: Bed #${bedNo}`,
          message: `Your hospital bed admission pass (#${booking.admissionPassNumber}) at ${booking.facilityName} has been approved. Allotted Bed: #${bedNo} (${bedTypeLabel.replace('_', ' ')}).`,
          severity: 'success',
          read: false,
          meta: {
            admissionPassNumber: booking.admissionPassNumber,
            facilityName: booking.facilityName,
            allottedBedNumber: bedNo,
            allottedBedType: bedTypeLabel
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ In-App notification created for patient:', booking.patientId);
      }
    } catch (nErr) {
      console.warn('In-app notification warning:', nErr.message);
    }

    // Send Email Notification to Patient
    try {
      let patientEmail = booking.contactPhone && booking.contactPhone.includes('@') ? booking.contactPhone : null;
      if (!patientEmail && booking.patientId) {
        try {
          let pId;
          try { pId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { pId = booking.patientId; }
          const u = await mongoose.connection.collection('users').findOne({ _id: pId });
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendBedAdmissionApprovedEmail } = require('../services/emailService');
        await sendBedAdmissionApprovedEmail({
          to: patientEmail,
          patientName: booking.patientName || 'Valued Patient',
          facilityName: booking.facilityName,
          admissionPassNumber: booking.admissionPassNumber,
          allottedBedNumber: bedNo,
          allottedBedType: bedTypeLabel.replace('_', ' '),
          department: booking.department || 'Emergency / General',
          hospitalNotes: hospitalNotes || 'Bed allocated & reserved by hospital admission desk.'
        });
      }
    } catch (eErr) {
      console.warn('Bed approval email dispatch warning:', eErr.message);
    }

    res.json({
      success: true,
      message: `Bed ${bedNo} successfully allotted. Available bed count occupied by 1. Email and in-app notifications dispatched.`,
      allottedBedNumber: bedNo,
      allottedBedType: bedTypeLabel
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital Staff Dispatch / Discharge Patient (Releases 1 Bed back to available inventory)
router.put('/bed-bookings/:id/dispatch', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { summaryNotes } = req.body;
    const mongoose = require('mongoose');

    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch (e) { objectId = id; }

    const booking = await mongoose.connection.collection('bedadmissions').findOne({ _id: objectId });
    if (!booking) {
      return res.status(404).json({ message: 'Bed admission request not found' });
    }

    const dischargedAt = new Date();

    await mongoose.connection.collection('bedadmissions').updateOne(
      { _id: objectId },
      {
        $set: {
          status: 'DISCHARGED',
          dischargedAt,
          dischargeNotes: summaryNotes || 'Patient discharged in stable condition.',
          updatedAt: new Date()
        }
      }
    );

    // Increment available bed count by 1 (releasing the bed back to capacity)
    try {
      await mongoose.connection.collection('healthcarefacilities').updateOne(
        { $or: [{ facilityId: booking.facilityId }, { name: booking.facilityName }] },
        { $inc: { 'bedCount.available': 1 } }
      );
      await mongoose.connection.collection('facilities').updateOne(
        { name: booking.facilityName },
        { $inc: { 'capacity.beds.available': 1 } }
      );
    } catch (bErr) {
      console.warn('Bed release increment warning:', bErr.message);
    }

    // Log Care Journey Event
    try {
      await CareJourneyEvent.create({
        patientId: booking.patientId,
        eventType: 'EMERGENCY',
        facilityId: booking.facilityId,
        facilityName: booking.facilityName,
        title: `🏁 Discharged from ${booking.facilityName}`,
        description: `Patient officially discharged. Bed ${booking.allottedBedNumber || ''} released. Pass #${booking.admissionPassNumber}.`,
        relatedAppointmentId: booking._id
      });
    } catch (cjErr) {
      console.warn('Care journey discharge event warning:', cjErr.message);
    }

    // Send In-App Notification
    try {
      if (booking.patientId) {
        let patObjId;
        try { patObjId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { patObjId = booking.patientId; }
        await mongoose.connection.collection('notifications').insertOne({
          user: patObjId,
          type: 'general',
          title: `🏥 Official Hospital Discharge Complete`,
          message: `You have been officially discharged from ${booking.facilityName}. Reserved bed #${booking.allottedBedNumber || ''} has been released.`,
          severity: 'info',
          read: false,
          meta: { admissionPassNumber: booking.admissionPassNumber, facilityName: booking.facilityName },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (nErr) {
      console.warn('In-app discharge notification warning:', nErr.message);
    }

    // Send Email Notification
    try {
      let patientEmail = booking.contactPhone && booking.contactPhone.includes('@') ? booking.contactPhone : null;
      if (!patientEmail && booking.patientId) {
        try {
          let pId;
          try { pId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { pId = booking.patientId; }
          const u = await mongoose.connection.collection('users').findOne({ _id: pId });
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendBedDischargedEmail } = require('../services/emailService');
        await sendBedDischargedEmail({
          to: patientEmail,
          patientName: booking.patientName || 'Valued Patient',
          facilityName: booking.facilityName,
          admissionPassNumber: booking.admissionPassNumber,
          dischargedAt,
          summaryNotes: summaryNotes || 'Patient discharged in stable condition.'
        });
      }
    } catch (eErr) {
      console.warn('Discharge email warning:', eErr.message);
    }

    res.json({ success: true, message: `Patient discharged. Reserved bed released (+1 available bed).` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital Staff Shift Patient to General Ward
router.put('/bed-bookings/:id/shift-ward', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { newBedNumber, hospitalNotes } = req.body;
    const mongoose = require('mongoose');

    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch (e) { objectId = id; }

    const booking = await mongoose.connection.collection('bedadmissions').findOne({ _id: objectId });
    if (!booking) {
      return res.status(404).json({ message: 'Bed admission request not found' });
    }

    const wardBedNo = newBedNumber || `GEN-WARD-${Math.floor(10 + Math.random() * 90)}`;

    await mongoose.connection.collection('bedadmissions').updateOne(
      { _id: objectId },
      {
        $set: {
          status: 'SHIFTED_TO_GENERAL_WARD',
          allottedBedType: 'GENERAL_WARD',
          allottedBedNumber: wardBedNo,
          hospitalNotes: hospitalNotes || 'Patient shifted to General Ward for recovery.',
          shiftedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Log Care Journey Event
    try {
      await CareJourneyEvent.create({
        patientId: booking.patientId,
        eventType: 'EMERGENCY',
        facilityId: booking.facilityId,
        facilityName: booking.facilityName,
        title: `🛏️ Shifted to General Ward Bed #${wardBedNo} at ${booking.facilityName}`,
        description: `Patient transferred to General Ward. Bed Tag: #${wardBedNo}. Pass #${booking.admissionPassNumber}.`,
        relatedAppointmentId: booking._id
      });
    } catch (cjErr) {
      console.warn('Care journey ward shift event warning:', cjErr.message);
    }

    // Send In-App Notification
    try {
      if (booking.patientId) {
        let patObjId;
        try { patObjId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { patObjId = booking.patientId; }
        await mongoose.connection.collection('notifications').insertOne({
          user: patObjId,
          type: 'general',
          title: `🛏️ Shifted to General Ward: Bed #${wardBedNo}`,
          message: `Your bed at ${booking.facilityName} has been transferred to General Ward Bed #${wardBedNo}. Pass #${booking.admissionPassNumber}.`,
          severity: 'info',
          read: false,
          meta: { admissionPassNumber: booking.admissionPassNumber, facilityName: booking.facilityName, allottedBedNumber: wardBedNo },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (nErr) {
      console.warn('In-app ward shift notification warning:', nErr.message);
    }

    // Send Email Notification
    try {
      let patientEmail = booking.contactPhone && booking.contactPhone.includes('@') ? booking.contactPhone : null;
      if (!patientEmail && booking.patientId) {
        try {
          let pId;
          try { pId = new mongoose.Types.ObjectId(booking.patientId); } catch(e) { pId = booking.patientId; }
          const u = await mongoose.connection.collection('users').findOne({ _id: pId });
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendBedWardShiftedEmail } = require('../services/emailService');
        await sendBedWardShiftedEmail({
          to: patientEmail,
          patientName: booking.patientName || 'Valued Patient',
          facilityName: booking.facilityName,
          admissionPassNumber: booking.admissionPassNumber,
          newBedNumber: wardBedNo,
          hospitalNotes: hospitalNotes || 'Patient shifted to General Ward for recovery.'
        });
      }
    } catch (eErr) {
      console.warn('Ward shift email warning:', eErr.message);
    }

    res.json({ success: true, message: `Patient shifted to General Ward Bed #${wardBedNo}. Notifications dispatched.`, allottedBedNumber: wardBedNo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanently Delete Bed Admission Record from MongoDB (Freed up DB memory)
router.delete('/bed-bookings/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch(e) { objectId = id; }

    await mongoose.connection.collection('bedadmissions').deleteOne({ _id: objectId });
    res.json({ success: true, message: 'Bed admission record permanently deleted from database.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanently Delete Appointment Record from MongoDB (Freed up DB memory)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch(e) { objectId = id; }

    await Appointment.deleteOne({ _id: objectId });
    res.json({ success: true, message: 'Appointment record permanently deleted from database.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

