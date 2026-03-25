import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import activity from "@/app/model/activitySchema";

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("Error connecting to MongoDB:", error.message);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const activities = await activity.find({ user_id: session?.user?.id });
    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error("Error fetching activities:", error.message);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
