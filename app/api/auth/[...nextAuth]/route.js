import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/client";

/**
 * Resolves or creates a Supabase auth user UUID for the given email/name.
 * Guarantees a matching row exists in both auth.users and public.users.
 */
async function resolveUserUuid(email, name) {
  if (!email) return null;

  try {
    // 1. Check if user already exists in public.users
    const { data: publicUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (publicUser?.id) {
      return publicUser.id;
    }

    // 2. Look in Supabase auth.users
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const matchedAuthUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (matchedAuthUser?.id) {
      // Sync into public.users
      await supabaseAdmin.from("users").upsert({
        id: matchedAuthUser.id,
        email: matchedAuthUser.email,
        name: name || matchedAuthUser.user_metadata?.full_name || email.split("@")[0],
      });
      return matchedAuthUser.id;
    }

    // 3. User does not exist in auth.users — create them
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { full_name: name || email.split("@")[0] },
      });

    if (created?.user?.id) {
      await supabaseAdmin.from("users").upsert({
        id: created.user.id,
        email: created.user.email,
        name: name || email.split("@")[0],
      });
      return created.user.id;
    }

    if (createErr) {
      console.error("[resolveUserUuid] createUser error:", createErr.message);
      // If error indicates user already exists, re-check listUsers
      const { data: retryList } = await supabaseAdmin.auth.admin.listUsers();
      const retryUser = retryList?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (retryUser?.id) {
        await supabaseAdmin.from("users").upsert({
          id: retryUser.id,
          email: retryUser.email,
          name: name || email.split("@")[0],
        });
        return retryUser.id;
      }
    }
  } catch (err) {
    console.error("[resolveUserUuid] Error resolving UUID:", err.message);
  }

  return null;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // IMPORTANT: Use anon client — service-role bypasses password validation
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.log("[NextAuth] Credentials invalid:", error?.message);
            return null;
          }

          // Ensure public.users has this user and fetch name
          const { data: userRow } = await supabaseAdmin
            .from("users")
            .select("name")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!userRow) {
            await supabaseAdmin.from("users").upsert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || data.user.email.split("@")[0],
            });
          }

          return {
            _id: data.user.id,
            email: data.user.email,
            name: userRow?.name || data.user.user_metadata?.full_name || data.user.email.split("@")[0],
          };
        } catch (err) {
          console.error("[NextAuth] authorize error:", err.message);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token._id = user._id;
        token.email = user.email;
        token.name = user.name;
        token.provider = account?.provider || "credentials";
      }

      // Recover _id if missing or undefined
      if (!token._id || token._id === "undefined") {
        if (token.email) {
          const uuid = await resolveUserUuid(token.email, token.name);
          if (uuid) {
            token._id = uuid;
            console.log("[NextAuth] jwt: recovered UUID", uuid, "for", token.email);
          }
        }
      }

      if (!token.provider) {
        token.provider = token.picture ? "google" : "credentials";
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user._id = token._id || null;
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
        session.user.provider = token.provider || "credentials";

        // Extra safety check: if session.user._id is still not present, resolve it
        if (!session.user._id || session.user._id === "undefined") {
          if (session.user.email) {
            const uuid = await resolveUserUuid(session.user.email, session.user.name);
            if (uuid) {
              session.user._id = uuid;
            }
          }
        }
      }
      session.provider = token.provider || "credentials";
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const uuid = await resolveUserUuid(user.email, user.name);
          if (uuid) {
            user._id = uuid;
            console.log("[NextAuth] Google signIn: mapped UUID", uuid);
          }
        } catch (err) {
          console.error("[NextAuth] Google signIn error:", err.message);
        }
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
