const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require("https");
const http = require("http");

const router = express.Router();

// Multer upload setup – store files in "uploads/" temp folder
const upload = multer({ dest: "uploads/" });

// Gemini client setup with fetch configuration
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiClient = null;

if (geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(geminiApiKey);
}

// Create custom fetch with agent for better network handling
const customFetch = (url, options = {}) => {
  const parsedUrl = new URL(url);
  const agent = parsedUrl.protocol === 'https:' 
    ? new https.Agent({ keepAlive: true, timeout: 60000 })
    : new http.Agent({ keepAlive: true, timeout: 60000 });
  
  return fetch(url, {
    ...options,
    agent,
  });
};

async function analyzeMedicineImage(imageBuffer, mimeType = "image/jpeg") {
  // If no API key, return a fallback that doesn't crash the app
  if (!geminiClient) {
    return {
      name: "",
      generic_name: null,
      dosage: null,
      form: null,
      expiry: null,
      mfg_date: null,
      batch_no: null,
      raw_cleaned: "",
      source: "fallback-no-gemini-vision"
    };
  }

  try {
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a medical packaging understanding assistant.

You are given a PHOTO of a medicine strip or box. Read all visible text carefully and extract CLEAN and STRUCTURED information.

Return a JSON object with EXACTLY these keys:

- "name": string (best guess of brand medicine name, or "" if truly unknown)
- "generic_name": string or null (e.g. "Paracetamol")
- "dosage": string or null (e.g. "500 mg", "10 mg/ml")
- "form": string or null (e.g. "tablet", "capsule", "syrup" if inferable)
- "expiry": string or null (as printed, e.g. "05/2027", "06/26", "EXP 06 2026")
- "mfg_date": string or null (manufacturing date if visible)
- "batch_no": string or null (batch/lot number if visible)
- "raw_cleaned": string (a cleaned-up readable text summary of everything you can read from the package)

IMPORTANT RULES:
- Only output VALID JSON. No commentary, no markdown, no code fences.
- Use double quotes around all keys and string values.
- If some field is not present or not readable, use null (or "" only for "name" when unknown).
`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    };

    const result = await model.generateContent([
      { text: prompt },
      imagePart,
    ]);

    const responseText = result.response.text().trim();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (err) {
      const cleaned = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    }

    // Ensure all keys exist and normalize the structure
    return {
      name: parsed.name || "",
      generic_name: "generic_name" in parsed ? parsed.generic_name : null,
      dosage: "dosage" in parsed ? parsed.dosage : null,
      form: "form" in parsed ? parsed.form : null,
      expiry: "expiry" in parsed ? parsed.expiry : null,
      mfg_date: "mfg_date" in parsed ? parsed.mfg_date : null,
      batch_no: "batch_no" in parsed ? parsed.batch_no : null,
      raw_cleaned: parsed.raw_cleaned || "",
      source: "gemini-2.0-flash-vision",
      raw_model_text: responseText,
    };
  } catch (error) {
    console.error("Gemini vision analysis error:", error);
    return {
      name: "",
      generic_name: null,
      dosage: null,
      form: null,
      expiry: null,
      mfg_date: null,
      batch_no: null,
      raw_cleaned: "",
      source: "gemini-vision-error-fallback"
    };
  }
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded",
      });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype || "image/jpeg";

    // Read image as buffer
    const imageBuffer = fs.readFileSync(filePath);

    // Call Gemini Vision
    const ai = await analyzeMedicineImage(imageBuffer, mimeType);

    // Clean up temp file
    fs.unlink(filePath, () => {});

    return res.json({
      success: true,
      ai,
    });
  } catch (error) {
    console.error("Gemini Vision OCR route error:", error);
    return res.status(500).json({
      success: false,
      error: "Vision OCR failed",
    });
  }
});

module.exports = router;
