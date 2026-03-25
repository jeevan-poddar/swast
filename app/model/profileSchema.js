import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  goal: {
    type: String,
  },
  howMuchWeight: {
    type: Number,
  },
  inHowManyDays: {
    type: Number,
  },
  foodType: {
    type: String,
  },
  meat: {
    type: [String],
  },
  meatPreferenceDays: {
    type: [String],
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
  },
  kitchen: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  weight: {
    type: Number,
  },
  height: {
    type: Number,
  },
  allergies: {
    type: String,
  },
  jobType: {
    type: String,
  },
});

let Profile;
try {
  Profile = mongoose.model("Profile", profileSchema, "Profile");
} catch (error) {
  Profile = mongoose.model("Profile");
}

export default Profile;
