const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function seedData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;

    // 1. Find or create User "Arka"
    let user = await db.collection('users').findOne({ $or: [{ name: /Arka/i }, { email: /arka/i }] });
    if (!user) {
      const result = await db.collection('users').insertOne({
        name: 'Arka',
        email: 'arka@meditrack.org',
        phoneNumber: '+919876543210',
        gender: 'male',
        dateOfBirth: new Date('1998-05-14'),
        age: 28,
        bloodGroup: 'B+',
        height: 178,
        weight: 74,
        healthScore: 92,
        healthState: 'GREEN',
        abhaNumber: '91-8812-9904-1234',
        abhaAddress: 'arka@abdm',
        familyMedicalHistory: [
          'Hypertension & Coronary Artery Disease (Father)',
          'Type 2 Diabetes Mellitus (Maternal Grandmother)',
          'Thyroid Nodules (Mother)'
        ],
        createdAt: new Date()
      });
      user = await db.collection('users').findOne({ _id: result.insertedId });
      console.log('Created MediTrack User:', user.name, user._id);
    } else {
      console.log('Found existing MediTrack User:', user.name, user._id);
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            healthScore: 92,
            healthState: 'GREEN',
            bloodGroup: 'B+',
            age: 28,
            height: 178,
            weight: 74,
            abhaNumber: '91-8812-9904-1234',
            abhaAddress: 'arka@abdm',
            familyMedicalHistory: [
              'Hypertension & Coronary Artery Disease (Father)',
              'Type 2 Diabetes Mellitus (Maternal Grandmother)',
              'Thyroid Nodules (Mother)'
            ]
          }
        }
      );
    }

    // 2. Link PatientRecord "ARKA" to MediTrack User
    const patientRecord = await db.collection('patientrecords').findOne({ name: /ARKA/i });
    if (patientRecord) {
      await db.collection('patientrecords').updateOne(
        { _id: patientRecord._id },
        {
          $set: {
            mediTrackUserId: user._id.toString(),
            email: user.email,
            phone: user.phoneNumber,
            allergies: ['Penicillin', 'Dust Mites', 'Sulfa Drugs'],
            chronicConditions: ['Mild Essential Hypertension', 'Seasonal Allergic Rhinitis']
          }
        }
      );
      console.log('Linked PatientRecord ARKA to MediTrack User ID:', user._id.toString());
    }

    // 3. Seed Active Medicines for User
    await db.collection('medicines').deleteMany({ userId: user._id });
    await db.collection('medicines').insertMany([
      {
        userId: user._id,
        name: 'Amlodipine Besylate',
        dosage: '5mg',
        quantity: 28,
        genericName: 'Amlodipine',
        category: 'Cardiovascular / Antihypertensive',
        form: 'Tablet',
        expiryDate: new Date('2027-11-30'),
        aiInsights: {
          recommendation: 'Take daily at 9:00 AM with water. Avoid grapefruit juice.',
          safetyAlert: 'Mild ankle swelling may occur.'
        },
        createdAt: new Date()
      },
      {
        userId: user._id,
        name: 'Telmisartan',
        dosage: '40mg',
        quantity: 30,
        genericName: 'Telmisartan',
        category: 'ARBs / Blood Pressure',
        form: 'Tablet',
        expiryDate: new Date('2027-09-15'),
        aiInsights: {
          recommendation: 'Take after breakfast for optimal blood pressure stabilization.'
        },
        createdAt: new Date()
      },
      {
        userId: user._id,
        name: 'Montelukast Sodium',
        dosage: '10mg',
        quantity: 14,
        genericName: 'Montelukast',
        category: 'Respiratory / Allergy',
        form: 'Tablet',
        expiryDate: new Date('2026-12-31'),
        aiInsights: {
          recommendation: 'Take at bedtime for nocturnal allergic asthma control.'
        },
        createdAt: new Date()
      }
    ]);
    console.log('Seeded 3 active medications.');

    // 4. Seed Diagnostic Reports with AI Analysis
    await db.collection('reports').deleteMany({ userId: user._id });
    await db.collection('reports').insertMany([
      {
        userId: user._id,
        folderName: 'Cardiology & Lipid Panel Comprehensive Checkup',
        reportDate: new Date('2026-08-15'),
        domain: 'Cardiology',
        files: [
          {
            url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
            publicId: 'lipid_panel_arka_01',
            fileType: 'image',
            originalName: 'Lipid_Panel_Report_Aug2026.png'
          }
        ],
        aiAnalysis: {
          summary: 'Overall lipid and cardiac bio-markers are stable. Mild borderline elevation in LDL Cholesterol (118 mg/dL). Triglycerides and HDL are in ideal ranges.',
          keyFindings: [
            'Total Cholesterol: 188 mg/dL (Normal < 200 mg/dL)',
            'LDL Cholesterol: 118 mg/dL (Borderline Elevated)',
            'HDL Cholesterol: 52 mg/dL (Healthy Protective > 40 mg/dL)',
            'Serum Creatinine: 0.95 mg/dL (Normal Kidney Function)',
            'ECG: Normal Sinus Rhythm (HR 72 bpm, no ST elevation)'
          ],
          questionsForDoctor: [
            'Should Amlodipine 5mg dosage be continued or combined with low-salt dietary therapy?',
            'Is quarterly lipid monitoring sufficient given family history of CAD?'
          ],
          healthScore: 90,
          createdAt: new Date('2026-08-15')
        },
        createdAt: new Date('2026-08-15')
      },
      {
        userId: user._id,
        folderName: 'Complete Blood Count (CBC) & HbA1c Glycated Hemoglobin',
        reportDate: new Date('2026-07-10'),
        domain: 'Pathology & Endocrinology',
        files: [
          {
            url: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&auto=format&fit=crop&q=60',
            publicId: 'cbc_hba1c_arka_02',
            fileType: 'image',
            originalName: 'CBC_HbA1c_July2026.png'
          }
        ],
        aiAnalysis: {
          summary: 'Glycated Hemoglobin HbA1c is 5.4% (Non-diabetic status). Hematocrit and Hemoglobin are optimal.',
          keyFindings: [
            'HbA1c: 5.4% (Optimal Non-Diabetic Range < 5.7%)',
            'Hemoglobin: 15.1 g/dL',
            'Platelet Count: 280,000 /µL',
            'Fasting Blood Glucose: 92 mg/dL'
          ],
          questionsForDoctor: [
            'Confirm routine annual screening timeline for HbA1c.'
          ],
          healthScore: 95,
          createdAt: new Date('2026-07-10')
        },
        createdAt: new Date('2026-07-10')
      }
    ]);
    console.log('Seeded 2 lab reports with AI analyses.');

    // 5. Seed Genetic Insights & Ayurvedic Profile
    await db.collection('ayurvedicprofiles').deleteOne({ userId: user._id });
    await db.collection('ayurvedicprofiles').insertOne({
      userId: user._id,
      constituency: {
        vata: 35,
        pitta: 50,
        kapha: 15,
        primary: 'Pitta-Vata (Balanced Metabolism & Active Vigor)'
      },
      onboardingCompleted: true,
      lifestyle: {
        dietaryPreference: 'Vegetarian with Dairy',
        sleepPattern: '7.5 Hours (Deep Sleep ~2h)',
        activityLevel: 'Moderate (30 min jog 4x/week)'
      },
      geneticInsights: [
        {
          condition: 'Familial Essential Hypertension Risk (ACE/AGT Gene Predisposition)',
          recommendation: 'Keep daily dietary sodium under 2,000mg. Regular aerobic exercise.',
          category: 'Cardiovascular Genomics'
        },
        {
          condition: 'Lactose Metabolism Sensitivity Variant (LCT Gene)',
          recommendation: 'Opt for fermented dairy (curd/yogurt) or lactose-free milk.',
          category: 'Metabolic & Digestive'
        },
        {
          condition: 'Alpha-1 Antitrypsin Deficiency Gene Heterozygote Carrier',
          recommendation: 'Strict avoidance of active/passive tobacco smoke and industrial smog.',
          category: 'Pulmonary Protection'
        }
      ],
      healingPath: {
        title: 'Vascular Protection & Pitta Cooling Regimen',
        description: 'Targeted preventive path focusing on BP stabilization, stress relief, and cooling digestive herbs.',
        source: 'MediTrack Intelligent Genomic & Ayurvedic Engine',
        recommendations: [
          {
            category: 'Dietary',
            title: 'Low-Sodium Potassium-Rich Nutrition',
            content: 'Incorporate tender coconut water, pomegranates, and green leafy vegetables daily.',
            timeToPerform: 'Morning'
          },
          {
            category: 'Mindfulness',
            title: 'Anulom Vilom Pranayama',
            content: '10 minutes of alternate nostril breathing to regulate vagal tone and systolic pressure.',
            timeToPerform: 'Evening'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Seeded Ayurvedic Profile with Genetic Insights.');

    // 6. Seed Daily Vitals & Symptoms
    await db.collection('dailystatuses').deleteMany({ userId: user._id });
    await db.collection('dailystatuses').insertMany([
      {
        userId: user._id,
        date: new Date('2026-09-04'),
        mood: 'good',
        energyLevel: 8,
        bodyStatus: ['Slight tension in back', 'Normal BP (122/80)'],
        notes: 'Felt calm today after morning jog.',
        createdAt: new Date('2026-09-04')
      },
      {
        userId: user._id,
        date: new Date('2026-09-03'),
        mood: 'excellent',
        energyLevel: 9,
        bodyStatus: ['Energetic', 'No headache'],
        notes: 'Good hydration and early sleep.',
        createdAt: new Date('2026-09-03')
      }
    ]);
    console.log('Seeded Daily Vitals & Status logs.');

    console.log('SUCCESS: All MediTrack patient health records seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding patient data:', err);
    process.exit(1);
  }
}

seedData();
