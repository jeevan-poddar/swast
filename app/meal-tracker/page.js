"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { calculateNutrients } from "@/action/nutirentCalculation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Loader2,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Flame,
  Activity,
  Calendar,
  Utensils,
  Sparkles,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const NUTRIENT_FIELDS = [
  "kcal",
  "protein",
  "carbs",
  "fats",
  "fiber_g",
  "water_L",
  "sodium_mg",
  "potassium_mg",
  "magnesium_mg",
  "iron_mg",
  "calcium_mg",
  "vitamin_D_mcg",
  "vitamin_B12_mcg",
  "omega_3_mg",
  "antioxidant_VitE_mg",
];

const PROGRESS_METRICS = [
  { key: "kcal", label: "Calories", unit: "kcal", target: (t) => t.calories },
  { key: "protein", label: "Protein", unit: "g", target: (t) => t.macros?.protein_g },
  { key: "carbs", label: "Carbs", unit: "g", target: (t) => t.macros?.carbs_g },
  { key: "fats", label: "Fats", unit: "g", target: (t) => t.macros?.fats_g },
  { key: "fiber_g", label: "Fiber", unit: "g", target: (t) => t.micros?.fiber_g },
  { key: "water_L", label: "Water", unit: "L", target: (t) => t.micros?.water_L },
  { key: "sodium_mg", label: "Sodium", unit: "mg", target: (t) => t.micros?.sodium_mg },
  { key: "potassium_mg", label: "Potassium", unit: "mg", target: (t) => t.micros?.potassium_mg },
  { key: "magnesium_mg", label: "Magnesium", unit: "mg", target: (t) => t.micros?.magnesium_mg },
  { key: "iron_mg", label: "Iron", unit: "mg", target: (t) => t.micros?.iron_mg },
  { key: "calcium_mg", label: "Calcium", unit: "mg", target: (t) => t.micros?.calcium_mg },
  { key: "vitamin_D_mcg", label: "Vitamin D", unit: "mcg", target: (t) => t.micros?.vitamin_D_mcg },
  { key: "vitamin_B12_mcg", label: "Vitamin B12", unit: "mcg", target: (t) => t.micros?.vitamin_B12_mcg },
  { key: "omega_3_mg", label: "Omega-3", unit: "mg", target: (t) => t.micros?.omega_3_mg },
  { key: "antioxidant_VitE_mg", label: "Vitamin E", unit: "mg", target: (t) => t.micros?.antioxidant_VitE_mg },
];

