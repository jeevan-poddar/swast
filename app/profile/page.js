"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import calculateAge from "@/action/ageCalculator";
import {
  User,
  Target,
  Scale,
  Flame,
  Utensils,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  HeartPulse,
  Info,
  Dumbbell,
  ChefHat,
  Compass,
} from "lucide-react";

// ── Pace preset definitions (kg per week) ──────────────────────────────────
const PACE_PRESETS = [
  {
    id: "slow",
    label: "Slow & Steady",
    emoji: "🐢",
    rateKgWeek: 0.25,
    tag: "Gentle",
    sublabel: "~0.25 kg / week",
    desc: "Easiest to sustain long-term. Minimal hunger, protects 100% lean muscle.",
    deficitKcal: 275,
  },
  {
    id: "moderate",
    label: "Moderate",
    emoji: "🚶",
    rateKgWeek: 0.5,
    tag: "Recommended",
    sublabel: "~0.50 kg / week",
    desc: "The gold standard recommended by sports nutritionists for steady fat loss or clean bulk.",
    deficitKcal: 550,
  },
  {
    id: "fast",
    label: "Fast",
    emoji: "🏃",
    rateKgWeek: 0.75,
    tag: "Aggressive",
    sublabel: "~0.75 kg / week",
    desc: "Noticeably faster results. Requires disciplined nutrition and proper sleep.",
    deficitKcal: 825,
  },
  {
    id: "very_fast",
    label: "Very Fast",
    emoji: "⚡",
    rateKgWeek: 1.0,
    tag: "Intense",
    sublabel: "~1.00 kg / week",
    desc: "High intensity. Strict adherence required. Best for short-term event preparation.",
    deficitKcal: 1100,
  },
  {
    id: "other",
    label: "Other (Custom)",
    emoji: "⚙️",
    rateKgWeek: null,
    tag: "Custom Timeline",
    sublabel: "Set your own days",
    desc: "Enter your exact target days or specific deadline.",
    deficitKcal: null,
  },
];

const MEAT_OPTIONS = ["Chicken", "Mutton", "Fish", "Egg", "Pork", "Turkey"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const GOAL_OPTIONS = ["Lose Weight", "Gain Weight", "Maintain Weight"];
const FOOD_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];

const KITCHEN_OPTIONS = [
  { value: "Full Kitchen", label: "🍳 Full Kitchen", sub: "Stove, oven, fridge & meal prep tools" },
  { value: "Basic Induction/Stove", label: "🔥 Basic Induction / Stove", sub: "Simple one-pot or basic cooking" },
  { value: "No Cooking/Hostel Life", label: "🏠 No Cooking / Hostel Life", sub: "Mess, canteen, or eating out" },
];

