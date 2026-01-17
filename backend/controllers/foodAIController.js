const foodIntelligence = require('../src/living-os/intelligence/foodIntelligence');

/**
 * POST /api/food/ai-recommend
 * Body: { ingredients: [], wakeUpTime, sleepTime, goal }
 */
exports.generateRecommendation = async (req, res) => {
  try {
    const { ingredients, wakeUpTime, sleepTime, goal } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide at least one ingredient." 
      });
    }

    const inputData = {
      ingredients,
      wakeUpTime: wakeUpTime || "07:00",
      sleepTime: sleepTime || "22:00",
      goal: goal || "immediate" // 'immediate' or 'weekly'
    };

    const recommendation = await foodIntelligence.recommendFood(req.user.id, inputData);

    res.json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    console.error("Food AI Controller Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate recommendation. Please try again." 
    });
  }
};