export default function MealTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // YYYY-MM-DD
  const [dayLog, setDayLog] = useState(null);
  const [weeklyTargets, setWeeklyTargets] = useState(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Report Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [newMealName, setNewMealName] = useState("");
  const [isAddingMeal, setIsAddingMeal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?._id) {
      loadMonthData();
      if (!weeklyTargets) loadNutrients();
    }
  }, [currentDate, session]);

  // Set default selected day to today
  useEffect(() => {
    if (!selectedDay) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDay(today);
    }
  }, []);

  useEffect(() => {
    if (selectedDay && session?.user?._id) {
      loadDayLog(selectedDay);
    }
  }, [selectedDay, session]);

  const loadNutrients = async () => {
    try {
      const data = await calculateNutrients(session.user._id);
      setWeeklyTargets(data);
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not update this meal." });
    }
  };

  const loadMonthData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(
        `/api/meal-log/month?userId=${session.user._id}&year=${year}&month=${month}`
      );
      if (res.ok) setMonthData(await res.json());
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not remove this meal." });
    }
  };

  const loadDayLog = async (dateStr) => {
    try {
      const res = await fetch(
        `/api/meal-log?userId=${session.user._id}&date=${dateStr}`
      );
      if (res.ok) setDayLog(await res.json());
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not add this meal." });
    }
  };

  // Calendar Math
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const calendarCells = Array.from({ length: 42 });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getLogForDate = (dateStr) => {
    return monthData.find((d) => d.date === dateStr);
  };

  const StatusDot = ({ status }) => {
    if (status === "eaten") return <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />;
    if (status === "not_eaten") return <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />;
    return <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />;
  };

  const currentDayOfWeekName = selectedDay ? DAYS_OF_WEEK[new Date(selectedDay).getDay()] : null;
  const currentTarget = weeklyTargets && currentDayOfWeekName ? weeklyTargets[currentDayOfWeekName] : null;

  const getErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => null);
    return data?.error || fallback;
  };

  const updateMealStatus = async (mealType, status) => {
    try {
      const payload = { userId: session.user._id, date: selectedDay, mealType, status };
      const res = await fetch("/api/meal-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadDayLog(selectedDay);
        await loadMonthData();
        setToast({ type: "success", msg: `Marked ${mealType} as ${status === "eaten" ? "completed" : "skipped"}.` });
      } else {
        setToast({ type: "error", msg: await getErrorMessage(res, "Could not update this meal.") });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not update this meal." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const deleteMeal = async (mealType) => {
    if (!confirm(`Are you sure you want to remove ${mealType}?`)) return;
    try {
      const res = await fetch(
        `/api/meal-log?userId=${session.user._id}&date=${selectedDay}&mealType=${mealType}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await loadDayLog(selectedDay);
        await loadMonthData();
        setToast({ type: "success", msg: `Removed ${mealType}` });
      } else {
        setToast({ type: "error", msg: await getErrorMessage(res, "Could not remove this meal.") });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not remove this meal." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const addNewMeal = async () => {
    if (!newMealName.trim()) return;
    const mealType = newMealName.trim().toLowerCase();
    try {
      const payload = { userId: session.user._id, date: selectedDay, mealType, status: "not_reported" };
      const res = await fetch("/api/meal-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNewMealName("");
        setIsAddingMeal(false);
        await loadDayLog(selectedDay);
        await loadMonthData();
      } else {
        setToast({ type: "error", msg: await getErrorMessage(res, "Could not add this meal.") });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Could not add this meal." });
    }
  };

  const openReportModal = (mealType) => {
    setActiveMealType(mealType);
    setScannedItems(dayLog?.[mealType]?.items || []);
    setPhotoSelected(false);
    setIsScanning(false);
    setIsModalOpen(true);
  };

  const handleSimulateUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoSelected(true);
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/detect-food", { method: "POST", body: formData });
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Could not detect food in this image."));
      }
      const detectedFoods = await res.json();
      if (!detectedFoods.length) throw new Error("No food was detected in this image.");
      const fullItems = [];
      for (const food of detectedFoods) {
        const calcRes = await fetch("/api/calculate-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: food.name,
            quantity: food.quantity,
            unit: food.unit,
          }),
        });
        if (!calcRes.ok) {
          throw new Error(await getErrorMessage(calcRes, `Could not calculate ${food.name}.`));
        }
        fullItems.push(await calcRes.json());
      }
      setScannedItems((prev) => [...prev, ...fullItems]);
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: e.message || "Could not scan this image." });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSearch = async (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      try {
        const res = await fetch("/api/calculate-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodName: searchQuery.trim(), quantity: 100 }),
        });
        if (res.ok) {
          const newItem = await res.json();
          setScannedItems((prev) => [...prev, newItem]);
          setSearchQuery("");
        } else {
          setToast({ type: "error", msg: await getErrorMessage(res, "Could not find that food.") });
        }
      } catch (error) {
        console.error(error);
        setToast({ type: "error", msg: "Could not find that food." });
      }
    }
  };

  const updateScannedItemQty = (id, val) => {
    setScannedItems((items) =>
      items.map((i) => (i.id === id ? { ...i, userInput: val } : i))
    );
  };

  const removeScannedItem = (id) => {
    setScannedItems((items) => items.filter((i) => i.id !== id));
  };

  const sumNutrients = (itemsToSum) => {
    const sums = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, 0]));
    itemsToSum.forEach((i) => {
      const ratio = (Number(i.userInput) || 0) / (i.baseAmount || 100);
      NUTRIENT_FIELDS.forEach((field) => {
        const value = field === "fats" ? i.fat ?? i.fats : i[field];
        sums[field] += (Number(value) || 0) * ratio;
      });
    });
    Object.keys(sums).forEach((k) => (sums[k] = Math.round(sums[k] * 10) / 10));
    return sums;
  };

  const saveMealLog = async () => {
    setIsSaving(true);
    try {
      const totalNutrients = sumNutrients(scannedItems);
      const payload = {
        userId: session.user._id,
        date: selectedDay,
        mealType: activeMealType,
        status: "eaten",
        items: scannedItems,
        totalNutrients,
      };
      const res = await fetch("/api/meal-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        await loadDayLog(selectedDay);
        await loadMonthData();
        setToast({ type: "success", msg: "Meal log saved successfully!" });
      } else {
        setToast({ type: "error", msg: await getErrorMessage(res, "Could not save this meal.") });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "Error saving meal log." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Day totals progress calculation
  const dayTotals = useMemo(() => {
    if (!dayLog || !currentTarget) return null;
    const sums = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, 0]));
    const mealsList = dayLog.mealsList || ["breakfast", "lunch", "dinner"];
    mealsList.forEach((m) => {
      const nutrients = dayLog[m]?.totalNutrients ?? dayLog[m]?.total_nutrients;
      if (dayLog[m]?.status === "eaten" && nutrients) {
        NUTRIENT_FIELDS.forEach((field) => {
          const value = field === "fats" ? nutrients.fats ?? nutrients.fat : nutrients[field];
          sums[field] += Number(value) || 0;
        });
      }
    });
    return Object.fromEntries(
      Object.entries(sums).map(([field, value]) => [field, Math.round(value * 10) / 10]),
    );
  }, [dayLog, currentTarget]);

  const progressMetrics = useMemo(() => {
    if (!dayTotals || !currentTarget) return [];

    return PROGRESS_METRICS.map((metric) => ({
      ...metric,
      value: dayTotals[metric.key] || 0,
      targetValue: metric.target(currentTarget) || 0,
    }));
  }, [currentTarget, dayTotals]);

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-6 text-zinc-100">
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
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">
              Dietary Consistency Engine
            </span>
          </div>
        </div>

        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Eaten</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Skipped</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600" /> Pending</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Meal Log &amp; Adherence Calendar</h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
          Track meal completion against daily calorie targets. Select any date to inspect foods or report consumed meals.
        </p>
      </div>

      {/* ── Main Two-Column Calendar & Day Detail Layout ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-800/70">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              <span>
                {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition border border-zinc-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition border border-zinc-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-xs font-bold uppercase tracking-wider text-zinc-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;

              if (!isCurrentMonth) {
                return <div key={i} className="min-h-[70px] sm:min-h-[85px] rounded-2xl bg-zinc-950/30 border border-transparent opacity-20" />;
              }

              const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
              const log = getLogForDate(dateStr);
              const isSelected = selectedDay === dateStr;

              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDay(dateStr);
                    setIsDayPanelOpen(true);
                  }}
                  className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-red-950/50 border-red-500 shadow-lg shadow-red-950/50"
                      : "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? "text-red-400" : "text-zinc-300"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Meal Status Dots */}
                  <div className="flex items-center justify-center gap-1 flex-wrap mt-auto">
                    {(log?.mealsList || ["breakfast", "lunch", "dinner"]).map((m) => (
                      <StatusDot key={m} status={log?.[m]?.status} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Selected Day Meal Protocol (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
          <div className="pb-4 border-b border-zinc-800/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Daily Breakdown
              </span>
              <h3 className="text-xl font-black text-white">
                {selectedDay
                  ? new Date(selectedDay).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select a date"}
              </h3>
            </div>
            {currentTarget && (
              <span className="text-xs font-bold text-red-400 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40">
                {currentTarget.calories} kcal Goal
              </span>
            )}
          </div>

          {/* Daily nutrient progress */}
          {currentTarget && dayTotals && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Nutrient progress</span>
                <span className="text-[11px] text-zinc-500">Consumed / daily target</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {progressMetrics.map((metric) => (
                  <div key={metric.key}>
                    <div className="flex justify-between gap-2 text-[11px] font-bold text-zinc-300 mb-1">
                      <span>{metric.label}</span>
                      <span className="text-zinc-400 whitespace-nowrap">
                        {metric.value} / {metric.targetValue} {metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all"
                        style={{
                          width: `${metric.targetValue > 0 ? Math.min((metric.value / metric.targetValue) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meals List for Day */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {(dayLog?.mealsList || ["breakfast", "lunch", "dinner"]).map((meal) => {
              const mealStatus = dayLog?.[meal]?.status || "not_reported";
              const mealCalories = dayLog?.[meal]?.totalNutrients?.kcal || 0;

              return (
                <div
                  key={meal}
                  className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mealStatus === "eaten" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : mealStatus === "not_eaten" ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-zinc-500" />
                      )}
                      <h4 className="font-bold text-base text-white capitalize">{meal}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {mealStatus === "eaten" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          {mealCalories} kcal
                        </span>
                      )}
                      <button
                        onClick={() => deleteMeal(meal)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition"
                        title="Delete meal slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions for Meal */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/40">
                    <button
                      onClick={() => openReportModal(meal)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-red-950 transition text-center"
                    >
                      {mealStatus === "eaten" ? "Edit Logged Food" : "Report Meal"}
                    </button>
                    {mealStatus !== "not_eaten" && (
                      <button
                        onClick={() => updateMealStatus(meal, "not_eaten")}
                        className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 font-semibold text-xs transition"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Meal Slot Input */}
          <div className="pt-2">
            {isAddingMeal ? (
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-900 border border-zinc-800">
                <input
                  type="text"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="e.g. Afternoon Snack, Pre-workout"
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && addNewMeal()}
                />
                <button
                  onClick={addNewMeal}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingMeal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingMeal(true)}
                className="w-full py-2.5 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-400 hover:text-white transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Meal Slot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL: Report Food for Meal ────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-white capitalize">
                  Log Foods for {activeMealType}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {/* Scan photo button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleSimulateUpload}
                disabled={isScanning}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-red-600/70 bg-zinc-900/40 text-center flex flex-col items-center justify-center transition"
              >
                {isScanning ? (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning meal photo...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
                    <Camera className="w-4 h-4 text-red-500" />
                    <span>Snap Photo / Upload Food Picture</span>
                  </div>
                )}
              </button>

              {/* Manual search bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleManualSearch}
                  placeholder="Or type food & hit Enter (e.g. 100g Chicken, Brown Rice)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              {/* Scanned Items List */}
              <div className="space-y-2">
                {scannedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{item.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {item.kcal} kcal per {item.baseUnitLabel || "100g"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.userInput || 100}
                        onChange={(e) => updateScannedItemQty(item.id, e.target.value)}
                        className="w-16 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-center text-xs text-white"
                      />
                      <span className="text-xs text-zinc-500 w-6">{item.unitType || "g"}</span>
                      <button
                        onClick={() => removeScannedItem(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Save Bar */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                Total: <strong className="text-white">{sumNutrients(scannedItems).kcal} kcal</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMealLog}
                  disabled={isSaving || scannedItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs shadow-lg shadow-red-950 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save to Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
