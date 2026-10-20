"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  Flame,
  ChefHat,
  Clock,
  ArrowRight,
  Info,
  DollarSign,
} from "lucide-react";

export default function WeeklyDietPlan({ weeklyPlan, budgetLimit = 166 }) {
  const { data: session } = useSession();
  const [activeDay, setActiveDay] = useState("monday");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'success' | 'error' | null

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // 1. Aggregated Shopping List
  const shoppingList = useMemo(() => {
    if (!weeklyPlan) return [];
    const aggregator = {};

    Object.values(weeklyPlan).forEach((dayData) => {
      if (!dayData?.meals) return;
      Object.keys(dayData.meals).forEach((slot) => {
        const meal = dayData.meals[slot];
        if (!meal?.components) return;

        meal.components.forEach((comp) => {
          const key = comp.name.toLowerCase();
          if (!aggregator[key]) {
            aggregator[key] = {
              name: comp.name,
              quantity: 0,
              unit: comp.unit || "g",
              cost: 0,
              isExempt: comp.cost === 0 && (key.includes("rice") || key.includes("wheat")),
            };
          }
          aggregator[key].quantity += comp.quantity || 0;
          aggregator[key].cost += comp.cost || 0;
        });
      });
    });

    return Object.values(aggregator).sort((a, b) => b.cost - a.cost);
  }, [weeklyPlan]);

  const totalGroceryCost = shoppingList.reduce((acc, i) => acc + (i.cost || 0), 0);

  if (!weeklyPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-zinc-950/70 border border-dashed border-zinc-800 text-zinc-400">
        <span className="text-4xl mb-3">🍽️</span>
        <h3 className="text-lg font-bold text-white">No Weekly Plan Available</h3>
        <p className="text-xs text-zinc-500 mt-1">Please generate a customized diet plan first.</p>
      </div>
    );
  }

  const handleSyncPlan = async () => {
    if (!session?.user?._id) {
      alert("Please log in to sync your plan.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const response = await fetch("/api/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user._id,
          weeklyPlan,
          budget: budgetLimit,
        }),
      });

      if (!response.ok) throw new Error("Failed to sync plan");
      setSyncStatus("success");
    } catch (error) {
      console.error("Error syncing plan:", error);
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const currentDayData = weeklyPlan[activeDay];

  return (
    <div className="space-y-6">
      {/* ── Action Sync Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 border border-red-900/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/50 border border-red-700/50 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Active Strategy
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Your Weekly Fueling Protocol</h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-lg">
            Complete 7-day culinary roadmap with recipes, portion weights, and grocery cost optimization.
          </p>
        </div>

        <button
          onClick={handleSyncPlan}
          disabled={isSyncing}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-xl shadow-red-950/60 disabled:opacity-50 transition self-start md:self-auto"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Syncing to Profile...</span>
            </>
          ) : syncStatus === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Plan Saved!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Save &amp; Sync to Profile</span>
            </>
          )}
        </button>
      </div>

      {/* ── Shopping List Section ─────────────────────────────────────── */}
      <section className="p-6 sm:p-8 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Grocery Shopping List</h3>
              <p className="text-xs text-zinc-400">Total aggregated ingredients needed for 7 days.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-zinc-400">Est. Total:</span>
            <span className="text-xl font-black text-emerald-400">
              ₹{totalGroceryCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
          {shoppingList.map((item, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/70 flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-xs sm:text-sm text-white capitalize truncate max-w-[120px]">
                  {item.name}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {item.quantity} {item.unit}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400">
                  {item.isExempt ? "Pantry" : `₹${item.cost.toFixed(0)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Day-by-Day Protocol ────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Horizontal Scroll Day Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {daysOfWeek.map((day) => {
            const isSelected = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-gradient-to-r from-red-600 to-red-700 border-red-500 text-white shadow-lg shadow-red-950"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Day Meal Details */}
        {currentDayData?.meals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(currentDayData.meals).map((slotKey) => {
              const meal = currentDayData.meals[slotKey];
              if (!meal) return null;

              return (
                <div
                  key={slotKey}
                  className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5" />
                        {slotKey}
                      </span>
                      {meal.calories && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {meal.calories} kcal
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white mb-2">
                      {meal.dishName || meal.name || slotKey}
                    </h4>

                    {/* Components / Ingredients */}
                    {meal.components && meal.components.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Ingredients:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {meal.components.map((comp, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800/60 text-zinc-300"
                            >
                              {comp.name} ({comp.quantity}{comp.unit})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preparation note */}
                    {meal.instructions && (
                      <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/40">
                        &ldquo;{meal.instructions}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span>Est. Meal Cost:</span>
                    <span className="font-bold text-emerald-400">
                      ₹{meal.cost ? Number(meal.cost).toFixed(2) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
