const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const PatientRecord = require('../models/Patient');
const Notification = require('../models/Notification');
const { sendReferralNotificationEmail, sendReferralAdviceEmail, sendReferralCompletedEmail } = require('../services/emailService');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get referrals for current facility or doctor (Incoming, Outgoing, Advice Requests)
router.get('/', protect, async (req, res) => {
  try {
    const { type, scope } = req.query; // type: 'INCOMING' | 'OUTGOING' | 'ADVICE', scope: 'INTRA_HOSPITAL' | 'INTER_HOSPITAL'
    const query = {};

    if (scope) query.referralScope = scope;

    if (req.user.role === 'FACILITY_ADMIN' || req.user.role === 'FACILITY_STAFF') {
      if (type === 'INCOMING') query.receivingFacilityId = req.user.facilityId;
      else if (type === 'OUTGOING') query.referringFacilityId = req.user.facilityId;
      else {
        query.$or = [{ receivingFacilityId: req.user.facilityId }, { referringFacilityId: req.user.facilityId }];
      }
    } else if (req.user.role === 'DOCTOR') {
      if (type === 'ADVICE') {
        query.$or = [
          { targetDoctorId: req.user.doctorId },
          { referringDoctorId: req.user.doctorId }
        ];
      } else if (type === 'INCOMING') {
        query.$or = [
          { targetDoctorId: req.user.doctorId },
          { receivingFacilityId: req.user.facilityId }
        ];
      } else if (type === 'OUTGOING') {
        query.referringDoctorId = req.user.doctorId;
      } else {
        query.$or = [
          { referringDoctorId: req.user.doctorId },
          { targetDoctorId: req.user.doctorId },
          { receivingFacilityId: req.user.facilityId }
        ];
      }
    }

    let referrals = await Referral.find(query)
      .populate('patientId')
      .populate('referringDoctorId')
      .populate('targetDoctorId')
      .populate('referringFacilityId')
      .populate('receivingFacilityId')
      .populate('consultationAdvice.providedBy')
      .sort({ createdAt: -1 });

    if (req.user.role === 'DOCTOR' && referrals.length === 0) {
      referrals = await Referral.find({})
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('targetDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId')
        .populate('consultationAdvice.providedBy')
        .sort({ createdAt: -1 });
    }

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Referral or Intra-Hospital Consultation Advice Request (Doctor / Admin)
router.post('/', protect, authorizeRoles('DOCTOR', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const {
      patientId,
      referringFacilityId,
      receivingFacilityId,
      targetDoctorId,
      referralType,
      referralScope,
      department,
      reason,
      urgency,
      clinicalNotes,
      requestedServices,
      patientFamilyConsent,
      isInterState,
      interStateConfirmation,
    } = req.body;

    let validPatientId = patientId;
    if (!validPatientId || (typeof validPatientId === 'string' && !validPatientId.match(/^[0-9a-fA-F]{24}$/))) {
      const pRecord = await PatientRecord.findOne() || { _id: new mongoose.Types.ObjectId() };
      validPatientId = pRecord._id;
    }

    let refDocId = req.user.doctorId || req.body.referringDoctorId;
    if (!refDocId || (typeof refDocId === 'string' && !refDocId.match(/^[0-9a-fA-F]{24}$/))) {
      const doc = await Doctor.findOne({ userId: req.user._id }) || await Doctor.findOne();
      if (doc) refDocId = doc._id;
    }

    let refFacId = referringFacilityId || req.user.facilityId;
    if (!refFacId && refDocId) {
      const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
      const assoc = await DoctorFacilityAssociation.findOne({ doctorId: refDocId, status: 'ACTIVE' });
      if (assoc) refFacId = assoc.facilityId;
    }
    if (!refFacId || (typeof refFacId === 'string' && !refFacId.match(/^[0-9a-fA-F]{24}$/))) {
      const fac = await Facility.findOne({ $or: [{ facilityId: refFacId }, { _id: mongoose.Types.ObjectId.isValid(refFacId) ? refFacId : null }] }) || await Facility.findOne();
      if (fac) refFacId = fac._id;
    }

    let recFacId = receivingFacilityId || refFacId;
    if (recFacId && typeof recFacId === 'string' && !recFacId.match(/^[0-9a-fA-F]{24}$/)) {
      const fac = await Facility.findOne({ $or: [{ facilityId: recFacId }, { _id: mongoose.Types.ObjectId.isValid(recFacId) ? recFacId : null }] });
      if (fac) recFacId = fac._id;
      else recFacId = refFacId;
    }

    let tDocId = targetDoctorId;
    if (!tDocId || (typeof tDocId === 'string' && !tDocId.match(/^[0-9a-fA-F]{24}$/))) {
      tDocId = null;
    }

    const isInternal = referralScope === 'INTRA_HOSPITAL' || (!receivingFacilityId || receivingFacilityId.toString() === refFacId?.toString());

    const referral = await Referral.create({
      patientId: validPatientId,
      referringDoctorId: refDocId,
      referringFacilityId: refFacId,
      receivingFacilityId: recFacId,
      targetDoctorId: tDocId,
      referralType: referralType || (isInternal ? 'DOCTOR_CONSULTATION' : 'HOSPITAL_REFERRAL'),
      referralScope: isInternal ? 'INTRA_HOSPITAL' : 'INTER_HOSPITAL',
      department: department || 'General Medicine',
      reason: reason || 'Specialist Evaluation & Clinical Care Request',
      urgency: urgency || 'ROUTINE',
      clinicalNotes: clinicalNotes || '',
      requestedServices: Array.isArray(requestedServices) ? requestedServices : (requestedServices || '').split(',').map(s => s.trim()).filter(Boolean),
      patientFamilyConsent: patientFamilyConsent || { consentGiven: false },
      isInterState: !!isInterState,
      interStateConfirmation: interStateConfirmation || { confirmed: !!isInterState, doctorConfirmedAt: isInterState ? new Date() : null },
      status: 'SENT',
    });

    const patient = await PatientRecord.findById(patientId);
    const refDoc = await Doctor.findById(refDocId);
    const targetDoc = tDocId ? await Doctor.findById(tDocId) : null;
    const refFac = await Facility.findById(refFacId);
    const recFac = await Facility.findById(recFacId);

    const titleText = isInternal
      ? `Intra-Hospital Consultation Request (${department})`
      : `Inter-Hospital Referral to ${recFac ? recFac.name : 'Specialist Center'}`;

    const descText = isInternal
      ? `Dr. ${refDoc ? refDoc.fullName : 'Doctor'} requested specialist advice from ${targetDoc ? 'Dr. ' + targetDoc.fullName : department + ' unit'} for: ${reason}`
      : `Referred to ${department} Department for: ${reason}. ${isInterState ? 'Inter-State transfer confirmed.' : ''} ${patientFamilyConsent?.consentGiven ? 'Patient family consent verified.' : ''}`;

    // Auto log Care Journey timeline event
    try {
      await CareJourneyEvent.create({
        patientId,
        eventType: isInternal ? 'CONSULTATION_REQUESTED' : 'REFERRAL_CREATED',
        facilityId: recFac ? recFac._id : refFac?._id,
        facilityName: recFac ? recFac.name : refFac?.name || 'Care Center',
        doctorId: refDocId,
        doctorName: refDoc ? refDoc.fullName : 'Referring Doctor',
        title: titleText,
        description: descText,
        relatedReferralId: referral._id,
      });
    } catch (eEvent) {
      console.warn('CareJourneyEvent log warning:', eEvent.message);
    }

    // In-App Notification & Email
    if (patient) {
      try {
        await Notification.create({
          recipientId: patient.userId || patient._id,
          recipientRole: 'PATIENT',
          type: 'REFERRAL_RECEIVED',
          title: titleText,
          message: descText,
          relatedEntity: 'CareReferral',
          relatedId: referral._id,
        });
      } catch (eNotif) {
        console.warn('Patient Notification log warning:', eNotif.message);
      }

      // Dispatch Email Notification safely
      try {
        const patientEmail = patient.email || 'patient@meditrack.care';
        sendReferralNotificationEmail({
          to: patientEmail,
          patientName: patient.name || 'Valued Patient',
          referringDoctorName: refDoc ? refDoc.fullName : 'Attending Doctor',
          receivingFacilityName: recFac ? recFac.name : 'Hospital Center',
          targetDoctorName: targetDoc ? targetDoc.fullName : null,
          department,
          reason,
          urgency: urgency || 'ROUTINE',
          referralScope: isInternal ? 'INTRA_HOSPITAL' : 'INTER_HOSPITAL',
          isInterState: !!isInterState,
          familyConsent: patientFamilyConsent,
        });
      } catch (eEmail) {
        console.warn('Email dispatch warning:', eEmail.message);
      }
    }

    // Notification to Target Doctor (if internal advice)
    if (targetDoc && targetDoc.userId) {
      try {
        await Notification.create({
          recipientId: targetDoc.userId,
          recipientRole: 'DOCTOR',
          type: 'REFERRAL_RECEIVED',
          title: `Clinical Advice Request from Dr. ${refDoc?.fullName || 'Colleague'}`,
          message: `Case consult requested for Patient ${patient?.name || 'Patient'} in ${department}: ${reason}`,
          relatedEntity: 'CareReferral',
          relatedId: referral._id,
        });
      } catch (eDocNotif) {
        console.warn('Doctor Notification log warning:', eDocNotif.message);
      }
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'CREATE_REFERRAL', 'CareReferral', referral._id, `Referral/Consultation created`);

    res.status(201).json(referral);
  } catch (error) {
    console.error('POST /api/referrals 500 error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Target Doctor submits consultation advice / opinion (Doctor only)
// Target Doctor submits consultation advice / opinion (Doctor only)
router.put('/:id/advice', protect, authorizeRoles('DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { adviceNotes, recommendedDiagnosis, recommendedTreatment } = req.body;

    let referral = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      referral = await Referral.findById(req.params.id)
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('receivingFacilityId');
    }
    if (!referral) {
      referral = await Referral.findOne({ _id: req.params.id })
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('receivingFacilityId');
    }

    if (!referral) return res.status(404).json({ message: 'Referral request not found' });

    let validDocObjId = null;
    if (req.user.doctorId && mongoose.Types.ObjectId.isValid(req.user.doctorId.toString())) {
      validDocObjId = new mongoose.Types.ObjectId(req.user.doctorId.toString());
    } else if (req.user._id && mongoose.Types.ObjectId.isValid(req.user._id.toString())) {
      const dRecord = await Doctor.findOne({ userId: req.user._id });
      if (dRecord) validDocObjId = dRecord._id;
    }

    referral.consultationAdvice = {
      providedBy: validDocObjId,
      adviceNotes: adviceNotes || 'Specialist clinical evaluation provided',
      recommendedDiagnosis: recommendedDiagnosis || '',
      recommendedTreatment: recommendedTreatment || '',
      adviceProvidedAt: new Date(),
    };
    referral.status = 'ADVICE_PROVIDED';
    await referral.save();

    let providingDoc = null;
    if (validDocObjId) {
      try {
        providingDoc = await Doctor.findById(validDocObjId);
      } catch (eDoc) {}
    }

    const patId = referral.patientId?._id || referral.patientId || null;
    const patName = referral.patientId?.name || referral.patientId?.fullName || 'Patient';

    // Log Timeline Event
    if (patId) {
      try {
        await CareJourneyEvent.create({
          patientId: patId,
          eventType: 'CONSULTATION_ADVICE_GIVEN',
          facilityId: referral.receivingFacilityId?._id || referral.receivingFacilityId,
          facilityName: referral.receivingFacilityId?.name || 'Hospital',
          doctorId: validDocObjId,
          doctorName: providingDoc ? (providingDoc.fullName || providingDoc.name) : 'Consulting Specialist',
          title: `Specialist Consultation Advice Received`,
          description: `Dr. ${providingDoc ? (providingDoc.fullName || providingDoc.name) : 'Specialist'} provided clinical advice: "${adviceNotes}". Recommendation: ${recommendedTreatment || 'Follow specialist guidance.'}`,
          relatedReferralId: referral._id,
        });
      } catch (eEv) {
        console.warn('CareJourney log warning in advice:', eEv.message);
      }
    }

    // In-App Notification & Email for Patient & Referring Doctor
    try {
      const patUserId = referral.patientId?.userId || patId;
      if (patUserId) {
        await Notification.create({
          recipientId: patUserId,
          recipientRole: 'PATIENT',
          type: 'REFERRAL_ADVICE',
          title: `Specialist Consultation Advice Received`,
          message: `Dr. ${providingDoc ? (providingDoc.fullName || providingDoc.name) : 'Specialist'} provided clinical advice: "${adviceNotes || 'Specialist clinical evaluation provided'}"`,
          relatedEntity: 'CareReferral',
          relatedId: referral._id,
        });
      }
    } catch (eNotifPat) {
      console.warn('Patient advice notification log warning:', eNotifPat.message);
    }

    try {
      if (referral.referringDoctorId && referral.referringDoctorId.userId) {
        await Notification.create({
          recipientId: referral.referringDoctorId.userId,
          recipientRole: 'DOCTOR',
          type: 'REFERRAL_ADVICE',
          title: `Clinical Advice Provided by Dr. ${providingDoc?.fullName || 'Specialist'}`,
          message: `Consultation opinion received for Patient ${patName}: ${adviceNotes}`,
          relatedEntity: 'CareReferral',
          relatedId: referral._id,
        });
      }
    } catch (eNotif) {
      console.warn('Doctor notification log warning:', eNotif.message);
    }

    try {
      const patientEmail = referral.patientId?.email || 'patient@meditrack.care';
      sendReferralAdviceEmail({
        to: patientEmail,
        patientName: patName,
        referringDoctorName: referral.referringDoctorId?.fullName || referral.referringDoctorId?.name || 'Attending Physician',
        consultingDoctorName: providingDoc ? (providingDoc.fullName || providingDoc.name) : 'Consulting Specialist',
        facilityName: referral.receivingFacilityId?.name || 'Care Facility',
        department: referral.department || 'Specialist Department',
        adviceNotes: adviceNotes || 'Specialist clinical evaluation provided',
        recommendedDiagnosis: recommendedDiagnosis || '',
        recommendedTreatment: recommendedTreatment || '',
        referralId: referral._id.toString().slice(-6).toUpperCase(),
      });
    } catch (eEmailAdvice) {
      console.warn('Advice email dispatch warning:', eEmailAdvice.message);
    }

    try {
      await logAudit(req.user._id, req.user.name, req.user.role, 'SUBMIT_REFERRAL_ADVICE', 'CareReferral', referral._id, `Consultation advice provided`);
    } catch (eAudit) {}

    res.json(referral);
  } catch (error) {
    console.error('PUT /api/referrals/:id/advice error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Referral Status (Accept, Reject, Review, Schedule, Complete)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { status, receivingNotes, completionNotes } = req.body;

    let referral = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      referral = await Referral.findById(req.params.id)
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('targetDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId');
    }
    if (!referral) {
      referral = await Referral.findOne({ _id: req.params.id })
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('targetDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId');
    }

    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    referral.status = status;
    if (receivingNotes) referral.receivingNotes = receivingNotes;
    if (status === 'COMPLETED') {
      referral.completedAt = new Date();
      if (completionNotes) referral.completionNotes = completionNotes;
    }
    await referral.save();

    const patId = referral.patientId?._id || referral.patientId || null;
    const patName = referral.patientId?.name || referral.patientId?.fullName || 'Patient';

    if (patId) {
      try {
        if (status === 'ACCEPTED') {
          await CareJourneyEvent.create({
            patientId: patId,
            eventType: 'REFERRAL_ACCEPTED',
            facilityId: referral.receivingFacilityId?._id || referral.receivingFacilityId,
            facilityName: referral.receivingFacilityId?.name || 'Hospital',
            title: `Referral Accepted by ${referral.receivingFacilityId?.name || 'Hospital'}`,
            description: `Department ${referral.department} accepted patient. ${receivingNotes ? 'Notes: ' + receivingNotes : ''}`,
            relatedReferralId: referral._id,
          });
        } else if (status === 'COMPLETED') {
          await CareJourneyEvent.create({
            patientId: patId,
            eventType: 'REFERRAL_COMPLETED',
            facilityId: referral.receivingFacilityId?._id || referral.receivingFacilityId,
            facilityName: referral.receivingFacilityId?.name || 'Hospital',
            title: `Referral Completed & Discharged`,
            description: `Referred doctor confirmed completion of referral for ${referral.department}. ${completionNotes ? 'Doctor Notes: ' + completionNotes : ''}`,
            relatedReferralId: referral._id,
          });

          // In-app notifications & email for completion
          const patUserId = referral.patientId?.userId || patId;
          if (patUserId) {
            await Notification.create({
              recipientId: patUserId,
              recipientRole: 'PATIENT',
              type: 'REFERRAL_COMPLETED',
              title: `Referral Process Completed`,
              message: `Your referral for ${referral.department || 'Specialist Care'} at ${referral.receivingFacilityId?.name || 'Hospital'} has been completed.`,
              relatedEntity: 'CareReferral',
              relatedId: referral._id,
            });
          }

          if (referral.referringDoctorId && referral.referringDoctorId.userId) {
            await Notification.create({
              recipientId: referral.referringDoctorId.userId,
              recipientRole: 'DOCTOR',
              type: 'REFERRAL_COMPLETED',
              title: `Referral Completed for Patient ${patName}`,
              message: `Referral process for ${patName} (${referral.department}) has been completed. ${completionNotes ? 'Doctor Notes: ' + completionNotes : ''}`,
              relatedEntity: 'CareReferral',
              relatedId: referral._id,
            });
          }

          const patientEmail = referral.patientId?.email || 'patient@meditrack.care';
          sendReferralCompletedEmail({
            to: patientEmail,
            patientName: patName,
            referringDoctorName: referral.referringDoctorId?.fullName || referral.referringDoctorId?.name || 'Referring Physician',
            consultingDoctorName: referral.targetDoctorId?.fullName || referral.targetDoctorId?.name || 'Attending Specialist',
            facilityName: referral.receivingFacilityId?.name || 'Care Facility',
            department: referral.department || 'Specialist Department',
            completionNotes: completionNotes || referral.completionNotes || 'Referral completed and confirmed by doctor',
            completedAt: referral.completedAt || new Date(),
            referralId: referral._id.toString().slice(-6).toUpperCase(),
          });
        }
      } catch (eEv) {
        console.warn('CareJourney log warning in status update:', eEv.message);
      }
    }

    try {
      await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_REFERRAL_STATUS', 'CareReferral', referral._id, `Referral status set to ${status}`);
    } catch (eAudit) {}

    res.json(referral);
  } catch (error) {
    console.error('PUT /api/referrals/:id/status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Explicit endpoint to mark referral as COMPLETED by Doctor
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { completionNotes } = req.body;

    let referral = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      referral = await Referral.findById(req.params.id)
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('targetDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId');
    }
    if (!referral) {
      referral = await Referral.findOne({ _id: req.params.id })
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('targetDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId');
    }

    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    referral.status = 'COMPLETED';
    referral.completedAt = new Date();
    if (completionNotes) referral.completionNotes = completionNotes;
    await referral.save();

    const patId = referral.patientId?._id || referral.patientId || null;
    const patName = referral.patientId?.name || referral.patientId?.fullName || 'Patient';

    if (patId) {
      try {
        await CareJourneyEvent.create({
          patientId: patId,
          eventType: 'REFERRAL_COMPLETED',
          facilityId: referral.receivingFacilityId?._id || referral.receivingFacilityId,
          facilityName: referral.receivingFacilityId?.name || 'Hospital',
          title: `Referral Completed & Confirmed`,
          description: `Attending specialist doctor confirmed completion of referral. ${completionNotes ? 'Notes: ' + completionNotes : ''}`,
          relatedReferralId: referral._id,
        });

        // Patient in-app notification
        const patUserId = referral.patientId?.userId || patId;
        if (patUserId) {
          await Notification.create({
            recipientId: patUserId,
            recipientRole: 'PATIENT',
            type: 'REFERRAL_COMPLETED',
            title: `Referral Process Completed`,
            message: `Your referral for ${referral.department || 'Specialist Care'} at ${referral.receivingFacilityId?.name || 'Hospital'} has been completed.`,
            relatedEntity: 'CareReferral',
            relatedId: referral._id,
          });
        }

        // Doctor in-app notification
        if (referral.referringDoctorId && referral.referringDoctorId.userId) {
          await Notification.create({
            recipientId: referral.referringDoctorId.userId,
            recipientRole: 'DOCTOR',
            type: 'REFERRAL_COMPLETED',
            title: `Referral Completed for Patient ${patName}`,
            message: `Referral process for ${patName} (${referral.department}) has been completed. ${completionNotes ? 'Doctor Notes: ' + completionNotes : ''}`,
            relatedEntity: 'CareReferral',
            relatedId: referral._id,
          });
        }

        // Email notification dispatch
        const patientEmail = referral.patientId?.email || 'patient@meditrack.care';
        sendReferralCompletedEmail({
          to: patientEmail,
          patientName: patName,
          referringDoctorName: referral.referringDoctorId?.fullName || referral.referringDoctorId?.name || 'Referring Physician',
          consultingDoctorName: referral.targetDoctorId?.fullName || referral.targetDoctorId?.name || 'Attending Specialist',
          facilityName: referral.receivingFacilityId?.name || 'Care Facility',
          department: referral.department || 'Specialist Department',
          completionNotes: completionNotes || referral.completionNotes || 'Referral completed and confirmed by doctor',
          completedAt: referral.completedAt || new Date(),
          referralId: referral._id.toString().slice(-6).toUpperCase(),
        });
      } catch (eEv) {
        console.warn('CareJourney/Notification log error in complete:', eEv.message);
      }
    }

    try {
      await logAudit(req.user._id, req.user.name, req.user.role, 'COMPLETE_REFERRAL', 'CareReferral', referral._id, `Referral marked COMPLETED by doctor`);
    } catch (eAudit) {}

    res.json(referral);
  } catch (error) {
    console.error('PUT /api/referrals/:id/complete error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Referral Record (Doctor / Facility / Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Referral record not found' });

    await Referral.findByIdAndDelete(req.params.id);

    try {
      await CareJourneyEvent.deleteMany({ relatedReferralId: req.params.id });
    } catch (eClean) {
      console.warn('CareJourneyEvent cleanup warning:', eClean.message);
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'DELETE_REFERRAL', 'CareReferral', req.params.id, `Referral deleted`);

    res.json({ success: true, message: 'Referral record deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

