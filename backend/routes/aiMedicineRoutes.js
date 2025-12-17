const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_DESC_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_DESC_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash-lite";

const axios = require("axios");
const cheerio = require("cheerio");

// Function to fetch medicine image from PharmEasy
async function fetchPharmEasy(medicineName) {
  try {
    const searchUrl = `https://pharmeasy.in/search/all?name=${encodeURIComponent(
      medicineName
    )}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 5000, // 5s timeout
    });

    const $ = cheerio.load(data);
    
    // Select the first product image
    let imageUrl = "";
    
    // Try to find the first product card image
    const firstImage = $("div[class*='ProductCard_medicineUnitContainer'] img").first();
    if (firstImage.length) {
        imageUrl = firstImage.attr("src");
    } else {
        // Fallback
        const genericImage = $("a[href*='/online-medicine-order/'] img").first();
        if (genericImage.length) {
            imageUrl = genericImage.attr("src");
        }
    }

    if (imageUrl && imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
    }

    return imageUrl || null;
  } catch (error) {
    // console.error("Error fetching PharmEasy image:", error.message);
    return null;
  }
}

// Function to fetch medicine image from 1mg
async function fetch1mg(medicineName) {
  try {
    const searchUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(
      medicineName
    )}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 5000,
    });

    const $ = cheerio.load(data);
    let imageUrl = "";

    // 1mg usually has style__product-image___... classes
    // We'll look for images inside divs that look like product cards
    const productImg = $("div[class*='style__product-image'] img").first();
    if (productImg.length) {
        imageUrl = productImg.attr("src");
    } else {
         const altImg = $("div[class*='style__product-box'] img").first();
         if (altImg.length) imageUrl = altImg.attr("src");
    }

    if (imageUrl && imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
    }

    return imageUrl || null;
  } catch (error) {
    // console.error("Error fetching 1mg image:", error.message);
    return null;
  }
}

// Function to fetch medicine image from Apollo Pharmacy
async function fetchApollo(medicineName) {
  try {
    const searchUrl = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(
      medicineName
    )}`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 5000,
    });

    const $ = cheerio.load(data);
    let imageUrl = "";

    // Apollo usually has ProductCard_productImg__...
    const productImg = $("div[class*='ProductCard_productImg'] img").first();
    if (productImg.length) {
        imageUrl = productImg.attr("src");
    } else {
        // Fallback generic search for product images
        const genericImg = $("a[href*='/otc/'] img, a[href*='/medicine/'] img").first();
        if (genericImg.length) imageUrl = genericImg.attr("src");
    }

    if (imageUrl && imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
    }

    return imageUrl || null;
  } catch (error) {
    // console.error("Error fetching Apollo image:", error.message);
    return null;
  }
}

async function fetchMedicineImages(medicineName) {
    // Run all scrapers in parallel
    const results = await Promise.allSettled([
        fetchPharmEasy(medicineName),
        fetch1mg(medicineName),
        fetchApollo(medicineName)
    ]);

    // Filter out failed requests and null results
    const images = results
        .filter(r => r.status === "fulfilled" && r.value)
        .map(r => r.value);

    // Remove duplicates
    return [...new Set(images)];
}

router.post("/medicine-insights", auth, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI not configured (missing GEMINI_API_KEY)",
      });
    }

    let { medicineId, name, genericName, dosage, form, forceRefresh } = req.body;

    if (medicineId) {
      const med = await Medicine.findById(medicineId);
      if (!med) {
        return res.status(404).json({ success: false, message: "Medicine not found" });
      }
      name = med.name || name;
      genericName = med.genericName || genericName;
      dosage = med.dosage || dosage;
      form = med.form || form;
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Medicine name is required",
      });
    }

    // 1. Check if we have cached insights in the database (unless forceRefresh is true)
    if (medicineId && !forceRefresh) {
      try {
        const medicine = await Medicine.findById(medicineId);
        if (medicine && medicine.aiInsights) {
          console.log("Returning cached AI insights from DB");
          return res.json({
            success: true,
            insights: medicine.aiInsights,
            cached: true,
          });
        }
      } catch (dbError) {
        console.error("Error checking DB cache:", dbError);
        // Continue to generate if DB check fails
      }
    }

    // Run AI generation and Image fetching in parallel
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: `
You are MediTrack AI, a helpful and knowledgeable health & medicine assistant.

You will receive information about a medicine (brand name, generic name, dosage, form) and must respond ONLY with STRICTLY VALID JSON.

**CRITICAL INSTRUCTION: SIMULATE A WEB SEARCH**
- You MUST simulate a comprehensive web search to find details about this medicine from reliable medical sources (like Apollo Pharmacy, 1mg, WebMD, etc.).
- Do NOT return "Information not available" or empty strings.
- If specific details are not found for the *exact* brand, use the *Generic Name* to provide general medical information.
- You must fill ALL fields with helpful information.

**JSON STRUCTURE:**
{
  "brand_name": "string",
  "generic_name": "string",
  "drug_class": "string",
  "primary_uses": "string",
  "how_to_take_general": "string",
  "usual_dose_range_general": "string",
  "common_side_effects": "string",
  "serious_side_effects": "string",
  "when_to_avoid_or_be_careful": "string",
  "ingredient_summary": "string",
  "food_and_alcohol_precautions": "string",
  "special_population_precautions": "string",
  "disclaimer": "string",
  "image_prompt": "string"
}

**FIELD GUIDELINES:**
- **primary_uses**: comprehensive list of conditions it treats.
- **how_to_take_general**: general advice (e.g., "with food", "empty stomach").
- **usual_dose_range_general**: typical adult dosage ranges (e.g., "Usually 40mg once daily").
- **common_side_effects**: list common ones (e.g., Nausea, Headache).
- **when_to_avoid_or_be_careful**: contraindications (e.g., "Liver disease", "Pregnancy").
- **disclaimer**: MUST be exactly: "Information may be incomplete. Please contact your doctor or some medicine guidance for better understanding."
- **image_prompt**: Describe the medicine pack/pills for an illustration.

**RULES:**
- Do NOT give personal medical advice.
- Output ONLY valid JSON.
`,
    });

    const prompt = `
Medicine info:
- Brand name: ${name}
- Generic name: ${genericName || "Unknown"}
- Dosage: ${dosage || "Unknown"}
- Form: ${form || "Unknown"}

Return the JSON now.
    `.trim();

    const [aiResult, images] = await Promise.all([
        model.generateContent(prompt),
        fetchMedicineImages(name)
    ]);

    const response = await aiResult.response;
    const text = response.text().trim();

    // Clean up the text to remove markdown code blocks if present
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI JSON, raw text:", text);
      return res.status(500).json({
        success: false,
        message: "AI returned invalid format",
      });
    }

    // Inject the fetched images into the response
    parsed.images = images || [];
    // Keep image_url for backward compatibility (use the first one)
    if (images.length > 0) {
        parsed.image_url = images[0];
    }

    // 2. Save to Database if medicineId is provided
    if (medicineId) {
      try {
        await Medicine.findByIdAndUpdate(medicineId, {
          aiInsights: parsed
        });
        console.log("Saved AI insights to DB");
      } catch (saveError) {
        console.error("Error saving insights to DB:", saveError);
      }
    }

    res.json({
      success: true,
      insights: parsed,
    });
  } catch (error) {
    console.error("Error in /api/ai/medicine-insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine insights",
    });
  }
});

module.exports = router;
