const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { analyzeWeeklyNutrition, getNutritionHistory, getLatestReport } = require("../controllers/nutritionController");

router.post("/analyze-weekly", protect, analyzeWeeklyNutrition);
router.get("/history", protect, getNutritionHistory);
router.get("/latest", protect, getLatestReport);

module.exports = router;
