const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AbdmConsentRequest = require('../models/AbdmConsentRequest');
const HealthcareFacility = require('../models/HealthcareFacility');
const authMiddleware = require('../middleware/authMiddleware');

// Helper to format 14-digit ABHA Number (XX-XXXX-XXXX-XXXX)
const generateFormattedAbhaNumber = () => {
  const p1 = Math.floor(10 + Math.random() * 90);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const p3 = Math.floor(1000 + Math.random() * 9000);
  const p4 = Math.floor(1000 + Math.random() * 9000);
  return `${p1}-${p2}-${p3}-${p4}`;
};

// Seed sample consent requests if user has none
const seedSampleConsentsIfEmpty = async (userId, userName) => {
  const existing = await AbdmConsentRequest.countDocuments({ userId });
  if (existing === 0) {
    const now = new Date();
    const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const future7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await AbdmConsentRequest.insertMany([
      {
        requestId: `CR-ABDM-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        requesterName: 'All India Institute of Medical Sciences (AIIMS Delhi)',
        requesterType: 'HOSPITAL',
        requesterFacilityId: 'FAC-IN-DL-AIIMS-01',
        purpose: 'Outpatient Care Consultation & OPD Diagnostics Review',
        healthRecordTypes: ['PRESCRIPTIONS', 'DIAGNOSTIC_REPORTS', 'HEALTH_SUMMARY'],
        status: 'PENDING',
        validTill: future30
      },
      {
        requestId: `CR-ABDM-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        requesterName: 'Dr. B.C. Roy Post Graduate Institute of Pediatric Sciences',
        requesterType: 'CLINIC',
        requesterFacilityId: 'FAC-IN-WB-RURAL-01',
        purpose: 'Specialist Tele-consultation Review',
        healthRecordTypes: ['PRESCRIPTIONS', 'MEDICATION_HISTORY'],
        status: 'GRANTED',
        validTill: future7,
        respondedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    ]);
  }
};

// GET /api/abdm/profile - Fetch ABHA profile for authenticated user
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email abhaNumber abhaAddress abhaStatus abhaQrCode abhaLinkedAt gender dateOfBirth phoneNumber bloodGroup');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '+91 98765 43210',
        gender: user.gender || 'male',
        dateOfBirth: user.dateOfBirth || new Date('1995-06-15'),
        bloodGroup: user.bloodGroup || 'O+',
        abhaNumber: user.abhaNumber,
        abhaAddress: user.abhaAddress,
        abhaStatus: user.abhaStatus || 'UNLINKED',
        abhaQrCode: user.abhaQrCode,
        abhaLinkedAt: user.abhaLinkedAt
      }
    });
  } catch (err) {
    console.error('Error fetching ABHA profile:', err);
    res.status(500).json({ message: 'Failed to fetch ABHA profile', error: err.message });
  }
});

// POST /api/abdm/generate-abha - Generate or Link ABHA ID
router.post('/generate-abha', authMiddleware, async (req, res) => {
  try {
    const { aadhaarNumber, mobileNumber, preferredAbhaAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate formatted 14-digit ABHA Number
    const abhaNumber = generateFormattedAbhaNumber();
    const sanitizeName = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const abhaAddress = preferredAbhaAddress || `${sanitizeName}${Math.floor(100 + Math.random() * 900)}@abdm`;

    // Simulated ABDM QR Code Payload
    const qrPayload = JSON.stringify({
      phrId: abhaAddress,
      abhaNumber: abhaNumber,
      name: user.name,
      gender: user.gender || 'M',
      dob: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '1995-06-15',
      mobile: mobileNumber || user.phoneNumber || '9876543210',
      distCode: 'Jalpaiguri',
      stateCode: 'West Bengal',
      authMethod: 'AADHAAR_OTP_VERIFIED',
      issuedBy: 'National Health Authority (NHA)'
    });

    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

    user.abhaNumber = abhaNumber;
    user.abhaAddress = abhaAddress;
    user.abhaStatus = 'VERIFIED';
    user.abhaQrCode = qrCodeDataUrl;
    user.abhaLinkedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'ABHA Health Card created & linked successfully!',
      abha: {
        abhaNumber: user.abhaNumber,
        abhaAddress: user.abhaAddress,
        abhaStatus: user.abhaStatus,
        abhaQrCode: user.abhaQrCode,
        abhaLinkedAt: user.abhaLinkedAt
      }
    });
  } catch (err) {
    console.error('Error generating ABHA ID:', err);
    res.status(500).json({ message: 'Failed to generate ABHA ID', error: err.message });
  }
});

// POST /api/abdm/opd-scan-token - Scan & Share OPD Token Generator
router.post('/opd-scan-token', authMiddleware, async (req, res) => {
  try {
    const { facilityId, department } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.abhaNumber) {
      return res.status(400).json({ message: 'Please create/link your ABHA Card before using Scan & Share OPD Token.' });
    }

    const facility = await HealthcareFacility.findOne({ facilityId }) || {
      name: 'Primary Health Centre (PHC) Jalpaiguri',
      facilityType: 'PHC',
      district: 'Jalpaiguri'
    };

    const tokenNumber = `OPD-ABDM-${Math.floor(100 + Math.random() * 900)}`;
    const estimatedWaitMinutes = Math.floor(10 + Math.random() * 25);
    const counterNumber = Math.floor(1 + Math.random() * 6);

    res.json({
      success: true,
      message: 'Scan & Share OPD Token Generated Successfully!',
      token: {
        tokenNumber,
        facilityName: facility.name,
        department: department || 'General Medicine OPD',
        patientName: user.name,
        abhaNumber: user.abhaNumber,
        counterNumber: `Counter #${counterNumber}`,
        estimatedWaitMinutes,
        generatedAt: new Date(),
        status: 'ACTIVE_IN_QUEUE'
      }
    });
  } catch (err) {
    console.error('Error generating OPD Scan Token:', err);
    res.status(500).json({ message: 'Failed to generate OPD token', error: err.message });
  }
});

