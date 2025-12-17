const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const FoodItem = require("../models/FoodItem");

/**
 * GET /api/food
 * - list user's food items
 * - optional query: day=Mon, mealType=breakfast
 */
router.get("/", auth, async (req, res) => {
  try {
    const query = { user: req.user.id };
    if (req.query.mealType) query.mealType = req.query.mealType;
    if (req.query.day) query.days = req.query.day;
    const items = await FoodItem.find(query).sort({ time: 1, createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    console.error("Error fetching food items:", err);
    res.status(500).json({ success: false, message: "Failed to fetch food items" });
  }
});

/**
 * POST /api/food
 * - create item
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, mealType, time, days, notes, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const item = await FoodItem.create({
      user: req.user.id,
      name: name.trim(),
      mealType: mealType || "other",
      time: time || "",
      days: Array.isArray(days) ? days : [],
      notes: notes || "",
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json({ success: true, item });
  } catch (err) {
    console.error("Error creating food item:", err);
    res.status(500).json({ success: false, message: "Failed to create food item" });
  }
});

/**
 * PUT /api/food/:id
 * - update item (owner only)
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const item = await FoodItem.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    const fields = ["name","mealType","time","days","notes","tags"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    item.updatedAt = new Date();
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    console.error("Error updating food item:", err);
    res.status(500).json({ success: false, message: "Failed to update food item" });
  }
});

/**
 * DELETE /api/food/:id
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await FoodItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting food item:", err);
    res.status(500).json({ success: false, message: "Failed to delete food item" });
  }
});

module.exports = router;
