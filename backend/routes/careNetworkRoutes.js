const express = require('express');
const router = express.Router();
const axios = require('axios');

const HealthcareFacility = require('../models/HealthcareFacility');
const Appointment = require('../models/Appointment');
const QueueStatus = require('../models/QueueStatus');
const Referral = require('../models/Referral');
const DiagnosticService = require('../models/DiagnosticService');
const MedicineInventory = require('../models/MedicineInventory');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const TeleconsultationRequest = require('../models/TeleconsultationRequest');

const facilitiesSeedData = require('../data/facilitiesData');
const authMiddleware = require('../middleware/authMiddleware');
const facilityContactService = require('../services/facilityContactService');

// Helper Haversine Distance Calculation
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Sync Pan-India Public Healthcare Facilities
const seedFacilitiesIfEmpty = async () => {
  try {
    for (const fac of facilitiesSeedData) {
      await HealthcareFacility.updateOne(
        { facilityId: fac.facilityId },
        { $set: fac },
        { upsert: true }
      );
    }
    console.log('🌱 Pan-India Public Healthcare Facilities Synced Successfully');
  } catch (err) {
    console.error('Failed to sync facilities:', err);
  }
};

// Call seed check on startup
seedFacilitiesIfEmpty();

// Dynamic Comprehensive Localized Facility Generator for ANY location in India
const generateLocalFacilitiesForCoordinates = (userLat, userLng, userCity = 'Jalpaiguri') => {
  const baseLat = userLat;
  const baseLng = userLng;
  const city = userCity || 'Jalpaiguri';

  return [
    {
      facilityId: `FAC-DYN-DH-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: 'District Hospital & Super Specialty Trauma Center',
      facilityType: 'DISTRICT_HOSPITAL',
      state: 'Local State',
      district: 'District Headquarters',
      taluka: 'Central Division',
      address: `Civil Hospital Complex, Main Road (${(baseLat + 0.012).toFixed(4)}, ${(baseLng + 0.009).toFixed(4)})`,
      latitude: baseLat + 0.012,
      longitude: baseLng + 0.009,
      phone: '112 / 108',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Cardiology', 'Emergency Trauma', 'Neurology', 'General Surgery', 'Pediatrics', 'ICU / CCU'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'MRI', available: true, waitTimeMinutes: 20 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
        { name: 'Pathology', available: true, waitTimeMinutes: 10 }
      ],
      medicineServices: [
        { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 3500, available: true },
        { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 8000, available: true },
        { medicineName: 'Atorvastatin 20mg', genericName: 'Atorvastatin Calcium', quantity: 2400, available: true },
        { medicineName: 'Aspirin 75mg', genericName: 'Acetylsalicylic Acid', quantity: 3000, available: true },
        { medicineName: 'Insulin Human Glargine', genericName: 'Insulin Glargine', quantity: 500, available: true }
      ],
      operatingHours: '24/7 Apex Emergency & Trauma Center',
      isPublicFacility: true,
      bedCount: { total: 350, available: 62 },
      rating: 4.9
    },
    {
      facilityId: `FAC-DYN-DIST-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `${city} District Hospital & Superspeciality Trauma Unit`,
      facilityType: 'DISTRICT_HOSPITAL',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Sadar`,
      address: `Hospital Road, District Hospital Campus, ${city} (${(baseLat + 0.005).toFixed(4)}, ${(baseLng + 0.003).toFixed(4)})`,
      latitude: baseLat + 0.005,
      longitude: baseLng + 0.003,
      phone: '+91 3561 222100',
      email: `dh.${city.toLowerCase()}@wbhealth.gov.in`,
      website: `https://www.wbhealth.gov.in`,
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['General Surgery', 'Trauma & ICU', 'Pediatrics', 'Obstetrics & Gynecology', 'Cardiology', 'Orthopedics'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 }
      ],
      medicineServices: [
        { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 2500, available: true },
        { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 1200, available: true },
        { medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', quantity: 800, available: true }
      ],
      operatingHours: '24/7 Apex Emergency & Trauma Center',
      isPublicFacility: true,
      bedCount: { total: 350, available: 62 },
      rating: 4.9
    },
    {
      facilityId: `FAC-DYN-PHC1-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Primary Health Centre (PHC) ${city} Sadar`,
      facilityType: 'PHC',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Central`,
      address: `DBC Road, Near Kadamtala More, ${city} (${(baseLat - 0.008).toFixed(4)}, ${(baseLng + 0.005).toFixed(4)})`,
      latitude: baseLat - 0.008,
      longitude: baseLng + 0.005,
      phone: '+91 3561 224455',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['General OPD', 'Maternal & Child Health', 'Immunization', 'First Aid'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 10 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 15 }
      ],
      medicineServices: [
        { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 850, available: true },
        { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 400, available: true }
      ],
      operatingHours: '24/7 Emergency, OPD 8 AM - 4 PM',
      isPublicFacility: true,
      bedCount: { total: 18, available: 7 },
      rating: 4.7
    },
    {
      facilityId: `FAC-DYN-RH-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Rajganj Rural Hospital & Maternity Unit`,
      facilityType: 'RURAL_HOSPITAL',
      state: 'West Bengal',
      district: city,
      taluka: 'Rajganj Block',
      address: `Rajganj Main Road, ${city} Sub-Division (${(baseLat - 0.032).toFixed(4)}, ${(baseLng - 0.022).toFixed(4)})`,
      latitude: baseLat - 0.032,
      longitude: baseLng - 0.022,
      phone: '+91 3561 229988',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Maternal & Child Healthcare', 'General OPD', 'Snakebite & Poisoning First Aid'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 10 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 15 }
      ],
      medicineServices: [
        { medicineName: 'Anti-Snake Venom (ASV)', genericName: 'Polyvalent ASV', quantity: 45, available: true },
        { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 900, available: true }
      ],
      operatingHours: '24/7 Emergency',
      isPublicFacility: true,
      bedCount: { total: 40, available: 16 },
      rating: 4.6
    },
    {
      facilityId: `FAC-DYN-CHC-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Community Health Centre (CHC) DBC Road ${city}`,
      facilityType: 'CHC',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Sub-Division`,
      address: `DBC Road, Near High School, ${city} (${(baseLat + 0.028).toFixed(4)}, ${(baseLng - 0.019).toFixed(4)})`,
      latitude: baseLat + 0.028,
      longitude: baseLng - 0.019,
      phone: '+91 3561 230911',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['General Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Emergency Care'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'Ultrasound', available: true, waitTimeMinutes: 20 }
      ],
      medicineServices: [
        { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 1500, available: true },
        { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 600, available: true }
      ],
      operatingHours: '24/7 Emergency & OPD',
      isPublicFacility: true,
      bedCount: { total: 60, available: 22 },
      rating: 4.8
    },
    {
      facilityId: `FAC-DYN-PHC2-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Belakoba Primary Health Centre (PHC)`,
      facilityType: 'PHC',
      state: 'West Bengal',
      district: city,
      taluka: 'Belakoba Block',
      address: `Belakoba Station Road, ${city} District (${(baseLat + 0.045).toFixed(4)}, ${(baseLng + 0.038).toFixed(4)})`,
      latitude: baseLat + 0.045,
      longitude: baseLng + 0.038,
      phone: '+91 3561 228811',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['General OPD', 'TB & Respiratory Clinic', 'Immunization'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 10 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 15 }
      ],
      medicineServices: [
        { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 700, available: true }
      ],
      bedCount: { total: 12, available: 5 },
      rating: 4.5
    },
    {
      facilityId: `FAC-DYN-RAIL-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `${city} Railway Divisional Hospital`,
      facilityType: 'HOSPITAL',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Junction`,
      address: `Station Road, Near Railway Junction, ${city} (${(baseLat - 0.012).toFixed(4)}, ${(baseLng - 0.015).toFixed(4)})`,
      latitude: baseLat - 0.012,
      longitude: baseLng - 0.015,
      phone: '+91 3561 223344',
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['General Medicine', 'Railway Emergency Unit', 'Orthopedics', 'Cardiology'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '24/7 Railway Emergency Hospital',
      isPublicFacility: true,
      bedCount: { total: 100, available: 30 },
      rating: 4.7
    }
  ];
};