// GET /api/abdm/consents - Get Health Record Access Consent Requests
router.get('/consents', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await seedSampleConsentsIfEmpty(user._id, user.name);

    const consents = await AbdmConsentRequest.find({ userId: user._id }).sort({ requestedAt: -1 });

    res.json({
      success: true,
      consents
    });
  } catch (err) {
    console.error('Error fetching ABDM consent requests:', err);
    res.status(500).json({ message: 'Failed to fetch consent requests', error: err.message });
  }
});

// POST /api/abdm/consents/:id/action - Grant or Deny Consent
router.post('/consents/:id/action', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'GRANT' or 'DENY'
    const consent = await AbdmConsentRequest.findById(req.params.id);

    if (!consent) {
      return res.status(404).json({ message: 'Consent request not found' });
    }

    consent.status = action === 'GRANT' ? 'GRANTED' : 'DENIED';
    consent.respondedAt = new Date();
    await consent.save();

    res.json({
      success: true,
      message: `Consent request ${consent.status.toLowerCase()} successfully`,
      consent
    });
  } catch (err) {
    console.error('Error updating consent request:', err);
    res.status(500).json({ message: 'Failed to update consent request', error: err.message });
  }
});

// GET /api/abdm/fhir-bundle/:consentId - Generate HL7 FHIR R4 Bundle for granted consent
router.get('/fhir-bundle/:consentId', authMiddleware, async (req, res) => {
  try {
    const consentId = req.params.consentId;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : "Demo Patient User";
    const userId = user ? user._id : "usr-demo-9921";
    const abhaNum = user ? user.abhaNumber : "14-8291-0394-8172";
    const abhaAddr = user ? user.abhaAddress : "demouser@abdm";

    const nowIso = new Date().toISOString();
    const fhirBundle = {
      resourceType: "Bundle",
      id: `abdm-fhir-bundle-${consentId}`,
      meta: {
        versionId: "1.0",
        lastUpdated: nowIso,
        profile: [
          "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"
        ],
        security: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
            code: "R",
            display: "Restricted"
          }
        ]
      },
      identifier: {
        system: "https://abdm.gov.in/fhir/bundle-id",
        value: `IN-ABDM-FHIR-${Math.floor(100000 + Math.random() * 900000)}`
      },
      type: "document",
      timestamp: nowIso,
      entry: [
        {
          fullUrl: "Composition/abdm-comp-01",
          resource: {
            resourceType: "Composition",
            id: "abdm-comp-01",
            status: "final",
            type: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "37153-5",
                  display: "Clinical consultation report"
                }
              ],
              text: "Outpatient Medical Prescription & Health Summary"
            },
            subject: {
              reference: `Patient/${userId}`,
              display: `${userName} (ABHA: ${abhaNum})`
            },
            date: nowIso,
            author: [
              {
                display: "Dr. Ananya Sharma (MCI Reg: #59281)",
                reference: "Practitioner/doc-59281"
              }
            ],
            title: "ABDM Health Record Interoperability Envelope"
          }
        },
        {
          fullUrl: `Patient/${userId}`,
          resource: {
            resourceType: "Patient",
            id: String(userId),
            identifier: [
              {
                system: "https://abdm.gov.in/abha-number",
                value: abhaNum
              },
              {
                system: "https://abdm.gov.in/abha-address",
                value: abhaAddr
              }
            ],
            name: [
              {
                text: userName,
                family: userName.split(' ').slice(-1)[0] || "User",
                given: [userName.split(' ')[0] || "Patient"]
              }
            ],
            gender: (user && user.gender) || "male",
            birthDate: (user && user.dateOfBirth) ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "1995-06-15"
          }
        },
        {
          fullUrl: "MedicationRequest/med-rx-01",
          resource: {
            resourceType: "MedicationRequest",
            id: "med-rx-01",
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "27658006",
                  display: "Amoxicillin 500mg oral capsule"
                }
              ],
              text: "Amoxicillin 500mg"
            },
            subject: {
              reference: `Patient/${userId}`,
              display: userName
            },
            dosageInstruction: [
              {
                text: "1 capsule twice daily after meals for 5 days",
                timing: {
                  repeat: {
                    frequency: 2,
                    period: 1,
                    periodUnit: "d"
                  }
                }
              }
            ]
          }
        },
        {
          fullUrl: "Condition/cond-diag-01",
          resource: {
            resourceType: "Condition",
            id: "cond-diag-01",
            clinicalStatus: {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
            },
            verificationStatus: {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }]
            },
            code: {
              coding: [{ system: "http://snomed.info/sct", code: "386661006", display: "Fever and Upper Respiratory Tract Symptoms" }],
              text: "Acute Upper Respiratory Symptoms"
            },
            subject: { reference: `Patient/${userId}` }
          }
        }
      ]
    };

    res.json({
      success: true,
      consentId,
      standard: "HL7 FHIR Release 4 (ABDM Profile compliant)",
      fhirBundle
    });
  } catch (err) {
    console.error('Error serving FHIR bundle:', err);
    res.status(500).json({ message: 'Failed to generate FHIR bundle', error: err.message });
  }
});

module.exports = router;

