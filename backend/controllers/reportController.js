const Report = require('../models/Report');
const { cloudinary } = require('../config/cloudinary');
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

    const uploadedFiles = files.map(file => ({
      url: file.path,
      publicId: file.filename,
      fileType: 'image',
      originalName: file.originalname
    }));

    const report = new Report({
      userId: req.user._id,
      folderName,
      reportDate,
      files: uploadedFiles
    });

    await report.save();

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Delete files from Cloudinary
    for (const file of report.files) {
      if (file.publicId) {
        await cloudinary.uploader.destroy(file.publicId, { resource_type: file.fileType === 'pdf' ? 'raw' : 'image' });
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
    
    Format the response as JSON with keys: "summary", "detailedAnalysis", "keyFindings" (array of strings), "healthScore" (number 0-100, estimate based on report).
    
    IMPORTANT:
    - Never panic the user.
    - If results are abnormal, explain common causes and next steps calmly.
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
    await report.save();

    res.json({ success: true, analysis: report.aiAnalysis });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
