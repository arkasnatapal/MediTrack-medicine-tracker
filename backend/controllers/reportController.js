const Report = require('../models/Report');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/supabaseHelper');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.uploadReport = async (req, res) => {
  try {
    const { folderName, reportDate } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log(`[Upload] Processing ${files.length} files...`);
    
    files.forEach((f, idx) => {
       console.log(`[Upload] File [${idx}]: name='${f.originalname}', mime='${f.mimetype}', size=${f.size}, buffer=${f.buffer ? f.buffer.length : 'MISSING'}`);
    });

    console.log(`[Upload] Processing ${files.length} files...`);
    
    files.forEach((f, idx) => {
       console.log(`[Upload] File [${idx}]: name='${f.originalname}', mime='${f.mimetype}', size=${f.size}`);
    });

    const uploadedFiles = [];

    for (const file of files) {
      console.log(`[Upload] Processing sequential: ${file.originalname}`);
      try {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
          console.log('[Upload] Sending to Supabase...');
          const result = await uploadToSupabase(file);
          console.log('[Upload] Supabase Success');
          uploadedFiles.push(result);
        } else {
          console.log('[Upload] Sending to Cloudinary...');
          const result = await new Promise((resolve, reject) => {
             const stream = cloudinary.uploader.upload_stream(
               { folder: 'meditrack_reports', resource_type: 'auto' },
               (error, result) => {
                 if (error) reject(error);
                 else resolve(result);
               }
             );
             stream.end(file.buffer);
          });
          console.log('[Upload] Cloudinary Success');
          uploadedFiles.push({
            url: result.secure_url,
            publicId: result.public_id,
            fileType: 'image',
            originalName: file.originalname
          });
        }
      } catch (innerError) {
        console.error(`[Upload] Failed for file ${file.originalname}:`);
        console.error(innerError);
        // Fail the whole request if one fails? Or continue? For now fail to see error.
        throw new Error(`Upload failed for ${file.originalname}: ${innerError.message || JSON.stringify(innerError)}`);
      }
    }

    console.log('[Upload] All files processed. Saving to DB...');
    const report = new Report({
      userId: req.user._id,
      folderName,
      reportDate,
      domain: req.body.domain || 'General',
      files: uploadedFiles
    });

    await report.save();
    console.log('[Upload] DB Save Success');

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Upload Endpoint Error:', error);
    res.status(500).json({ 
        message: 'Server error during upload', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id }).sort({ reportDate: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete files from Storage (Cloudinary or Supabase)
    for (const file of report.files) {
      if (file.publicId) {
        if (file.fileType === 'pdf') {
          await deleteFromSupabase(file.publicId);
        } else {
          await cloudinary.uploader.destroy(file.publicId, { resource_type: 'image' });
        }
      }
    }

    await Report.deleteOne({ _id: report._id });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.analyzeReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare prompt
    // Prepare prompt
    let prompt = `You are MediTrack AI, a calm and trustworthy medical assistant.
    Your role is to explain medical information in simple, reassuring, and human-friendly language.

    Analyze the following medical reports for patient. 
    Report Name: ${report.folderName}
    Date: ${new Date(report.reportDate).toLocaleDateString()}
    
    Files included:
    ${report.files.map(f => `- ${f.originalName} (${f.fileType})`).join('\n')}
    
    Please provide a detailed analysis including:
    1. Summary of the report (Calm and reassuring tone).
    2. Detailed findings (abnormalities, key metrics) - explained simply.
    3. Key findings as a list.
    4. Any recommendations based on the report.
    
    Format the response as JSON with keys: "summary", "detailedAnalysis", "keyFindings" (array of strings), "healthScore" (number 0-100), "domain" (String, e.g. "Cardiology", "Endocrinology", "General").
    
    IMPORTANT:
    - Never panic the user.
    - If results are abnormal, explain common causes and next steps calmly.
    - Suggest a 'domain' if one is apparent (e.g., if glucose -> "Endocrinology").
    - At the end of the "summary" and "detailedAnalysis", you MUST append: "ℹ️ This explanation is meant to help you understand your health better. It does not replace advice from a qualified doctor."
    `;

    // Gemini 2.5 Flash supports image inputs.
    // We will send image parts for analysis.

    const imageParts = [];
    const fetch = (await import('node-fetch')).default; // Dynamic import for node-fetch if needed, or use global fetch if Node 18+

    for (const file of report.files) {
      if (file.fileType === 'image') {
        const response = await fetch(file.url);
        const buffer = await response.arrayBuffer();
        imageParts.push({
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: 'image/jpeg' // Simplified, ideally detect from file
          }
        });
      } else if (file.fileType === 'pdf') {
        const response = await fetch(file.url);
        const buffer = await response.arrayBuffer();
        imageParts.push({
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: 'application/pdf'
          }
        });
      }
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON
    let analysisData;
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      analysisData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error", e);
      analysisData = {
        summary: "Analysis generated but format was not valid JSON.",
        detailedAnalysis: text,
        keyFindings: ["Could not parse structured findings."]
      };
    }

    analysisData.createdAt = new Date();
    report.aiAnalysis = analysisData;
    
    // Update domain if AI found a specific one and current is General
    if (analysisData.domain && (!report.domain || report.domain === 'General')) {
      report.domain = analysisData.domain;
    }

    await report.save();

    res.json({ success: true, analysis: report.aiAnalysis });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.updateReport = async (req, res) => {
  try {
    const { folderName, reportDate, domain } = req.body;
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (folderName) report.folderName = folderName;
    if (reportDate) report.reportDate = reportDate;
    if (domain) report.domain = domain;

    await report.save();
    res.json({ success: true, report });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublicReports = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Find user by memberId
    const user = await User.findOne({ memberId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch reports for this user
    const reports = await Report.find({ userId: user._id }).sort({ reportDate: -1 });

    // Sanitize response (maybe hide userId if needed, but reports are gathered)
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Public Reports Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
