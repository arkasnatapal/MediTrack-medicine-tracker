const MedicineCatalog = require('../models/MedicineCatalog');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Cloudinary helper removed as per user request for dynamic icons only

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_FAMILY_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_FAMILY_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash-lite";

/**
 * Local Lookup: Search medicine in the local catalog (Exact Match)
 */
exports.lookupMedicine = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Case-insensitive search using regex
    // We search in brandName primarily
    const medicine = await MedicineCatalog.findOne({
      brandName: { $regex: new RegExp(`^${query}$`, 'i') }
    });

    if (medicine) {
      return res.status(200).json({
        found: true,
        data: medicine
      });
    }

    return res.status(200).json({ found: false });

  } catch (error) {
    console.error("Error in lookupMedicine:", error);
    res.status(500).json({ message: "Server error during lookup" });
  }
};

/**
 * Search Medicines: Partial match for autocomplete
 */
exports.searchMedicines = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Partial match (starts with or contains)
    // Using 'starts with' for better autocomplete relevance, or 'contains' if preferred.
    // Let's use 'contains' but sort by exact match relevance if possible, 
    // but for simplicity, regex 'i' is good.
    const medicines = await MedicineCatalog.find({
      brandName: { $regex: new RegExp(query, 'i') }
    }).limit(10).select('brandName genericName category imageUrl dosageInfo commonUses precautions');

    res.status(200).json({
      success: true,
      data: medicines
    });

  } catch (error) {
    console.error("Error in searchMedicines:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};

/**
 * AI Search: Generate details using AI, upload image, and save to catalog
 */
exports.aiSearchMedicine = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    if (!genAI) {
      return res.status(503).json({ message: "AI service not configured" });
    }

    // 1. Generate details using Gemini
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: `
        You are a medical database assistant. 
        Provide structured data for the medicine named "${query}".
        
        STRICT RULES:
        1. Return ONLY valid JSON. No markdown, no code blocks.
        2. Use general medical knowledge. Normalize data as if sourced from standard pharmacy databases.
        3. DO NOT scrape live websites.
        4. If the medicine is not found or is invalid, return {"error": "Medicine not found"}.
        5. DO NOT provide any image URL. The frontend will handle icons dynamically.
           
           JSON FORMAT:
           {
             "brandName": "Standardized Brand Name",
             "genericName": "Generic Name",
             "category": "Tablet/Syrup/Injection/Capsule/Drops/Cream/Inhaler",
             "dosageInfo": "Standard dosage info",
             "commonUses": ["Use 1", "Use 2"],
             "precautions": ["Precaution 1", "Precaution 2"]
           }
      `
    });

    const prompt = `Provide details for medicine: ${query}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up markdown if present
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let aiData;
    
    try {
      aiData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    if (aiData.error) {
      return res.status(404).json({ message: aiData.error });
    }

    // 2. Save to Local Catalog (No image handling)
    const newMedicine = new MedicineCatalog({
      brandName: aiData.brandName,
      genericName: aiData.genericName,
      category: aiData.category,
      dosageInfo: aiData.dosageInfo,
      commonUses: aiData.commonUses,
      precautions: aiData.precautions,
      imageUrl: "", // No image URL
      createdBy: 'ai',
      verified: false
    });

    await newMedicine.save();

    // 4. Return Result
    res.status(200).json({
      found: true,
      data: newMedicine
    });

  } catch (error) {
    console.error("Error in aiSearchMedicine:", error);
    res.status(500).json({ message: "Server error during AI search" });
  }
};
