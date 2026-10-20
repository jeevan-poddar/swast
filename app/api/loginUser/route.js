import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/client";

/**
 * POST /api/loginUser
 * Validates credentials via Supabase Auth.
 * Returns user data for NextAuth credentials provider authorize().
 */
export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Use anon client so Supabase Auth actually validates the password
    // (service-role key bypasses auth checks — do NOT use it here)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({
        message: "Invalid email or password",
        success: false,
        status: 400,
      });
    }

    // Fetch public user row for extra fields (name)
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      message: "Login successful",
      success: true,
      status: 200,
      user: {
        _id: userRow?.id ?? data.user.id,
        email: userRow?.email ?? data.user.email,
        name: userRow?.name ?? data.user.user_metadata?.full_name ?? "",
      },
    });
  } catch (error) {
    console.error("[loginUser] Error:", error.message);
    return NextResponse.json({
      message: "Error logging in user",
      success: false,
      status: 500,
    });
  }
}