const JOB_OPTIONS = [
  { value: "1", label: "💺 Sedentary", sub: "Desk job, 6+ hrs sitting daily" },
  { value: "2", label: "🚶 Lightly Active", sub: "Teacher, standing, lab work" },
  { value: "3", label: "🏃 Moderately Active", sub: "Nurse, retail, waiter, regular walking" },
  { value: "4", label: "💪 Very Active", sub: "Athlete, construction worker, heavy labor" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg: string }
  const [paceMode, setPaceMode] = useState("moderate"); // 'slow' | 'moderate' | 'fast' | 'very_fast' | 'other'
  const [customDays, setCustomDays] = useState(60);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      country: "India",
      goal: "Lose Weight",
      gender: "Male",
      foodType: "Non-Vegetarian",
      jobType: "1",
      kitchen: "Full Kitchen",
      meat: [],
      meatPreferenceDays: [],
    },
  });

  const goal = watch("goal");
  const foodType = watch("foodType");
  const dob = watch("dob");
  const meat = watch("meat") || [];
  const meatDays = watch("meatPreferenceDays") || [];
  const weight = watch("weight");
  const height = watch("height");
  const gender = watch("gender");
  const jobType = watch("jobType");
  const howMuchWeight = watch("howMuchWeight");
  const inHowManyDays = watch("inHowManyDays");

  // Helper to calculate days from weight & rate
  const computeDaysForRate = (weightVal, rateKgWeek) => {
    const targetKg = parseFloat(weightVal) || 5;
    return Math.max(7, Math.round((targetKg / rateKgWeek) * 7));
  };

  // ── Load profile from backend ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/profileFetch");
        if (!res.ok) {
          if (res.status === 404) {
            // Profile does not exist yet; populate from session
            if (isMounted) {
              setValue("name", session?.user?.name || "");
              setValue("email", session?.user?.email || "");
              setValue("country", "India");
              setValue("inHowManyDays", 56);
            }
          }
          return;
        }

        const data = await res.json();
        if (data?.profile && isMounted) {
          const p = data.profile;
          const fields = [
            ["name", p.name || ""],
            ["email", p.email || ""],
            ["goal", p.goal || "Lose Weight"],
            ["howMuchWeight", p.howMuchWeight != null ? p.howMuchWeight : ""],
            ["inHowManyDays", p.inHowManyDays != null ? Number(p.inHowManyDays) : ""],
            ["foodType", p.foodType || "Non-Vegetarian"],
            ["meat", Array.isArray(p.meat) ? p.meat : []],
            ["meatPreferenceDays", Array.isArray(p.meatPreferenceDays) ? p.meatPreferenceDays : []],
            ["dob", p.dob ? new Date(p.dob).toISOString().split("T")[0] : ""],
            ["gender", p.gender || "Male"],
            ["kitchen", p.kitchen || "Full Kitchen"],
            ["city", p.city || ""],
            ["state", p.state || ""],
            ["country", p.country || "India"],
            ["weight", p.weight != null ? p.weight : ""],
            ["height", p.height != null ? p.height : ""],
            ["allergies", p.allergies || ""],
            ["jobType", p.jobType ? String(p.jobType) : "1"],
          ];
          fields.forEach(([k, v]) => setValue(k, v));

          // Determine paceMode from saved inHowManyDays and howMuchWeight
          const savedDays = Number(p.inHowManyDays);
          const targetKg = parseFloat(p.howMuchWeight) || 5;

          if (savedDays && savedDays > 0) {
            let matched = false;
            for (const preset of PACE_PRESETS) {
              if (preset.rateKgWeek) {
                const expectedDays = computeDaysForRate(targetKg, preset.rateKgWeek);
                if (Math.abs(expectedDays - savedDays) <= 2) {
                  setPaceMode(preset.id);
                  matched = true;
                  break;
                }
              }
            }
            if (!matched) {
              setPaceMode("other");
              setCustomDays(savedDays);
            }
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setValue, session?.user?.email, session?.user?.name]);

  // ── Sync inHowManyDays when paceMode or howMuchWeight changes ─────────────
  const updatePace = (mode, customVal = customDays) => {
    setPaceMode(mode);
    if (goal === "Maintain Weight") {
      setValue("inHowManyDays", 0);
      return;
    }

    if (mode === "other") {
      const days = parseInt(customVal, 10) || 30;
      setValue("inHowManyDays", days, { shouldValidate: true });
    } else {
      const preset = PACE_PRESETS.find((p) => p.id === mode);
      if (preset && preset.rateKgWeek) {
        const computed = computeDaysForRate(howMuchWeight, preset.rateKgWeek);
        setValue("inHowManyDays", computed, { shouldValidate: true });
      }
    }
  };

  // Recompute days if weight change amount changes and not in "other" mode
  const handleWeightGoalChange = (e) => {
    const val = e.target.value;
    setValue("howMuchWeight", val, { shouldValidate: true });
    if (paceMode !== "other") {
      const preset = PACE_PRESETS.find((p) => p.id === paceMode);
      if (preset && preset.rateKgWeek) {
        const computed = computeDaysForRate(val, preset.rateKgWeek);
        setValue("inHowManyDays", computed, { shouldValidate: true });
      }
    }
  };

  // ── Real-time Metabolic Snapshot Calculations ────────────────────────────
  const metrics = useMemo(() => {
    const numWeight = parseFloat(weight);
    const numHeight = parseFloat(height);
    const numAge = dob ? calculateAge(dob) : 25;
    const isMale = gender === "Male";

    // BMI
    let bmi = null;
    let bmiCategory = "";
    let bmiColor = "#94a3b8";
    if (numWeight > 0 && numHeight > 0) {
      const hM = numHeight / 100;
      bmi = (numWeight / (hM * hM)).toFixed(1);
      const bmiVal = parseFloat(bmi);
      if (bmiVal < 18.5) {
        bmiCategory = "Underweight";
        bmiColor = "#38bdf8";
      } else if (bmiVal < 25) {
        bmiCategory = "Normal weight";
        bmiColor = "#22c55e";
      } else if (bmiVal < 30) {
        bmiCategory = "Overweight";
        bmiColor = "#f59e0b";
      } else {
        bmiCategory = "Obese";
        bmiColor = "#ef4444";
      }
    }

    // BMR (Mifflin-St Jeor)
    let bmr = null;
    if (numWeight > 0 && numHeight > 0 && numAge > 0) {
      if (isMale) {
        bmr = Math.round(10 * numWeight + 6.25 * numHeight - 5 * numAge + 5);
      } else {
        bmr = Math.round(10 * numWeight + 6.25 * numHeight - 5 * numAge - 161);
      }
    }

    // TDEE with job multiplier
    let tdee = null;
    if (bmr) {
      const multipliers = { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725 };
      tdee = Math.round(bmr * (multipliers[jobType] || 1.2));
    }

    // Daily Calorie Target
    let targetCalories = tdee;
    let dailyDeficit = 0;
    const numTargetWeight = parseFloat(howMuchWeight) || 0;
    const numDays = parseInt(inHowManyDays, 10) || 0;

    if (tdee && goal !== "Maintain Weight" && numTargetWeight > 0 && numDays > 0) {
      dailyDeficit = Math.round((7700 * numTargetWeight) / numDays);
      if (goal === "Lose Weight") {
        targetCalories = Math.max(1200, tdee - dailyDeficit);
      } else if (goal === "Gain Weight") {
        targetCalories = tdee + dailyDeficit;
      }
    }

    // Estimated finish date
    let finishDateStr = null;
    if (numDays > 0 && goal !== "Maintain Weight") {
      const d = new Date();
      d.setDate(d.getDate() + numDays);
      finishDateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // Rate in kg/week
    let weeklyRate = null;
    if (numTargetWeight > 0 && numDays > 0) {
      weeklyRate = ((numTargetWeight / numDays) * 7).toFixed(2);
    }

    return {
      bmi,
      bmiCategory,
      bmiColor,
      bmr,
      tdee,
      targetCalories,
      dailyDeficit,
      finishDateStr,
      weeklyRate,
      age: numAge,
    };
  }, [weight, height, dob, gender, jobType, goal, howMuchWeight, inHowManyDays]);

  // ── Form submit handler ──────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        howMuchWeight:
          formData.goal === "Maintain Weight"
            ? null
            : formData.howMuchWeight
            ? parseFloat(formData.howMuchWeight)
            : null,
        inHowManyDays:
          formData.goal === "Maintain Weight"
            ? null
            : formData.inHowManyDays
            ? parseInt(formData.inHowManyDays, 10)
            : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
      };

      const res = await fetch("/api/profileUpdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", msg: json.message || "Failed to update profile" });
      } else {
        setToast({ type: "success", msg: "Profile saved successfully! Targets updated." });
        if (formData.email !== session?.user?.email) {
          setTimeout(() => signOut(), 2500);
        }
      }
    } catch {
      setToast({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4500);
    }
  };

  return (
    <>
      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`pf-toast pf-toast--${toast.type}`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

      <main className="pf-root">
        {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
        <header className="pf-top-bar">
          <button
            type="button"
            id="btn-back-hub"
            onClick={() => router.push("/")}
            className="pf-btn-back"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="pf-live-badge">
              <span className="pf-pulse-dot" />
              Realtime Sync
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="pf-btn-ghost-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="pf-header-text">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fitness Baseline &amp; Targets
          </div>
          <h1 className="pf-main-title">Profile &amp; Goal Strategy</h1>
          <p className="pf-main-desc">
            Your metrics power the entire AI engine — calculating your exact daily calorie budget,
            macro splits, workout burn, and personalized meal schedules.
          </p>
        </div>

        {/* ── Live Metabolic Snapshot Card ──────────────────────────────── */}
        <div className="pf-metrics-hero">
          <div className="pf-metrics-header">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <span>Live Metabolism &amp; Strategy Snapshot</span>
            </div>
            {metrics.finishDateStr && goal !== "Maintain Weight" && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-red-950/80 border border-red-800/40 text-red-300 font-medium">
                🎯 Target: {metrics.finishDateStr}
              </span>
            )}
          </div>

          <div className="pf-metrics-grid">
            {/* BMI Card */}
            <div className="pf-metric-card">
              <span className="pf-metric-label">Current BMI</span>
              <div className="flex items-baseline gap-2">
                <span className="pf-metric-val">{metrics.bmi || "—"}</span>
                {metrics.bmi && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${metrics.bmiColor}20`,
                      color: metrics.bmiColor,
                      border: `1px solid ${metrics.bmiColor}40`,
                    }}
                  >
                    {metrics.bmiCategory}
                  </span>
                )}
              </div>
              <span className="pf-metric-hint">Based on height &amp; weight</span>
            </div>

            {/* BMR Card */}
            <div className="pf-metric-card">
              <span className="pf-metric-label">Basal Metabolic Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="pf-metric-val">{metrics.bmr ? metrics.bmr.toLocaleString() : "—"}</span>
                <span className="text-xs text-zinc-400 font-medium">kcal/day</span>
              </div>
              <span className="pf-metric-hint">Cals burned at complete rest</span>
            </div>

            {/* TDEE Card */}
            <div className="pf-metric-card">
              <span className="pf-metric-label">Maintenance (TDEE)</span>
              <div className="flex items-baseline gap-1">
                <span className="pf-metric-val">{metrics.tdee ? metrics.tdee.toLocaleString() : "—"}</span>
                <span className="text-xs text-zinc-400 font-medium">kcal/day</span>
              </div>
              <span className="pf-metric-hint">BMR × Activity Level</span>
            </div>

            {/* Target Daily Calories */}
            <div className="pf-metric-card pf-metric-card--highlight">
              <span className="pf-metric-label text-red-300">Daily Target Calories</span>
              <div className="flex items-baseline gap-1">
                <span className="pf-metric-val text-red-400 font-black">
                  {metrics.targetCalories ? metrics.targetCalories.toLocaleString() : "—"}
                </span>
                <span className="text-xs text-red-300 font-semibold">kcal/day</span>
              </div>
              <span className="pf-metric-hint text-zinc-300">
                {goal === "Maintain Weight"
                  ? "Maintenance diet"
                  : goal === "Lose Weight"
                  ? `~${metrics.dailyDeficit} kcal deficit`
                  : `~${metrics.dailyDeficit} kcal surplus`}
                {metrics.weeklyRate ? ` (${metrics.weeklyRate} kg/wk)` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="pf-form-body" noValidate>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 1: FITNESS GOAL & PACE LOGIC
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">1. Fitness Goal &amp; Timeline Strategy</h2>
                <p className="pf-section-desc">
                  Choose your direction, target change, and select your pace: Slow, Moderate, Fast, or Custom.
                </p>
              </div>
            </div>

            {/* Primary Goal Selector */}
            <div className="pf-field">
              <label className="pf-label">Primary Objective</label>
              <div className="pf-goal-pills">
                {GOAL_OPTIONS.map((g) => {
                  const isActive = goal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setValue("goal", g, { shouldValidate: true });
                        if (g === "Maintain Weight") {
                          setValue("howMuchWeight", "");
                          setValue("inHowManyDays", 0);
                        } else {
                          updatePace(paceMode);
                        }
                      }}
                      className={`pf-goal-pill ${isActive ? "pf-goal-pill--active" : ""}`}
                    >
                      <span className="text-xl">
                        {g === "Lose Weight" ? "🔥" : g === "Gain Weight" ? "💪" : "⚖️"}
                      </span>
                      <div className="text-left">
                        <div className="font-bold text-sm text-white">{g}</div>
                        <div className="text-xs text-zinc-400">
                          {g === "Lose Weight"
                            ? "Fat reduction & cut"
                            : g === "Gain Weight"
                            ? "Muscle build & bulk"
                            : "Body recomp & maintain"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("goal", { required: "Goal is required" })} />
            </div>

            {/* When goal is Lose Weight or Gain Weight */}
            {goal && goal !== "Maintain Weight" && (
              <div className="mt-6 pt-6 border-t border-zinc-800/70 space-y-6">
                {/* Weight Target input */}
                <div className="pf-field">
                  <div className="flex items-center justify-between">
                    <label className="pf-label">
                      {goal === "Lose Weight" ? "Target weight to lose" : "Target weight to gain"}
                    </label>
                    <span className="text-xs text-zinc-400">Recommended: 2 kg – 20 kg</span>
                  </div>
                  <div className="pf-input-affix">
                    <input
                      id="input-howMuchWeight"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      placeholder="e.g. 5"
                      value={howMuchWeight || ""}
                      onChange={handleWeightGoalChange}
                      className="pf-input"
                    />
                    <span className="pf-affix-label">kg</span>
                  </div>
                  {errors.howMuchWeight && (
                    <p className="pf-error-msg">⚠ {errors.howMuchWeight.message}</p>
                  )}
                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">Quick pick:</span>
                    {[3, 5, 8, 10, 15].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setValue("howMuchWeight", val, { shouldValidate: true });
                          if (paceMode !== "other") {
                            const preset = PACE_PRESETS.find((p) => p.id === paceMode);
                            if (preset && preset.rateKgWeek) {
                              const computed = computeDaysForRate(val, preset.rateKgWeek);
                              setValue("inHowManyDays", computed, { shouldValidate: true });
                            }
                          }
                        }}
                        className={`pf-chip-btn ${
                          parseFloat(howMuchWeight) === val ? "pf-chip-btn--active" : ""
                        }`}
                      >
                        {val} kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── PACE SELECTION CARDS ("fast, slow and other") ─────────── */}
                <div className="pf-field">
                  <div className="flex items-center justify-between">
                    <label className="pf-label">Pace &amp; Timeline Strategy</label>
                    <span className="text-xs text-red-400 font-medium">Select speed preference</span>
                  </div>

                  <div className="pf-pace-cards-grid">
                    {PACE_PRESETS.map((preset) => {
                      const isSelected = paceMode === preset.id;
                      const calculatedDays = preset.rateKgWeek
                        ? computeDaysForRate(howMuchWeight, preset.rateKgWeek)
                        : customDays;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updatePace(preset.id)}
                          className={`pf-pace-card ${isSelected ? "pf-pace-card--active" : ""}`}
                        >
                          <div className="pf-pace-card-top">
                            <span className="pf-pace-emoji">{preset.emoji}</span>
                            <span className="pf-pace-tag">{preset.tag}</span>
                          </div>

                          <div className="pf-pace-card-main">
                            <h3 className="pf-pace-title">{preset.label}</h3>
                            <div className="pf-pace-sub">{preset.sublabel}</div>
                            <p className="pf-pace-desc">{preset.desc}</p>
                          </div>

                          <div className="pf-pace-card-footer">
                            {preset.id === "other" ? (
                              <span className="text-xs font-semibold text-zinc-300">
                                {customDays} Days (Custom)
                              </span>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-bold text-white">
                                  ~{calculatedDays} Days
                                </span>
                                <span className="text-[11px] text-zinc-400 font-medium">
                                  {Math.round(calculatedDays / 7)} wks
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── "OTHER" CUSTOM DAYS INPUT ──────────────────────────── */}
                  {paceMode === "other" && (
                    <div className="pf-custom-days-box">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">Custom Target Days</h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Specify the exact number of days to achieve your{" "}
                            {howMuchWeight ? `${howMuchWeight} kg` : "weight"} target.
                          </p>

                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mt-3">
                            <div className="pf-input-affix max-w-[200px]">
                              <input
                                id="input-custom-days"
                                type="number"
                                min="7"
                                max="730"
                                value={customDays}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 7;
                                  setCustomDays(val);
                                  updatePace("other", val);
                                }}
                                className="pf-input font-bold text-base"
                              />
                              <span className="pf-affix-label">Days</span>
                            </div>

                            {/* Quick Days presets */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[30, 45, 60, 90, 120, 180].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setCustomDays(d);
                                    updatePace("other", d);
                                  }}
                                  className={`pf-chip-btn ${
                                    customDays === d ? "pf-chip-btn--active" : ""
                                  }`}
                                >
                                  {d}d (~{Math.round(d / 30)}mo)
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Live Pace Feedback Indicator */}
                          {howMuchWeight > 0 && customDays > 0 && (
                            <div className="mt-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                              <span>
                                Pace required:{" "}
                                <strong className="text-white">
                                  {((howMuchWeight / customDays) * 7).toFixed(2)} kg/week
                                </strong>
                              </span>
                              <span>
                                Daily deficit/surplus:{" "}
                                <strong className="text-red-400">
                                  ~{Math.round((7700 * howMuchWeight) / customDays)} kcal/day
                                </strong>
                              </span>
                              <span className="text-zinc-400">
                                Target Date:{" "}
                                <strong className="text-white">{metrics.finishDateStr}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="hidden"
                    {...register("inHowManyDays", {
                      required: goal !== "Maintain Weight" ? "Pace selection is required" : false,
                      min: { value: 7, message: "Minimum 7 days required" },
                    })}
                  />
                  {errors.inHowManyDays && (
                    <p className="pf-error-msg">⚠ {errors.inHowManyDays.message}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 2: USER IDENTITY & VITALS
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">2. Identity &amp; Vitals</h2>
                <p className="pf-section-desc">Personal profile details and physiological age.</p>
              </div>
            </div>

            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Full Name</label>
                <input
                  id="input-name"
                  type="text"
                  placeholder="e.g. Jeevan Poddar"
                  className="pf-input"
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && <p className="pf-error-msg">⚠ {errors.name.message}</p>}
              </div>

              <div className="pf-field">
                <label className="pf-label">Email Address</label>
                <input
                  id="input-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pf-input"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <p className="pf-error-msg">⚠ {errors.email.message}</p>}
              </div>

              <div className="pf-field">
                <div className="flex items-center justify-between">
                  <label className="pf-label">Date of Birth</label>
                  {dob && (
                    <span className="text-xs text-red-400 font-semibold">
                      Age: {calculateAge(dob)} years
                    </span>
                  )}
                </div>
                <input
                  id="input-dob"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className="pf-input"
                  {...register("dob", { required: "Date of birth is required" })}
                />
                {errors.dob && <p className="pf-error-msg">⚠ {errors.dob.message}</p>}
              </div>

              <div className="pf-field">
                <label className="pf-label">Biological Gender</label>
                <div className="pf-pill-group">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue("gender", g, { shouldValidate: true })}
                      className={`pf-select-pill ${gender === g ? "pf-select-pill--active" : ""}`}
                    >
                      {g === "Male" ? "♂ Male" : g === "Female" ? "♀ Female" : "⚧ Other"}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register("gender", { required: "Gender is required" })} />
                {errors.gender && <p className="pf-error-msg">⚠ {errors.gender.message}</p>}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 3: BODY METRICS
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">3. Body Metrics</h2>
                <p className="pf-section-desc">
                  Used for precise Basal Metabolic Rate (BMR) and daily energy expenditure.
                </p>
              </div>
            </div>

            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label">Current Weight (kg)</label>
                <div className="pf-input-affix">
                  <input
                    id="input-weight"
                    type="number"
                    step="0.1"
                    min="25"
                    max="300"
                    placeholder="e.g. 72.5"
                    className="pf-input"
                    {...register("weight", {
                      required: "Weight is required",
                      min: { value: 25, message: "Min 25 kg" },
                    })}
                  />
                  <span className="pf-affix-label">kg</span>
                </div>
                {errors.weight && <p className="pf-error-msg">⚠ {errors.weight.message}</p>}
              </div>

              <div className="pf-field">
                <label className="pf-label">Height (cm)</label>
                <div className="pf-input-affix">
                  <input
                    id="input-height"
                    type="number"
                    step="0.5"
                    min="80"
                    max="260"
                    placeholder="e.g. 175"
                    className="pf-input"
                    {...register("height", {
                      required: "Height is required",
                      min: { value: 80, message: "Min 80 cm" },
                    })}
                  />
                  <span className="pf-affix-label">cm</span>
                </div>
                {errors.height && <p className="pf-error-msg">⚠ {errors.height.message}</p>}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 4: LIFESTYLE & ACTIVITY LEVEL
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">4. Daily Activity &amp; Lifestyle</h2>
                <p className="pf-section-desc">
                  Determines your baseline non-exercise activity thermogenesis (NEAT).
                </p>
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label">Typical Daily Activity</label>
              <div className="pf-card-select-grid">
                {JOB_OPTIONS.map((opt) => {
                  const isSelected = jobType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("jobType", opt.value, { shouldValidate: true })}
                      className={`pf-select-card ${isSelected ? "pf-select-card--active" : ""}`}
                    >
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-xs text-zinc-400 mt-1">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("jobType", { required: "Activity level is required" })} />
              {errors.jobType && <p className="pf-error-msg">⚠ {errors.jobType.message}</p>}
            </div>

            <div className="pf-field mt-6">
              <label className="pf-label">Kitchen &amp; Cooking Access</label>
              <div className="pf-card-select-grid">
                {KITCHEN_OPTIONS.map((opt) => {
                  const isSelected = watch("kitchen") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("kitchen", opt.value, { shouldValidate: true })}
                      className={`pf-select-card ${isSelected ? "pf-select-card--active" : ""}`}
                    >
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-xs text-zinc-400 mt-1">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("kitchen", { required: "Kitchen setup is required" })} />
              {errors.kitchen && <p className="pf-error-msg">⚠ {errors.kitchen.message}</p>}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 5: DIET & FOOD PREFERENCES
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">5. Diet &amp; Nutrition Preferences</h2>
                <p className="pf-section-desc">
                  Used by the weekly diet generator to suggest ingredients and recipes you love.
                </p>
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label">Diet Category</label>
              <div className="pf-pill-group">
                {FOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue("foodType", opt, { shouldValidate: true })}
                    className={`pf-select-pill ${foodType === opt ? "pf-select-pill--active" : ""}`}
                  >
                    {opt === "Vegetarian" ? "🥦 Vegetarian" : opt === "Non-Vegetarian" ? "🍗 Non-Vegetarian" : "🌱 Vegan"}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("foodType", { required: "Food type is required" })} />
              {errors.foodType && <p className="pf-error-msg">⚠ {errors.foodType.message}</p>}
            </div>

            {/* Non-Veg Options */}
            {foodType === "Non-Vegetarian" && (
              <div className="mt-6 pt-6 border-t border-zinc-800/70 space-y-6">
                <div className="pf-field">
                  <label className="pf-label">Meat &amp; Seafood Preferences (Pick all you eat)</label>
                  <div className="flex flex-wrap gap-2">
                    {MEAT_OPTIONS.map((m) => {
                      const isSelected = meat.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const next = isSelected ? meat.filter((x) => x !== m) : [...meat, m];
                            setValue("meat", next);
                          }}
                          className={`pf-chip-btn ${isSelected ? "pf-chip-btn--active" : ""}`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("meat")} />
                </div>

                <div className="pf-field">
                  <label className="pf-label">Days You Eat Non-Veg</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = meatDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const next = isSelected ? meatDays.filter((x) => x !== d) : [...meatDays, d];
                            setValue("meatPreferenceDays", next);
                          }}
                          className={`pf-chip-btn ${isSelected ? "pf-chip-btn--active" : ""}`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("meatPreferenceDays")} />
                </div>
              </div>
            )}

            <div className="pf-field mt-6">
              <label className="pf-label">Allergies &amp; Dietary Restrictions</label>
              <input
                id="input-allergies"
                type="text"
                placeholder="e.g. Peanuts, lactose, shellfish, gluten (leave blank if none)"
                className="pf-input"
                {...register("allergies")}
              />
              <span className="text-xs text-zinc-500">Excluded automatically from all AI meal suggestions.</span>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 6: LOCATION & REGION
          ════════════════════════════════════════════════════════════════ */}
          <section className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-icon bg-red-950/70 border border-red-800/40 text-red-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="pf-section-title">6. Region &amp; Ingredient Availability</h2>
                <p className="pf-section-desc">Tailors meal plans to local grocery availability and regional dishes.</p>
              </div>
            </div>

            <div className="pf-grid-3">
              <div className="pf-field">
                <label className="pf-label">City</label>
                <input
                  id="input-city"
                  type="text"
                  placeholder="e.g. Mumbai"
                  className="pf-input"
                  {...register("city", { required: "City is required" })}
                />
                {errors.city && <p className="pf-error-msg">⚠ {errors.city.message}</p>}
              </div>

              <div className="pf-field">
                <label className="pf-label">State / Province</label>
                <input
                  id="input-state"
                  type="text"
                  placeholder="e.g. Maharashtra"
                  className="pf-input"
                  {...register("state", { required: "State is required" })}
                />
                {errors.state && <p className="pf-error-msg">⚠ {errors.state.message}</p>}
              </div>

              <div className="pf-field">
                <label className="pf-label">Country</label>
                <input
                  id="input-country"
                  type="text"
                  placeholder="e.g. India"
                  className="pf-input"
                  {...register("country", { required: "Country is required" })}
                />
                {errors.country && <p className="pf-error-msg">⚠ {errors.country.message}</p>}
              </div>
            </div>
          </section>

          {/* ── Desktop & Mobile Submit Bar ───────────────────────────────── */}
          <div className="pf-submit-bar">
            <div className="hidden sm:block text-xs text-zinc-400">
              Changes instantly update calorie targets in your Nutrients dashboard.
            </div>
            <button
              id="btn-save-profile"
              type="submit"
              disabled={saving}
              className="pf-save-btn"
            >
              {saving ? (
                <>
                  <span className="pf-spinner" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Strategy &amp; Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* ── Scoped Styles for Pixel-Perfect Dark & Mobile Presentation ──── */}
      <style jsx>{`
        /* Reset & Container */
        .pf-root {
          min-height: 100vh;
          max-width: 960px;
          margin: 0 auto;
          padding: 1rem 1rem 6rem;
          color: #f4f4f5;
        }
        @media (min-width: 640px) {
          .pf-root {
            padding: 2rem 1.5rem 5rem;
          }
        }

        /* Top Bar */
        .pf-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.25rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pf-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid #27272a;
          color: #d4d4d8;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0.45rem 0.9rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pf-btn-back:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.06);
        }
        .pf-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.3rem 0.75rem;
          border-radius: 9999px;
        }
        .pf-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: pf-pulse 1.8s infinite;
        }
        @keyframes pf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .pf-btn-ghost-sm {
          background: transparent;
          border: 1px solid #27272a;
          color: #a1a1aa;
          font-size: 0.75rem;
          padding: 0.35rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pf-btn-ghost-sm:hover {
          border-color: #71717a;
          color: #fff;
        }

        /* Header Text */
        .pf-header-text {
          margin-bottom: 2rem;
        }
        .pf-main-title {
          font-size: clamp(1.8rem, 4.5vw, 2.75rem);
          font-weight: 900;
          letter-spacing: -0.025em;
          color: #ffffff;
          line-height: 1.15;
          margin: 0;
        }
        .pf-main-desc {
          font-size: 0.925rem;
          color: #a1a1aa;
          max-width: 680px;
          margin-top: 0.5rem;
          line-height: 1.5;
        }

        /* Metabolism Hero Card */
        .pf-metrics-hero {
          background: linear-gradient(135deg, rgba(24, 24, 27, 0.85), rgba(9, 9, 11, 0.95));
          border: 1px solid #27272a;
          border-radius: 1.25rem;
          padding: 1.25rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
        }
        .pf-metrics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .pf-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .pf-metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .pf-metric-card {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.875rem;
          padding: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .pf-metric-card--highlight {
          background: rgba(220, 38, 38, 0.08);
          border-color: rgba(220, 38, 38, 0.35);
        }
        .pf-metric-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pf-metric-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
        }
        .pf-metric-hint {
          font-size: 0.68rem;
          color: #71717a;
          margin-top: 0.15rem;
        }

        /* Sections */
        .pf-form-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .pf-section {
          background: rgba(18, 18, 20, 0.8);
          border: 1px solid #27272a;
          border-radius: 1.25rem;
          padding: 1.25rem;
          backdrop-filter: blur(10px);
          transition: border-color 0.2s;
        }
        @media (min-width: 640px) {
          .pf-section {
            padding: 1.75rem;
          }
        }
        .pf-section:hover {
          border-color: #3f3f46;
        }
        .pf-section-head {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .pf-section-icon {
          width: 38px;
          height: 38px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          shrink: 0;
        }
        .pf-section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0;
        }
        .pf-section-desc {
          font-size: 0.8rem;
          color: #a1a1aa;
          margin: 0.2rem 0 0;
          line-height: 1.4;
        }

        /* Fields & Inputs */
        .pf-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .pf-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: #e4e4e7;
          letter-spacing: 0.02em;
        }
        .pf-input-affix {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pf-input {
          width: 100%;
          background: #09090b !important;
          border: 1px solid #27272a !important;
          color: #ffffff !important;
          font-size: 16px !important; /* Critical 16px prevents iOS Safari auto-zoom */
          padding: 0.7rem 0.9rem !important;
          border-radius: 0.75rem !important;
          outline: none;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }
        .pf-input:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25) !important;
        }
        .pf-affix-label {
          position: absolute;
          right: 0.9rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #71717a;
          pointer-events: none;
        }
        .pf-error-msg {
          font-size: 0.75rem;
          color: #f87171;
          margin: 0.1rem 0 0;
        }

        /* Grids */
        .pf-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 600px) {
          .pf-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pf-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .pf-grid-3 {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }

        /* Goal Pills */
        .pf-goal-pills {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 600px) {
          .pf-goal-pills {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .pf-goal-pill {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #09090b !important;
          border: 1px solid #27272a !important;
          border-radius: 0.875rem !important;
          padding: 0.875rem 1rem !important;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        .pf-goal-pill:hover {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
          transform: translateY(-1px);
        }
        .pf-goal-pill--active {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.12) !important;
          box-shadow: 0 0 0 1.5px #ef4444, 0 4px 16px rgba(239, 68, 68, 0.2) !important;
        }

        /* Pace Cards Grid ("fast, slow and other") */
        .pf-pace-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }
        @media (min-width: 480px) {
          .pf-pace-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .pf-pace-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .pf-pace-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #09090b !important;
          border: 1px solid #27272a !important;
          border-radius: 1rem !important;
          padding: 1rem !important;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          min-height: 160px;
          gap: 0.75rem;
        }
        .pf-pace-card:hover {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.04) !important;
          transform: translateY(-2px);
        }
        .pf-pace-card--active {
          border-color: #ef4444 !important;
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.14), rgba(9, 9, 11, 0.9)) !important;
          box-shadow: 0 0 0 1.5px #ef4444, 0 8px 24px rgba(239, 68, 68, 0.2) !important;
          transform: translateY(-2px);
        }
        .pf-pace-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .pf-pace-emoji {
          font-size: 1.5rem;
        }
        .pf-pace-tag {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          background: rgba(255, 255, 255, 0.06);
          color: #a1a1aa;
        }
        .pf-pace-card--active .pf-pace-tag {
          background: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }
        .pf-pace-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .pf-pace-sub {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ef4444;
          margin-top: 0.15rem;
        }
        .pf-pace-desc {
          font-size: 0.7rem;
          color: #71717a;
          line-height: 1.35;
          margin: 0.35rem 0 0;
        }
        .pf-pace-card--active .pf-pace-desc {
          color: #d4d4d8;
        }
        .pf-pace-card-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 0.6rem;
          margin-top: auto;
          width: 100%;
        }

        /* Custom Days Box */
        .pf-custom-days-box {
          background: rgba(24, 24, 27, 0.6);
          border: 1px dashed #ef4444;
          border-radius: 1rem;
          padding: 1.25rem;
          margin-top: 0.75rem;
          animation: pf-fade-in 0.25s ease;
        }
        @keyframes pf-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Generic Pills & Chips */
        .pf-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .pf-select-pill {
          background: #09090b !important;
          border: 1px solid #27272a !important;
          color: #d4d4d8 !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          padding: 0.65rem 1.2rem !important;
          border-radius: 0.75rem !important;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pf-select-pill:hover {
          border-color: #ef4444 !important;
          color: #ffffff !important;
        }
        .pf-select-pill--active {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #fca5a5 !important;
          box-shadow: 0 0 0 1px #ef4444 !important;
        }

        .pf-chip-btn {
          background: #09090b !important;
          border: 1px solid #27272a !important;
          color: #a1a1aa !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          padding: 0.35rem 0.75rem !important;
          border-radius: 9999px !important;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pf-chip-btn:hover {
          border-color: #71717a !important;
          color: #fff !important;
        }
        .pf-chip-btn--active {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.2) !important;
          color: #fca5a5 !important;
        }

        /* Select Cards Grid (Job & Kitchen) */
        .pf-card-select-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.65rem;
        }
        @media (min-width: 600px) {
          .pf-card-select-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pf-select-card {
          background: #09090b !important;
          border: 1px solid #27272a !important;
          border-radius: 0.875rem !important;
          padding: 0.875rem 1rem !important;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          width: 100%;
        }
        .pf-select-card:hover {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.04) !important;
        }
        .pf-select-card--active {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.12) !important;
          box-shadow: 0 0 0 1.5px #ef4444 !important;
        }

        /* Submit Bar (Fixed on mobile, clean on desktop) */
        .pf-submit-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.25rem 0;
          margin-top: 1rem;
        }
        @media (max-width: 639px) {
          .pf-submit-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(9, 9, 11, 0.92);
            backdrop-filter: blur(16px);
            border-top: 1px solid #27272a;
            padding: 0.875rem 1rem;
            margin: 0;
            z-index: 50;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
          }
        }
        .pf-save-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #ef4444, #b91c1c) !important;
          color: #ffffff !important;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          padding: 0.8rem 2rem !important;
          border-radius: 0.875rem !important;
          border: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(239, 68, 68, 0.35);
          width: 100%;
        }
        @media (min-width: 640px) {
          .pf-save-btn {
            width: auto;
            min-width: 220px;
          }
        }
        .pf-save-btn:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.5);
        }
        .pf-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Spinner */
        .pf-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.25);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: pf-spin 0.65s linear infinite;
        }
        @keyframes pf-spin {
          to { transform: rotate(360deg); }
        }

        /* Toast */
        .pf-toast {
          position: fixed;
          top: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          background: #09090b;
          border-radius: 1rem;
          padding: 0.85rem 1.25rem;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6);
          animation: pf-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 90vw;
        }
        .pf-toast--success {
          border: 1px solid #16a34a;
          background: linear-gradient(135deg, #052e16, #09090b);
        }
        .pf-toast--error {
          border: 1px solid #dc2626;
          background: linear-gradient(135deg, #450a0a, #09090b);
        }
        @keyframes pf-toast-in {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}
