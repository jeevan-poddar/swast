import mongoose from "mongoose";
import { NextResponse } from "next/server";
import MealLog from "@/models/MealLog";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB in meal-log");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
    }
  }
}

export async function GET(req) {
  try {
    console.log("[GET meal-log] Starting request");
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date"); // YYYY-MM-DD
    
    console.log(`[GET meal-log] Params - userId: ${userId}, date: ${date}`);

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing userId or date" }, { status: 400 });
    }

    console.log("[GET meal-log] Attempting to find meal log");
    let mealLog = await MealLog.findOne({ userId, date });
    console.log("[GET meal-log] Find result:", mealLog ? "Found existing config" : "Not Found - Creating Default");

    if (!mealLog) {
      // Return a default structure without saving it to DB yet
      return NextResponse.json({
        userId,
        date,
        mealsList: ["breakfast", "lunch", "dinner"],
        breakfast: { status: "not_reported", items: [], totalNutrients: {} },
        lunch: { status: "not_reported", items: [], totalNutrients: {} },
        dinner: { status: "not_reported", items: [], totalNutrients: {} }
      }, { status: 200 });
    }

    // Ensure mealsList is always present for old data
    if (!mealLog.mealsList || mealLog.mealsList.length === 0) {
      mealLog = mealLog.toObject();
      mealLog.mealsList = ["breakfast", "lunch", "dinner"];
    }

    return NextResponse.json(mealLog, { status: 200 });
  } catch (error) {
    console.error("Error in GET meal-log:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    console.log("[POST meal-log] Starting request");
    await connectToDatabase();
    const body = await req.json();
    console.log("[POST meal-log] Request body:", body);
    const { userId, date, mealType, status, items, totalNutrients } = body;

    if (!userId || !date || !mealType || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const update = {
      $set: {
        [`${mealType}.status`]: status,
      },
      $addToSet: {
        mealsList: mealType
      }
    };
    if (items) update.$set[`${mealType}.items`] = items;
    if (totalNutrients) update.$set[`${mealType}.totalNutrients`] = totalNutrients;

    console.log("[POST meal-log] Update payload:", JSON.stringify(update));

    let mealLog = await MealLog.findOne({ userId, date });
    if (!mealLog) {
      console.log("[POST meal-log] Creating new default doc before update");
      await MealLog.create({ userId, date });
    }

    mealLog = await MealLog.findOneAndUpdate(
      { userId, date },
      update,
      { new: true }
    );
    console.log("[POST meal-log] Successfully updated DB");

    return NextResponse.json(mealLog, { status: 200 });
  } catch (error) {
    console.error("Error in POST meal-log:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    console.log("[DELETE meal-log] Starting request");
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const mealType = searchParams.get("mealType");
    console.log(`[DELETE meal-log] Params - userId: ${userId}, date: ${date}, mealType: ${mealType}`);

    if (!userId || !date || !mealType) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const update = {
      $pull: { mealsList: mealType },
      $unset: { [`${mealType}`]: "" }
    };

    console.log("[DELETE meal-log] Update payload:", update);

    const mealLog = await MealLog.findOneAndUpdate(
      { userId, date },
      update,
      { new: true }
    );
    console.log("[DELETE meal-log] Successfully deleted meal type from DB");

    return NextResponse.json(mealLog, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE meal-log:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
