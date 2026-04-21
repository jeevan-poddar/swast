import mongoose from "mongoose";
import { NextResponse } from "next/server";
import DietPlan from "@/models/DietPlan";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB in diet-plan api");
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

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!dietPlan) {
      return NextResponse.json({ error: "No diet plan found" }, { status: 404 });
    }

    return NextResponse.json(dietPlan, { status: 200 });
  } catch (error) {
    console.error("Error in GET diet-plan:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, weeklyPlan, budget } = body;

    if (!userId || !weeklyPlan) {
      return NextResponse.json({ error: "Missing required fields: userId or weeklyPlan" }, { status: 400 });
    }

    let dietPlan = await DietPlan.findOne({ userId });

    if (dietPlan) {
      dietPlan.weeklyPlan = weeklyPlan;
      if (budget !== undefined) dietPlan.budget = budget;
      dietPlan.updatedAt = Date.now();
      await dietPlan.save();
    } else {
      dietPlan = await DietPlan.create({ userId, weeklyPlan, budget });
    }

    return NextResponse.json(dietPlan, { status: 200 });
  } catch (error) {
    console.error("Error in POST diet-plan:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