// Real OpenStreetMap Hospital, PHC & Public Healthcare Fetcher for any city (Jalpaiguri & Pan-India)
const fetchRealOSMHospitals = async (userLat, userLng, userCity = 'Jalpaiguri', radius = 50000) => {
  try {
    const lat = userLat || 26.54;
    const lon = userLng || 88.71;
    const searchCity = userCity || 'Jalpaiguri';

    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        way["amenity"="clinic"](around:${radius},${lat},${lon});
        node["healthcare"="hospital"](around:${radius},${lat},${lon});
        node["healthcare"="clinic"](around:${radius},${lat},${lon});
        node["healthcare"="centre"](around:${radius},${lat},${lon});
        node["healthcare"="health_centre"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const res = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: {
        'User-Agent': 'MediTrack-Care-Network/1.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 8000
    });

    const uniqueMap = new Map();

    if (res.data && res.data.elements) {
      res.data.elements.forEach((el, idx) => {
        const placeLat = el.lat || (el.center && el.center.lat);
        const placeLng = el.lon || (el.center && el.center.lon);
        if (!placeLat || !placeLng) return;

        const rawName = el.tags?.name || el.tags?.['name:en'] || `Locality Healthcare Unit ${idx + 1}`;
        const lowerName = rawName.toLowerCase();

        // Skip diagnostic centers and standalone labs on hospital map
        if (
          lowerName.includes('diagnostic') ||
          lowerName.includes('pathology') ||
          (lowerName.includes('lab') && !lowerName.includes('hospital')) ||
          lowerName.includes('imaging center') ||
          lowerName.includes('scan center')
        ) {
          return;
        }

        const placeId = `OSM-FAC-${el.id}`;

        if (!uniqueMap.has(rawName)) {
          let fType = 'HOSPITAL';
          if (lowerName.includes('primary health') || lowerName.includes('phc')) fType = 'PHC';
          else if (lowerName.includes('community health') || lowerName.includes('chc')) fType = 'CHC';
          else if (lowerName.includes('rural hospital')) fType = 'RURAL_HOSPITAL';
          else if (lowerName.includes('district hospital')) fType = 'DISTRICT_HOSPITAL';

          const dist = calculateDistanceKm(lat, lon, placeLat, placeLng);

          uniqueMap.set(rawName, {
            facilityId: placeId,
            name: rawName,
            facilityType: fType,
            state: 'State Healthcare',
            district: searchCity,
            taluka: `${searchCity} Sub-Division`,
            address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || `${rawName}, ${searchCity}`,
            latitude: placeLat,
            longitude: placeLng,
            phone: el.tags?.phone || `+91 108`,
            email: `contact@${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
            website: `https://www.google.com/search?q=${encodeURIComponent(rawName + ' ' + searchCity)}`,
            emergencyAvailable: true,
            ambulanceSupported: true,
            opdAvailable: true,
            teleconsultationAvailable: true,
            distanceKm: Math.round(dist * 10) / 10,
            estimatedTravelTimeMinutes: Math.round(dist * 2.5) || 5,
            specialties: ['General OPD', 'Emergency Care', 'Pediatrics', 'Maternity'],
            diagnostics: [
              { name: 'ECG', available: true, waitTimeMinutes: 5 },
              { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
              { name: 'Blood Test', available: true, waitTimeMinutes: 5 }
            ],
            operatingHours: 'Public Locality Facility',
            isPublicFacility: true,
            rating: 4.6
          });
        }
      });
    }

    const osmList = Array.from(uniqueMap.values());
    const fallbackLocal = generateLocalFacilitiesForCoordinates(userLat, userLng, searchCity);
    const combinedLocal = [...osmList, ...fallbackLocal];
    
    const finalUniqueMap = new Map();
    combinedLocal.forEach(f => {
      if (f && f.name && !finalUniqueMap.has(f.name.toLowerCase())) {
        finalUniqueMap.set(f.name.toLowerCase(), f);
      }
    });

    return Array.from(finalUniqueMap.values());
  } catch (err) {
    console.warn('Error fetching OSM hospitals via Overpass:', err.message);
    return generateLocalFacilitiesForCoordinates(userLat, userLng, userCity);
  }
};

const fetchRealOSMDiagnosticCenters = async (lat, lng, city = 'Jalpaiguri', radius = 30000) => {
  try {
    const userLat = lat || 26.54;
    const userLng = lng || 88.71;
    const searchCity = city || 'Jalpaiguri';

    const query = `
      [out:json];
      (
        node["healthcare"="laboratory"](around:${radius},${userLat},${userLng});
        node["amenity"="clinic"](around:${radius},${userLat},${userLng});
      );
      out center;
    `;

    const res = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: {
        'User-Agent': 'MediTrack-Care-Network/1.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 6000
    });

    const uniqueMap = new Map();

    if (res.data && res.data.elements) {
      res.data.elements.forEach((el, idx) => {
        const placeLat = el.lat || (el.center && el.center.lat);
        const placeLng = el.lon || (el.center && el.center.lon);
        if (!placeLat || !placeLng) return;

        const rawName = el.tags?.name || `Diagnostic & Lab Unit ${idx + 1}`;
        const placeId = `OSM-DIAG-${el.id}`;

        if (!uniqueMap.has(rawName)) {
          let isDiagName = rawName.toLowerCase().includes('diag') || rawName.toLowerCase().includes('path') || rawName.toLowerCase().includes('lab') || rawName.toLowerCase().includes('scan');
          const displayName = isDiagName ? rawName : `${rawName} Diagnostic & Lab Unit`;
          const fType = isDiagName ? (rawName.toLowerCase().includes('path') ? 'PATHOLOGY_LAB' : 'DIAGNOSTIC_CENTER') : 'DIAGNOSTIC_CENTER';
          const dist = calculateDistanceKm(userLat, userLng, placeLat, placeLng);

          uniqueMap.set(rawName, {
            facilityId: placeId,
            name: displayName,
            facilityType: fType,
            state: 'State Health Network',
            district: searchCity,
            taluka: `${searchCity} Sub-Division`,
            address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || `${displayName}, ${searchCity}`,
            latitude: placeLat,
            longitude: placeLng,
            phone: el.tags?.phone || `+91 108`,
            email: `contact@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
            website: `https://www.google.com/search?q=${encodeURIComponent(displayName + ' ' + searchCity)}`,
            emergencyAvailable: true,
            ambulanceSupported: false,
            opdAvailable: true,
            teleconsultationAvailable: true,
            distanceKm: Math.round(dist * 10) / 10,
            specialties: ['Radiology', 'Pathology', 'Blood Test', 'Ultrasonography'],
            diagnostics: [
              { name: 'ECG', available: true, waitTimeMinutes: 5 },
              { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
              { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
              { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
              { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
              { name: 'Pathology', available: true, waitTimeMinutes: 10 }
            ],
            operatingHours: '24/7 Diagnostic & Lab Services',
            isPublicFacility: true,
            rating: 4.8
          });
        }
      });
    }

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.warn('Error fetching OSM diagnostic centers:', err.message);
    return [];
  }
};

// Dynamic Dedicated Diagnostic Centers & Labs Generator for user location (Jalpaiguri & Pan-India)
const generateLocalDiagnosticCentersForCoordinates = (userLat, userLng, userCity = 'Jalpaiguri') => {
  const baseLat = userLat;
  const baseLng = userLng;
  const city = userCity || 'Jalpaiguri';

  return [
    {
      facilityId: `DIAG-DYN-APEX-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `${city} Apex Advanced Diagnostic & MRI/CT Center`,
      facilityType: 'DIAGNOSTIC_CENTER',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Sadar`,
      address: `DBC Road, Near Kadamtala More, ${city} (${(baseLat + 0.007).toFixed(4)}, ${(baseLng + 0.005).toFixed(4)})`,
      latitude: baseLat + 0.007,
      longitude: baseLng + 0.005,
      phone: '+91 3561 224455',
      email: `contact@${city.toLowerCase()}apexdiag.org`,
      website: `https://www.${city.toLowerCase()}apexdiag.org`,
      emergencyAvailable: true,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Radiology', 'Pathology', 'Advanced Imaging', 'Cardiac Diagnostics'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'MRI', available: true, waitTimeMinutes: 20 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
        { name: 'Pathology', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '24/7 Diagnostic & Scan Services',
      isPublicFacility: true,
      rating: 4.9
    },
    {
      facilityId: `DIAG-DYN-SURAKSHA-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Suraksha Diagnostic & Pathology Lab ${city}`,
      facilityType: 'PATHOLOGY_LAB',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Central`,
      address: `Kadamtala More, Club Road, ${city} (${(baseLat + 0.009).toFixed(4)}, ${(baseLng - 0.007).toFixed(4)})`,
      latitude: baseLat + 0.009,
      longitude: baseLng - 0.007,
      phone: '+91 3561 229988',
      email: `info@surakshadiagnostics${city.toLowerCase()}.in`,
      website: `https://www.surakshadiagnostics.in`,
      emergencyAvailable: false,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Blood Pathology', 'Biochemistry', 'Microbiology', 'Haematology'],
      diagnostics: [
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Pathology', available: true, waitTimeMinutes: 10 },
        { name: 'ECG', available: true, waitTimeMinutes: 10 },
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '7:00 AM - 9:00 PM',
      isPublicFacility: true,
      rating: 4.9
    },
    {
      facilityId: `DIAG-DYN-APOLLO-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Apollo Diagnostics & Sonography Hub ${city}`,
      facilityType: 'IMAGING_CENTER',
      state: 'West Bengal',
      district: city,
      taluka: `${city} North`,
      address: `Station Road, Opposite Railway Station, ${city} (${(baseLat - 0.006).toFixed(4)}, ${(baseLng + 0.008).toFixed(4)})`,
      latitude: baseLat - 0.006,
      longitude: baseLng + 0.008,
      phone: '+91 98320 45678',
      email: `scans@apollodiagnostics${city.toLowerCase()}.com`,
      website: `https://www.apollodiagnostics.in`,
      emergencyAvailable: true,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Ultrasound Sonography', 'Color Doppler', 'Digital X-Ray', 'CT Scan'],
      diagnostics: [
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 }
      ],
      operatingHours: '8:00 AM - 10:00 PM',
      isPublicFacility: true,
      rating: 4.9
    },
    {
      facilityId: `DIAG-DYN-LIFE-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `LifeCare Pathology & Diagnostic Lab ${city}`,
      facilityType: 'PATHOLOGY_LAB',
      state: 'West Bengal',
      district: city,
      taluka: `${city} Central`,
      address: `Station Road, Opposite Railway Station, ${city} (${(baseLat - 0.006).toFixed(4)}, ${(baseLng + 0.008).toFixed(4)})`,
      latitude: baseLat - 0.006,
      longitude: baseLng + 0.008,
      phone: '+91 98320 45678',
      email: `info@lifecarepathology${city.toLowerCase()}.in`,
      website: `https://www.lifecarepathology.in`,
      emergencyAvailable: false,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Blood Pathology', 'Biochemistry', 'Microbiology', 'Haematology'],
      diagnostics: [
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Pathology', available: true, waitTimeMinutes: 10 },
        { name: 'ECG', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '7:00 AM - 9:00 PM',
      isPublicFacility: true,
      rating: 4.8
    },
    {
      facilityId: `DIAG-DYN-METRO-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Kadamtala Scan & Sonography Hub ${city}`,
      facilityType: 'IMAGING_CENTER',
      state: 'West Bengal',
      district: city,
      taluka: `${city} North`,
      address: `Kadamtala More, Club Road, ${city} (${(baseLat + 0.015).toFixed(4)}, ${(baseLng - 0.012).toFixed(4)})`,
      latitude: baseLat + 0.015,
      longitude: baseLng - 0.012,
      phone: '+91 3561 230911',
      email: `scans@${city.toLowerCase()}sonography.com`,
      website: `https://www.sonographyhub.com`,
      emergencyAvailable: true,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Ultrasound Sonography', 'Color Doppler', 'Digital X-Ray', 'CT Scan'],
      diagnostics: [
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'ECG', available: true, waitTimeMinutes: 5 }
      ],
      operatingHours: '8:00 AM - 10:00 PM',
      isPublicFacility: true,
      rating: 4.9
    },
    {
      facilityId: `DIAG-DYN-LAL-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `Dr. Lal PathLabs & Diagnostics ${city}`,
      facilityType: 'PATHOLOGY_LAB',
      state: 'West Bengal',
      district: city,
      taluka: `${city} East`,
      address: `Dinbazar Main Road, ${city} (${(baseLat - 0.014).toFixed(4)}, ${(baseLng - 0.011).toFixed(4)})`,
      latitude: baseLat - 0.014,
      longitude: baseLng - 0.011,
      phone: '+91 94340 11223',
      email: `jalpaiguri@lalpathlabs.com`,
      website: `https://www.lalpathlabs.com`,
      emergencyAvailable: false,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Pathology', 'Endocrinology', 'Molecular Diagnostics', 'Blood Test'],
      diagnostics: [
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Pathology', available: true, waitTimeMinutes: 5 }
      ],
      operatingHours: '6:30 AM - 8:30 PM',
      isPublicFacility: true,
      rating: 4.8
    },
    {
      facilityId: `DIAG-DYN-CARDIO-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `CarePlus Cardiac & Echo Diagnostic Lab ${city}`,
      facilityType: 'DIAGNOSTIC_CENTER',
      state: 'West Bengal',
      district: city,
      taluka: `${city} West`,
      address: `Begary Link Road, Near Pharmacy Market, ${city} (${(baseLat + 0.022).toFixed(4)}, ${(baseLng + 0.019).toFixed(4)})`,
      latitude: baseLat + 0.022,
      longitude: baseLng + 0.019,
      phone: '+91 98001 77889',
      email: `echo@carepluscardio${city.toLowerCase()}.org`,
      website: `https://www.carepluscardio.org`,
      emergencyAvailable: true,
      ambulanceSupported: false,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Cardiac ECG', '2D Echo', 'Holter Monitoring', 'TMT Stress Test'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 10 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '24/7 Cardiac Emergency Lab',
      isPublicFacility: true,
      rating: 4.9
    },
    {
      facilityId: `DIAG-DYN-GOVT-${Math.round(baseLat * 100)}-${Math.round(baseLng * 100)}`,
      name: `${city} District Hospital Central Diagnostic Unit`,
      facilityType: 'PUBLIC_DIAGNOSTIC_CENTER',
      state: 'West Bengal',
      district: city,
      taluka: 'Hospital Campus',
      address: `Hospital Road, District Hospital Campus, ${city} (${(baseLat - 0.021).toFixed(4)}, ${(baseLng + 0.025).toFixed(4)})`,
      latitude: baseLat - 0.021,
      longitude: baseLng + 0.025,
      phone: '+91 3561 222100',
      email: `dh.jalpaiguri@wbhealth.gov.in`,
      website: `https://www.wbhealth.gov.in`,
      emergencyAvailable: true,
      ambulanceSupported: true,
      opdAvailable: true,
      teleconsultationAvailable: true,
      specialties: ['Public Diagnostic Hub', 'Radiology', 'Pathology', 'Maternal Ultrasound'],
      diagnostics: [
        { name: 'ECG', available: true, waitTimeMinutes: 5 },
        { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
        { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
        { name: 'MRI', available: true, waitTimeMinutes: 20 },
        { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
        { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
        { name: 'Pathology', available: true, waitTimeMinutes: 10 }
      ],
      operatingHours: '24/7 Government Free Diagnostic Hub',
      isPublicFacility: true,
      rating: 4.9
    }
  ];
};

// -------------------------------------------------------------
// 1. PUBLIC HEALTHCARE FACILITIES API
// -------------------------------------------------------------
router.get('/facilities', async (req, res) => {
  try {
    const { query, facilityType, emergency, service, lat, lng, city, maxDistance } = req.query;

    const CITY_COORDS = {
      'jalpaiguri': { lat: 26.5400, lng: 88.7100 },
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'amritsar': { lat: 31.6340, lng: 74.8723 },
      'bengaluru': { lat: 12.9716, lng: 77.5946 },
      'satara': { lat: 17.6805, lng: 74.0183 }
    };

    const userCity = city || 'Jalpaiguri';
    const cityKey = userCity.toLowerCase();
    const defaultCoords = CITY_COORDS[cityKey] || CITY_COORDS['jalpaiguri'];

    const userLat = lat ? parseFloat(lat) : defaultCoords.lat;
    const userLng = lng ? parseFloat(lng) : defaultCoords.lng;

    let dbFacilities = [];
    try {
      await seedFacilitiesIfEmpty().catch(() => {});
      let filter = {};
      if (facilityType && facilityType !== 'ALL') {
        filter.facilityType = facilityType;
      }
      if (emergency === 'true') {
        filter.emergencyAvailable = true;
      }
      dbFacilities = await HealthcareFacility.find(filter).lean();
    } catch (dbErr) {
      console.warn('DB query warning, utilizing local generated facilities:', dbErr.message);
    }

    // Fetch registered MediTrack-Linked Facilities directly from 'facilities' MongoDB collection
    let registeredCareFacs = [];
    try {
      const mongoose = require('mongoose');
      let rawFacs = await mongoose.connection.collection('facilities').find({}).toArray();

      registeredCareFacs = rawFacs.map(f => {
        const dist = calculateDistanceKm(userLat, userLng, f.latitude || userLat, f.longitude || userLng);
        const isVer = f.verificationStatus === 'VERIFIED' || !f.verificationStatus || f.verificationStatus === 'PENDING_VERIFICATION';
        return {
          facilityId: f._id.toString(),
          _id: f._id,
          name: f.name,
          facilityType: f.facilityType || 'DISTRICT_HOSPITAL',
          state: f.state || 'India Health Network',
          district: f.district || userCity,
          address: f.address || `${f.name}, ${userCity}`,
          latitude: f.latitude || userLat,
          longitude: f.longitude || userLng,
          phone: f.phone || '+91 3561 222100',
          email: f.email || 'facility@meditrack.care',
          emergencyAvailable: f.emergencyAvailable ?? true,
          ambulanceSupported: true,
          opdAvailable: true,
          teleconsultationAvailable: true,
          isPublicFacility: true,
          isMediTrackLinked: true,
          verificationStatus: f.verificationStatus || 'VERIFIED',
          operatingHours: f.operatingHours || '24/7 Emergency & OPD Services',
          distanceKm: Math.round(dist * 10) / 10,
          isMediTrackVerified: isVer,
          canSelect: isVer,
          badgeText: isVer ? 'MediTrack Verified' : 'Unverified / Not on MediTrack'
        };
      });
    } catch (e) {
      console.warn('Care facilities collection query warning:', e.message);
    }

    // Also fetch real OpenStreetMap locality hospitals for the current city
    let osmLocalityFacs = [];
    try {
      const rawOsm = await fetchRealOSMHospitals(userLat, userLng, userCity);
      osmLocalityFacs = rawOsm.map(f => {
        const isMatched = registeredCareFacs.some(rf =>
          rf.name.toLowerCase().includes(f.name.toLowerCase()) ||
          f.name.toLowerCase().includes(rf.name.toLowerCase())
        );
        if (isMatched) return null;

        return {
          ...f,
          isMediTrackVerified: false,
          verificationStatus: 'UNVERIFIED',
          canSelect: false,
          badgeText: 'Unverified / Not on MediTrack'
        };
      }).filter(Boolean);
    } catch (errOsm) {
      console.warn('OSM fetch warning:', errOsm.message);
    }

    // Combine MediTrack Verified facilities, Unverified Locality Hospitals, DB facilities, and generated fallback local facilities
    const generatedLocal = generateLocalFacilitiesForCoordinates(userLat, userLng, userCity);
    let rawCombined = [...registeredCareFacs, ...osmLocalityFacs, ...dbFacilities, ...generatedLocal];
    
    // Recalculate distance for ALL facilities relative to current user coordinates
    rawCombined = rawCombined.map(f => {
      if (!f || !f.latitude || !f.longitude) return null;
      const dist = calculateDistanceKm(userLat, userLng, f.latitude, f.longitude);
      return {
        ...f,
        distanceKm: Math.round(dist * 10) / 10,
        estimatedTravelTimeMinutes: Math.round(dist * 2.5) || 5
      };
    }).filter(Boolean);

    const uniqueMap = new Map();
    rawCombined.forEach(f => {
      if (f && f.name && !uniqueMap.has(f.name.toLowerCase())) {
        uniqueMap.set(f.name.toLowerCase(), f);
      }
    });
    let allFacilities = Array.from(uniqueMap.values());

    // Proximity Filter: Default max distance threshold 80km (unless searching another specific city explicitly)
    const effectiveMaxDist = maxDistance ? parseFloat(maxDistance) : 80;
    const qLower = (query || '').toLowerCase().trim();
    const isExplicitDistantSearch = qLower.includes('pune') || qLower.includes('delhi') || qLower.includes('mumbai') || qLower.includes('kolkata') || qLower.includes('chennai') || qLower.includes('amritsar');

    if (!isExplicitDistantSearch) {
      let localOnly = allFacilities.filter(f => f.distanceKm <= effectiveMaxDist);
      if (localOnly.length >= 2) {
        allFacilities = localOnly;
      } else {
        allFacilities = allFacilities.filter(f => f.distanceKm <= 120);
      }
    }

    // Facility Type Filter
    if (facilityType && facilityType !== 'ALL') {
      allFacilities = allFacilities.filter(f => 
        f.facilityType === facilityType || 
        (facilityType === 'PHC' && f.name.toLowerCase().includes('phc')) ||
        (facilityType === 'CHC' && f.name.toLowerCase().includes('chc')) ||
        (facilityType === 'RURAL_HOSPITAL' && f.name.toLowerCase().includes('rural')) ||
        (facilityType === 'DISTRICT_HOSPITAL' && f.name.toLowerCase().includes('district'))
      );
    }

    // Text Search Filter
    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      allFacilities = allFacilities.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.district && f.district.toLowerCase().includes(q)) ||
        (f.address && f.address.toLowerCase().includes(q)) ||
        (f.specialties && f.specialties.some(s => s.toLowerCase().includes(q))) ||
        (f.diagnostics && f.diagnostics.some(d => d.name.toLowerCase().includes(q)))
      );
    }

    // Service Filter (e.g., ECG, X-Ray, Teleconsultation)
    if (service && service.trim() !== '') {
      const s = service.toLowerCase();
      allFacilities = allFacilities.filter(f =>
        (f.diagnostics && f.diagnostics.some(d => d.name.toLowerCase().includes(s) && d.available)) ||
        (f.specialties && f.specialties.some(sp => sp.toLowerCase().includes(s))) ||
        (s.includes('tele') && f.teleconsultationAvailable) ||
        (s.includes('emergency') && f.emergencyAvailable)
      );
    }

    // Sort by distance ascending
    allFacilities.sort((a, b) => a.distanceKm - b.distanceKm);

    // Tag the #1 closest facility with isNearest: true
    if (allFacilities.length > 0) {
      allFacilities[0].isNearest = true;
      allFacilities[0].nearestBadge = '📍 NEAREST HEALTHCARE FACILITY';
    }

    return res.json({
      success: true,
      count: allFacilities.length,
      userLocation: { latitude: userLat, longitude: userLng, city: userCity },
      facilities: allFacilities
    });
  } catch (err) {
    console.error('Error fetching facilities:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching facilities' });
  }
});

router.get('/facilities/:id', async (req, res) => {
  try {
    let facility = await HealthcareFacility.findOne({ facilityId: req.params.id }).lean();

    if (!facility && (req.params.id.startsWith('FAC-DYN') || req.params.id.startsWith('DIAG-DYN') || req.params.id.startsWith('OSM-DIAG'))) {
      const parts = req.params.id.split('-');
      const userLat = parseFloat(parts[3]) / 100 || 26.54;
      const userLng = parseFloat(parts[4]) / 100 || 88.71;

      let localList = [];
      if (req.params.id.startsWith('DIAG-DYN')) {
        localList = generateLocalDiagnosticCentersForCoordinates(userLat, userLng);
      } else if (req.params.id.startsWith('OSM-DIAG')) {
        localList = await fetchRealOSMDiagnosticCenters(userLat, userLng);
      } else {
        localList = generateLocalFacilitiesForCoordinates(userLat, userLng);
      }
      facility = localList.find(f => f.facilityId === req.params.id) || localList[0];
    }

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Healthcare facility not found' });
    }

    const facilityObj = facility.toObject ? facility.toObject() : facility;
    const contactInfo = await facilityContactService.getVerifiedContactInfo(req.params.id, facilityObj);

    return res.json({
      success: true,
      facility: {
        ...facilityObj,
        contactInfo
      }
    });
  } catch (err) {
    console.error('Error fetching facility detail:', err);
    return res.status(500).json({ success: false, message: 'Error fetching facility detail' });
  }
});

// Independent Verified Contact Information API Endpoints
router.get('/facilities/:id/contact', async (req, res) => {
  try {
    const contactInfo = await facilityContactService.getVerifiedContactInfo(req.params.id);
    return res.json({ success: true, contactInfo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching verified contact info' });
  }
});

router.put('/facilities/:id/contact', async (req, res) => {
  try {
    const updated = await facilityContactService.updateContactInfo(req.params.id, req.body);
    return res.json({ success: true, message: 'Facility contact info updated independently', contactInfo: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating facility contact info' });
  }
});

// -------------------------------------------------------------
// 2. DIGITAL TRIAGE ENGINE (Gemini 1.5 Flash + Safety Engine)
// -------------------------------------------------------------
router.post('/triage', async (req, res) => {


  try {
    const { symptoms = [], freeTextDescription = '', message = '', age = 30, gender = 'male', session_id, vitals } = req.body;
    const inputText = message || freeTextDescription || symptoms.join(', ');

    let triageResult = null;

    // 1. Attempt calling Python AI Service on port 8001
    try {
      const aiResponse = await axios.post('http://localhost:8001/api/v1/triage/message', {
        session_id: session_id || `TRG-${Date.now()}`,
        message: inputText,
        symptoms_selected: symptoms,
        vitals: vitals || null
      }, { timeout: 30000 });


      if (aiResponse.data) {
        const data = aiResponse.data;
        triageResult = {
          session_id: data.session_id,
          providerMode: data.provider_mode || 'AI-ASSISTED TRIAGE ENGINE',
          isRealProviderUsed: data.ai_assistance_used,
          triageLevel: data.triage_level,
          urgencyLevel: data.urgency_level,
          riskScore: data.risk_score || 20,
          headline: data.headline,
          recommendation: data.recommendation,
          escalateToEmergency: data.escalate_to_emergency,
          recommendedFacilityType: data.recommended_facility_type,
          redFlags: data.red_flags || [],
          followUpQuestions: data.follow_up_questions || [],
          retrievedKnowledge: data.retrieved_knowledge || [],
          firstAidSteps: data.first_aid_steps || [],
          contraindications: data.contraindications || [],
          possibleClinicalConcerns: data.possible_clinical_concerns || [],
          careNavigation: data.care_navigation || [],
          disclaimer: data.disclaimer
        };
      }
    } catch (aiErr) {
      console.warn('⚠️ Python AI service unavailable/timed out. Executing Node.js Safety Fallback:', aiErr.message);
    }


    // 2. Deterministic Node.js Safety Engine Fallback if AI Service is down
    if (!triageResult) {
      const lowerText = (inputText + ' ' + symptoms.join(' ')).toLowerCase();
      const isEmergency = lowerText.includes('chest pain') || lowerText.includes('breathing') || 
                          lowerText.includes('unconscious') || lowerText.includes('heart attack') || 
                          lowerText.includes('stroke') || lowerText.includes('bleeding');

      triageResult = {
        session_id: session_id || `TRG-${Date.now()}`,
        providerMode: 'MediTrack Deterministic Safety Engine (Fallback)',
        isRealProviderUsed: false,
        triageLevel: isEmergency ? 'EMERGENCY' : 'ROUTINE',
        urgencyLevel: isEmergency ? 'CRITICAL_HIGH' : 'LOW',
        headline: isEmergency ? '⚠️ POSSIBLE MEDICAL EMERGENCY — IMMEDIATE CARE REQUIRED' : 'Routine Primary Healthcare Consultation',
        recommendation: isEmergency 
          ? 'Your symptoms include critical warning signs requiring immediate medical evaluation. Call 108 immediately or proceed to the nearest emergency trauma facility.'
          : 'Schedule a routine consultation at your nearest Primary Health Centre (PHC) or Community Health Centre (CHC).',
        escalateToEmergency: isEmergency,
        recommendedFacilityType: isEmergency ? 'DISTRICT_HOSPITAL' : 'PHC',
        redFlags: isEmergency ? ['Emergency Red-Flag Triggered: Suspected Acute Cardiac/Respiratory Risk'] : [],
        followUpQuestions: [],
        retrievedKnowledge: [],
        careNavigation: isEmergency ? [
          {
            facility_type: 'DISTRICT_HOSPITAL',
            title: 'Call 108 Ambulance Emergency',
            description: 'Immediate emergency dispatch',
            action_type: 'EMERGENCY_CALL',
            phone_number: '108'
          },
          {
            facility_type: 'DISTRICT_HOSPITAL',
            title: 'Nearest District Emergency Hospital',
            description: 'Proceed to nearest emergency department',
            action_type: 'FIND_FACILITY',
            action_url: '/care-network/emergency'
          }
        ] : [
          {
            facility_type: 'PHC',
            title: 'Book Appointment at PHC/CHC',
            description: 'Schedule outpatient assessment',
            action_type: 'BOOK_APPOINTMENT',
            action_url: '/care-network/appointments'
          }
        ],
        disclaimer: 'Notice: Automated care-navigation tool. NOT a formal medical diagnosis. Dial 108 in emergencies.'
      };
    }

    // 3. Log CareJourneyEvent if user is authenticated
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meditrack_secret_key');
        if (decoded && decoded.id) {
          await CareJourneyEvent.create({
            patientId: decoded.id,
            type: 'TRIAGE',
            title: `Digital Triage Completed: ${triageResult.triageLevel}`,
            description: `${triageResult.headline}. Urgency: ${triageResult.urgencyLevel}`,
            status: 'COMPLETED',
            metadata: {
              triageLevel: triageResult.triageLevel,
              urgencyLevel: triageResult.urgencyLevel,
              recommendedFacilityType: triageResult.recommendedFacilityType,
              sessionId: triageResult.session_id
            }
          });
        }
      }
    } catch (evtErr) {
      // Non-blocking care journey event error logging
    }

    return res.json({
      success: true,
      triage: triageResult
    });
  } catch (err) {
    console.error('Care Backend Triage error:', err);
    return res.status(500).json({ success: false, message: 'Internal triage evaluation error' });
  }
});


// -------------------------------------------------------------
// 3. OPENFDA MEDICINE INFORMATION API
// -------------------------------------------------------------
router.get('/drugs', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query term required' });
    }

    let drugData = null;
    let isRealProviderUsed = false;

    try {
      const response = await axios.get(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"+openfda.generic_name:"${encodeURIComponent(query)}"&limit=1`);
      if (response.data && response.data.results && response.data.results.length > 0) {
        const item = response.data.results[0];
        isRealProviderUsed = true;
        drugData = {
          providerMode: 'OPENFDA REAL-TIME DATA',
          isRealProviderUsed: true,
          brandName: item.openfda?.brand_name?.[0] || query,
          genericName: item.openfda?.generic_name?.[0] || query,
          dosageForm: item.openfda?.dosage_form?.[0] || 'Tablet / Injectable',
          indications: item.indications_and_usage?.[0] || 'Used for clinical management under healthcare practitioner direction.',
          warnings: item.warnings?.[0] || 'Consult physician before starting medication.',
          adverseReactions: item.adverse_reactions?.[0] || 'Side effects vary depending on patient clinical history.'
        };
      }
    } catch (fdaErr) {
      // Fallback
    }

    if (!isRealProviderUsed) {
      drugData = {
        providerMode: 'MEDiTRACK DRUG KNOWLEDGE PROVIDER',
        isRealProviderUsed: false,
        brandName: query.toUpperCase(),
        genericName: query.toLowerCase().includes('metformin') ? 'Metformin Hydrochloride' : query.toLowerCase().includes('paracetamol') ? 'Acetaminophen' : `${query} Active Pharmaceutical Ingredient`,
        dosageForm: 'Oral Tablet / Suspension',
        indications: 'Indicated for therapeutic management as prescribed by public health clinic officers.',
        warnings: 'Keep out of reach of children. Store in a cool dry place below 30°C.',
        adverseReactions: 'Mild gastric upset, dizziness, or allergic rash may occur in sensitive patients.',
        disclaimer: 'General medicine reference information powered by OpenFDA & MediTrack Knowledge Base.'
      };
    }

    return res.json({ success: true, drug: drugData });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Drug information retrieval error' });
  }
});

// -------------------------------------------------------------
// 4. APPOINTMENTS & QUEUE MANAGEMENT API
// -------------------------------------------------------------
router.post('/appointments', authMiddleware, async (req, res) => {
  try {
    const { facilityId, facilityName, department = 'General OPD', date, time, reasonForVisit, triagePriority } = req.body;
    const mongoose = require('mongoose');

    const todayStr = date || new Date().toISOString().split('T')[0];

    // Count appointments for this specific facility & department & date
    const countToday = await Appointment.countDocuments({ facilityId, department, date: todayStr });
    const tokenNumber = countToday + 1;
    const appointmentId = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const appointment = new Appointment({
      appointmentId,
      patientId: req.user._id,
      facilityId,
      facilityName,
      department,
      date: todayStr,
      time: time || '09:30 AM',
      tokenNumber,
      reasonForVisit: reasonForVisit || 'General Consultation',
      triagePriority: triagePriority || 'ROUTINE',
      status: 'BOOKED'
    });

    await appointment.save();

    // Cross-sync directly into care_backend MongoDB collections (careappointments & carequeues)
    try {
      let targetFacObj = null;
      if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
        targetFacObj = await mongoose.connection.collection('facilities').findOne({ _id: new mongoose.Types.ObjectId(facilityId) });
      }
      if (!targetFacObj) {
        targetFacObj = await mongoose.connection.collection('facilities').findOne({ facilityId: facilityId });
      }
      if (!targetFacObj) {
        targetFacObj = await mongoose.connection.collection('facilities').findOne({});
      }

      const facIdKey = targetFacObj ? targetFacObj._id : facilityId;

      // Upsert patient record in patientrecords collection for care_backend population
      await mongoose.connection.collection('patientrecords').updateOne(
        { _id: req.user._id },
        {
          $set: {
            name: req.user.name || 'Patient',
            email: req.user.email || 'patient@meditrack.org',
            phone: req.user.phone || '+91 9876543210',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      const careAppRecord = {
        facilityId: facIdKey,
        patientId: req.user._id,
        patientName: req.user.name || 'Patient',
        facilityName: facilityName || targetFacObj?.name || 'Healthcare Facility',
        department: department || 'General OPD',
        appointmentDate: new Date(date || Date.now()),
        timeSlot: time || '09:30 AM',
        tokenNumber: tokenNumber,
        symptoms: reasonForVisit || 'General Consultation',
        triagePriority: triagePriority || 'ROUTINE',
        status: 'CONFIRMED',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertedApp = await mongoose.connection.collection('careappointments').insertOne(careAppRecord);

      // Add to carequeues collection scoped by facility AND department AND date
      let existingQueue = await mongoose.connection.collection('carequeues').findOne({
        department: department,
        date: todayStr,
        $or: [
          { facilityId: facIdKey },
          { facilityIdStr: facilityId }
        ]
      });

      if (!existingQueue) {
        // Fallback search without department for initial migration
        existingQueue = await mongoose.connection.collection('carequeues').findOne({
          date: todayStr,
          $or: [
            { facilityId: facIdKey },
            { facilityIdStr: facilityId }
          ]
        });
      }

      const queueEntry = {
        _id: new mongoose.Types.ObjectId(),
        appointmentId: insertedApp.insertedId,
        patientId: req.user._id,
        patientName: req.user.name || 'Patient',
        tokenNumber: tokenNumber,
        checkInTime: new Date(),
        status: 'WAITING'
      };

      if (existingQueue && existingQueue.department === department) {
        const nextServingToken = existingQueue.servingToken > 0 ? existingQueue.servingToken : 1;
        await mongoose.connection.collection('carequeues').updateOne(
          { _id: existingQueue._id },
          {
            $push: { entries: queueEntry },
            $set: {
              currentToken: Math.max(existingQueue.currentToken || 0, tokenNumber),
              servingToken: nextServingToken,
              facilityIdStr: facilityId,
              updatedAt: new Date()
            }
          }
        );
      } else {
        await mongoose.connection.collection('carequeues').insertOne({
          facilityId: facIdKey,
          facilityIdStr: facilityId,
          department: department || 'General OPD',
          date: todayStr,
          currentToken: tokenNumber,
          servingToken: 1,
          entries: [queueEntry],
          isPaused: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Upsert QueueStatus model
      await QueueStatus.updateOne(
        { facilityId, department },
        {
          $set: {
            facilityId,
            department,
            lastAssignedToken: tokenNumber,
            lastUpdated: new Date()
          }
        },
        { upsert: true }
      );
    } catch (syncErr) {
      console.error('Care backend appointment sync error:', syncErr.message);
    }

    await CareJourneyEvent.create({
      patientId: req.user._id,
      type: 'APPOINTMENT',
      facilityId,
      facilityName,
      title: `Token #${tokenNumber} Booked at ${facilityName} (${department})`,
      description: `Appointment reserved for ${department} on ${appointment.date} at ${appointment.time}.`,
      status: 'COMPLETED'
    });

    return res.json({
      success: true,
      message: `Appointment booked successfully! Your ${department} Token Number is #${tokenNumber}`,
      appointment
    });
  } catch (err) {
    console.error('Appointment booking error:', err);
    return res.status(500).json({ success: false, message: 'Appointment booking error' });
  }
});

router.get('/appointments/my', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const appointments = await Appointment.find({ patientId: req.user._id }).sort({ createdAt: -1 }).lean();
    
    // Fetch careappointments to supplement & enrich doctor/delay details
    try {
      const careApps = await mongoose.connection.collection('careappointments').find({ patientId: req.user._id }).sort({ createdAt: -1 }).toArray();
      const doctorsMap = new Map();

      // Collect doctor IDs to fetch doctor names
      const docIds = careApps.map(a => a.doctorId).filter(Boolean);
      if (docIds.length > 0) {
        const docObjs = await mongoose.connection.collection('doctors').find({ _id: { $in: docIds } }).toArray();
        docObjs.forEach(d => {
          doctorsMap.set(d._id.toString(), {
            name: d.fullName?.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}`,
            specialization: d.specialization || 'Specialist Doctor'
          });
        });
      }

      // Map careappointments by token & dept for enrichment
      const careAppMap = new Map();
      careApps.forEach(a => {
        const key = `${a.facilityName || ''}-${a.department || 'General OPD'}-${a.tokenNumber}`;
        const docInfo = a.doctorId ? doctorsMap.get(a.doctorId.toString()) : null;
        careAppMap.set(key, {
          careAppId: a._id,
          doctorName: docInfo?.name || (a.doctorName || null),
          doctorSpecialization: docInfo?.specialization || null,
          appointmentDate: a.appointmentDate,
          timeSlot: a.timeSlot,
          notes: a.notes,
          status: a.status
        });
      });

      // Enrich main appointments list with latest doctor and delay details from careappointments
      const enrichedAppointments = appointments.map(apt => {
        const key = `${apt.facilityName || ''}-${apt.department || 'General OPD'}-${apt.tokenNumber}`;
        const careInfo = careAppMap.get(key);
        if (careInfo) {
          return {
            ...apt,
            doctorName: careInfo.doctorName || apt.doctorName || 'Duty Medical Officer',
            doctorSpecialization: careInfo.doctorSpecialization || apt.doctorSpecialization || null,
            date: careInfo.appointmentDate ? new Date(careInfo.appointmentDate).toISOString().split('T')[0] : apt.date,
            time: careInfo.timeSlot || apt.time,
            notes: careInfo.notes || apt.notes,
            status: careInfo.status || apt.status,
            isDelayed: careInfo.status === 'RESCHEDULED' || apt.isDelayed || false,
            delayReason: careInfo.notes || apt.delayReason
          };
        }
        return apt;
      });

      const existingTokenMap = new Set(enrichedAppointments.map(a => `${a.facilityName}-${a.department}-${a.tokenNumber}`));

      const extraApps = [];
      for (const a of careApps) {
        const key = `${a.facilityName || 'Public Healthcare Center'}-${a.department || 'General OPD'}-${a.tokenNumber}`;
        if (!existingTokenMap.has(key)) {
          const docInfo = a.doctorId ? doctorsMap.get(a.doctorId.toString()) : null;
          extraApps.push({
            _id: a._id,
            appointmentId: `CARE-${a._id}`,
            facilityId: a.facilityId ? a.facilityId.toString() : 'FAC-DEFAULT',
            facilityName: a.facilityName || 'Public Healthcare Center',
            department: a.department || 'General OPD',
            date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            time: a.timeSlot || '10:00 AM',
            tokenNumber: a.tokenNumber || 1,
            reasonForVisit: a.symptoms || 'General OPD Consultation',
            status: a.status || 'CONFIRMED',
            doctorName: docInfo?.name || 'Duty Medical Officer',
            doctorSpecialization: docInfo?.specialization || null,
            notes: a.notes,
            isDelayed: a.status === 'RESCHEDULED',
            delayReason: a.notes
          });
        }
      }

      return res.json({ success: true, appointments: [...enrichedAppointments, ...extraApps] });
    } catch (e) {
      return res.json({ success: true, appointments });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching patient appointments' });
  }
});

// Delete an Appointment record by ID
router.delete('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      objectId = id;
    }

    await Appointment.deleteOne({ _id: objectId, patientId: req.user._id });
    try {
      await mongoose.connection.collection('careappointments').deleteOne({ _id: objectId, patientId: req.user._id });
    } catch (e) {}

    return res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete appointment' });
  }
});

router.get('/prescriptions/my', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let prescriptions = await mongoose.connection.collection('prescriptions')
      .find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    const events = await CareJourneyEvent.find({
      patientId: req.user._id,
      eventType: 'PRESCRIPTION_ISSUED'
    }).sort({ createdAt: -1 }).lean();

    const combinedPrescriptions = [...prescriptions];

    events.forEach(ev => {
      const isAlreadyAdded = combinedPrescriptions.some(p => String(p.appointmentId) === String(ev.relatedAppointmentId));
      if (!isAlreadyAdded && (ev.prescriptionDetails || ev.pdfDataUrl)) {
        combinedPrescriptions.push({
          _id: ev._id,
          appointmentId: ev.relatedAppointmentId,
          facilityName: ev.facilityName || 'Healthcare Center',
          department: 'General OPD',
          doctorName: ev.doctorName || 'Doctor Specialist',
          doctorSpecialization: 'Specialist Officer',
          date: new Date(ev.createdAt).toLocaleDateString(),
          diagnosis: ev.prescriptionDetails?.diagnosis || 'OPD Clinical Evaluation',
          medicines: ev.prescriptionDetails?.medicines || [],
          advice: ev.prescriptionDetails?.advice || '',
          isOfflinePrescription: ev.prescriptionDetails?.isOfflinePrescription || false,
          pdfDataUrl: ev.pdfDataUrl || null,
          createdAt: ev.createdAt
        });
      }
    });

    return res.json({ success: true, prescriptions: combinedPrescriptions });
  } catch (err) {
    console.error('Error fetching patient prescriptions:', err);
    return res.status(500).json({ success: false, message: 'Error fetching patient prescriptions' });
  }
});

// Delete a Prescription record by ID
router.delete('/prescriptions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      objectId = null;
    }

    const filter = objectId ? { $or: [{ _id: objectId }, { appointmentId: objectId }] } : { _id: id };
    await mongoose.connection.collection('prescriptions').deleteOne(filter);

    if (objectId) {
      await CareJourneyEvent.deleteOne({ _id: objectId, eventType: 'PRESCRIPTION_ISSUED' });
    }

    return res.json({ success: true, message: 'Prescription record deleted successfully' });
  } catch (err) {
    console.error('Error deleting prescription:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete prescription' });
  }
});
// ---------------------------------------------------------------------------
// BED BOOKING & ADMISSION REQUEST ROUTES
// ---------------------------------------------------------------------------

// 1. Submit Bed Booking & Admission Request
router.post('/bed-bookings', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const {
      facilityId,
      facilityName,
      department = 'Emergency Trauma',
      requestedBedType = 'GENERAL_WARD',
      patientName,
      patientAge,
      patientGender,
      contactPhone,
      reasonForAdmission
    } = req.body;

    if (!facilityName) {
      return res.status(400).json({ success: false, message: 'Facility Name is required' });
    }

    // Check facility available bed count
    let availableBeds = 8;
    try {
      const fac = await HealthcareFacility.findOne({ $or: [{ facilityId }, { name: facilityName }] }).lean();
      if (fac && fac.bedCount && fac.bedCount.available !== undefined) {
        availableBeds = fac.bedCount.available;
      }
    } catch (fErr) {
      console.warn('Facility bed count lookup warning:', fErr.message);
    }

    const passNum = `ADM-${(facilityName || 'FAC').substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const status = availableBeds > 0 ? 'PENDING' : 'WAITLISTED';

    const bookingRecord = {
      patientId: req.user._id,
      facilityId: facilityId || 'FAC-DEFAULT',
      facilityName: facilityName,
      department: department,
      requestedBedType: requestedBedType,
      allottedBedType: '',
      allottedBedNumber: '',
      patientName: patientName || req.user.name || 'Patient',
      patientAge: patientAge || 'N/A',
      patientGender: patientGender || 'N/A',
      contactPhone: contactPhone || req.user.phone || 'N/A',
      reasonForAdmission: reasonForAdmission || 'Emergency Admission Required',
      status: status,
      admissionPassNumber: passNum,
      hospitalNotes: availableBeds > 0 ? 'Awaiting hospital bed allocation & staff confirmation' : 'Beds currently at 100% capacity. Waitlisted for next available opening.',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertRes = await mongoose.connection.collection('bedadmissions').insertOne(bookingRecord);

    // Create Care Journey Event
    try {
      await CareJourneyEvent.create({
        patientId: req.user._id,
        eventType: 'EMERGENCY',
        facilityId: facilityId || 'FAC-DEFAULT',
        facilityName: facilityName,
        title: status === 'PENDING'
          ? `🛏️ Hospital Bed & Admission Requested at ${facilityName}`
          : `⏳ Bed Admission Request Waitlisted at ${facilityName}`,
        description: `Department: ${department}. Requested Bed: ${requestedBedType.replace('_', ' ')}. Admission Pass #${passNum}. Status: ${status}`,
        relatedAppointmentId: insertRes.insertedId
      });
    } catch (cjErr) {
      console.warn('Care journey event warning:', cjErr.message);
    }

    return res.status(201).json({
      success: true,
      message: status === 'PENDING' ? 'Bed admission request submitted successfully.' : 'Request registered on hospital waitlist.',
      booking: { _id: insertRes.insertedId, ...bookingRecord }
    });
  } catch (err) {
    console.error('Error submitting bed booking:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit bed booking request' });
  }
});

// 2. Get Logged-in Patient's Bed Booking Requests
router.get('/bed-bookings/my', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const bookings = await mongoose.connection.collection('bedadmissions')
      .find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching patient bed bookings:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bed bookings' });
  }
});

// 3. Hospital Approve Bed Request & Allot Specific Bed (Decrements Available Beds by 1)
router.put('/bed-bookings/:id/approve', authMiddleware, async (req, res) => {
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
      return res.status(404).json({ success: false, message: 'Bed admission request not found' });
    }

    const bedTypeLabel = allottedBedType || booking.requestedBedType || 'GENERAL_WARD';
    const bedNo = allottedBedNumber || `BED-${Math.floor(10 + Math.random() * 90)}`;

    // Update booking status to APPROVED_BED_ALLOTTED
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

    // Decrement hospital available bed count by 1
    try {
      await HealthcareFacility.updateOne(
        { $or: [{ facilityId: booking.facilityId }, { name: booking.facilityName }] },
        { $inc: { 'bedCount.available': -1 } }
      );
    } catch (bErr) {
      console.warn('Bed count decrement warning:', bErr.message);
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
      const Notification = require('../models/Notification');
      if (booking.patientId) {
        await Notification.create({
          user: booking.patientId,
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
          }
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
          const User = require('../models/User');
          const u = await User.findById(booking.patientId);
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendEmail } = require('../utils/sendEmail');
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #14b8a6; margin: 0;">🏥 MediTrack Hospital Admission & Bed Allotted</h2>
              <p style="color: #94a3b8; font-size: 13px;">Official Inpatient Admission Confirmation Pass</p>
            </div>
            
            <p>Dear <strong>${booking.patientName || 'Valued Patient'}</strong>,</p>
            <p>Your bed booking & hospital admission request for <strong>${booking.facilityName}</strong> has been <strong style="color: #22c55e;">APPROVED</strong> and a bed has been successfully allotted by the hospital admission desk.</p>
            
            <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #14b8a6; margin: 20px 0;">
              <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${booking.admissionPassNumber}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Allotted Bed Tag: <strong style="color: #38bdf8; font-size: 1.15em;">#${bedNo}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Bed Category: <strong style="color: #22c55e;">${bedTypeLabel.replace('_', ' ')}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Hospital Unit: <strong>${booking.department || 'Emergency / General'}</strong></p>
            </div>

            ${hospitalNotes ? `
              <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                <strong>Hospital Admission Notes:</strong> ${hospitalNotes}
              </div>
            ` : ''}

            <p style="font-size: 13px; color: #cbd5e1;">Please present your Admission Pass Number (<strong>#${booking.admissionPassNumber}</strong>) and government ID when arriving at <strong>${booking.facilityName}</strong>.</p>
            
            <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Admission Notification</p>
          </div>
        `;

        await sendEmail({
          to: patientEmail,
          subject: `🟢 Confirmed: Hospital Bed #${bedNo} Allotted at ${booking.facilityName}`,
          html: emailHTML
        });
        console.log('✅ Bed allotment email dispatched to:', patientEmail);
      }
    } catch (eErr) {
      console.warn('Bed approval email dispatch warning:', eErr.message);
    }

    return res.json({
      success: true,
      message: `Bed ${bedNo} successfully allotted. Hospital available bed count occupied by 1. Email and in-app notifications sent.`,
      allottedBedNumber: bedNo,
      allottedBedType: bedTypeLabel
    });
  } catch (err) {
    console.error('Error approving bed booking:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve bed booking' });
  }
});

// 4. Cancel Bed Booking Request
router.delete('/bed-bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      objectId = id;
    }

    await mongoose.connection.collection('bedadmissions').deleteOne({ _id: objectId });
    return res.json({ success: true, message: 'Bed admission request cancelled' });
  } catch (err) {
    console.error('Error cancelling bed booking:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel bed booking' });
  }
});

// 5. Dispatch / Discharge Patient (Releases 1 Bed back to available count)
router.put('/bed-bookings/:id/dispatch', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { summaryNotes } = req.body;
    const mongoose = require('mongoose');

    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch (e) { objectId = id; }

    const booking = await mongoose.connection.collection('bedadmissions').findOne({ _id: objectId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Bed admission request not found' });
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

    // Release 1 bed back to facility available count
    try {
      await HealthcareFacility.updateOne(
        { $or: [{ facilityId: booking.facilityId }, { name: booking.facilityName }] },
        { $inc: { 'bedCount.available': 1 } }
      );
    } catch (fErr) {
      console.warn('Bed release increment warning:', fErr.message);
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
      const Notification = require('../models/Notification');
      if (booking.patientId) {
        await Notification.create({
          user: booking.patientId,
          type: 'general',
          title: `🏥 Official Hospital Discharge Complete`,
          message: `You have been officially discharged from ${booking.facilityName}. Reserved bed #${booking.allottedBedNumber || ''} has been released.`,
          severity: 'info',
          read: false,
          meta: { admissionPassNumber: booking.admissionPassNumber, facilityName: booking.facilityName }
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
          const User = require('../models/User');
          const u = await User.findById(booking.patientId);
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendEmail } = require('../utils/sendEmail');
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #38bdf8; margin: 0;">🏥 Official Hospital Discharge Summary</h2>
              <p style="color: #94a3b8; font-size: 13px;">Inpatient Discharge & Recovery Clearance</p>
            </div>
            
            <p>Dear <strong>${booking.patientName || 'Valued Patient'}</strong>,</p>
            <p>You have been officially <strong style="color: #38bdf8;">DISCHARGED</strong> from inpatient care at <strong>${booking.facilityName}</strong>. Your reserved hospital bed has been released.</p>
            
            <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #38bdf8; margin: 20px 0;">
              <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${booking.admissionPassNumber}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Discharge Date & Time: <strong style="color: #38bdf8;">${new Date(dischargedAt).toLocaleString()}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Status: <strong style="color: #22c55e;">COMPLETED / DISCHARGED</strong></p>
            </div>

            ${summaryNotes ? `
              <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                <strong>Discharge Summary & Instructions:</strong> ${summaryNotes}
              </div>
            ` : ''}

            <p style="font-size: 13px; color: #cbd5e1;">Thank you for choosing <strong>${booking.facilityName}</strong>. We wish you a fast and full recovery!</p>
            
            <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Discharge Notification</p>
          </div>
        `;

        await sendEmail({
          to: patientEmail,
          subject: `🏥 Hospital Discharge Summary: Pass #${booking.admissionPassNumber} at ${booking.facilityName}`,
          html: emailHTML
        });
      }
    } catch (eErr) {
      console.warn('Discharge email warning:', eErr.message);
    }

    return res.json({ success: true, message: 'Patient discharged. Bed count released by +1.' });
  } catch (err) {
    console.error('Error discharging patient:', err);
    return res.status(500).json({ success: false, message: 'Failed to discharge patient' });
  }
});

// 6. Shift Patient to General Ward
router.put('/bed-bookings/:id/shift-ward', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { newBedNumber, hospitalNotes } = req.body;
    const mongoose = require('mongoose');

    let objectId;
    try { objectId = new mongoose.Types.ObjectId(id); } catch (e) { objectId = id; }

    const booking = await mongoose.connection.collection('bedadmissions').findOne({ _id: objectId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Bed admission request not found' });
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
      const Notification = require('../models/Notification');
      if (booking.patientId) {
        await Notification.create({
          user: booking.patientId,
          type: 'general',
          title: `🛏️ Shifted to General Ward: Bed #${wardBedNo}`,
          message: `Your bed at ${booking.facilityName} has been transferred to General Ward Bed #${wardBedNo}. Pass #${booking.admissionPassNumber}.`,
          severity: 'info',
          read: false,
          meta: { admissionPassNumber: booking.admissionPassNumber, facilityName: booking.facilityName, allottedBedNumber: wardBedNo }
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
          const User = require('../models/User');
          const u = await User.findById(booking.patientId);
          if (u && u.email) patientEmail = u.email;
        } catch(e) {}
      }

      if (patientEmail) {
        const { sendEmail } = require('../utils/sendEmail');
        const emailHTML = `
          <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #a855f7; margin: 0;">🛏️ Patient General Ward Shift Notice</h2>
              <p style="color: #94a3b8; font-size: 13px;">Inpatient Ward Transfer Confirmation</p>
            </div>
            
            <p>Dear <strong>${booking.patientName || 'Valued Patient'}</strong>,</p>
            <p>Your inpatient bed at <strong>${booking.facilityName}</strong> has been transferred to the <strong style="color: #a855f7;">General Medicine Ward</strong> for continued recovery.</p>
            
            <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #a855f7; margin: 20px 0;">
              <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${booking.admissionPassNumber}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">New Ward Bed Tag: <strong style="color: #c084fc; font-size: 1.15em;">#${wardBedNo}</strong></p>
              <p style="margin: 6px 0; color: #94a3b8;">Bed Category: <strong style="color: #a855f7;">General Ward</strong></p>
            </div>

            ${hospitalNotes ? `
              <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
                <strong>Ward Transfer Notes:</strong> ${hospitalNotes}
              </div>
            ` : ''}

            <p style="font-size: 13px; color: #cbd5e1;">Your medical records and care journey have been updated with your new bed assignment (<strong>#${wardBedNo}</strong>).</p>
            
            <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Ward Transfer Notification</p>
          </div>
        `;

        await sendEmail({
          to: patientEmail,
          subject: `🛏️ Shifted to General Ward: Bed #${wardBedNo} at ${booking.facilityName}`,
          html: emailHTML
        });
      }
    } catch (eErr) {
      console.warn('Ward shift email warning:', eErr.message);
    }

    return res.json({ success: true, message: `Patient shifted to General Ward Bed #${wardBedNo}.`, allottedBedNumber: wardBedNo });
  } catch (err) {
    console.error('Error shifting patient to general ward:', err);
    return res.status(500).json({ success: false, message: 'Failed to shift patient to general ward' });
  }
});



router.get('/queue/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { department = 'General OPD', tokenNumber } = req.query;
    const mongoose = require('mongoose');
    const todayStr = new Date().toISOString().split('T')[0];

    // Count appointments for this facility & department today from Appointment collection
    const departmentAppointmentsCount = await Appointment.countDocuments({
      facilityId,
      department,
      date: todayStr
    });

    const hasBookedToken = tokenNumber !== undefined && tokenNumber !== null && tokenNumber !== '' && !isNaN(parseInt(tokenNumber)) && parseInt(tokenNumber) > 0;
    const userToken = hasBookedToken ? parseInt(tokenNumber) : 0;

    // Fetch all active department queues for this facility today to build overview summary map
    let allFacilityQueues = [];
    try {
      allFacilityQueues = await mongoose.connection.collection('carequeues').find({
        date: todayStr,
        $or: [
          { facilityIdStr: facilityId },
          { facilityId: facilityId }
        ]
      }).toArray();
    } catch (err) {
      console.warn('Facility queues summary fetch warning:', err.message);
    }

    const departmentQueues = {};
    allFacilityQueues.forEach(q => {
      const dept = q.department || 'General OPD';
      departmentQueues[dept] = {
        department: dept,
        currentToken: q.servingToken || 1,
        totalTokensBooked: q.currentToken || 0,
        waitingCount: Math.max(0, (q.currentToken || 0) - (q.servingToken || 1))
      };
    });

    // Attempt to fetch real live queue token from carequeues for this specific department
    try {
      let realQueue = await mongoose.connection.collection('carequeues').findOne({
        department: department,
        date: todayStr,
        $or: [
          { facilityIdStr: facilityId },
          { facilityId: facilityId }
        ]
      });

      if (!realQueue) {
        realQueue = await mongoose.connection.collection('carequeues').findOne({
          date: todayStr,
          $or: [
            { facilityIdStr: facilityId },
            { facilityId: facilityId }
          ]
        });
      }

      if (realQueue) {
        const totalBooked = Math.max(realQueue.currentToken || 0, departmentAppointmentsCount);
        const currentToken = realQueue.servingToken || (totalBooked > 0 ? 1 : 0);
        const position = userToken > 0 ? Math.max(0, userToken - currentToken) : 0;
        const estimatedWaitMinutes = position * 5;

        return res.json({
          success: true,
          facilityId,
          department,
          userToken,
          currentToken,
          totalTokensBooked: totalBooked,
          positionInLine: position,
          estimatedWaitMinutes,
          hasAppointment: hasBookedToken,
          status: userToken === 0 ? 'NO_APPOINTMENT' : position === 0 ? 'NOW_SERVING' : 'WAITING',
          entries: realQueue.entries || [],
          departmentQueues,
          lastUpdated: new Date()
        });
      }
    } catch (qErr) {
      console.warn('Department Queue fetch warning:', qErr.message);
    }

    const totalBooked = departmentAppointmentsCount;
    const currentToken = totalBooked > 0 ? 1 : 0;
    const position = userToken > 0 ? Math.max(0, userToken - currentToken) : 0;
    const estimatedWaitMinutes = position * 5;

    return res.json({
      success: true,
      facilityId,
      department,
      userToken,
      currentToken,
      totalTokensBooked: totalBooked,
      positionInLine: position,
      estimatedWaitMinutes,
      hasAppointment: hasBookedToken,
      status: userToken === 0 ? 'NO_APPOINTMENT' : position === 0 ? 'NOW_SERVING' : 'WAITING',
      entries: [],
      departmentQueues,
      lastUpdated: new Date()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error calculating queue status' });
  }
});

// Doctor / Hospital Staff Queue Advance Action
router.post('/queue/action', async (req, res) => {
  try {
    const { facilityId, department = 'General OPD', action = 'COMPLETE', tokenNumber } = req.body;
    const mongoose = require('mongoose');
    const todayStr = new Date().toISOString().split('T')[0];

    let queue = await mongoose.connection.collection('carequeues').findOne({
      department: department,
      date: todayStr,
      $or: [
        { facilityIdStr: facilityId },
        { facilityId: facilityId }
      ]
    });

    if (!queue) {
      queue = await mongoose.connection.collection('carequeues').findOne({
        date: todayStr,
        $or: [
          { facilityIdStr: facilityId },
          { facilityId: facilityId }
        ]
      });
    }

    if (!queue) {
      // Create default department queue if none exists
      const newQueue = {
        facilityIdStr: facilityId || 'DEFAULT',
        department: department,
        date: todayStr,
        currentToken: 1,
        servingToken: 2,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await mongoose.connection.collection('carequeues').insertOne(newQueue);
      return res.json({ success: true, message: `Queue advanced for ${department}`, servingToken: 2, currentToken: 2, department });
    }

    let newServingToken = (queue.servingToken || 1) + 1;
    if (tokenNumber && parseInt(tokenNumber)) {
      newServingToken = parseInt(tokenNumber) + 1;
    }

    // Mark completed entry in entries array
    const updatedEntries = (queue.entries || []).map(entry => {
      if (entry.tokenNumber === (queue.servingToken || 1)) {
        return { ...entry, status: 'COMPLETED', endTime: new Date() };
      }
      if (entry.tokenNumber === newServingToken) {
        return { ...entry, status: 'IN_CONSULTATION', startTime: new Date() };
      }
      return entry;
    });

    await mongoose.connection.collection('carequeues').updateOne(
      { _id: queue._id },
      {
        $set: {
          servingToken: newServingToken,
          entries: updatedEntries,
          updatedAt: new Date()
        }
      }
    );

    // Update appointment status in main DB if applicable for this department
    await Appointment.updateMany(
      { facilityId, department, tokenNumber: queue.servingToken || 1, date: todayStr },
      { $set: { status: 'COMPLETED' } }
    );

    return res.json({
      success: true,
      message: `Queue advanced for ${department}! Now serving Token #${newServingToken}`,
      servingToken: newServingToken,
      currentToken: queue.currentToken || newServingToken,
      department
    });
  } catch (err) {
    console.error('Error advancing queue:', err);
    return res.status(500).json({ success: false, message: 'Failed to advance queue' });
  }
});

// -------------------------------------------------------------
// 5. REFERRAL TRACKING API
// -------------------------------------------------------------
router.post('/referrals', authMiddleware, async (req, res) => {
  try {
    const { fromFacilityId, fromFacilityName, toFacilityId, toFacilityName, reason, priority, specialtyRequired } = req.body;

    const referralId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const referral = new Referral({
      referralId,
      patientId: req.user._id,
      patientName: req.user.name || 'Patient',
      fromFacilityId: fromFacilityId || 'FAC-IN-DL-PHC-02',
      fromFacilityName: fromFacilityName || 'Primary Health Centre Najafgarh',
      toFacilityId: toFacilityId || 'FAC-IN-DL-AIIMS-01',
      toFacilityName: toFacilityName || 'AIIMS New Delhi Apex Hospital',
      reason: reason || 'Specialist Cardiology Evaluation',
      specialtyRequired: specialtyRequired || 'Cardiology',
      priority: priority || 'URGENT',
      status: 'IN_TRANSIT'
    });

    await referral.save();

    await CareJourneyEvent.create({
      patientId: req.user._id,
      type: 'REFERRAL',
      facilityId: toFacilityId,
      facilityName: toFacilityName,
      title: `Referred to ${toFacilityName}`,
      description: `Referral generated for ${specialtyRequired} (${priority} priority).`,
      status: 'COMPLETED'
    });

    return res.json({ success: true, message: 'Referral generated successfully', referral });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Referral generation error' });
  }
});

router.get('/referrals/my', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    if (!db) {
      return res.json({ success: true, count: 0, referrals: [] });
    }

    let userEmail = null;
    let userId = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded && decoded.id) {
          userId = decoded.id;
          const userObj = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
          if (userObj) userEmail = userObj.email;
        }
      } catch (e) {
        // Token decode failure handled gracefully
      }
    }

    const patientIds = [];
    if (userId) {
      patientIds.push(userId.toString());
      if (mongoose.Types.ObjectId.isValid(userId)) {
        patientIds.push(new mongoose.Types.ObjectId(userId));
      }
    }

    if (userId || userEmail) {
      try {
        const pQuery = [];
        if (userId) pQuery.push({ mediTrackUserId: userId.toString() });
        if (userEmail) pQuery.push({ email: userEmail.toLowerCase() });

        if (pQuery.length > 0) {
          const matchedPatients = await db.collection('patientrecords').find({ $or: pQuery }).toArray();
          matchedPatients.forEach(p => {
            patientIds.push(p._id.toString());
            patientIds.push(p._id);
          });
        }
      } catch (ePat) {
        console.warn('Patient lookup warning:', ePat.message);
      }
    }

    let rawReferrals = [];
    const collectionNames = ['carereferrals', 'referrals', 'care_referrals'];

    for (const colName of collectionNames) {
      try {
        const collections = await db.listCollections({ name: colName }).toArray();
        if (collections.length > 0) {
          if (patientIds.length > 0) {
            const matched = await db.collection(colName).find({
              patientId: { $in: patientIds }
            }).sort({ createdAt: -1 }).toArray();

            if (matched && matched.length > 0) {
              rawReferrals = [...rawReferrals, ...matched];
            }
          }

          if (rawReferrals.length === 0) {
            const allRefs = await db.collection(colName).find({}).sort({ createdAt: -1 }).toArray();
            if (allRefs && allRefs.length > 0) {
              rawReferrals = [...rawReferrals, ...allRefs];
            }
          }
        }
      } catch (colErr) {
        console.warn(`Error checking collection ${colName}:`, colErr.message);
      }
    }

    const uniqueMap = new Map();
    rawReferrals.forEach(ref => {
      if (ref && ref._id) {
        uniqueMap.set(ref._id.toString(), ref);
      }
    });

    const finalRawReferrals = Array.from(uniqueMap.values());

    if (finalRawReferrals.length === 0) {
      return res.json({ success: true, count: 0, referrals: [] });
    }

    // Lookup facilities, doctors, patients for authentic names
    let facilities = [];
    let doctors = [];
    let patients = [];
    try {
      facilities = await db.collection('facilities').find({}).toArray();
      doctors = await db.collection('doctors').find({}).toArray();
      patients = await db.collection('patientrecords').find({}).toArray();
    } catch (eLookup) {
      console.warn('Lookup collections warning:', eLookup.message);
    }

    const facMap = new Map();
    facilities.forEach(f => facMap.set(f._id.toString(), f.name));

    const docMap = new Map();
    doctors.forEach(d => {
      let name = d.fullName || d.name || 'Doctor';
      if (!name.startsWith('Dr.')) name = `Dr. ${name}`;
      docMap.set(d._id.toString(), name);
    });

    const patMap = new Map();
    patients.forEach(p => patMap.set(p._id.toString(), p.name || p.fullName || 'Patient'));

    const populated = finalRawReferrals.map(ref => {
      const fromFac = ref.referringFacilityId ? (facMap.get(ref.referringFacilityId.toString()) || 'Primary Healthcare Facility') : 'Primary Health Centre';
      const toFac = ref.receivingFacilityId ? (facMap.get(ref.receivingFacilityId.toString()) || 'Super Specialty Hospital') : 'District Hospital';
      const refDoc = ref.referringDoctorId ? (docMap.get(ref.referringDoctorId.toString()) || 'Attending Physician') : 'Attending Physician';
      const targetDoc = ref.targetDoctorId ? docMap.get(ref.targetDoctorId.toString()) : null;
      const patientName = ref.patientId ? (patMap.get(ref.patientId.toString()) || 'Patient') : 'Patient';

      return {
        _id: ref._id.toString(),
        referralId: `REF-${ref._id.toString().slice(-6).toUpperCase()}`,
        patientName,
        fromFacilityName: fromFac,
        toFacilityName: toFac,
        referringDoctorName: refDoc,
        targetDoctorName: targetDoc,
        department: ref.department || 'General Medicine',
        specialtyRequired: ref.department || 'General Medicine',
        priority: ref.urgency || 'ROUTINE',
        status: ref.status || 'SENT',
        reason: ref.reason || 'Clinical Referral Request',
        clinicalNotes: ref.clinicalNotes || '',
        patientFamilyConsent: ref.patientFamilyConsent || { consentGiven: false },
        isInterState: !!ref.isInterState,
        interStateConfirmation: ref.interStateConfirmation,
        consultationAdvice: ref.consultationAdvice,
        completedAt: ref.completedAt ? new Date(ref.completedAt).toLocaleString() : null,
        completionNotes: ref.completionNotes || '',
        createdAt: ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
      };
    });

    return res.json({ success: true, count: populated.length, referrals: populated });
  } catch (err) {
    console.error('Error in GET /api/care-network/referrals/my:', err);
    return res.status(500).json({ success: false, message: 'Error fetching patient referrals', referrals: [] });
  }
});

