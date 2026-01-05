require('dotenv').config();
const { uploadToSupabase } = require('./utils/supabaseHelper');

async function debugUpload() {
  console.log('--- Starting Debug Upload ---');
  
  // Mock a file object similar to what Multer provides
  const mockFile = {
    originalname: 'debug_test.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('This is a test PDF content for debugging purposes.')
  };

  try {
    console.log('Calling uploadToSupabase with mock file...');
    const result = await uploadToSupabase(mockFile);
    console.log('--- Upload Success ---');
    console.log(result);
  } catch (error) {
    console.error('--- Upload Failed ---');
    console.error('Error Object:', error);
    if (error.message) console.error('Error Message:', error.message);
    if (error.cause) console.error('Error Cause:', error.cause);
  }
}

debugUpload();
