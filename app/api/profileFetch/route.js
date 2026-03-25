import mongoose from "mongoose";
import Profile from "../../model/profileSchema";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

try {
  await mongoose.connect(`${process.env.MONGODB_URI}`);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Error connecting to MongoDB:", error.message);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const isProfileExist = await Profile.findOne({
      email: session?.user?.email,
    });
    if (!isProfileExist) {
      return NextResponse.json(
        { message: "Profile does not exist" },
        { status: 404 },
      );
    }
    console.log("Success");
    return NextResponse.json({
      message: "Profile fetched successfully",
      profile: isProfileExist.toObject(),
    });
  } catch (error) {
    console.log("Error fetching profile:", error.message);
    return NextResponse.json(
      {
        message: `Error fetching profile: ${error.message}`,
      },
      { status: 500 },
    );
  }
}
