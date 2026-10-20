"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Activity,
  Flame,
  ScanLine,
  CalendarDays,
  UtensilsCrossed,
  LogOut,
  LogIn,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  Dumbbell,
  Target,
} from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchProfileStatus = async () => {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/profileFetch");
        const data = await res.json();

        if (data?.message === "Profile does not exist") {
          router.push("/profile");
        } else if (data?.profile) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileStatus();
  }, [status, router]);

  const navItems = [
    {
      href: "/profile",
      title: "Profile & Vitals",
      desc: "Set body metrics, target weight change, and custom pace strategy.",
      icon: User,
      badge: profile?.goal || "Baseline Setup",
      color: "#ef4444",
      highlight: true,
    },
    {
      href: "/activity",
      title: "Daily Activities",
      desc: "Log daily workouts, active routines, and compute real-time calorie burn.",
      icon: Dumbbell,
      badge: "Workouts",
      color: "#f97316",
    },
    {
      href: "/nutrient",
      title: "Nutrient Targets",
      desc: "View daily calorie goals, protein/carbs/fat targets, and micronutrients.",
      icon: Flame,
      badge: "Macro Analytics",
      color: "#eab308",
    },
    {
      href: "/detectFood",
      title: "AI Food Scanner",
      desc: "Snap meal photos for automated ingredient and nutritional detection.",
      icon: ScanLine,
      badge: "Gemini Vision",
      color: "#ec4899",
    },
    {
      href: "/meal-tracker",
      title: "Meal Log & Calendar",
      desc: "Daily adherence calendar, meal reporting, and habit consistency.",
      icon: CalendarDays,
      badge: "Calendar",
      color: "#10b981",
    },
    {
      href: "/diet-plan",
      title: "Weekly Fueling Plan",
      desc: "Generate full 7-day budget-optimized meal plans & grocery lists.",
      icon: UtensilsCrossed,
      badge: "Budget AI",
      color: "#8b5cf6",
    },
  ];

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto flex flex-col gap-6">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-950/50">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-red-500">
                Swast Fitness
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 font-semibold">
                v2.0
              </span>
            </div>
            <h2 className="text-xl font-black text-white">Performance Command Hub</h2>
          </div>
        </div>

        {/* User Account State */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white">
                  {session.user?.name || "Fitness Athlete"}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {session.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-950/50 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign In</span>
              </button>
              <Link
                href="/signin"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
              >
                Email Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero / Status Snapshot ────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-red-900/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/50 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Nutrition &amp; Performance
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {profile?.name
                ? `Welcome Back, ${profile.name.split(" ")[0]}!`
                : "Fuel Your Potential."}
            </h1>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed max-w-xl">
              Track nutrition with AI, manage workout caloric expenditure, and achieve your
              body goals with scientific precision.
            </p>
          </div>

          {/* Quick Stat Pill Chips if Profile exists */}
          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Weight
                </span>
                <span className="text-xl font-black text-white">
                  {profile.weight || "—"}{" "}
                  <span className="text-xs text-zinc-400 font-normal">kg</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Goal
                </span>
                <span className="text-sm font-bold text-red-400 truncate">
                  {profile.goal || "Not set"}
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Diet Type
                </span>
                <span className="text-sm font-bold text-zinc-200 truncate">
                  {profile.foodType || "Standard"}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Feature Cards Grid ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-3xl border border-zinc-800/90 bg-zinc-950/70 p-6 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-red-600/70 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-red-950/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: `${item.color}15`,
                      borderColor: `${item.color}35`,
                      color: item.color,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 group-hover:border-red-900/50 group-hover:text-red-300 transition-colors">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                <span>Access Module</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* ── Mobile Quick Links Bar ────────────────────────────────────── */}
      <footer className="mt-6 py-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div>Swast Fitness © {new Date().getFullYear()} — Redline AI Engine</div>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="hover:text-red-400 transition">
            Profile
          </Link>
          <Link href="/activity" className="hover:text-red-400 transition">
            Workouts
          </Link>
          <Link href="/nutrient" className="hover:text-red-400 transition">
            Nutrients
          </Link>
          <Link href="/meal-tracker" className="hover:text-red-400 transition">
            Calendar
          </Link>
        </div>
      </footer>
    </main>
  );
}
