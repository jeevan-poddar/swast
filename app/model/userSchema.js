import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

let User;

try {
  User = mongoose.model("User", userSchema, "User");
} catch (error) {
  User = mongoose.model("User");
}

export default User;
