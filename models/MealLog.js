import mongoose from "mongoose";

const mealLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  mealsList: { type: [String], default: ["breakfast", "lunch", "dinner"] },
  breakfast: {
    status: { type: String, enum: ["not_reported", "eaten", "not_eaten"], default: "not_reported" },
    items: { type: Array, default: [] },
    totalNutrients: { type: Object, default: {} },
  },
  lunch: {
    status: { type: String, enum: ["not_reported", "eaten", "not_eaten"], default: "not_reported" },
    items: { type: Array, default: [] },
    totalNutrients: { type: Object, default: {} },
  },
  dinner: {
    status: { type: String, enum: ["not_reported", "eaten", "not_eaten"], default: "not_reported" },
    items: { type: Array, default: [] },
    totalNutrients: { type: Object, default: {} },
  },
}, { timestamps: true, strict: false });

// Ensure one log per user per day
mealLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Avoid schema caching issues in Next.js dev mode
if (mongoose.models.MealLog) {
  delete mongoose.models.MealLog;
}

export default mongoose.model("MealLog", mealLogSchema);
