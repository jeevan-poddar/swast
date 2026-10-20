import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── GET: fetch latest diet plan for a user ───────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || userId === "undefined") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: plan, error } = await supabaseAdmin
      .from("diet_plans")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[diet-plan GET] Supabase error:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ error: "No diet plan found" }, { status: 404 });
    }

    return NextResponse.json({
      id:         plan.id,
      userId:     plan.user_id,
      weeklyPlan: plan.weekly_plan,
      budget:     plan.budget,
      createdAt:  plan.created_at,
      updatedAt:  plan.updated_at,
    }, { status: 200 });
  } catch (error) {
    console.error("[diet-plan GET] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST: create or update diet plan ────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, weeklyPlan, budget } = body;

    if (!userId || !weeklyPlan) {
      return NextResponse.json(
        { error: "Missing required fields: userId or weeklyPlan" },
        { status: 400 }
      );
    }

    const { data: plan, error } = await supabaseAdmin
      .from("diet_plans")
      .upsert(
        { user_id: userId, weekly_plan: weeklyPlan, budget: budget ?? null },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[diet-plan POST] Supabase error:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("[diet-plan POST] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
