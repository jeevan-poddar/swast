"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Trash2,
  Search,
  Camera,
  Loader2,
  ChevronLeft,
  Flame,
  Activity,
  Zap,
  Shield,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Utensils,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function DetectFoodPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [selectedImageURLs, setSelectedImageURLs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSavingToLog, setIsSavingToLog] = useState(false);
  const [targetMealSlot, setTargetMealSlot] = useState("lunch"); // breakfast | lunch | dinner

  const fileInputRef = useRef(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      selectedImageURLs.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImageURLs]);

  // Totals Calculation
  const totals = useMemo(() => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    items.forEach((item) => {
      const input = Number(item.userInput);
      if (!isNaN(input) && input > 0) {
        const ratio = input / (item.baseAmount || 100);
        totalKcal += (item.kcal || 0) * ratio;
        totalProtein += (item.protein || 0) * ratio;
        totalCarbs += (item.carbs || 0) * ratio;
        totalFat += (item.fat || 0) * ratio;
        totalFiber += (item.fiber_g || 0) * ratio;
      }
    });

    return {
      kcal: Math.round(totalKcal),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
    };
  }, [items]);

  const handleSimulateUpload = () => {
    if (isScanning) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotoSelected(true);
    setSelectedFiles((prev) => [...prev, ...files]);
    setSelectedImageURLs((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    setHasAnalyzed(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setItems([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("file", file));

      // 1. Detect food names via Gemini Vision
      const res = await fetch("/api/detect-food", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Could not detect food in image");
      const detectedFoods = await res.json();

      if (!Array.isArray(detectedFoods) || detectedFoods.length === 0) {
        setToast({ type: "error", msg: "No recognizable food found in the image. Try another photo." });
        setIsScanning(false);
        return;
      }

      // 2. Calculate nutrition for each detected food
      const resolvedItems = [];
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

        if (calcRes.ok) {
          const itemData = await calcRes.json();
          resolvedItems.push(itemData);
        }
      }

      setItems(resolvedItems);
      setHasAnalyzed(true);
      setToast({ type: "success", msg: `Detected ${resolvedItems.length} food items!` });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", msg: "AI detection failed. You can search food manually below." });
    } finally {
      setIsScanning(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/calculate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: searchQuery.trim(), quantity: 100 }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [...prev, newItem]);
        setSearchQuery("");
        setToast({ type: "success", msg: `Added ${newItem.name}` });
      } else {
        setToast({ type: "error", msg: "Could not find nutrition data for this food." });
      }
    } catch {
      setToast({ type: "error", msg: "Error searching food." });
    } finally {
      setIsSearching(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleQuantityChange = (id, newAmount) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, userInput: Math.max(0, newAmount) } : item
      )
    );
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setSelectedImageURLs([]);
    setItems([]);
    setPhotoSelected(false);
    setHasAnalyzed(false);
  };

  // Save detected foods into today's meal log
  const handleSaveToMealLog = async () => {
    if (!session?.user?._id) {
      router.push("/signin");
      return;
    }
    if (items.length === 0) return;

    setIsSavingToLog(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/meal-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user._id,
          date: todayStr,
          mealType: targetMealSlot,
          items: items,
          totalNutrients: totals,
          status: "eaten",
        }),
      });

      if (res.ok) {
        setToast({
          type: "success",
          msg: `Logged successfully to Today's ${targetMealSlot.toUpperCase()}!`,
        });
      } else {
        setToast({ type: "error", msg: "Failed to log meal." });
      }
    } catch {
      setToast({ type: "error", msg: "Network error saving meal." });
    } finally {
      setIsSavingToLog(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <main className="min-h-screen max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-6 text-zinc-100">
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

      {/* ── Header & Navigation ────────────────────────────────────────── */}
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
            <span className="text-xs uppercase tracking-wider font-bold text-pink-500">
              Gemini Vision AI
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push("/meal-tracker")}
          className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View Meal Tracker Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">AI Meal &amp; Calorie Scanner</h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
          Upload or capture a photo of your meal. The computer vision model automatically identifies dishes and decomposes macronutrients.
        </p>
      </div>

      {/* ── Upload & Scanner Dropzone ─────────────────────────────────── */}
      <section className="relative rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-xl overflow-hidden shadow-2xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedImageURLs.length === 0 ? (
          <div
            onClick={handleSimulateUpload}
            className="group cursor-pointer border-2 border-dashed border-zinc-800 hover:border-red-600/70 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all bg-zinc-900/40 hover:bg-zinc-900/80"
          >
            <div className="w-16 h-16 rounded-3xl bg-red-950/50 border border-red-800/40 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Snap Photo or Drag &amp; Drop Meal Image
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-4">
              Supports JPEG, PNG, WEBP. You can upload single or multiple food shots.
            </p>
            <span className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition">
              Choose Photo
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview Grid */}
            <div className="flex flex-wrap gap-3">
              {selectedImageURLs.map((url, i) => (
                <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}

              <button
                type="button"
                onClick={handleSimulateUpload}
                disabled={isScanning}
                className="w-28 h-28 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-semibold">Add More</span>
              </button>
            </div>

            {/* Scan Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/70">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isScanning}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-950/60 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Ingredients...</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Analyze Meal with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Manual Add / Search Bar ───────────────────────────────────── */}
      <section className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md">
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add food item manually (e.g. 2 Boiled Eggs, 100g Paneer, Whey Protein)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-red-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-xs transition disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Item"}
          </button>
        </form>
      </section>

      {/* ── Nutrition Totals Snapshot HUD ──────────────────────────────── */}
      {items.length > 0 && (
        <section className="p-6 rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border border-red-900/40 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800/70">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-400">Total Scanned Meal</div>
              <h2 className="text-2xl font-black text-white">{items.length} Items Configured</h2>
            </div>

            {/* Meal Slot Picker & Log Action */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={targetMealSlot}
                onChange={(e) => setTargetMealSlot(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 outline-none focus:border-red-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>

              <button
                type="button"
                onClick={handleSaveToMealLog}
                disabled={isSavingToLog}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-950 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingToLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Log to Meal Tracker</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex flex-col">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Energy</span>
              <span className="text-2xl font-black text-white mt-1">
                {totals.kcal} <span className="text-xs font-normal text-zinc-400">kcal</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/30 flex flex-col">
              <span className="text-[11px] font-semibold text-red-400 uppercase">Protein</span>
              <span className="text-2xl font-black text-red-300 mt-1">
                {totals.protein} <span className="text-xs font-normal text-red-400">g</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/30 flex flex-col">
              <span className="text-[11px] font-semibold text-amber-400 uppercase">Carbs</span>
              <span className="text-2xl font-black text-amber-300 mt-1">
                {totals.carbs} <span className="text-xs font-normal text-amber-400">g</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-950/30 border border-yellow-800/30 flex flex-col">
              <span className="text-[11px] font-semibold text-yellow-400 uppercase">Fats</span>
              <span className="text-2xl font-black text-yellow-300 mt-1">
                {totals.fat} <span className="text-xs font-normal text-yellow-400">g</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Detected Items List ────────────────────────────────────────── */}
      {items.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Detected Ingredients &amp; Portions
          </div>

          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => {
              const currentGrams = Number(item.userInput) || item.baseAmount || 100;
              const ratio = currentGrams / (item.baseAmount || 100);
              const itemKcal = Math.round((item.kcal || 0) * ratio);
              const itemP = Math.round((item.protein || 0) * ratio * 10) / 10;
              const itemC = Math.round((item.carbs || 0) * ratio * 10) / 10;
              const itemF = Math.round((item.fat || 0) * ratio * 10) / 10;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-white">{item.name}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {itemKcal} kcal
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold">
                      <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-900/40">
                        P: {itemP}g
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-900/40">
                        C: {itemC}g
                      </span>
                      <span className="px-2 py-0.5 rounded bg-yellow-950/50 text-yellow-300 border border-yellow-900/40">
                        F: {itemF}g
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Delete */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, currentGrams - 25)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="5"
                        max="2000"
                        step="5"
                        value={currentGrams}
                        onChange={(e) =>
                          handleQuantityChange(item.id, Number(e.target.value))
                        }
                        className="w-16 text-center bg-transparent text-sm font-bold text-white outline-none"
                      />
                      <span className="text-xs text-zinc-500 pr-1.5 font-medium">
                        {item.unitType || "g"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, currentGrams + 25)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-xl bg-zinc-900/80 hover:bg-red-950/70 border border-zinc-800 hover:border-red-800 text-zinc-500 hover:text-red-400 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
