import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_MEALS,
  DEFAULT_MEAL_SLOT,
  normalizeMealLog,
  normalizeMealSlot,
} from "@/lib/meal-log";
const VALID_STATUSES = new Set(["not_reported", "eaten", "not_eaten"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MEAL_NAME_PATTERN = /^[a-z0-9][a-z0-9 -]{0,48}$/;

async function requireCurrentUser(requestedUserId) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (requestedUserId && requestedUserId !== userId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { userId };
}

function isValidMealRequest({ date, mealType, status }) {
  return (
    DATE_PATTERN.test(date || "") &&
    MEAL_NAME_PATTERN.test(mealType || "") &&
    VALID_STATUSES.has(status)
  );
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    const auth = await requireCurrentUser(userId);
    if (auth.error) return auth.error;

    if (!DATE_PATTERN.test(date || "")) {
      return NextResponse.json(
        { error: "A valid date is required" },
        { status: 400 },
      );
    }

    const { data: row, error } = await supabaseAdmin
      .from("meal_logs")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      console.error("[meal-log GET] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    if (!row) {
      // Return default structure (not persisted yet)
      return NextResponse.json(
        {
          userId: auth.userId,
          date,
          mealsList: DEFAULT_MEALS,
          breakfast: normalizeMealSlot(),
          lunch: normalizeMealSlot(),
          dinner: normalizeMealSlot(),
        },
        { status: 200 },
      );
    }

    return NextResponse.json(normalizeMealLog(row), { status: 200 });
  } catch (error) {
    console.error("[meal-log GET] Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userId: requestedUserId,
      date,
      mealType,
      status,
      items,
      totalNutrients,
    } = body;
    const auth = await requireCurrentUser(requestedUserId);
    if (auth.error) return auth.error;

    if (!isValidMealRequest({ date, mealType, status })) {
      return NextResponse.json(
        { error: "Invalid meal log request" },
        { status: 400 },
      );
    }
    console.log(1);
    // Check if a row already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("meal_logs")
      .select("id, meals_list, breakfast, lunch, dinner, extra_meals")
      .eq("user_id", auth.userId)
      .eq("date", date)
      .maybeSingle();
    if (existingError) throw existingError;

    const isFixedMeal = DEFAULT_MEALS.includes(mealType);
    const currentSlot = isFixedMeal
      ? existing?.[mealType]
      : existing?.extra_meals?.[mealType];
    const mealPayload = {
      status,
      items: items ?? currentSlot?.items ?? [],
      total_nutrients:
        totalNutrients ??
        currentSlot?.total_nutrients ??
        currentSlot?.totalNutrients ??
        {},
    };
    console.log(2);
    if (!existing) {
      // Create new log row
      const newRow = {
        user_id: auth.userId,
        date,
        meals_list: [...DEFAULT_MEALS, ...(isFixedMeal ? [] : [mealType])],
      };
      if (isFixedMeal) {
        newRow[mealType] = mealPayload;
      } else {
        newRow.extra_meals = { [mealType]: mealPayload };
      }
      const { error: insertError } = await supabaseAdmin
        .from("meal_logs")
        .insert(newRow);
      if (insertError && insertError.code !== "23505") throw insertError;
      // A competing first save may have created the row. Apply this request to it.
      if (insertError?.code === "23505") {
        const updates = isFixedMeal
          ? { [mealType]: mealPayload }
          : { extra_meals: { [mealType]: mealPayload } };
        const { error: retryError } = await supabaseAdmin
          .from("meal_logs")
          .update(updates)
          .eq("user_id", auth.userId)
          .eq("date", date);
        if (retryError) throw retryError;
        console.log("Row already exists, applied update instead");
      }
    } else {
      // Update existing row
      const updates = {};
      const currentMealsList = existing.meals_list ?? DEFAULT_MEALS;

      if (isFixedMeal) {
        updates[mealType] = mealPayload;
      } else {
        const currentExtras = existing.extra_meals ?? {};
        updates.extra_meals = { ...currentExtras, [mealType]: mealPayload };
      }
      // Add mealType to meals_list if missing
      if (!currentMealsList.includes(mealType)) {
        updates.meals_list = [...currentMealsList, mealType];
      }

      console.log(3);
      const { error } = await supabaseAdmin
        .from("meal_logs")
        .update(updates)
        .eq("user_id", auth.userId)
        .eq("date", date);
      if (error) throw error;
    }

    console.log(4);
    // Return updated row
    const { data: updated, error: updatedError } = await supabaseAdmin
      .from("meal_logs")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("date", date)
      .single();
    if (updatedError) throw updatedError;
    console.log(5);
    return NextResponse.json(normalizeMealLog(updated), { status: 200 });
  } catch (err) {
    console.log(99);
    console.error("[meal-log POST] Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const date = searchParams.get("date");
    const mealType = searchParams.get("mealType");

    const auth = await requireCurrentUser(requestedUserId);
    if (auth.error) return auth.error;

    if (
      !DATE_PATTERN.test(date || "") ||
      !MEAL_NAME_PATTERN.test(mealType || "")
    ) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("meal_logs")
      .select("meals_list, extra_meals")
      .eq("user_id", auth.userId)
      .eq("date", date)
      .maybeSingle();
    if (existingError) throw existingError;

    if (!existing) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const isFixedMeal = DEFAULT_MEALS.includes(mealType);
    const updates = {};

    if (isFixedMeal) {
      // Reset fixed meal to default
      updates[mealType] = { ...DEFAULT_MEAL_SLOT };
    } else {
      updates.meals_list = (existing.meals_list ?? DEFAULT_MEALS).filter(
        (m) => m !== mealType,
      );
      const extras = { ...(existing.extra_meals ?? {}) };
      delete extras[mealType];
      updates.extra_meals = extras;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("meal_logs")
      .update(updates)
      .eq("user_id", auth.userId)
      .eq("date", date);
    if (deleteError) throw deleteError;

    const { data: updated, error: updatedError } = await supabaseAdmin
      .from("meal_logs")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("date", date)
      .single();
    if (updatedError) throw updatedError;

    return NextResponse.json(normalizeMealLog(updated), { status: 200 });
  } catch (error) {
    console.error("[meal-log DELETE] Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