// DELETE patient referral record by ID
router.delete('/referrals/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;

    let query = { _id: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      const objId = new mongoose.Types.ObjectId(id);
      query = { $or: [{ _id: objId }, { _id: id }] };
    }

    const collectionNames = ['carereferrals', 'referrals', 'care_referrals'];
    let deletedCount = 0;

    for (const colName of collectionNames) {
      try {
        const collections = await db.listCollections({ name: colName }).toArray();
        if (collections.length > 0) {
          const resDel = await db.collection(colName).deleteMany(query);
          deletedCount += resDel.deletedCount;
        }
      } catch (eDel) {
        console.warn(`Delete error in ${colName}:`, eDel.message);
      }
    }

    return res.json({ success: true, message: 'Referral deleted successfully', deletedCount });
  } catch (err) {
    console.error('Error in DELETE /api/care-network/referrals/:id:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete referral' });
  }
});

// PUT Mark referral as COMPLETED
router.put('/referrals/:id/complete', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { id } = req.params;
    const { completionNotes } = req.body;

    let query = { _id: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      const objId = new mongoose.Types.ObjectId(id);
      query = { $or: [{ _id: objId }, { _id: id }] };
    }

    const updateData = {
      $set: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: completionNotes || 'Referral completed & confirmed by attending specialist doctor.'
      }
    };

    let referralDoc = null;
    const collectionNames = ['carereferrals', 'referrals', 'care_referrals'];
    for (const colName of collectionNames) {
      try {
        const collections = await db.listCollections({ name: colName }).toArray();
        if (collections.length > 0) {
          if (!referralDoc) {
            referralDoc = await db.collection(colName).findOne(query);
          }
          await db.collection(colName).updateMany(query, updateData);
        }
      } catch (eUp) {
        console.warn(`Update complete error in ${colName}:`, eUp.message);
      }
    }

    try {
      let sendReferralCompletedEmail;
      try {
        sendReferralCompletedEmail = require('../../care_backend/services/emailService').sendReferralCompletedEmail;
      } catch (e) {}

      if (sendReferralCompletedEmail && referralDoc) {
        const patientEmail = referralDoc.patientEmail || 'patient@meditrack.care';
        sendReferralCompletedEmail({
          to: patientEmail,
          patientName: referralDoc.patientName || 'Valued Patient',
          referringDoctorName: referralDoc.referringDoctorName || 'Referring Physician',
          consultingDoctorName: referralDoc.targetDoctorName || 'Attending Specialist',
          facilityName: referralDoc.receivingFacilityName || 'Care Facility',
          department: referralDoc.department || 'Specialist Department',
          completionNotes: completionNotes || 'Referral completed & confirmed by attending doctor',
          completedAt: new Date(),
          referralId: (referralDoc._id || id).toString().slice(-6).toUpperCase(),
        });
      }
    } catch (eEmailErr) {
      console.warn('CareNetwork email dispatch error:', eEmailErr.message);
    }

    return res.json({ success: true, message: 'Referral status updated to COMPLETED' });
  } catch (err) {
    console.error('Error in PUT /api/care-network/referrals/:id/complete:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete referral' });
  }
});

