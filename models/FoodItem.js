import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, lowercase: true },
  baseAmount: { type: Number, required: true },
  unitType: { type: String, required: true, enum: ['g', 'ml', 'piece'] },
  price_per_100g: { type: Number, required: true },
  isBudgetExempt: { type: Boolean, default: false },
  
  // 13 Nutrients
  kcal: { type: Number, required: true, default: 0 },
  protein: { type: Number, required: true, default: 0 },
  carbs: { type: Number, required: true, default: 0 },
  fats: { type: Number, required: true, default: 0 },
  fiber: { type: Number, required: true, default: 0 },
  water: { type: Number, required: true, default: 0 },
  sodium: { type: Number, required: true, default: 0 },
  potassium: { type: Number, required: true, default: 0 },
  magnesium: { type: Number, required: true, default: 0 },
  iron: { type: Number, required: true, default: 0 },
  calcium: { type: Number, required: true, default: 0 },
  vitD: { type: Number, required: true, default: 0 },
  vitB12: { type: Number, required: true, default: 0 },
  omega3: { type: Number, required: true, default: 0 },
  vitE: { type: Number, required: true, default: 0 },
});

export default mongoose.models.FoodItem || mongoose.model("FoodItem", foodItemSchema);
