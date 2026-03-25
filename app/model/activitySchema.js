import mongoose, { Schema } from "mongoose";
import { use } from "react";

const activitySchema = new mongoose.Schema({
  user_id: String,
  activityName: String,
  duration: Number,
  startTime: String,
  days: [String],
});

let activity;
try {
  activity = mongoose.model("Activity", activitySchema, "Activity");
} catch (error) {
  activity = mongoose.model("Activity");
}

export default activity;
