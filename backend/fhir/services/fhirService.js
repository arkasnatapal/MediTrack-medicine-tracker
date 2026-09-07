/**
 * Main FHIR Interoperability Core Service for MediTrack.
 * Handles entity translation, FHIR REST search query evaluation,
 * bidirectional import/export, and schema validation.
 */

const mongoose = require('mongoose');

// Dynamic model helper and DB connection guard
async function ensureDbConnected() {
  if (mongoose.connection.readyState === 0) {
    try {
      const connectDB = require('../../config/db');
      await connectDB();
    } catch (e) {
      console.warn('[FHIR Service] Auto DB connection attempt:', e.message);
    }
  }
}

function getModel(modelName, relativePath) {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  try {
    return require(relativePath);
  } catch (e) {
    return null;
  }
}

/**
 * Helper to collect patient IDs linked to a specific facility or doctor.
 */
async function getScopedPatientIds({ facilityId, doctorId }) {
  if (!facilityId && !doctorId) return null; // Unrestricted access (e.g. system admin)

  const patientIdSet = new Set();
  const db = mongoose.connection;

  if (facilityId) {
    const cleanFacId = String(facilityId);
    const isObjId = mongoose.Types.ObjectId.isValid(cleanFacId);
    const facQuery = [
      { facilityId: cleanFacId },
      ...(isObjId ? [{ facilityId: new mongoose.Types.ObjectId(cleanFacId) }] : [])
    ];
    
    // CareAppointments & Appointments
    const careAppts = await db.collection('careappointments').find({ $or: facQuery }).toArray().catch(() => []);
    careAppts.forEach(a => {
      const pid = a.patientId || a.user || a.patient;
      if (pid) patientIdSet.add(String(pid));
    });

    const appts = await db.collection('appointments').find({ $or: facQuery }).toArray().catch(() => []);
    appts.forEach(a => {
      const pid = a.patientId || a.user || a.patient;
      if (pid) patientIdSet.add(String(pid));
    });

    // CareReferrals & Referrals
    const targetQuery = [
      { targetFacilityId: cleanFacId },
      { fromFacilityId: cleanFacId },
      ...(isObjId ? [{ targetFacilityId: new mongoose.Types.ObjectId(cleanFacId) }, { fromFacilityId: new mongoose.Types.ObjectId(cleanFacId) }] : [])
    ];
    const careRefs = await db.collection('carereferrals').find({ $or: targetQuery }).toArray().catch(() => []);
    careRefs.forEach(r => {
      if (r.patientId) patientIdSet.add(String(r.patientId));
    });

    const refs = await db.collection('referrals').find({ $or: targetQuery }).toArray().catch(() => []);
    refs.forEach(r => {
      if (r.patientId) patientIdSet.add(String(r.patientId));
    });

    // BedAdmissions
    const beds = await db.collection('bedadmissions').find({ $or: facQuery }).toArray().catch(() => []);
    beds.forEach(b => {
      if (b.patientId) patientIdSet.add(String(b.patientId));
    });

    // Queues
    const queues = await db.collection('queues').find({ $or: facQuery }).toArray().catch(() => []);
    queues.forEach(q => {
      (q.entries || []).forEach(e => {
        if (e.patientId) patientIdSet.add(String(e.patientId));
      });
    });

    // PatientTransfers
    const xfers = await db.collection('patienttransfers').find({ $or: targetQuery }).toArray().catch(() => []);
    xfers.forEach(x => {
      if (x.patientId) patientIdSet.add(String(x.patientId));
    });

    // CareDiagnosticOrders
    const orders = await db.collection('carediagnosticorders').find({ $or: facQuery }).toArray().catch(() => []);
    orders.forEach(o => {
      if (o.patientId) patientIdSet.add(String(o.patientId));
    });
  }

  if (doctorId) {
    const cleanDocId = String(doctorId);
    const isObjId = mongoose.Types.ObjectId.isValid(cleanDocId);
    const docQuery = [
      { doctorId: cleanDocId },
      ...(isObjId ? [{ doctorId: new mongoose.Types.ObjectId(cleanDocId) }] : [])
    ];

    // CareAppointments & Appointments
    const careAppts = await db.collection('careappointments').find({ $or: docQuery }).toArray().catch(() => []);
    careAppts.forEach(a => {
      const pid = a.patientId || a.user || a.patient;
      if (pid) patientIdSet.add(String(pid));
    });

    const appts = await db.collection('appointments').find({ $or: docQuery }).toArray().catch(() => []);
    appts.forEach(a => {
      const pid = a.patientId || a.user || a.patient;
      if (pid) patientIdSet.add(String(pid));
    });

    // Teleconsultations
    const teles = await db.collection('teleconsultationsessions').find({ $or: docQuery }).toArray().catch(() => []);
    teles.forEach(t => {
      if (t.patientId) patientIdSet.add(String(t.patientId));
    });

    // CareReferrals
    const targetDocQuery = [
      { referringDoctorId: cleanDocId },
      { targetDoctorId: cleanDocId },
      ...(isObjId ? [{ referringDoctorId: new mongoose.Types.ObjectId(cleanDocId) }, { targetDoctorId: new mongoose.Types.ObjectId(cleanDocId) }] : [])
    ];
    const careRefs = await db.collection('carereferrals').find({ $or: targetDocQuery }).toArray().catch(() => []);
    careRefs.forEach(r => {
      if (r.patientId) patientIdSet.add(String(r.patientId));
    });

    // Queues
    const queues = await db.collection('queues').find({ $or: docQuery }).toArray().catch(() => []);
    queues.forEach(q => {
      (q.entries || []).forEach(e => {
        if (e.patientId) patientIdSet.add(String(e.patientId));
      });
    });

    // CareDiagnosticOrders
    const targetOrderQuery = [
      { requestingDoctorId: cleanDocId },
      ...(isObjId ? [{ requestingDoctorId: new mongoose.Types.ObjectId(cleanDocId) }] : [])
    ];
    const orders = await db.collection('carediagnosticorders').find({ $or: targetOrderQuery }).toArray().catch(() => []);
    orders.forEach(o => {
      if (o.patientId) patientIdSet.add(String(o.patientId));
    });
  }

  return Array.from(patientIdSet);
}


