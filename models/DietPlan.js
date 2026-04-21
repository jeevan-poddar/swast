import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  weeklyPlan: { type: Object, required: true },
  budget: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

// Avoid schema caching issues in Next.js dev mode
if (mongoose.models.DietPlan) {
  delete mongoose.models.DietPlan;
}

export default mongoose.model("DietPlan", dietPlanSchema);
