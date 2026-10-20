import { NextResponse } from "next/server";

/**
 * This route previously fetched plain-text passwords from MongoDB.
 * With Supabase Auth, passwords are NEVER stored in plain text — this
 * endpoint is now deprecated and disabled for security.
 *
 * The NextAuth credentials provider now validates passwords directly
 * via supabaseAdmin.auth.signInWithPassword() in the [...nextauth] route.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is disabled. Passwords are managed by Supabase Auth." },
    { status: 410 } // 410 Gone
  );
}
