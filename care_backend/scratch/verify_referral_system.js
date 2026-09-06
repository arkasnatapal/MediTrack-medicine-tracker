const http = require('http');

function checkPort(port, path) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ Port ${port}${path} -> Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response summary:`, Array.isArray(json) ? `Array[${json.length}]` : json);
        } catch (e) {
          console.log(`   Response text length:`, data.length);
        }
        resolve(true);
      });
    }).on('error', (err) => {
      console.log(`❌ Port ${port}${path} -> Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('🔍 Checking Care Network Ports...');
  await checkPort(5001, '/api/referrals');
  await checkPort(5000, '/api/care-network/facilities');
}

run();
