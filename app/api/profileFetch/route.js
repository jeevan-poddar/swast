import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let userId = session.user?._id;

    // Fallback: recover userId by email if token._id wasn't set yet
    if (!userId || userId === "undefined") {
      if (session.user?.email) {
        const { data: userRow } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .maybeSingle();
        userId = userRow?.id;
      }
    }

    if (!userId || userId === "undefined") {
      return NextResponse.json(
        { message: "Profile does not exist" },
        { status: 404 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[profileFetch] Supabase error:", error.message);
      return NextResponse.json(
        { message: `Error fetching profile: ${error.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { message: "Profile does not exist" },
        { status: 404 }
      );
    }

    // Map snake_case DB columns back to camelCase for client compatibility
    return NextResponse.json({
      message: "Profile fetched successfully",
      profile: {
        _id:                profile.id,
        name:               profile.name,
        email:              profile.email,
        goal:               profile.goal,
        howMuchWeight:      profile.how_much_weight,
        inHowManyDays:      profile.in_how_many_days,
        foodType:           profile.food_type,
        meat:               profile.meat,
        meatPreferenceDays: profile.meat_preference_days,
        dob:                profile.dob,
        gender:             profile.gender,
        kitchen:            profile.kitchen,
        city:               profile.city,
        state:              profile.state,
        country:            profile.country,
        weight:             profile.weight,
        height:             profile.height,
        allergies:          profile.allergies,
        jobType:            profile.job_type,
      },
    });
  } catch (error) {
    console.error("[profileFetch] Error:", error.message);
    return NextResponse.json(
      { message: `Error fetching profile: ${error.message}` },
      { status: 500 }
    );
  }
}
