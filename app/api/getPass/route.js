import mongoose from "mongoose";
import User from "@/app/model/userSchema";
import { NextResponse } from "next/server";

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Error connecting to MongoDB:", error.message);
}

export async function POST(req) {
  try {
    
    const { email } = await req.json();
    
    const user = await User.findOne({ email: email });
    return NextResponse.json({ password: user.password }, { status: 200 });
  } catch (error) {
    console.error("Error fetching password:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
