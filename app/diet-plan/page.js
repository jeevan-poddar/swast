"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import WeeklyDietPlan from "@/components/WeeklyDietPlan";
import {
  UtensilsCrossed,
  Sparkles,
  ChevronLeft,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  Calendar,
  ChefHat,
  ArrowRight,
} from "lucide-react";

export default function DietPlanPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState("Loading"); // Loading | Input | Generating | Results
  const [monthlyBudget, setMonthlyBudget] = useState("5000");
  const [loadingText, setLoadingText] = useState("Checking active plan...");
  const [apiData, setApiData] = useState(null);
  const [toast, setToast] = useState(null);

  const dailyBudget = monthlyBudget
    ? (parseFloat(monthlyBudget) / 30).toFixed(2)
    : "0.00";

  useEffect(() => {
    async function checkExistingPlan() {
      if (session?.user?._id) {
        try {
          const res = await fetch(`/api/diet-plan?userId=${session.user._id}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.weekly_plan) {
              setApiData({ weekly_plan: data.weekly_plan });
              if (data.budget) {
                setMonthlyBudget(Math.round(data.budget * 30).toString());
              }
              setStep("Results");
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching existing plan:", error);
        }
      }
      setStep("Input");
    }

    if (session !== undefined) {
      if (step === "Loading") {
        checkExistingPlan();
      }
    }
  }, [session, step]);

  useEffect(() => {
    let interval;
    if (step === "Generating") {
      const texts = [
        "Analyzing 13 macro & micronutrient targets...",
        "Evaluating local grocery market ingredient costs...",
        "Designing high-protein budget recipes...",
        "Balancing meal satiety and prep simplicity...",
        "Finalizing your 7-day culinary protocol...",
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleGenerate = async () => {
    if (!monthlyBudget || isNaN(monthlyBudget) || Number(monthlyBudget) <= 0) return;

    setStep("Generating");

    try {
      const payload = {
        dailyBudget: parseFloat(dailyBudget),
        dailyTargets: {
          protein: 150,
          carbs: 250,
          fats: 70,
          fiber: 30,
          vitaminA: 900,
          vitaminC: 90,
          vitaminD: 20,
          vitaminE: 15,
          iron: 18,
          calcium: 1000,
          potassium: 3400,
          sodium: 2300,
          magnesium: 400,
        },
      };

      const response = await fetch("/api/generate-weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      setApiData(data);
      setStep("Results");
      setToast({ type: "success", msg: "Weekly diet strategy generated!" });
    } catch (error) {
      console.error("Failed to generate plan:", error);
      setStep("Input");
      setToast({ type: "error", msg: "AI plan generation timed out. Please try again." });
    } finally {
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-6 text-zinc-100">
      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-600/50 text-emerald-200"
              : "bg-red-950/90 border-red-600/50 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
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
            <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
              AI Budget Nutritionist
            </span>
          </div>
        </div>

        {step === "Results" && (
          <button
            onClick={() => setStep("Input")}
            className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Change Budget / Regenerate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── STEP: Loading ──────────────────────────────────────────────── */}
      {step === "Loading" && (
        <div className="flex flex-col items-center justify-center p-20 text-center rounded-3xl bg-zinc-950/70 border border-zinc-800">
          <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-400 font-medium">{loadingText}</p>
        </div>
      )}

      {/* ── STEP: Input (Budget Selection) ─────────────────────────────── */}
      {step === "Input" && (
        <div className="max-w-xl mx-auto w-full p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/50 border border-purple-800/40 text-purple-400 flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-white">7-Day Budget Fueling</h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Set your target monthly grocery spend. Our AI engine builds an optimal weekly menu maximizing protein &amp; micronutrients within your budget.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Monthly Grocery Budget (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  min="1000"
                  max="100000"
                  step="500"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-lg outline-none focus:border-red-500 transition"
                />
              </div>

              {/* Quick Pick Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-xs text-zinc-500">Presets:</span>
                {[3000, 5000, 7500, 10000, 15000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setMonthlyBudget(b.toString())}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition border ${
                      Number(monthlyBudget) === b
                        ? "bg-red-950/80 border-red-700/60 text-red-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    ₹{b.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Daily Allocation Feedback */}
              <div className="mt-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-between text-xs text-zinc-300">
                <span className="text-zinc-400">Calculated Daily Limit:</span>
                <span className="text-lg font-black text-white">
                  ₹{dailyBudget} <span className="text-xs text-zinc-500 font-normal">/ day</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!monthlyBudget || isNaN(monthlyBudget) || Number(monthlyBudget) <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 7-Day Strategy</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: Generating ───────────────────────────────────────────── */}
      {step === "Generating" && (
        <div className="max-w-md mx-auto w-full p-10 rounded-3xl bg-zinc-950/80 border border-zinc-800 text-center shadow-2xl flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-red-950/40" />
            <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🥗
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Formulating Diet Plan</h2>
          <p className="text-sm text-red-400 font-medium animate-pulse">
            {loadingText}
          </p>
          <p className="text-xs text-zinc-500 mt-4 max-w-xs">
            Using Gemini Generative AI to structure balanced macros across 7 days.
          </p>
        </div>
      )}

      {/* ── STEP: Results View ─────────────────────────────────────────── */}
      {step === "Results" && apiData && (
        <WeeklyDietPlan
          weeklyPlan={apiData.weekly_plan}
          budgetLimit={parseFloat(dailyBudget)}
        />
      )}
    </main>
  );
}
