import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const { user_id } = await req.json();

    if (!user_id || user_id === "undefined") {
      return NextResponse.json({ activities: [] }, { status: 200 });
    }

    const { data: activities, error } = await supabaseAdmin
      .from("activities")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[activityFetch] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Map snake_case to camelCase for client compatibility
    const mapped = (activities ?? []).map((a) => ({
      _id:          a.id,
      user_id:      a.user_id,
      activityName: a.activity_name,
      duration:     a.duration,
      startTime:    a.start_time,
      days:         a.days,
    }));

    return NextResponse.json({ activities: mapped }, { status: 200 });
  } catch (error) {
    console.error("[activityFetch] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
