const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../../../models/User");
const Medicine = require("../../../models/Medicine");

// Use Intelligent Key or Fallback
const genAI = process.env.GEMINI_API_INTELLIGENT_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_INTELLIGENT_KEY)
  : (process.env.GEMINI_API_CHAT_KEY 
      ? new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY) 
      : null);

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Generates a food recommendation based on ingredients, health, and medicines.
 * @param {string} userId - The user's ID
 * @param {Object} inputData - { ingredients: ["..."], wakeUpTime: "07:00", sleepTime: "22:00", goal: "immediate" | "weekly" }
 */
const recommendFood = async (userId, inputData) => {
  if (!genAI) {
    throw new Error("AI not configured");
  }

  // 1. Fetch Context
  const [user, medicines] = await Promise.all([
    User.findById(userId).select('name healthState healthScore bloodGroup age gender familyMedicalHistory settings'),
    Medicine.find({ userId, quantity: { $gt: 0 } }).select('name form dosage category')
  ]);

  if (!user) throw new Error("User not found");

  // 2. Construct Prompt Context
  const medList = medicines.map(m => `${m.name} (${m.dosage || 'N/A'})`).join(", ");
  const healthContext = {
    state: user.healthState,
    score: user.healthScore,
    details: `Age: ${user.age || 'N/A'}, Blood: ${user.bloodGroup || 'N/A'}, Gender: ${user.gender || 'N/A'}`,
    conditions: user.familyMedicalHistory.join(", ")
  };

  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert Indian Nutritionist and Chef AI.
    
    USER CONTEXT:
    - Name: ${user.name}
    - Health: ${healthContext.state} (Score: ${healthContext.score})
    - Info: ${healthContext.details}
    - Known Conditions/History: ${healthContext.conditions}
    - Active Medicines: ${medList || "None"}
    - Schedule: Wakes up at ${inputData.wakeUpTime || "07:00"}, Sleeps at ${inputData.sleepTime || "22:00"}
    
    AVAILABLE INGREDIENTS:
    ${inputData.ingredients.join(", ")}
    
    GOAL: ${inputData.goal === 'weekly' ? "Generate a 7-day Recovery Meal Plan" : "Recommend ONE perfect meal to cook NOW"}
    
    INSTRUCTIONS:
    1. Analyze the ingredients and user's health.
    2. Check for Food-Drug interactions with the active medicines.
    3. If GOAL is 'weekly':
       - Create a 7-day plan (Breakfast, Lunch, Dinner).
       - Ensure 4 days Non-Veg and 3 days Veg if acceptable (unless user is strictly veg, infer from ingredients or default to balanced).
       - Focus on Indian cuisine using available ingredients + common pantry staples.
    4. If GOAL is 'immediate':
       - Suggest the best Indian dish possible now.
       - Provide step-by-step recipe.
       - Explain WHY this is good for their current health/meds.
       
    OUTPUT JSON FORMAT (Strictly observe this structure):
    
    For IMMEDIATE meal:
    {
      "type": "immediate",
      "dishName": "Name of the dish",
      "description": "Short appetizing description",
      "bestTime": "Best time to eat (e.g., 'Lunch' or '1:00 PM')",
      "reasoning": "Why this matches their health/meds",
      "nutrition": { "calories": 300, "protein": "10g", "carbs": "40g", "fats": "5g" },
      "ingredientsUsed": ["ingredient1", "ingredient2"],
      "missingIngredients": ["optional spice 1"],
      "recipe": [
        "Step 1: ...",
        "Step 2: ..."
      ],
      "imagePrompt": "A high-quality realistic photo of [Dish Name], indian cuisine, professional food photography, 4k"
    }

    For WEEKLY plan:
    {
      "type": "weekly",
      "overview": "Summary of the 7-day strategy",
      "schedule": [
        { "day": "Monday", "breakfast": "...", "lunch": "...", "dinner": "...", "type": "Veg/Non-Veg" }
        // ... 7 days
      ],
      "healthFocus": "What this plan aims to improve"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    // Add image generation URL for immediate meals
    if (response.type === 'immediate' && response.imagePrompt) {
        const encoded = encodeURIComponent(response.imagePrompt);
        response.imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&seed=${Math.floor(Math.random() * 1000)}`;
    }

    return response;
  } catch (error) {
    console.error("Food Intelligence Error:", error);
    throw new Error("Failed to generate recommendation");
  }
};


/**
 * Analyzes a specific dish for health impact, nutrition, and recipe.
 * @param {string} dishName - Name of the food.
 * @param {object} user - User profile (health, age, etc.).
 * @param {Array} medicines - User's active medicines.
 * @returns {Promise<object>} - Structured insight data.
 */
async function analyzeDish(dishName, user, medicines) {
  if (!genAI) throw new Error("Generative AI not properly configured.");

  const medicineNames = medicines && medicines.length > 0 
    ? medicines.map(m => `${m.name} (${m.category || 'general'})`).join(", ") 
    : "None";

  const prompt = `
    You are an expert Clinical Nutritionist and Indian Chef.
    
    Analyze the dish "${dishName}" for a user with the following profile:
    - Health State: ${user.healthState} (Score: ${user.healthScore})
    - Conditions: ${user.familyMedicalHistory?.join(", ") || "None"}
    - Blood Group: ${user.bloodGroup || "Unknown"}
    - Age/Gender: ${user.age || "?"}/${user.gender || "?"}
    - Current Medicines: ${medicineNames}

    Provide a detailed JSON response with:
    1. "calories": Approximate calories per serving (e.g., "350 kcal").
    2. "nutrients": Key nutrients map (Protein, Carbs, Fats, Fiber, etc. with units).
    3. "healthScore": A score from 1-10 (10 being perfectly healthy for THIS user).
    4. "healthImpact": A helpful, empathetic paragraph explaining EXACTLY how this food interacts with their specific health conditions and medicines. Be specific (e.g., "Good for your diabetes", "Avoid with Warfarin").
    5. "recipe": An array of strings representing clear, simple cooking steps for an Indian home.
    6. "tags": Array of 3-4 descriptive tags (e.g., "High Protein", "Diabetic Friendly", "Spicy").
    7. "imagePrompt": A highly descriptive string to generate a photorealistic, delicious image of this dish.

    Output STRICT JSON.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const data = JSON.parse(text);

    // Generate accurate image using Pollinations - DISABLED
    // const safePrompt = encodeURIComponent(data.imagePrompt || `${dishName} indian food professional photography 4k`);
    // data.imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?nologo=true&private=true&enhance=true`;
    data.imageUrl = null; // No image needed

    return data;
  } catch (error) {
    console.error("Food Insight General Error:", error);
    throw new Error("Failed to analyze food.");
  }
}

module.exports = {
  recommendFood,
  analyzeDish
};
