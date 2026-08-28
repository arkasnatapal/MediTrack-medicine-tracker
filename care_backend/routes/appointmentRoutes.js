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
      .sort({ createdAt: -1 });

    if (req.user.role === 'DOCTOR' && appointments.length === 0) {
      appointments = await Appointment.find({})
        .populate('patientId')
        .populate('doctorId')
        .populate('facilityId')
        .sort({ createdAt: -1 });
    }

    res.json(appointments);
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

// Update Appointment Status (Check-in, Start Consult, Complete, Reschedule, Cancel)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, notes, prescription } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId')
      .populate('doctorId');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    if (notes) appointment.notes = notes;
    if (prescription) {
      appointment.prescription = {
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines || [],
        advice: prescription.advice,
        createdAt: new Date(),
      };
    }
    await appointment.save();

    // Auto-create Care Journey timeline event on completion or prescription
    if (status === 'COMPLETED' || prescription) {
      await CareJourneyEvent.create({
        patientId: appointment.patientId._id,
        eventType: prescription ? 'PRESCRIPTION_ISSUED' : 'SPECIALIST_CONSULTATION',
        facilityId: appointment.facilityId._id,
        facilityName: appointment.facilityId.name,
        doctorId: appointment.doctorId ? appointment.doctorId._id : null,
        doctorName: appointment.doctorId ? appointment.doctorId.fullName : 'Doctor',
        title: prescription ? `Prescription & Notes Issued by Dr. ${appointment.doctorId?.fullName || 'Doctor'}` : `Consultation Completed at ${appointment.facilityId.name}`,
        description: prescription ? `Diagnosis: ${prescription.diagnosis || 'N/A'}` : notes || 'Consultation completed.',
        relatedAppointmentId: appointment._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_APPOINTMENT_STATUS', 'CareAppointment', appointment._id, `Changed status to ${status}`);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