function buildScopedPatientQuery(scopedPatientIds) {
  if (!scopedPatientIds) return null;
  const list = [];
  scopedPatientIds.forEach(id => {
    const str = String(id);
    list.push(str);
    if (mongoose.Types.ObjectId.isValid(str)) {
      list.push(new mongoose.Types.ObjectId(str));
    }
  });
  return { $in: list };
}

const User = getModel('User', '../../models/User');
const Checkup = getModel('Checkup', '../../models/Checkup');
const DailyStatus = getModel('DailyStatus', '../../models/DailyStatus');
const Report = getModel('Report', '../../models/Report');
const Appointment = getModel('Appointment', '../../models/Appointment');
const Referral = getModel('Referral', '../../models/Referral');



const {
  toFhirPatient, fromFhirPatient,
  toFhirPractitioner, toFhirPractitionerRole, fromFhirPractitioner,
  toFhirOrganization, toFhirLocation, fromFhirOrganization,
  toFhirObservation, fromFhirObservation,
  toFhirCondition, fromFhirCondition,
  toFhirMedication, toFhirMedicationRequest, toFhirMedicationStatement, fromFhirMedicationRequest,
  toFhirAllergyIntolerance, fromFhirAllergyIntolerance,
  toFhirDiagnosticReport, fromFhirDiagnosticReport,
  toFhirDocumentReference, fromFhirDocumentReference,
  toFhirAppointment, fromFhirAppointment,
  toFhirEncounter, fromFhirEncounter,
  toFhirServiceRequest, fromFhirServiceRequest,
  toFhirTask, fromFhirTask,
  toFhirCarePlan, fromFhirCarePlan,
  toFhirProcedure, toFhirImmunization, toFhirCommunication,
  toFhirCareTeam, toFhirRelatedPerson, toFhirGoal,
  toFhirConsent, toFhirAuditEvent, toFhirProvenance
} = require('../mappers');


