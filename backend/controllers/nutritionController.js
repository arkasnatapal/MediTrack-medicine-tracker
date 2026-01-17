const WeeklyNutrition = require("../models/WeeklyNutrition");
const FoodItem = require("../models/FoodItem");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeWeeklyNutrition = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Rate Limit Check (24 hours)
    const lastReport = await WeeklyNutrition.findOne({ user: userId }).sort({ generatedAt: -1 });
    if (lastReport) {
      const hoursDiff = (Date.now() - new Date(lastReport.generatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return res.status(429).json({
          success: false,
          message: `Next analysis available in ${(24 - hoursDiff).toFixed(1)} hours.`,
          nextAvailable: new Date(new Date(lastReport.generatedAt).getTime() + 24 * 60 * 60 * 1000)
        });
      }
    }

    // 2. Gather Data
    // User Profile for context
    const user = await User.findById(userId).select("name healthState healthScore diseases allergies");
    
    // Medicines (Integration check)
    const medicines = await Medicine.find({ user: userId, quantity: { $gt: 0 } }).select("name type dosage");

    // Food Items (The Routine)
    // We assume the 'FoodItem' collection represents the user's *current plan*.
    // We need to calculate an estimated "Weekly Intake" based on the `days` array in each item.
    const foodItems = await FoodItem.find({ user: userId });

    if (foodItems.length === 0) {
      return res.status(400).json({ success: false, message: "No food routine found to analyze." });
    }

    // 3. Construct AI Prompt
    const prompt = `
      Act as a Lead Clinical Nutritionist and Data Scientist.
      Analyze the following weekly food routine for a patient.

      PATIENT PROFILE:
      - Name: ${user.name}
      - Health Condition/Diseases: ${user.diseases || "None specified"} (Current State: ${user.healthState})
      - Allergies: ${user.allergies || "None"}
      - Current Medicines: ${medicines.map(m => m.name).join(", ")}

      WEEKLY FOOD ROUTINE (Items and days consumed):
      ${foodItems.map(f => `- ${f.name} (${f.mealType}): Consumed on ${f.days.join(", ")}`).join("\n")}

      TASK:
      1. Calculate/Estimate the TOTAL WEEKLY intake of macronutrients based on these dishes and their typical portion sizes.
      2. Analyze how this specific diet impacts the patient's existing conditions (${user.diseases}).
      3. Identify which specific foods in this list are helping recover from their condition ("Food as Medicine").
      4. Provide a textual summary of their week.

      OUTPUT FORMAT:
      Return strictly a JSON object with this structure (no markdown formatting):
      {
        "summary": "Detailed paragraph summarizing their nutritional week...",
        "macroBreakdown": {
           "calories": 15000, 
           "protein": 500,
           "carbs": 1200,
           "fats": 400,
           "fiber": 150,
           "sugar": 200
        },
        "diseaseAnalysis": {
           "condition": "${user.diseases || 'General Health'}",
           "impactScore": 8, // 1-10 (10 is perfect for recovery)
           "explanation": "Explanation of why this score was given...",
           "beneficialFoods": ["Spinach", "Salmon"],
           "avoidFoods": ["Soda"]
        },
        "visualData": [
           { "name": "Protein", "value": 500, "fill": "#8884d8" },
           { "name": "Carbs", "value": 1200, "fill": "#82ca9d" },
           { "name": "Fats", "value": 400, "fill": "#ffc658" },
           { "name": "Fiber", "value": 150, "fill": "#ff8042" }
        ]
      }
    `;

    // 4. Call AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Cleanup JSON string
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    // 5. Save Report
    const report = await WeeklyNutrition.create({
      user: userId,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate: new Date(),
      ...data
    });

    res.status(200).json({ success: true, data: report });

  } catch (error) {
    console.error("Weekly Analysis Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate nutritional analysis." });
  }
};

exports.getNutritionHistory = async (req, res) => {
  try {
    const history = await WeeklyNutrition.find({ user: req.user._id })
      .sort({ generatedAt: -1 })
      .select("generatedAt summary diseaseAnalysis.impactScore");
    
    // Check if user can generate a new one today
    let canGenerate = true;
    let nextAvailable = null;
    
    if (history.length > 0) {
      const last = history[0]; // Sort is -1
      const hoursDiff = (Date.now() - new Date(last.generatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        canGenerate = false;
        nextAvailable = new Date(new Date(last.generatedAt).getTime() + 24 * 60 * 60 * 1000);
      }
    }

    res.status(200).json({ 
      success: true, 
      history, 
      canGenerate,
      nextAvailable
    });

  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({ success: false, message: "Could not fetch history." });
  }
};

exports.getLatestReport = async (req, res) => {
    try {
        const report = await WeeklyNutrition.findOne({ user: req.user._id }).sort({ generatedAt: -1 });
        if (!report) return res.json({ success: true, data: null });
        
        res.json({ success: true, data: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching report" });
    }
}
