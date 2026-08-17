"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    // console.log("Session provider:", session?.provider);
    if (session?.provider === "google") {
      const googleToCredentials = async () => {
        try {
          const pass = await fetch(`/api/getPass`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session?.user?.email,
            }),
          });
          const passRes = await pass.json();
          // console.log("Fetched password for Google user:", passRes);
          const signin = await signIn("credentials", {
            email: session?.user?.email,
            password: passRes.password,
            redirect: false,
          });
          // console.log("Sign-in result after Google credentials handling:", signin);
          if (signin.ok) {
            console.log(
              "Successfully signed in with credentials after Google auth",
            );
          } else {
            console.error(
              "Failed to sign in with credentials after Google auth:",
              signin.error,
            );
          }
        } catch (error) {
          console.error(
            "Error during Google credentials handling:",
            error.message,
          );
        }
      };
      googleToCredentials();
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchProfileStatus = async () => {
      try {
        const res = await fetch("/api/profileFetch");
        const data = await res.json();

        console.log("Profile status:", data?.message);

        if (data?.message === "Profile does not exist") {
          console.log(
            "Profile does not exist, redirecting to profile creation page...",
          );
          router.push("/profile");
        }
      } catch (error) {
        console.error("Error while checking profile status:", error.message);
      }
    };

    fetchProfileStatus();
  }, [status, router]);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <section className="mx-auto max-w-6xl rounded-3xl border border-red-900/50 bg-black/50 p-6 shadow-2xl shadow-red-950/40 md:p-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-red-900/40 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-red-400">
              Swast Fitness
            </p>
            <h1 className="text-4xl font-black text-white md:text-5xl">
              Redline Performance Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              Your full fitness command center for profile tracking, activity,
              nutrition analytics, AI food scan, meal logging, and weekly diet
              strategy.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="bg-red-700"
            >
              Continue with Google
            </button>
            <button onClick={() => signOut()} className="bg-zinc-900">
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { href: "/signin", title: "Sign In", note: "Access your account" },
            { href: "/signup", title: "Sign Up", note: "Create an account" },
            { href: "/profile", title: "Profile", note: "Set your fitness base" },
            { href: "/activity", title: "Activity", note: "Plan workouts" },
            { href: "/nutrient", title: "Nutrients", note: "View daily targets" },
            { href: "/detectFood", title: "Detect Food", note: "AI food scanner" },
            {
              href: "/meal-tracker",
              title: "Meal Tracker",
              note: "Calendar and meal logs",
            },
            {
              href: "/diet-plan",
              title: "Diet Plan",
              note: "Generate weekly budget plans",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 transition hover:border-red-700 hover:bg-zinc-900"
            >
              <p className="text-lg font-semibold text-white transition group-hover:text-red-300">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-zinc-400">{item.note}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
