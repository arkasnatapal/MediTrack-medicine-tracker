// Pan-India Public Healthcare Dataset for MediTrack Public Healthcare Access Platform
// Covers PHCs, CHCs, Rural Hospitals, Sub-Centers & District/Apex Hospitals across India

const facilitiesData = [
  // -------------------------------------------------------------
  // NATIONAL CAPITAL REGION (DELHI NCR)
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-IN-DL-AIIMS-01',
    name: 'All India Institute of Medical Sciences (AIIMS Delhi)',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'Delhi',
    district: 'New Delhi',
    taluka: 'South Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    latitude: 28.5672,
    longitude: 77.2100,
    phone: '011-26588500 / 112',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Trauma & Emergency Care', 'Pediatrics', 'Pulmonology', 'Nephrology'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
      { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
      { name: 'MRI', available: true, waitTimeMinutes: 20 },
      { name: 'Ultrasound', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 5 },
      { name: 'Pathology', available: true, waitTimeMinutes: 10 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 5000, available: true },
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 10000, available: true },
      { medicineName: 'Atorvastatin 20mg', genericName: 'Atorvastatin Calcium', quantity: 3000, available: true },
      { medicineName: 'Aspirin 75mg', genericName: 'Acetylsalicylic Acid', quantity: 4500, available: true },
      { medicineName: 'Insulin Human Glargine', genericName: 'Insulin Glargine', quantity: 800, available: true }
    ],
    operatingHours: '24/7 Apex Emergency',
    isPublicFacility: true,
    bedCount: { total: 2500, available: 120 },
    rating: 4.9
  },
  {
    facilityId: 'FAC-IN-DL-PHC-02',
    name: 'Primary Health Centre (PHC) Najafgarh',
    facilityType: 'PHC',
    state: 'Delhi',
    district: 'South West Delhi',
    taluka: 'Najafgarh',
    address: 'Rural Health Training Centre, Najafgarh, New Delhi 110043',
    latitude: 28.6090,
    longitude: 76.9855,
    phone: '011-25321088 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General OPD', 'Maternal & Child Health', 'Immunization', 'First Aid'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 15 },
      { name: 'Pathology', available: true, waitTimeMinutes: 15 }
    ],
    medicineServices: [
      { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 600, available: true },
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 300, available: true },
      { medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', quantity: 200, available: true }
    ],
    operatingHours: '24/7 Emergency, OPD 8 AM - 2 PM',
    isPublicFacility: true,
    bedCount: { total: 15, available: 6 },
    rating: 4.6
  },

  // -------------------------------------------------------------
  // WEST BENGAL
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-IN-WB-SSKM-03',
    name: 'SSKM Hospital & IPGMER Kolkata',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'West Bengal',
    district: 'Kolkata',
    taluka: 'Kolkata Central',
    address: '244 AJC Bose Road, Bhowanipore, Kolkata, West Bengal 700020',
    latitude: 22.5392,
    longitude: 88.3433,
    phone: '033-22231589 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['Cardiology', 'General Surgery', 'Nephrology', 'Emergency Trauma', 'Pediatrics', 'Neurology'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
      { name: 'CT Scan', available: true, waitTimeMinutes: 20 },
      { name: 'MRI', available: true, waitTimeMinutes: 30 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 10 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 2400, available: true },
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 5000, available: true },
      { medicineName: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', quantity: 1200, available: true }
    ],
    operatingHours: '24/7 Emergency & Specialty OPD',
    isPublicFacility: true,
    bedCount: { total: 1800, available: 95 },
    rating: 4.8
  },
  {
    facilityId: 'FAC-IN-WB-PHC-04',
    name: 'Primary Health Centre (PHC) Singur',
    facilityType: 'PHC',
    state: 'West Bengal',
    district: 'Hooghly',
    taluka: 'Singur',
    address: 'Singur Station Road, Hooghly, West Bengal 712409',
    latitude: 22.8122,
    longitude: 88.2311,
    phone: '03212-230108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General OPD', 'Snakebite First Aid', 'Maternal Health', 'Malaria Clinic'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 15 }
    ],
    medicineServices: [
      { medicineName: 'Anti-Snake Venom (ASV)', genericName: 'Polyvalent ASV', quantity: 30, available: true },
      { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 400, available: true }
    ],
    operatingHours: '24/7 Emergency',
    isPublicFacility: true,
    bedCount: { total: 10, available: 4 },
    rating: 4.5
  },

  // -------------------------------------------------------------
  // TAMIL NADU
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-IN-TN-RGGGH-05',
    name: 'Rajiv Gandhi Govt General Hospital Chennai',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'Tamil Nadu',
    district: 'Chennai',
    taluka: 'Chennai Central',
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
    latitude: 13.0818,
    longitude: 80.2773,
    phone: '044-25305000 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['Cardiology', 'Cardiothoracic Surgery', 'Neurology', 'Emergency Trauma', 'General Medicine'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
      { name: 'CT Scan', available: true, waitTimeMinutes: 15 },
      { name: 'MRI', available: true, waitTimeMinutes: 25 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 10 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 3500, available: true },
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 8000, available: true },
      { medicineName: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium', quantity: 2000, available: true }
    ],
    operatingHours: '24/7 Tertiary Medical Care',
    isPublicFacility: true,
    bedCount: { total: 2700, available: 140 },
    rating: 4.8
  },
  {
    facilityId: 'FAC-IN-TN-PHC-06',
    name: 'Government Primary Health Centre Kanchipuram',
    facilityType: 'PHC',
    state: 'Tamil Nadu',
    district: 'Kanchipuram',
    taluka: 'Walajabad',
    address: 'Walajabad Main Road, Kanchipuram, Tamil Nadu 631605',
    latitude: 12.8342,
    longitude: 79.7036,
    phone: '044-27221088 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General OPD', 'Maternal & Child Healthcare', 'Immunization'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 15 }
    ],
    medicineServices: [
      { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 550, available: true },
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 250, available: true }
    ],
    operatingHours: '24/7 Emergency, OPD 8 AM - 4 PM',
    isPublicFacility: true,
    bedCount: { total: 12, available: 5 },
    rating: 4.6
  },

  // -------------------------------------------------------------
  // PUNJAB
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-IN-PB-CIVIL-07',
    name: 'Civil Hospital Amritsar',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'Punjab',
    district: 'Amritsar',
    taluka: 'Amritsar City',
    address: 'Majitha Road, Near Circular Road, Amritsar, Punjab 143001',
    latitude: 31.6444,
    longitude: 74.8770,
    phone: '0183-2211088 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General Surgery', 'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology', 'Emergency Care'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 15 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 10 },
      { name: 'Pathology', available: true, waitTimeMinutes: 15 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 1800, available: true },
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 4000, available: true },
      { medicineName: 'Aspirin 75mg', genericName: 'Acetylsalicylic Acid', quantity: 1200, available: true }
    ],
    operatingHours: '24/7 Emergency',
    isPublicFacility: true,
    bedCount: { total: 350, available: 45 },
    rating: 4.7
  },
  {
    facilityId: 'FAC-IN-PB-CHC-08',
    name: 'Community Health Centre (CHC) Jandiala Guru',
    facilityType: 'CHC',
    state: 'Punjab',
    district: 'Amritsar',
    taluka: 'Jandiala',
    address: 'GT Road, Jandiala Guru, Amritsar, Punjab 143115',
    latitude: 31.5621,
    longitude: 75.0210,
    phone: '0183-2771088 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General OPD', 'Trauma First Aid', 'Maternal Health'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 15 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 20 }
    ],
    medicineServices: [
      { medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', quantity: 600, available: true },
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 280, available: true }
    ],
    operatingHours: '24/7 Emergency',
    isPublicFacility: true,
    bedCount: { total: 30, available: 11 },
    rating: 4.5
  },

  // -------------------------------------------------------------
  // MAHARASHTRA
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-MH-PUNE-PHC-01',
    name: 'Primary Health Centre (PHC) Khed',
    facilityType: 'PHC',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Khed',
    address: 'Main Road, Khed Taluka, Pune, Maharashtra 410505',
    latitude: 18.8475,
    longitude: 73.9142,
    phone: '02135-222108 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General Medicine', 'Maternal & Child Health', 'Immunization', 'First Aid'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 10 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 15 },
      { name: 'Pathology', available: true, waitTimeMinutes: 20 }
    ],
    medicineServices: [
      { medicineName: 'Paracetamol', genericName: 'Acetaminophen', quantity: 250, available: true },
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 120, available: true },
      { medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', quantity: 80, available: true }
    ],
    operatingHours: '24/7 Emergency, OPD 8 AM - 2 PM',
    isPublicFacility: true,
    bedCount: { total: 10, available: 4 },
    rating: 4.6
  },
  {
    facilityId: 'FAC-MH-PUNE-RH-02',
    name: 'Rural Hospital Chakan',
    facilityType: 'RURAL_HOSPITAL',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Khed',
    address: 'Pune-Nashik Highway, Chakan, Pune, Maharashtra 410501',
    latitude: 18.7607,
    longitude: 73.8631,
    phone: '02135-249108 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['General Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Emergency Trauma', 'Orthopedics'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 15 },
      { name: 'Ultrasound', available: true, waitTimeMinutes: 30 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 10 }
    ],
    medicineServices: [
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 450, available: true },
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 210, available: true }
    ],
    operatingHours: '24/7',
    isPublicFacility: true,
    bedCount: { total: 30, available: 12 },
    rating: 4.7
  },
  {
    facilityId: 'FAC-MH-PUNE-DH-03',
    name: 'Aundh District Hospital Pune',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    address: 'Aundh Camp, Chest Hospital Campus, Pune, Maharashtra 411027',
    latitude: 18.5626,
    longitude: 73.8087,
    phone: '020-27280108 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['Cardiology', 'Neurology', 'Nephrology', 'General Surgery', 'ICU / CCU', 'Pediatrics'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
      { name: 'CT Scan', available: true, waitTimeMinutes: 25 },
      { name: 'MRI', available: true, waitTimeMinutes: 45 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 1200, available: true },
      { medicineName: 'Atorvastatin 20mg', genericName: 'Atorvastatin Calcium', quantity: 600, available: true }
    ],
    operatingHours: '24/7 Emergency & Specialty Care',
    isPublicFacility: true,
    bedCount: { total: 300, available: 64 },
    rating: 4.8
  },

  // -------------------------------------------------------------
  // KARNATAKA
  // -------------------------------------------------------------
  {
    facilityId: 'FAC-IN-KA-VICTORIA-09',
    name: 'Victoria Hospital Bengaluru',
    facilityType: 'DISTRICT_HOSPITAL',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'Bengaluru Fort',
    address: 'Fort Road, Near KR Market, Bengaluru, Karnataka 560002',
    latitude: 12.9634,
    longitude: 77.5750,
    phone: '080-26701150 / 108',
    emergencyAvailable: true,
    ambulanceSupported: true,
    opdAvailable: true,
    teleconsultationAvailable: true,
    specialties: ['Cardiology', 'Trauma Center', 'General Surgery', 'Burn Center', 'Pediatrics'],
    diagnostics: [
      { name: 'ECG', available: true, waitTimeMinutes: 5 },
      { name: 'X-Ray', available: true, waitTimeMinutes: 10 },
      { name: 'CT Scan', available: true, waitTimeMinutes: 20 },
      { name: 'Blood Test', available: true, waitTimeMinutes: 10 }
    ],
    medicineServices: [
      { medicineName: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', quantity: 3000, available: true },
      { medicineName: 'Paracetamol 650mg', genericName: 'Acetaminophen', quantity: 7000, available: true }
    ],
    operatingHours: '24/7 Emergency Apex Care',
    isPublicFacility: true,
    bedCount: { total: 1000, available: 80 },
    rating: 4.8
  }
];

module.exports = facilitiesData;
