const axios = require('axios');

const API_URL = 'http://localhost:5000/api/medicine-catalog';

async function runVerification() {
  console.log('Starting verification...');

  // 1. Local Lookup (Expect Not Found)
  const testMedicine = "TestMedicine_" + Date.now();
  console.log(`\n1. Testing Local Lookup for non-existent medicine: ${testMedicine}`);
  try {
    const res1 = await axios.post(`${API_URL}/lookup`, { query: testMedicine });
    console.log('Result:', res1.data);
    if (res1.data.found === false) {
      console.log('✅ Local lookup correctly returned not found.');
    } else {
      console.error('❌ Local lookup failed: Expected not found.');
    }
  } catch (err) {
    console.error('❌ Error in local lookup:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  }

  // 2. AI Search (Expect Success)
  const aiMedicine = "Dolo 650"; 
  console.log(`\n2. Testing AI Search for: ${aiMedicine}`);
  try {
    const res2 = await axios.post(`${API_URL}/ai-search`, { query: aiMedicine });
    console.log('Result Data Keys:', Object.keys(res2.data.data || {}));
    if (res2.data.found === true && res2.data.data.brandName) {
      console.log('✅ AI Search successful. Data returned.');
      console.log('Image URL:', res2.data.data.imageUrl);
    } else {
      console.error('❌ AI Search failed.');
    }
  } catch (err) {
    console.error('❌ Error in AI search:', err.message);
    if (err.response) console.error('Response:', err.response.data);
    if (err.code) console.error('Error Code:', err.code);
  }

  // 3. Local Lookup Again (Expect Found)
  console.log(`\n3. Testing Local Lookup for cached medicine: ${aiMedicine}`);
  try {
    const res3 = await axios.post(`${API_URL}/lookup`, { query: aiMedicine });
    if (res3.data.found === true) {
      console.log('✅ Local lookup correctly returned cached data.');
    } else {
      console.error('❌ Local lookup failed: Expected found after AI search.');
    }
  } catch (err) {
    console.error('❌ Error in local lookup:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  }
}

runVerification();
