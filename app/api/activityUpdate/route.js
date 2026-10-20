import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const data = await req.json();

    // DELETE
    if (data.function === "delete") {
      const { error } = await supabaseAdmin
        .from("activities")
        .delete()
        .eq("id", data.index);

      if (error) {
        return NextResponse.json(
          { error: "Failed to delete activity" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: "Activity deleted successfully" },
        { status: 200 }
      );
    }

    // EDIT
    if (data.function === "edit") {
      const { error } = await supabaseAdmin
        .from("activities")
        .update({
          activity_name: data.activityName,
          duration:      data.duration,
          start_time:    data.startTime,
          days:          data.days,
        })
        .eq("id", data.index);

      if (error) {
        return NextResponse.json(
          { error: "Failed to update activity" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: "Activity updated successfully" },
        { status: 200 }
      );
    }

    // CREATE
    const { error } = await supabaseAdmin.from("activities").insert({
      user_id:       data.userId ?? data._id,   // client may send either field name
      activity_name: data.activityName,
      duration:      data.duration,
      start_time:    data.startTime,
      days:          data.days,
    });

    if (error) {
      console.error("[activityUpdate] Insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to add activity" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Activity added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[activityUpdate] Error:", error.message);
    return NextResponse.json(
      { error: "Failed to add activity" },
      { status: 500 }
    );
  }
}
