import mongoose from "mongoose";
import Profile from "../../model/profileSchema";
import User from "../../model/userSchema";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

try {
  await mongoose.connect(`${process.env.MONGODB_URI}`);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Error connecting to MongoDB:", error.message);
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();
    const isProfileExist = await Profile.findOne({ email: session.user.email });
    const profileData = {
      name: data.name,
      email: data.email,
      goal: data.goal,
      howMuchWeight: data.howMuchWeight,
      inHowManyDays: data.inHowManyDays,
      foodType: data.foodType,
      meat: data.meat,
      meatPreferenceDays: data.meatPreferenceDays,
      dob: data.dob,
      gender: data.gender,
      kitchen: data.kitchen,
      city: data.city,
      state: data.state,
      country: data.country,
      weight: data.weight,
      height: data.height,
      allergies: data.allergies,
      jobType: data.jobType,
    };
    if (data.email !== session.user.email || data.name !== session.user.name) {
      await User.findOneAndUpdate(
        { email: session.user.email },
        { email: data.email, name: data.name },
      );
    }
    if (isProfileExist) {
      await Profile.findOneAndUpdate(
        { email: session.user.email },
        profileData,
        { new: true },
      );
      return NextResponse.json({ message: "Profile updated successfully" });
    } else {
      await new Profile(profileData).save();
      return NextResponse.json({ message: "Profile updated successfully" });
    }
  } catch (error) {
    console.log("Error updating profile:", error.message);
    return NextResponse.json(
      {
        message: `Error updating profile: ${error.message}`,
      },
      { status: 500 },
    );
  }
}