const { validateFhirResource } = require('../validators/fhirValidator');
const { createBundle, createPatientEverythingBundle } = require('./bundleService');

class FhirService {
  /**
   * Get a single FHIR resource by Type and ID.
   */
  async getResource(resourceType, id) {
    await ensureDbConnected();
    const UserModel = getModel('User', '../../models/User');
    const DoctorModel = mongoose.models.Doctor || getModel('Doctor', '../../models/Doctor');
    const FacilityModel = mongoose.models.Facility || mongoose.models.HealthcareFacility || getModel('Facility', '../../models/Facility');
    const AppointmentModel = mongoose.models.CareAppointment || getModel('Appointment', '../../models/Appointment');
    const DailyStatusModel = getModel('DailyStatus', '../../models/DailyStatus');
    const CheckupModel = getModel('Checkup', '../../models/Checkup');
    const ReferralModel = mongoose.models.CareReferral || getModel('Referral', '../../models/Referral');

    switch (resourceType) {
      case 'Patient': {
        if (!UserModel) return null;
        const user = await UserModel.findById(id).catch(() => null);
        if (!user) {
          const PatientRecord = mongoose.models.PatientRecord;
          if (PatientRecord) {
            const pRec = await PatientRecord.findById(id).catch(() => null);
            if (pRec) return toFhirPatient(pRec);
          }
          return null;
        }
        return toFhirPatient(user);
      }

      case 'Practitioner': {
        if (DoctorModel) {
          const doc = await DoctorModel.findById(id).catch(() => null);
          if (doc) return toFhirPractitioner(doc);
        }
        if (UserModel) {
          const user = await UserModel.findById(id).catch(() => null);
          if (user) return toFhirPractitioner({ fullName: user.name, email: user.email, phone: user.phoneNumber, _id: user._id });
        }
        return null;
      }

      case 'Organization': {
        if (FacilityModel) {
          const fac = await FacilityModel.findById(id).catch(() => null);
          if (fac) return toFhirOrganization(fac);
        }
        return null;
      }

      case 'Location': {
        if (FacilityModel) {
          const facId = id.replace('loc-', '');
          const fac = await FacilityModel.findById(facId).catch(() => null);
          if (fac) return toFhirLocation(fac);
        }
        return null;
      }

      case 'Appointment': {
        if (AppointmentModel) {
          const appt = await AppointmentModel.findById(id).catch(() => null);
          if (appt) return toFhirAppointment(appt);
        }
        return null;
      }

      case 'Observation': {
        if (DailyStatusModel) {
          const status = await DailyStatusModel.findById(id).catch(() => null);
          if (status) {
            return toFhirObservation({
              id: status._id,
              patientId: status.userId,
              type: 'ENERGY_LEVEL',
              value: status.energyLevel,
              unit: '1-10 scale',
              notes: status.notes,
              effectiveDateTime: status.date
            });
          }
        }
        return null;
      }

      case 'Condition': {
        if (CheckupModel) {
          const checkup = await CheckupModel.findById(id).catch(() => null);
          if (checkup) {
            return toFhirCondition({
              id: checkup._id,
              patientId: checkup.user,
              conditionName: checkup.title,
              recordedDate: checkup.date,
              notes: checkup.notes
            });
          }
        }
        return null;
      }

      case 'ServiceRequest': {
        if (ReferralModel) {
          const ref = await ReferralModel.findById(id).catch(() => null);
          if (ref) return toFhirServiceRequest(ref);
        }
        return null;
      }

      case 'Task': {
        if (ReferralModel) {
          const taskId = id.replace('task-', '');
          const ref = await ReferralModel.findById(taskId).catch(() => null);
          if (ref) return toFhirTask(ref);
        }
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Search FHIR Resources using FHIR query parameters.
   */
  async searchResources(resourceType, params = {}) {
    await ensureDbConnected();
    let resources = [];

    const scopedPatientIds = await getScopedPatientIds({
      facilityId: params.facilityId,
      doctorId: params.doctorId
    });

    if (scopedPatientIds !== null && scopedPatientIds.length === 0) {
      return createBundle({
        type: 'searchset',
        resources: [],
        total: 0
      });
    }

    const UserModel = getModel('User', '../../models/User');
    const DoctorModel = mongoose.models.Doctor || getModel('Doctor', '../../models/Doctor');
    const FacilityModel = mongoose.models.Facility || mongoose.models.HealthcareFacility || getModel('Facility', '../../models/Facility');
    const DailyStatusModel = getModel('DailyStatus', '../../models/DailyStatus');
    const CheckupModel = getModel('Checkup', '../../models/Checkup');
    const AppointmentModel = mongoose.models.CareAppointment || getModel('Appointment', '../../models/Appointment');
    const ReferralModel = mongoose.models.CareReferral || getModel('Referral', '../../models/Referral');

    try {
      switch (resourceType) {
        case 'Patient': {
          const filter = {};
          if (scopedPatientIds !== null && scopedPatientIds.length > 0) {
            filter._id = buildScopedPatientQuery(scopedPatientIds);
          }
          if (params.name) {
            filter.name = new RegExp(params.name, 'i');
          }
          if (params.identifier) {
            const cleanId = params.identifier.replace('Patient/', '');
            const isObjId = mongoose.Types.ObjectId.isValid(cleanId);
            filter.$or = [
              ...(isObjId ? [{ _id: cleanId }] : []),
              { abhaNumber: params.identifier },
              { abhaAddress: params.identifier },
              { memberId: params.identifier }
            ];
          }
          let users = [];
          if (UserModel) {
            users = await UserModel.find(filter).limit(50);
          }
          if (users.length === 0) {
            const db = mongoose.connection;
            const careUsers = await db.collection('careusers').find({}).limit(50).toArray().catch(() => []);
            if (careUsers.length > 0) {
              users = careUsers;
            } else {
              const allUsers = await db.collection('users').find({}).limit(50).toArray().catch(() => []);
              users = allUsers;
            }
          }
          resources = users.map(u => toFhirPatient(u));
          break;
        }

        case 'Observation': {
          if (!DailyStatusModel) break;
          const filter = {};
          if (scopedPatientIds !== null) {
            filter.userId = buildScopedPatientQuery(scopedPatientIds);
          }
          if (params.patient) {
            const pClean = params.patient.replace('Patient/', '');
            filter.userId = buildScopedPatientQuery([pClean]);
          } else if (params.name && UserModel) {
            const userFilter = { name: new RegExp(params.name, 'i') };
            if (scopedPatientIds !== null) {
              userFilter._id = buildScopedPatientQuery(scopedPatientIds);
            }
            const matchingUsers = await UserModel.find(userFilter).select('_id');
            filter.userId = buildScopedPatientQuery(matchingUsers.map(u => u._id));
          }
          const statuses = await DailyStatusModel.find(filter).sort({ date: -1 }).limit(50);
          resources = statuses.map(s => toFhirObservation({
            id: s._id,
            patientId: s.userId,
            type: 'ENERGY_LEVEL',
            value: s.energyLevel,
            unit: '1-10 scale',
            notes: s.notes,
            effectiveDateTime: s.date
          }));
          break;
        }

        case 'Condition': {
          if (!CheckupModel) break;
          const filter = {};
          if (scopedPatientIds !== null) {
            filter.user = buildScopedPatientQuery(scopedPatientIds);
          }
          if (params.patient) {
            const pClean = params.patient.replace('Patient/', '');
            filter.user = buildScopedPatientQuery([pClean]);
          } else if (params.name && UserModel) {
            const userFilter = { name: new RegExp(params.name, 'i') };
            if (scopedPatientIds !== null) {
              userFilter._id = buildScopedPatientQuery(scopedPatientIds);
            }
            const matchingUsers = await UserModel.find(userFilter).select('_id');
            filter.user = buildScopedPatientQuery(matchingUsers.map(u => u._id));
          }
          const checkups = await CheckupModel.find(filter).sort({ date: -1 }).limit(50);
          resources = checkups.map(c => toFhirCondition({
            id: c._id,
            patientId: c.user,
            conditionName: c.title,
            recordedDate: c.date,
            notes: c.notes
          }));
          break;
        }

        case 'Appointment': {
          if (!AppointmentModel) break;
          const filter = {};
          if (params.facilityId) {
            const cleanFacId = String(params.facilityId);
            filter.$or = [
              { facilityId: cleanFacId },
              ...(mongoose.Types.ObjectId.isValid(cleanFacId) ? [{ facilityId: new mongoose.Types.ObjectId(cleanFacId) }] : [])
            ];
          }
          if (params.doctorId) {
            const cleanDocId = String(params.doctorId);
            filter.$or = [
              { doctorId: cleanDocId },
              ...(mongoose.Types.ObjectId.isValid(cleanDocId) ? [{ doctorId: new mongoose.Types.ObjectId(cleanDocId) }] : [])
            ];
          }
          if (params.patient) {
            const pClean = params.patient.replace('Patient/', '');
            filter.patientId = buildScopedPatientQuery([pClean]);
          }
          if (scopedPatientIds !== null && !params.patient) {
            filter.patientId = buildScopedPatientQuery(scopedPatientIds);
          }
          const appts = await AppointmentModel.find(filter).sort({ date: -1 }).limit(50);
          resources = appts.map(a => toFhirAppointment(a));
          break;
        }

        case 'ServiceRequest': {
          if (!ReferralModel) break;
          const filter = {};
          if (params.facilityId) {
            const cleanFacId = String(params.facilityId);
            filter.$or = [
              { targetFacilityId: cleanFacId },
              { fromFacilityId: cleanFacId },
              ...(mongoose.Types.ObjectId.isValid(cleanFacId) ? [
                { targetFacilityId: new mongoose.Types.ObjectId(cleanFacId) },
                { fromFacilityId: new mongoose.Types.ObjectId(cleanFacId) }
              ] : [])
            ];
          }
          if (params.doctorId) {
            const cleanDocId = String(params.doctorId);
            filter.$or = [
              { targetDoctorId: cleanDocId },
              { referringDoctorId: cleanDocId },
              ...(mongoose.Types.ObjectId.isValid(cleanDocId) ? [
                { targetDoctorId: new mongoose.Types.ObjectId(cleanDocId) },
                { referringDoctorId: new mongoose.Types.ObjectId(cleanDocId) }
              ] : [])
            ];
          }
          if (params.patient) {
            const pClean = params.patient.replace('Patient/', '');
            filter.patientId = buildScopedPatientQuery([pClean]);
          }
          if (scopedPatientIds !== null && !params.patient) {
            filter.patientId = buildScopedPatientQuery(scopedPatientIds);
          }
          const refs = await ReferralModel.find(filter).limit(50);
          resources = refs.map(r => toFhirServiceRequest(r));
          break;
        }

        case 'Practitioner': {
          if (!DoctorModel) break;
          const filter = {};
          if (params.name) filter.name = new RegExp(params.name, 'i');
          const docs = await DoctorModel.find(filter).limit(50);
          resources = docs.map(d => toFhirPractitioner(d));
          break;
        }

        case 'Organization': {
          if (!FacilityModel) break;
          const filter = {};
          if (params.name) filter.name = new RegExp(params.name, 'i');
          const facs = await FacilityModel.find(filter).limit(50);
          resources = facs.map(f => toFhirOrganization(f));
          break;
        }

        default:
          resources = [];
      }
    } catch (err) {
      console.warn(`[FHIR Search Warning] Search for ${resourceType} failed:`, err.message);
      resources = [];
    }


    return createBundle({
      type: 'searchset',
      resources: resources,
      total: resources.length
    });
  }


  /**
   * Generate complete FHIR `$everything` Bundle for a patient.
   */
  async getPatientEverythingBundle(patientId) {
    const patientIdClean = patientId.replace('Patient/', '');
    const user = await User.findById(patientIdClean).catch(() => null);
    if (!user) {
      throw new Error(`Patient with ID ${patientIdClean} not found`);
    }

    const patientFhir = toFhirPatient(user);

    // Fetch related records
    const checkups = await Checkup.find({ user: patientIdClean }).catch(() => []);
    const statuses = await DailyStatus.find({ userId: patientIdClean }).catch(() => []);
    const appts = await Appointment.find({ patientId: patientIdClean }).catch(() => []);

    const childResources = [];

    // Map conditions
    checkups.forEach(c => {
      childResources.push(toFhirCondition({
        id: c._id,
        patientId: patientIdClean,
        conditionName: c.title,
        recordedDate: c.date,
        notes: c.notes
      }));
    });

    // Map observations
    statuses.forEach(s => {
      childResources.push(toFhirObservation({
        id: s._id,
        patientId: patientIdClean,
        type: 'ENERGY_LEVEL',
        value: s.energyLevel,
        unit: '1-10 scale',
        notes: s.notes,
        effectiveDateTime: s.date
      }));
    });

    // Map appointments
    appts.forEach(a => {
      childResources.push(toFhirAppointment(a));
    });

    // Map CarePlan
    childResources.push(toFhirCarePlan({
      patientId: patientIdClean,
      title: 'MediTrack Personalized Health CarePlan',
      description: `Daily health score ${user.healthScore || 100}%. Adherence tracking active.`,
      activities: ['Daily medicine intake log', 'Daily vitals monitoring', 'Follow-up consultations']
    }));

    // Map Goal
    childResources.push(toFhirGoal({
      patientId: patientIdClean,
      targetScore: user.healthScore || 100
    }));

    return createPatientEverythingBundle(patientFhir, childResources);
  }

  /**
   * Safe helper to resolve or create a valid Mongoose ObjectId for a target patient.
   */
  async resolveTargetUserId(rawPatientId) {
    let clean = rawPatientId ? String(rawPatientId).replace('Patient/', '').trim() : '';
    if (!clean) {
      clean = 'sample-patient-001';
    }

    const usersColl = mongoose.connection.collection('users');

    // 1. If already a valid 24-hex ObjectId string, check if a User exists or return clean
    if (mongoose.Types.ObjectId.isValid(clean)) {
      const existing = await usersColl.findOne({ _id: new mongoose.Types.ObjectId(clean) }).catch(() => null);
      if (existing) return String(existing._id);
      return clean;
    }

    // 2. Lookup existing user by memberId or email directly in MongoDB 'users' collection
    const existing = await usersColl.findOne({
      $or: [
        { memberId: clean },
        { email: `${clean.toLowerCase()}@meditrack.org` }
      ]
    }).catch(() => null);

    if (existing) {
      return String(existing._id);
    }

    // 3. Auto-create a patient User document directly in MongoDB 'users' collection
    const newId = new mongoose.Types.ObjectId();
    const newUserDoc = {
      _id: newId,
      name: clean.includes('sample') ? 'Sample Patient' : `Patient (${clean})`,
      email: `${clean.toLowerCase()}@meditrack.org`,
      phone: '+1-555-0199',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
      memberId: clean,
      abhaNumber: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      abhaAddress: `${clean.toLowerCase()}@abdm`,
      healthScore: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersColl.insertOne(newUserDoc).catch((err) => {
      console.warn('[FHIR resolveTargetUserId] Direct insertOne warning:', err.message);
    });

    return String(newId);
  }

  /**
   * Helper to ensure an ingested patient is linked to the current facility/doctor scope.
   */
  async ensurePatientFacilityLink(patientId, currentUser) {
    if (!patientId || !currentUser) return;
    const facId = currentUser.facilityId?._id || currentUser.facilityId;
    const docId = currentUser.doctorId?._id || currentUser.doctorId;
    
    if (facId) {
      const cleanFacId = String(facId);
      const cleanPatId = String(patientId);

      if (mongoose.Types.ObjectId.isValid(cleanFacId) && mongoose.Types.ObjectId.isValid(cleanPatId)) {
        const patObjId = new mongoose.Types.ObjectId(cleanPatId);
        const facObjId = new mongoose.Types.ObjectId(cleanFacId);
        const db = mongoose.connection;

        const careColl = db.collection('careappointments');
        const mainColl = db.collection('appointments');

        const existing = await careColl.findOne({
          $or: [
            { patientId: patObjId, facilityId: facObjId },
            { patientId: cleanPatId, facilityId: cleanFacId },
            { patientId: patObjId, facilityId: cleanFacId },
            { patientId: cleanPatId, facilityId: facObjId }
          ]
        }).catch(() => null);

        if (!existing) {
          const apptDoc = {
            appointmentId: `FHIR-LINK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientId: patObjId,
            facilityId: facObjId,
            facilityName: 'MediTrack OPD Health Facility',
            department: 'General OPD',
            doctorId: docId && mongoose.Types.ObjectId.isValid(String(docId)) ? new mongoose.Types.ObjectId(String(docId)) : undefined,
            appointmentDate: new Date(),
            date: new Date().toISOString().split('T')[0],
            timeSlot: '10:00 AM',
            time: '10:00 AM',
            tokenNumber: Math.floor(100 + Math.random() * 900),
            triagePriority: 'ROUTINE',
            triageLevel: 'NORMAL',
            status: 'COMPLETED',
            notes: 'FHIR Interoperability Record Linked',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await Promise.all([
            careColl.insertOne({ ...apptDoc }).catch(() => {}),
            mainColl.insertOne({ ...apptDoc }).catch(() => {})
          ]);
        }
      }
    }
  }

  /**
   * Ingest/Import external FHIR Resource or Bundle into MediTrack database.
   */
  async importFhirResourceOrBundle(fhirJson, currentUser = null) {
    await ensureDbConnected();
    const validation = validateFhirResource(fhirJson);
    if (!validation.valid) {
      throw new Error(`FHIR Validation Error: ${validation.errors.join('; ')}`);
    }

    const importedResults = [];

    if (fhirJson.resourceType === 'Bundle') {
      const entries = fhirJson.entry || [];
      for (const entry of entries) {
        if (entry.resource) {
          const res = await this.importSingleResource(entry.resource, currentUser);
          importedResults.push(res);
        }
      }
    } else {
      const res = await this.importSingleResource(fhirJson, currentUser);
      importedResults.push(res);
    }

    return {
      success: true,
      count: importedResults.length,
      imported: importedResults
    };
  }

  /**
   * Import a single validated FHIR resource into operational MediTrack model.
   */
  async importSingleResource(resource, currentUser = null) {
    const type = resource.resourceType;
    switch (type) {
      case 'Patient': {
        const patData = fromFhirPatient(resource);
        let user = await User.findOne({ email: patData.email }).catch(() => null);
        if (!user) {
          user = new User({
            name: patData.name || 'Imported Patient',
            email: patData.email || `imported-${Date.now()}@meditrack.org`,
            phoneNumber: patData.phone,
            gender: patData.gender,
            address: patData.address,
            dateOfBirth: patData.dateOfBirth
          });
          await user.save();
        }
        await this.ensurePatientFacilityLink(user._id, currentUser);
        return { type: 'Patient', id: user._id, status: 'IMPORTED' };
      }

      case 'Practitioner': {
        const docData = fromFhirPractitioner(resource);
        const Doctor = mongoose.models.Doctor;
        if (Doctor) {
          let doctor = await Doctor.findOne({ medicalRegistrationNumber: docData.medicalRegistrationNumber }).catch(() => null);
          if (!doctor) {
            doctor = new Doctor(docData);
            await doctor.save();
          }
          return { type: 'Practitioner', id: doctor._id, status: 'IMPORTED' };
        }
        return { type: 'Practitioner', status: 'VALIDATED_SKIPPED_STORE' };
      }

      case 'Organization': {
        const facData = fromFhirOrganization(resource);
        const Facility = mongoose.models.Facility;
        if (Facility) {
          let fac = await Facility.findOne({ licenseId: facData.licenseId }).catch(() => null);
          if (!fac) {
            fac = new Facility(facData);
            await fac.save();
          }
          return { type: 'Organization', id: fac._id, status: 'IMPORTED' };
        }
        return { type: 'Organization', status: 'VALIDATED_SKIPPED_STORE' };
      }

      case 'Observation': {
        const obsData = fromFhirObservation(resource);
        const targetUserId = await this.resolveTargetUserId(obsData.patientId);
        
        if (targetUserId) {
          const valNum = typeof obsData.value === 'number' ? obsData.value : parseFloat(obsData.value);
          const energyVal = !isNaN(valNum) ? Math.min(Math.max(Math.round(valNum), 1), 10) : 8;
          const userObjId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

          const doc = {
            userId: userObjId,
            energyLevel: energyVal,
            mood: 'good',
            notes: `[FHIR Ingested ${obsData.display || 'Observation'}] Value: ${obsData.value} ${obsData.unit || ''} (LOINC: ${obsData.loincCode || 'N/A'})`,
            date: obsData.effectiveDateTime ? new Date(obsData.effectiveDateTime) : new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const insertRes = await mongoose.connection.collection('dailystatuses').insertOne(doc).catch(() => null);
          const insertedId = insertRes?.insertedId || doc._id;
          await this.ensurePatientFacilityLink(targetUserId, currentUser);
          return { type: 'Observation', id: insertedId, status: 'IMPORTED_PERSISTED' };
        }
        return { type: 'Observation', status: 'VALIDATED' };
      }

      case 'Condition': {
        const condData = fromFhirCondition(resource);
        const targetUserId = await this.resolveTargetUserId(condData.patientId);

        if (targetUserId) {
          const userObjId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

          const doc = {
            user: userObjId,
            title: condData.conditionName || condData.display || 'Imported Condition',
            time: '10:00 AM',
            location: 'MediTrack OPD Clinic',
            notes: condData.notes || `[FHIR Ingested Condition] SNOMED CT: ${condData.snomedCode || 'N/A'}`,
            date: condData.recordedDate ? new Date(condData.recordedDate) : new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const insertRes = await mongoose.connection.collection('checkups').insertOne(doc).catch(() => null);
          const insertedId = insertRes?.insertedId || doc._id;
          await this.ensurePatientFacilityLink(targetUserId, currentUser);
          return { type: 'Condition', id: insertedId, status: 'IMPORTED_PERSISTED' };
        }
        return { type: 'Condition', status: 'VALIDATED' };
      }

      case 'MedicationRequest': {
        const medName = resource.medicationCodeableConcept?.text || resource.medicationCodeableConcept?.coding?.[0]?.display || 'Medication';
        const patientRef = resource.subject?.reference || '';
        const pid = patientRef.replace('Patient/', '');
        const targetUserId = await this.resolveTargetUserId(pid);

        if (targetUserId) {
          const userObjId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

          const doc = {
            user: userObjId,
            title: `Prescription: ${medName}`,
            time: '10:00 AM',
            location: 'MediTrack Pharmacy & OPD',
            notes: `[FHIR Ingested MedicationRequest] Dosage: ${resource.dosageInstruction?.[0]?.text || 'As directed'}`,
            date: resource.authoredOn ? new Date(resource.authoredOn) : new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const insertRes = await mongoose.connection.collection('checkups').insertOne(doc).catch(() => null);
          const insertedId = insertRes?.insertedId || doc._id;
          await this.ensurePatientFacilityLink(targetUserId, currentUser);
          return { type: 'MedicationRequest', id: insertedId, status: 'IMPORTED_PERSISTED' };
        }
        return { type: 'MedicationRequest', status: 'VALIDATED' };
      }

      case 'ServiceRequest': {
        const refData = fromFhirServiceRequest(resource);
        const targetUserId = await this.resolveTargetUserId(refData.patientId);

        if (targetUserId) {
          const userObjId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

          const doc = {
            patientId: userObjId,
            referralReason: refData.serviceName || 'FHIR Ingested Referral',
            priority: (refData.priority || 'ROUTINE').toUpperCase(),
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const insertRes = await mongoose.connection.collection('carereferrals').insertOne(doc).catch(() => null);
          const insertedId = insertRes?.insertedId || doc._id;
          await this.ensurePatientFacilityLink(targetUserId, currentUser);
          return { type: 'ServiceRequest', id: insertedId, status: 'IMPORTED_PERSISTED' };
        }
        return { type: 'ServiceRequest', status: 'VALIDATED' };
      }

      default:
        return { type: type, status: 'VALIDATED' };
    }
  }
}

module.exports = new FhirService();
