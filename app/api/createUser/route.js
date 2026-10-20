import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        message: "User with this email already exists",
        success: false,
        status: 400,
      });
    }

    // Create user in Supabase Auth (handles password hashing)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,         // skip email confirmation for now
        user_metadata: { full_name: name },
      });

    if (authError) {
      console.error("[createUser] Supabase auth error:", authError.message);
      return NextResponse.json({
        message: authError.message,
        success: false,
        status: 400,
      });
    }

    // The trigger `on_auth_user_created` auto-inserts a row in public.users.
    // We update the name explicitly to be safe.
    await supabaseAdmin
      .from("users")
      .update({ name })
      .eq("id", authData.user.id);

    return NextResponse.json({
      message: "User created successfully",
      success: true,
      status: 201,
    });
  } catch (error) {
    console.error("[createUser] Error:", error.message);
    return NextResponse.json({
      message: "Error creating user",
      success: false,
      status: 500,
    });
  }
}
