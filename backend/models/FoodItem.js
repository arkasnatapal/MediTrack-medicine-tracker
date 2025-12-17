const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true }, // e.g., "Spinach Dal"
    mealType: { type: String, enum: ["breakfast","lunch","dinner","snack","other"], default: "other" },
    time: { type: String, default: "" }, // "08:30", "Evening", or ISO time string as needed
    days: { type: [String], default: [] }, // ["Mon","Tue"] or ["Everyday"]
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] }, // e.g., ["low-carb","protein"]
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", FoodItemSchema);
