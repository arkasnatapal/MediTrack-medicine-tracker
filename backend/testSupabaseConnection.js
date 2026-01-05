require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to list buckets to verify connection and permissions
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Connection Failed:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Connection Successful!');
      console.log('Available Buckets:', data.map(b => b.name));
      
      const reportBucket = data.find(b => b.name === 'meditrack-reports');
      if (reportBucket) {
         console.log('✅ Bucket "meditrack-reports" found.');
      } else {
         console.warn('⚠️ Bucket "meditrack-reports" NOT found. Please create it in Supabase Dashboard.');
      }
    }
  } catch (err) {
    console.error('❌ Unexpected Error:', err);
  }
}

testConnection();
