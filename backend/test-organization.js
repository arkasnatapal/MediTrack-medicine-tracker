/**
 * Test Script for Medicine Organization Feature
 * Run with: node backend/test-organization.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { normalizeMedicineName, extractMedicineComponents, areMedicineNamesSimilar } = require('./utils/medicineNormalizer');
const { lookupDrugIndications } = require('./utils/drugLookupService');
const { categorizeMedicine } = require('./utils/medicineCategorizationService');

// Test data
const testMedicines = [
  'Pan 40',
  'P 500',
  'Paracetamol 500mg',
  'Lemonade',
  'Amoxicillin 500mg',
  'Cefixime + Ofloxacin 200mg',
  'Ibuprofen 400',
  'Omeprazole 20mg',
  'Cetirizine 10mg',
  'Azithromycin 500',
];

console.log('🧪 Testing Medicine Organization Feature\n');
console.log('=' .repeat(60));

// Test 1: Medicine Name Normalization
console.log('\n📝 Test 1: Medicine Name Normalization');
console.log('-'.repeat(60));

testMedicines.forEach(medicine => {
  const normalized = normalizeMedicineName(medicine);
  console.log(`${medicine.padEnd(30)} → ${normalized}`);
});

// Test 2: Component Extraction
console.log('\n📝 Test 2: Component Extraction (Combination Medicines)');
console.log('-'.repeat(60));

const combinationMedicine = 'Cefixime + Ofloxacin 200mg';
const components = extractMedicineComponents(combinationMedicine);
console.log(`${combinationMedicine}`);
console.log(`Components: ${components.join(', ')}`);

// Test 3: Similarity Check
console.log('\n📝 Test 3: Medicine Name Similarity');
console.log('-'.repeat(60));

const pairs = [
  ['Pan 40', 'Paracetamol 500mg'],
  ['P 500', 'Pan 40'],
  ['Ibuprofen 400', 'Brufen 200'],
  ['Lemonade', 'Paracetamol'],
];

pairs.forEach(([name1, name2]) => {
  const similar = areMedicineNamesSimilar(name1, name2);
  console.log(`${name1} ≈ ${name2}: ${similar ? '✓ Similar' : '✗ Different'}`);
});

// Test 4: Drug Lookup (requires internet)
console.log('\n📝 Test 4: Drug Indication Lookup');
console.log('-'.repeat(60));
console.log('This test requires internet connection and may take a few seconds...\n');

async function testLookups() {
  const testDrugs = ['paracetamol', 'amoxicillin', 'ibuprofen', 'lemonade'];
  
  for (const drug of testDrugs) {
    try {
      console.log(`Looking up: ${drug}`);
      const result = await lookupDrugIndications(drug);
      console.log(`  Source: ${result.source}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Indications: ${result.indications.slice(0, 2).join(', ') || 'None found'}`);
      console.log('');
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }
}

// Test 5: Categorization
console.log('\n📝 Test 5: Medicine Categorization');
console.log('-'.repeat(60));

async function testCategorization() {
  const testCases = [
    {
      medicine: 'Paracetamol',
      indications: ['pain relief', 'fever reduction', 'headache treatment'],
    },
    {
      medicine: 'Amoxicillin',
      indications: ['bacterial infection', 'antibiotic treatment'],
    },
    {
      medicine: 'Omeprazole',
      indications: ['acid reflux', 'gastric ulcer', 'heartburn'],
    },
    {
      medicine: 'Unknown Medicine',
      indications: [],
    },
  ];

  testCases.forEach(({ medicine, indications }) => {
    const categories = categorizeMedicine(indications);
    console.log(`\n${medicine}:`);
    console.log(`  Indications: ${indications.join(', ') || 'None'}`);
    console.log(`  Categories:`);
    categories.forEach(cat => {
      console.log(`    - ${cat.category} (${(cat.confidence * 100).toFixed(0)}% confidence)`);
    });
  });
}

// Test 6: Database Connection (optional)
async function testDatabaseConnection() {
  console.log('\n📝 Test 6: Database Connection');
  console.log('-'.repeat(60));

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Successfully connected to MongoDB');
    
    const MedicineFolder = require('./models/MedicineFolder');
    const MedicineLookupCache = require('./models/MedicineLookupCache');
    const Medicine = require('./models/Medicine');

    console.log('✓ Models loaded successfully');
    
    // Check indexes
    const folderIndexes = await MedicineFolder.collection.getIndexes();
    const cacheIndexes = await MedicineLookupCache.collection.getIndexes();
    
    console.log(`✓ MedicineFolder indexes: ${Object.keys(folderIndexes).length}`);
    console.log(`✓ MedicineLookupCache indexes: ${Object.keys(cacheIndexes).length}`);
    
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('✗ Database connection error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testLookups();
    await testCategorization();
    await testDatabaseConnection();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
