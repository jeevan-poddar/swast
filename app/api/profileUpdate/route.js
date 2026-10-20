import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    let userId = session.user?._id;
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
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const profileData = {
      user_id:              userId,
      name:                 data.name,
      email:                data.email,
      goal:                 data.goal,
      how_much_weight:      data.howMuchWeight !== "" && data.howMuchWeight != null ? Number(data.howMuchWeight) : null,
      in_how_many_days:     data.inHowManyDays !== "" && data.inHowManyDays != null ? parseInt(data.inHowManyDays, 10) : null,
      food_type:            data.foodType,
      meat:                 data.meat,
      meat_preference_days: data.meatPreferenceDays,
      dob:                  data.dob || null,
      gender:               data.gender,
      kitchen:              data.kitchen,
      city:                 data.city,
      state:                data.state,
      country:              data.country,
      weight:               data.weight !== "" && data.weight != null ? Number(data.weight) : null,
      height:               data.height !== "" && data.height != null ? Number(data.height) : null,
      allergies:            data.allergies,
      job_type:             data.jobType,
    };

    // Upsert profile (insert or update on user_id conflict)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (profileError) {
      console.error("[profileUpdate] Supabase error:", profileError.message);
      return NextResponse.json(
        { message: `Error updating profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Also update name/email on the users table if changed
    if (
      data.email !== session.user.email ||
      data.name !== session.user.name
    ) {
      await supabaseAdmin
        .from("users")
        .update({ name: data.name, email: data.email })
        .eq("id", userId);
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("[profileUpdate] Error:", error.message);
    return NextResponse.json(
      { message: `Error updating profile: ${error.message}` },
      { status: 500 }
    );
  }
}
