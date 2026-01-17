const FoodKnowledge = require('../models/FoodKnowledge');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const { analyzeDish } = require('../src/living-os/intelligence/foodIntelligence');

exports.getFoodInsight = async (req, res) => {
  try {
    const dishNameRaw = req.params.name;
    if (!dishNameRaw) {
      return res.status(400).json({ success: false, message: "Dish name is required" });
    }

    // Normalize for cache key
    const dishName = dishNameRaw.trim().toLowerCase();

    // 1. Check Cache (Database)
    // We check case-insensitive exact match
    let knowledge = await FoodKnowledge.findOne({ dishName });

    if (knowledge) {
      // Return cached data
      return res.status(200).json({ success: true, data: knowledge, source: 'cache' });
    }

    // 2. Determine User Context
    // We need the user to get personalized health impact
    const userId = req.user._id;
    const user = await User.findById(userId).select('healthState healthScore bloodGroup age gender familyMedicalHistory');
    const medicines = await Medicine.find({ user: userId, quantity: { $gt: 0 } });

    // 3. Generate with AI
    const analysis = await analyzeDish(dishName, user, medicines);

    // 4. Save to Database (Cache)
    knowledge = await FoodKnowledge.create({
      dishName: dishName, // stored in lowercase for consistency
      calories: analysis.calories,
      nutrients: analysis.nutrients,
      healthScore: analysis.healthScore,
      healthImpact: analysis.healthImpact,
      recipe: analysis.recipe,
      imageUrl: analysis.imageUrl,
      tags: analysis.tags
    });

    res.status(200).json({ success: true, data: knowledge, source: 'ai' });

  } catch (error) {
    console.error("Get Food Insight Error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve food insights." });
  }
};
