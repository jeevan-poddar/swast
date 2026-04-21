import mongoose from "mongoose";
import User from "../../model/userSchema";
import { NextResponse } from "next/server";

try {
  await mongoose.connect(`${process.env.MONGODB_URI}`);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Error connecting to MongoDB:", error.message);
}

export async function POST(req) {
  try {
    const data = await req.json();
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return NextResponse.json({
        message: "Invalid email or password",
        success: false,
        status: 400,
      });
    }
    if (user.password !== data.password) {
      return NextResponse.json({
        message: "Invalid email or password",
        success: false,
        status: 400,
      });
    }
    // console.log("User logged in successfully:", user);
    return NextResponse.json({
      message: "Login successful",
      success: true,
      status: 200,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.log("Error logging in user:", error.message);
    return NextResponse.json({
      message: "Error logging in user",
      success: false,
      status: 500,
    });
  }
}
