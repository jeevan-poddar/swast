"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ACTIVITIES_CATALOG, getMETForActivity } from "@/lib/activitiesCatalog";
import {
  Dumbbell,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  Flame,
  X,
  CheckCircle2,
  AlertCircle,
  Activity as ActivityIcon,
  Sparkles,
} from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const POPULAR_ACTIVITIES = [
  "Weight Training",
  "Running / Jogging",
  "Brisk Walking",
  "Cycling",
  "HIIT Workout",
  "Swimming",
  "Yoga / Mobility",
  "Football / Soccer",
  "Badminton",
  "Boxing / Martial Arts",
];

export default function ActivityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activityList, setActivityList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      activityName: "",
      duration: 45,
      startTime: "07:00",
      days: ["Monday", "Wednesday", "Friday"],
    },
  });

  const selectedDays = watch("days") || [];
  const durationVal = watch("duration") || 45;

  const fetchActivities = async () => {
    if (!session?.user?._id) return;
    try {
      setLoading(true);
      const res = await fetch("/api/activityFetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user._id }),
      });
      const data = await res.json();
      setActivityList(data.activities || []);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setToast({ type: "error", msg: "Failed to fetch activities." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?._id) {
      fetchActivities();
    }
  }, [session]);

  const openAddModal = () => {
    reset({
      activityName: "",
      duration: 45,
      startTime: "07:00",
      days: ["Monday", "Wednesday", "Friday"],
    });
    setEditingActivityId(null);
    setModalMode("add");
  };

  const openEditModal = (activity) => {
    setEditingActivityId(activity._id);
    reset({
      activityName: activity.activityName,
      duration: activity.duration,
      startTime: activity.startTime,
      days: Array.isArray(activity.days) ? activity.days : [],
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingActivityId(null);
  };

  const handleFormSubmit = async (formData) => {
    if (!selectedDays || selectedDays.length === 0) {
      setToast({ type: "error", msg: "Please select at least one day." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        days: selectedDays,
        function: modalMode, // 'add' or 'edit'
        index: editingActivityId,
        _id: session?.user?._id,
        userId: session?.user?._id,
      };

      const res = await fetch("/api/activityUpdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", msg: json.message || "Failed to save activity" });
      } else {
        setToast({
          type: "success",
          msg: modalMode === "add" ? "Activity added successfully!" : "Activity updated!",
        });
        closeModal();
        fetchActivities();
      }
    } catch (err) {
      setToast({ type: "error", msg: "Network error saving activity." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleDelete = async (activityId) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const res = await fetch("/api/activityUpdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: "delete",
          index: activityId,
        }),
      });
      if (res.ok) {
        setToast({ type: "success", msg: "Activity removed." });
        fetchActivities();
      } else {
        setToast({ type: "error", msg: "Failed to delete activity." });
      }
    } catch {
      setToast({ type: "error", msg: "Network error deleting activity." });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleDay = (day) => {
    const current = selectedDays || [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setValue("days", next, { shouldValidate: true });
  };

  const setDaysPreset = (preset) => {
    if (preset === "all") setValue("days", DAYS_OF_WEEK);
    else if (preset === "weekdays") setValue("days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    else if (preset === "weekends") setValue("days", ["Saturday", "Sunday"]);
  };

  // Calculations for summary stats
  const totalWeeklySessions = activityList.reduce((acc, act) => acc + (act.days?.length || 0), 0);
  const totalWeeklyMinutes = activityList.reduce((acc, act) => acc + (Number(act.duration) || 0) * (act.days?.length || 0), 0);
  const estimatedWeeklyBurn = Math.round(totalWeeklyMinutes * 7.5); // ~7.5 kcal/min avg

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

      {/* ── Navigation & Header ────────────────────────────────────────── */}
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
            <span className="text-xs uppercase tracking-wider font-bold text-orange-500">
              Workouts &amp; Habits
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Activity</span>
        </button>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Daily Workout Schedule</h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
          Log your training sessions and active habits. Swast automatically factors the metabolic equivalent of task (MET) into your daily calorie target.
        </p>
      </div>

      {/* ── Summary Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-950/60 border border-orange-800/40 text-orange-400 flex items-center justify-center shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Weekly Sessions</div>
            <div className="text-2xl font-black text-white">{totalWeeklySessions}</div>
            <div className="text-[11px] text-zinc-500">{activityList.length} unique activities</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Time</div>
            <div className="text-2xl font-black text-white">{totalWeeklyMinutes} <span className="text-xs font-normal text-zinc-400">min/wk</span></div>
            <div className="text-[11px] text-zinc-500">~{Math.round(totalWeeklyMinutes / 7)} min daily avg</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-red-950/30 border border-red-800/40 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700/50 text-red-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-red-300 uppercase tracking-wider">Est. Workout Burn</div>
            <div className="text-2xl font-black text-red-400">{estimatedWeeklyBurn.toLocaleString()} <span className="text-xs font-normal text-red-300">kcal/wk</span></div>
            <div className="text-[11px] text-zinc-400">Adds to daily nutrient budget</div>
          </div>
        </div>
      </div>

      {/* ── Activity List / Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl bg-zinc-950/50 border border-zinc-800/80">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-400">Loading activities...</p>
        </div>
      ) : activityList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-zinc-950/60 border border-dashed border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-red-950/40 border border-red-900/50 text-red-400 flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Activities Scheduled</h3>
          <p className="text-sm text-zinc-400 max-w-md mt-1 mb-6">
            Add your regular workouts, sports, or walking habits to personalize your daily metabolic burn.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Activity</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityList.map((activity, idx) => {
            const daysCount = activity.days?.length || 0;
            const burnEst = Math.round((Number(activity.duration) || 0) * 7.5);

            return (
              <div
                key={activity._id || idx}
                className="group relative rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 backdrop-blur-xl hover:border-red-600/60 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-800/30 text-orange-400 flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-red-400 transition-colors">
                          {activity.activityName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {activity.duration} mins
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-red-500" />
                            ~{burnEst} kcal
                          </span>
                          {activity.startTime && (
                            <>
                              <span>•</span>
                              <span>{activity.startTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(activity)}
                        className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
                        title="Edit Activity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(activity._id)}
                        className="p-2 rounded-xl bg-zinc-900/80 hover:bg-red-950/80 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Weekdays Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isActive = activity.days?.includes(d);
                      return (
                        <span
                          key={d}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                            isActive
                              ? "bg-red-950/70 border border-red-700/60 text-red-300"
                              : "bg-zinc-900/50 border border-zinc-800/40 text-zinc-600"
                          }`}
                        >
                          {d.slice(0, 3)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                  <span>{daysCount} {daysCount === 1 ? "day" : "days"} / week</span>
                  <span className="text-zinc-400 font-medium">
                    {(Number(activity.duration) || 0) * daysCount} min weekly total
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-7 shadow-2xl shadow-red-950/50 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {modalMode === "add" ? "Add New Activity" : "Edit Activity"}
                </h3>
                <p className="text-xs text-zinc-400">Configure duration and active days.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
              {/* Activity Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weight Training, Running"
                  {...register("activityName", { required: "Activity name is required" })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-base focus:border-red-500 outline-none transition"
                />
                {errors.activityName && (
                  <p className="text-xs text-red-400 mt-1">⚠ {errors.activityName.message}</p>
                )}

                {/* Popular chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-500 self-center">Popular:</span>
                  {POPULAR_ACTIVITIES.slice(0, 5).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setValue("activityName", act, { shouldValidate: true })}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration and Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    {...register("duration", { required: "Duration is required", min: 5 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-base focus:border-red-500 outline-none transition"
                  />
                  {/* Quick duration chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setValue("duration", mins)}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          Number(durationVal) === mins
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : "bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    {...register("startTime", { required: "Start time is required" })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-base focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Days Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Active Days ({selectedDays.length} selected)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDaysPreset("weekdays")}
                      className="text-[10px] text-zinc-400 hover:text-red-400"
                    >
                      Weekdays
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setDaysPreset("all")}
                      className="text-[10px] text-zinc-400 hover:text-red-400"
                    >
                      Everyday
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? "bg-red-600 text-white shadow-md shadow-red-950"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated burn preview */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 text-xs text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Estimated burn per session:
                </span>
                <span className="font-bold text-white">
                  ~{Math.round((Number(durationVal) || 0) * 7.5)} kcal
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-800/70">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-950/50 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Save Activity" : "Update Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
