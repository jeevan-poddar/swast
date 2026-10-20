"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { calculateNutrients } from "@/action/nutirentCalculation";
import {
  Activity,
  Droplet,
  Flame,
  Zap,
  ChevronLeft,
  Shield,
  HeartPulse,
  Scale,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function NutrientsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    const fetchNutrients = async () => {
      if (!session?.user?._id) return;

      setLoading(true);
      try {
        const data = await calculateNutrients(session.user._id);
        setWeeklyData(data);
      } catch (error) {
        console.error("Failed to load nutrients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrients();
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400 font-medium">Calculating dynamic targets...</p>
      </div>
    );
  }

  if (!weeklyData || !weeklyData[selectedDay]) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/50 text-red-500 flex items-center justify-center mb-4">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">No Nutrition Data Found</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Please complete your body metrics and fitness goal on your Profile page so our engine can compute your targets.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition"
          >
            Go to Profile Setup
          </button>
        </div>
      </main>
    );
  }

  const currentData = weeklyData[selectedDay];
  const macros = currentData.macros || { protein_g: 0, carbs_g: 0, fats_g: 0 };
  const micros = currentData.micronutrients || {};

  // Macro calorie contributions & percentages
  const proteinCals = macros.protein_g * 4;
  const carbsCals = macros.carbs_g * 4;
  const fatsCals = macros.fats_g * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals || currentData.calories || 1;

  const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsPct = Math.round((carbsCals / totalMacroCals) * 100);
  const fatsPct = Math.round((fatsCals / totalMacroCals) * 100);

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-6 text-zinc-100">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-red-600 text-zinc-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-red-500">
              Macro &amp; Micronutrient Engine
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push("/profile")}
          className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-1 self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Adjust Baseline in Profile</span>
        </button>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Daily Target Blueprint</h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
          Dynamic nutrition targets computed daily from your BMR, activity burn, and deficit/surplus pace.
        </p>
      </div>

      {/* ── Day Selector Scrollable Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const dayCals = weeklyData[day]?.calories;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-gradient-to-b from-red-600 to-red-800 border-red-500 text-white shadow-lg shadow-red-950/60"
                  : "bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">{day.slice(0, 3)}</span>
              <span className="text-xs font-semibold opacity-85 mt-0.5">
                {dayCals ? `${dayCals} kcal` : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Total Energy Required Hero Card ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-red-900/40 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Target Energy Expenditure — {selectedDay}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {currentData.calories}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-red-400">kcal / day</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 max-w-lg leading-relaxed">
              Dynamically accounts for your metabolic baseline plus workout calories logged for {selectedDay}.
            </p>
          </div>

          {/* Macro Split Summary Bar */}
          <div className="w-full md:max-w-xs p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-zinc-300">Macro Calorie Distribution</span>
            <div className="h-3 rounded-full bg-zinc-950 overflow-hidden flex gap-1 p-0.5 border border-zinc-800">
              <div style={{ width: `${proteinPct}%` }} className="bg-red-500 rounded-full" title={`Protein ${proteinPct}%`} />
              <div style={{ width: `${carbsPct}%` }} className="bg-amber-500 rounded-full" title={`Carbs ${carbsPct}%`} />
              <div style={{ width: `${fatsPct}%` }} className="bg-yellow-500 rounded-full" title={`Fats ${fatsPct}%`} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> P: {proteinPct}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> C: {carbsPct}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> F: {fatsPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary Macronutrient Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Protein */}
        <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-red-600/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <Activity className="w-4 h-4" />
                <span>Protein</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-300">
                {proteinCals} kcal
              </span>
            </div>
            <div className="text-4xl font-black text-white">
              {macros.protein_g}
              <span className="text-lg text-zinc-400 font-bold ml-1">g</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Essential for muscle recovery, enzyme repair, and nitrogen retention during deficit or growth.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
            ~4 kcal per gram
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-600/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Zap className="w-4 h-4" />
                <span>Carbohydrates</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-300">
                {carbsCals} kcal
              </span>
            </div>
            <div className="text-4xl font-black text-white">
              {macros.carbs_g}
              <span className="text-lg text-zinc-400 font-bold ml-1">g</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Primary glycogen energy for intense brain work, nervous system focus, and high-intensity workout output.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
            ~4 kcal per gram
          </div>
        </div>

        {/* Dietary Fats */}
        <div className="p-6 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 hover:border-yellow-600/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400">
                <Shield className="w-4 h-4" />
                <span>Healthy Fats</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-800/40 text-yellow-300">
                {fatsCals} kcal
              </span>
            </div>
            <div className="text-4xl font-black text-white">
              {macros.fats_g}
              <span className="text-lg text-zinc-400 font-bold ml-1">g</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Supports critical steroid hormones (testosterone, thyroid), joint lubrication, and fat-soluble vitamin uptake.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
            ~9 kcal per gram
          </div>
        </div>
      </div>

      {/* ── Micronutrients, Hydration & Electrolytes ───────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-white">Hydration &amp; Micronutrient Defense</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Optimized electrolyte fluid balance, cellular hydration, and micronutrient thresholds.
            </p>
          </div>
          <span className="text-xs font-bold text-red-400 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40">
            ACSM &amp; NIH Standards
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Water */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Droplet className="w-3.5 h-3.5" />
              <span>Fluid Intake</span>
            </div>
            <div className="text-2xl font-black text-white">
              {micros.water_L || 3.0} <span className="text-xs text-zinc-400 font-normal">Liters</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Daily water target</div>
          </div>

          {/* Fiber */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-emerald-400 mb-1">Dietary Fiber</div>
            <div className="text-2xl font-black text-white">
              {micros.fiber_g || 28} <span className="text-xs text-zinc-400 font-normal">grams</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Gut microbiome &amp; satiety</div>
          </div>

          {/* Sodium */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Sodium (Na)</div>
            <div className="text-2xl font-black text-white">
              {micros.sodium_mg || 2300} <span className="text-xs text-zinc-400 font-normal">mg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Electrolyte balance</div>
          </div>

          {/* Potassium */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Potassium (K)</div>
            <div className="text-2xl font-black text-white">
              {micros.potassium_mg || 4700} <span className="text-xs text-zinc-400 font-normal">mg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Blood pressure &amp; pumps</div>
          </div>

          {/* Magnesium */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Magnesium (Mg)</div>
            <div className="text-2xl font-black text-white">
              {micros.magnesium_mg || 420} <span className="text-xs text-zinc-400 font-normal">mg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Sleep &amp; muscle relaxation</div>
          </div>

          {/* Iron */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Iron (Fe)</div>
            <div className="text-2xl font-black text-white">
              {micros.iron_mg || 14} <span className="text-xs text-zinc-400 font-normal">mg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">RBC oxygen transport</div>
          </div>

          {/* Calcium */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Calcium (Ca)</div>
            <div className="text-2xl font-black text-white">
              {micros.calcium_mg || 1000} <span className="text-xs text-zinc-400 font-normal">mg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Bone density &amp; signaling</div>
          </div>

          {/* Vitamin D */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <div className="text-xs font-semibold text-zinc-300 mb-1">Vitamin D3</div>
            <div className="text-2xl font-black text-white">
              {micros.vitamin_D_mcg || 20} <span className="text-xs text-zinc-400 font-normal">mcg</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Immune &amp; bone health</div>
          </div>
        </div>
      </section>
    </main>
  );
}
