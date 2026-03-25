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

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const data = await req.json();
    if (data.function === "delete") {
      console.log("Deleting activity with ID:", data.index);
      const res = await activity.findByIdAndDelete(data.index);
      if (!res) {
        return NextResponse.json(
          { error: "Failed to delete activity" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { message: "Activity deleted successfully" },
        { status: 200 },
      );
    }

    if (data.function === "edit") {
      console.log("Editing activity with ID:", data.index);
      console.log("Updated data:", {
        activityName: data.activityName,
        duration: data.duration,
        startTime: data.startTime,
        days: data.days,
      });
      const res = await activity.findByIdAndUpdate(data.index, {
        activityName: data.activityName,
        duration: data.duration,
        startTime: data.startTime,
        days: data.days,
      });
      if (!res) {
        return NextResponse.json(
          { error: "Failed to update activity" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { message: "Activity updated successfully" },
        { status: 200 },
      );
    }
    console.log("Adding new activity for user ID:", session?.user?._id);
    const newActivity = new activity({
      user_id: session?.user?._id,
      activityName: data.activityName,
      duration: data.duration,
      startTime: data.startTime,
      days: data.days,
    });
    const res = await newActivity.save();
    if (!res) {
      return NextResponse.json(
        { error: "Failed to add activity" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { message: "Activity added successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding activity:", error.message);
    return NextResponse.json(
      { error: "Failed to add activity" },
      { status: 500 },
    );
  }
}