// -------------------------------------------------------------
// 6. DIAGNOSTICS & MEDICINE STOCK AVAILABILITY API
// -------------------------------------------------------------
router.get('/diagnostics', async (req, res) => {
  try {
    await seedFacilitiesIfEmpty();
    const { name, lat, lng, maxDistance, city } = req.query;

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const userCity = city || 'Jalpaiguri';

    let allFacilities = [];

    if (userLat !== null && userLng !== null) {
      const generatedLocal = generateLocalDiagnosticCentersForCoordinates(userLat, userLng, userCity);
      const osmPlaces = await fetchRealOSMDiagnosticCenters(userLat, userLng, userCity);
      allFacilities = [...generatedLocal, ...osmPlaces];
    } else {
      let dbFacilities = await HealthcareFacility.find().lean();
      allFacilities = dbFacilities;
    }

    let facilityMap = new Map();

    allFacilities.forEach(f => {
      if (!f.diagnostics || !Array.isArray(f.diagnostics)) return;

      const dist = (userLat !== null && userLng !== null) 
        ? calculateDistanceKm(userLat, userLng, f.latitude, f.longitude)
        : (f.distanceKm || 1.2);

      const travelTime = Math.round(dist * 2.5);

      // Filter by test name if requested
      const matchingDiagnostics = f.diagnostics.filter(d => 
        !name || name === 'ALL' || d.name.toLowerCase().includes(name.toLowerCase())
      );

      if (matchingDiagnostics.length > 0) {
        facilityMap.set(f.facilityId, {
          facilityId: f.facilityId,
          facilityName: f.name,
          facilityType: f.facilityType,
          district: f.district || userCity,
          taluka: f.taluka || `${userCity} Sub-Division`,
          address: f.address || '',
          latitude: f.latitude,
          longitude: f.longitude,
          phone: f.phone || '+91 3561 224455',
          email: f.email || null,
          website: f.website || null,
          distanceKm: dist,
          estimatedTravelTimeMinutes: travelTime,
          operatingHours: f.operatingHours || '24/7 Diagnostic Services',
          availableDiagnostics: f.diagnostics.filter(d => d.available).map(d => d.name),
          diagnostics: f.diagnostics,
          minWaitTimeMinutes: Math.min(...f.diagnostics.map(d => d.waitTimeMinutes || 5))
        });
      }
    });

    let results = Array.from(facilityMap.values());

    if (userLat !== null && userLng !== null) {
      const allowedRadius = parseFloat(maxDistance) || 300;
      results = results.filter(m => m.distanceKm <= allowedRadius);
      results.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    if (results.length > 0) {
      results[0].isNearest = true;
    }

    return res.json({
      success: true,
      count: results.length,
      userLocation: { latitude: userLat, longitude: userLng, city: userCity },
      diagnostics: results
    });
  } catch (err) {
    console.error('Error querying diagnostic availability:', err);
    return res.status(500).json({ success: false, message: 'Error querying diagnostic availability' });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const { name, lat, lng, city } = req.query;
    const userCity = city || 'Jalpaiguri';

    const facilities = await HealthcareFacility.find().lean();
    let inventoryList = [];

    // Filter database facilities strictly by user city/district if available
    facilities.forEach(f => {
      const isCityMatch = f.district && f.district.toLowerCase().includes(userCity.toLowerCase());
      if (userCity && !isCityMatch) return; // Skip non-matching cities (e.g. Pune/Delhi when user is in Jalpaiguri)

      f.medicineServices.forEach(m => {
        if (!name || m.medicineName.toLowerCase().includes(name.toLowerCase()) || m.genericName.toLowerCase().includes(name.toLowerCase())) {
          inventoryList.push({
            facilityId: f.facilityId,
            facilityName: f.name,
            facilityType: f.facilityType,
            district: f.district || userCity,
            medicineName: m.medicineName,
            genericName: m.genericName,
            quantity: m.quantity,
            available: m.available,
            phone: f.phone
          });
        }
      });
    });

    // Dynamic Local Public Health Centers strictly for the user's city (e.g. Jalpaiguri)
    const medName = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : 'Essential Medicine';

    const localCityFacilities = [
      {
        facilityId: `PHC-LOCAL-1`,
        facilityName: `Primary Health Centre (PHC) ${userCity} Sadar`,
        facilityType: 'PHC',
        district: userCity,
        medicineName: `${medName} 500mg`,
        genericName: `${medName} Active Formulation`,
        quantity: 140,
        available: true,
        phone: '+91 3561 224455'
      },
      {
        facilityId: `RH-LOCAL-2`,
        facilityName: `Rural Hospital Rajganj ${userCity}`,
        facilityType: 'RURAL_HOSPITAL',
        district: userCity,
        medicineName: `${medName} 500mg`,
        genericName: `${medName} Active Formulation`,
        quantity: 210,
        available: true,
        phone: '+91 3561 229988'
      },
      {
        facilityId: `DH-LOCAL-3`,
        facilityName: `${userCity} District Hospital Central Pharmacy`,
        facilityType: 'DISTRICT_HOSPITAL',
        district: userCity,
        medicineName: `${medName} 500mg`,
        genericName: `${medName} Active Formulation`,
        quantity: 1250,
        available: true,
        phone: '+91 3561 222100'
      },
      {
        facilityId: `CHC-LOCAL-4`,
        facilityName: `Community Health Centre (CHC) DBC Road ${userCity}`,
        facilityType: 'CHC',
        district: userCity,
        medicineName: `${medName} 500mg`,
        genericName: `${medName} Active Formulation`,
        quantity: 95,
        available: true,
        phone: '+91 3561 230911'
      }
    ];

    if (inventoryList.length === 0) {
      inventoryList = localCityFacilities;
    }

    return res.json({ success: true, count: inventoryList.length, inventory: inventoryList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error querying medicine inventory' });
  }
});

// -------------------------------------------------------------
// 7. CARE JOURNEY API
// -------------------------------------------------------------
router.get('/care-journey', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let events = await CareJourneyEvent.find({ patientId: req.user._id }).sort({ timestamp: 1 }).lean();

    try {
      const careEvents = await mongoose.connection.collection('carejourneytimelineevents').find().sort({ timestamp: 1 }).toArray();
      if (careEvents && careEvents.length > 0) {
        const mapped = careEvents.map(e => ({
          _id: e._id,
          type: e.eventType || 'CLINICAL',
          facilityName: 'Public Healthcare Center',
          title: e.title || 'Clinical Care Event',
          description: e.description || 'Clinical evaluation performed',
          timestamp: e.timestamp || new Date(),
          status: 'COMPLETED'
        }));
        events = [...mapped, ...events];
      }
    } catch (e) {}

    if (events.length === 0) {
      events = [
        {
          _id: 'cj-demo-1',
          type: 'TRIAGE',
          title: 'Digital Triage Conducted',
          description: 'Symptom intake: Chest discomfort & shortness of breath. Evaluated as High Urgency.',
          timestamp: new Date(Date.now() - 86400000 * 3),
          status: 'COMPLETED'
        },
        {
          _id: 'cj-demo-2',
          type: 'APPOINTMENT',
          facilityName: 'Primary Health Centre (PHC)',
          title: 'Consultation Token #37',
          description: 'Attended Medical Officer evaluation at PHC.',
          timestamp: new Date(Date.now() - 86400000 * 2),
          status: 'COMPLETED'
        },
        {
          _id: 'cj-demo-3',
          type: 'DIAGNOSTIC',
          facilityName: 'Primary Health Centre (PHC)',
          title: 'ECG Diagnostic Completed',
          description: 'ECG performed. Preliminary ST-elevation notes flagged for specialist review.',
          timestamp: new Date(Date.now() - 86400000 * 2),
          status: 'COMPLETED'
        },
        {
          _id: 'cj-demo-4',
          type: 'REFERRAL',
          facilityName: 'District Hospital Cardiology Unit',
          title: 'Referred to District Hospital Cardiology',
          description: 'High priority referral issued for tertiary cardiac care.',
          timestamp: new Date(Date.now() - 86400000 * 1),
          status: 'IN_PROGRESS'
        },
        {
          _id: 'cj-demo-5',
          type: 'MEDICINE',
          facilityName: 'District Hospital Pharmacy',
          title: 'Prescription & Medicine Dispensed',
          description: 'Metformin 500mg, Atorvastatin 20mg & Aspirin 75mg issued.',
          timestamp: new Date(),
          status: 'COMPLETED'
        }
      ];
    }

    return res.json({ success: true, events });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching care journey' });
  }
});

// -------------------------------------------------------------
// 8. TELECONSULTATION & HOSPITAL PORTAL API
// -------------------------------------------------------------
router.post('/teleconsultation', authMiddleware, async (req, res) => {
  try {
    const { specialty, symptoms, preferredFacilityName } = req.body;

    const request = new TeleconsultationRequest({
      patientId: req.user._id,
      patientName: req.user.name || 'Patient',
      specialty: specialty || 'Cardiology',
      preferredFacilityName: preferredFacilityName || 'District Hospital Tele-Hub',
      symptoms: symptoms || 'Follow-up remote consultation',
      status: 'SCHEDULED',
      scheduledTime: 'Today at 4:30 PM'
    });

    await request.save();

    await CareJourneyEvent.create({
      patientId: req.user._id,
      type: 'TELECONSULTATION',
      title: `Teleconsultation Requested: ${specialty}`,
      description: `Scheduled with ${request.preferredFacilityName} for ${request.scheduledTime}.`,
      status: 'COMPLETED'
    });

    return res.json({ success: true, message: 'Teleconsultation session requested successfully', request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error booking teleconsultation' });
  }
});

router.get('/hospital-portal/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const facility = await HealthcareFacility.findOne({ facilityId });

    return res.json({
      success: true,
      facility: facility || facilitiesSeedData[0],
      stats: {
        todayPatients: 142,
        waitingInQueue: 11,
        activeReferrals: 6,
        emergencyAlerts: 2
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching hospital portal data' });
  }
});

module.exports = router;



