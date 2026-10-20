import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeMealLog } from "@/lib/meal-log";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year   = searchParams.get("year");
    const month  = searchParams.get("month"); // 1-12

    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?._id;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userId && userId !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);
    if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return NextResponse.json(
        { error: "A valid year and month are required" },
        { status: 400 }
      );
    }

    const monthPadded  = String(monthNumber).padStart(2, "0");
    const startDate    = `${year}-${monthPadded}-01`;
    // Last day of month
    const lastDay      = new Date(yearNumber, monthNumber, 0).getDate();
    const endDate      = `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}`;

    const { data: logs, error } = await supabaseAdmin
      .from("meal_logs")
      .select("*")
      .eq("user_id", sessionUserId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[meal-log/month GET] Supabase error:", error.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const normalized = (logs ?? []).map(normalizeMealLog);

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("[meal-log/month GET] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
