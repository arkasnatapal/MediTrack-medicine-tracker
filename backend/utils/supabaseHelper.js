const supabase = require('../config/supabaseClient');
const path = require('path');

const BUCKET_NAME = 'meditrack-reports';

exports.uploadToSupabase = async (file) => {
  console.log(`[Supabase] Preparing to upload ${file.originalname} to bucket ${BUCKET_NAME}`);
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `${fileName}`; 

    console.log(`[Supabase] Uploading buffer (size: ${file.buffer.length}) to path: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
       console.error('[Supabase] Upload call returned error:', error);
       throw error;
    }
    
    console.log('[Supabase] Upload successful. Data:', data);

    // Get Signed URL (valid for 10 years to effectively make it permanent for this use case)
    // Alternatively, if you want true public access, you MUST set the bucket to Public in Supabase dashboard.
    // Switching to signed URL ensures it works regardless of bucket setting.
    const { data: { signedUrl }, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

    if (signError) {
      console.error('[Supabase] Failed to generate signed URL:', signError);
      throw signError;
    }
    
    console.log('[Supabase] Signed URL generated:', signedUrl);

    return {
      url: signedUrl,
      publicId: filePath, 
      fileType: 'pdf',
      originalName: file.originalname
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};

exports.deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
};
