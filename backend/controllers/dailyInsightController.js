const DailyInsight = require('../models/DailyInsight');
const IntelligenceSnapshot = require('../models/IntelligenceSnapshot');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const genAI = process.env.GEMINI_API_INTELLIGENT_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_INTELLIGENT_KEY)
  : null;

const CATEGORIES = ['nutrition', 'exercise', 'medicine', 'mental_health', 'sleep'];
const GRADIENTS = [
  'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)'
];

exports.getDailyInsight = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Check if exists for today
    let insight = await DailyInsight.findOne({ userId, date: today });
    if (insight) {
      return res.json({ success: true, insight });
    }

    console.log(`[DailyInsight] No insight found for today. Generating...`);

    // 2. Fetch context for AI
    const snapshot = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 });
    
    // 3. Generate via AI (or fallback if no key)
    let aiContent = {
      title: "Start your day with hydration",
      content: "Drinking a glass of water first thing in the morning helps jumpstart your metabolism and flush out toxins.",
      category: "nutrition"
    };

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
        const userHealthContext = snapshot ? snapshot.summary : "New user starting their journey.";
        const prompt = `
          You are an expert AI doctor. Generate a highly personalized daily health insight for a patient.
          Patient Context & Current Health Conditions: ${userHealthContext}
          
          Analyze the patient's specific health conditions and create a tip to help CURE or IMPROVE their specific problems.
          
          OUTPUT JSON:
          {
            "title": "Short catchy title (max 5 words)",
            "content": "One practical, actionable health tip tailored to improve their specific condition (max 2 sentences).",
            "category": "nutrition" | "exercise" | "medicine" | "mental_health" | "sleep",
            "imagePrompt": "A detailed artistic prompt for an AI image generator. Describe a high-quality, professional, 8k, cinematic health-related scene (e.g., 'A crystal clear glass of water on a wooden table with soft morning sunlight, macro photography, health vibe')",
            "reasoning": "Explain exactly WHY this specific action helps cure or improve the patient's specific health problem (1-2 sentences)."
          }
        `;
        const result = await model.generateContent(prompt);
        aiContent = JSON.parse(result.response.text());
      } catch (err) {
        console.error("Gemini Insight Generation Failed:", err);
      }
    }

    // 4. Finalize styling
    const categoryIndex = CATEGORIES.indexOf(aiContent.category) !== -1 ? CATEGORIES.indexOf(aiContent.category) : 0;
    const gradient = GRADIENTS[categoryIndex % GRADIENTS.length];
    
    // True AI Generated Image via Pollinations.ai
    const imagePrompt = aiContent.imagePrompt || `Professional health photography of ${aiContent.category}`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=800&nologo=true&seed=${userId.toString().slice(-5)}${today.replace(/-/g, '')}`;
    
    // 5. Download and store the image locally
    const fileName = `daily_${userId}_${today}.jpg`;
    const insightsDir = path.join(__dirname, '../../frontend/public/assets/insights');
    if (!fs.existsSync(insightsDir)) {
      fs.mkdirSync(insightsDir, { recursive: true });
    }
    const imagePath = path.join(insightsDir, fileName);
    
    let localImageUrl = `/assets/insights/${fileName}`;
    
    try {
      console.log(`[DailyInsight] Downloading AI image...`);
      const imageResponse = await axios({
        url: pollinationsUrl,
        responseType: 'stream',
      });
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) resolve(true);
        });
      });
      console.log(`[DailyInsight] Image successfully saved locally.`);
    } catch (downloadErr) {
      console.error("[DailyInsight] Failed to download image, using remote URL fallback.");
      localImageUrl = pollinationsUrl;
    }

    // 6. Save and return
    insight = await DailyInsight.create({
      userId,
      date: today,
      title: aiContent.title,
      content: aiContent.content,
      imageUrl: localImageUrl,
      gradient,
      category: aiContent.category,
      reasoning: aiContent.reasoning || "This personalized tip helps balance your daily health metrics for long-term vitality."
    });

    res.json({ success: true, insight });
  } catch (error) {
    console.error("Error in getDailyInsight:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
