import mongoose from "mongoose";
import { NextResponse } from "next/server";
import MealLog from "@/models/MealLog";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB in meal-log/month");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
    }
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year = searchParams.get("year"); 
    const month = searchParams.get("month"); // 1-12

    if (!userId || !year || !month) {
      return NextResponse.json({ error: "Missing required query params" }, { status: 400 });
    }

    // Pad month to 2 digits
    const monthPadded = month.toString().padStart(2, '0');
    const regex = new RegExp(`^${year}-${monthPadded}-`);

    const logs = await MealLog.find({
      userId,
      date: { $regex: regex }
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("Error in GET meal-log/month:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
