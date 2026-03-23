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
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        {
          message: "User with this email already exists",
          success: false,
          status: 400,
        },
      );
    }
    const user = new User({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    await user.save();
    return NextResponse.json(
      {
        message: "User created successfully",
        success: true,
        status: 201,
      },

    );
  } catch (error) {
    console.log("Error creating user:", error.message);
    return NextResponse.json(
      { message: "Error creating user",
        success: false,
        status: 500
       },
    );
  }
}
