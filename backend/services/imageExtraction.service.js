const { GoogleGenerativeAI } = require("@google/generative-ai");
const { cloudinary } = require("../config/cloudinary");
const axios = require('axios');

// Initialize Gemini
const genAI = process.env.GEMINI_API_CHAT_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY)
  : null;

// Use a stable model version as default, allows fallback
const MODEL_NAME = "gemini-2.5-flash-lite"; 

/**
 * 1. Ask Gemini for a valid, stable image URL (e.g. Wikimedia)
 * 2. Upload to Cloudinary
 * 3. Return Cloudinary URL
 */
exports.findAndUploadImage = async (query) => {
    if (!genAI || !process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn("Missing Gemini or Cloudinary keys");
        return null;
    }

    try {
        // Step 1: Get URL from Gemini
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
        TASK: Find a DIRECT, PUBLIC, STABLE image URL for the Yoga Pose/Exercise: "${query}".
        SOURCE PRIORITY: Wikimedia Commons, Pexels, Unsplash, or official health sites.
        AVOID: Stock photo sites with watermarks (Getty, Shutterstock).
        
        OUTPUT JSON ONLY:
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/..." 
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) return null;
        const { url } = JSON.parse(jsonMatch[0]);

        if (!url) return null;

        // Step 2: Upload to Cloudinary
        console.log(`[ImageExtraction] Uploading ${query} from ${url}...`);
        
        const uploadRes = await cloudinary.uploader.upload(url, {
            folder: 'women_health_exercises',
            public_id: query.toLowerCase().replace(/\s+/g, '_'),
            overwrite: false // Don't re-upload if exists (caching mechanism)
        });

        return uploadRes.secure_url;

    } catch (error) {
        console.error(`[ImageExtraction] Failed for ${query}:`, error.message);
        // Fallback or return null
        return null;
    }
};
