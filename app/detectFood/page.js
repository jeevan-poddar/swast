"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  UploadCloud,
  Trash2,
  Search,
  Camera,
  Loader2,
  PieChart,
  ChevronRight,
  Flame,
  Wheat,
  Beef,
  PlusCircle,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default function DetectFoodPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [selectedImageURLs, setSelectedImageURLs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      selectedImageURLs.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImageURLs]);

  const totals = useMemo(() => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    items.forEach((item) => {
      const input = Number(item.userInput);
      if (!isNaN(input) && input > 0) {
        const ratio = input / item.baseAmount;
        totalKcal += item.kcal * ratio;
        totalProtein += item.protein * ratio;
        totalCarbs += item.carbs * ratio;
        totalFat += item.fat * ratio;
      }
    });

    return {
      kcal: Math.round(totalKcal),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
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
    setIsError(false);
    setSelectedFiles((prev) => [...prev, ...files]);
    setSelectedImageURLs((prev) => [...prev, ...files.map(file => URL.createObjectURL(file))]);
    setHasAnalyzed(false);
    
    // Reset file input so same file could be added again ideally
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setIsError(false);
    setItems([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("file", file));

      // 1. Detect food names via Gemini
      const res = await fetch("/api/detect-food", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze images");
      }

      const detectedNames = await res.json();

      if (!detectedNames || detectedNames.length === 0) {
        throw new Error("No food items detected. Try adding clearer photos.");
      }

      // 2. Calculate nutrients for each food name
      const fetchedItems = [];
      for (const name of detectedNames) {
        try {
          const calcRes = await fetch("/api/calculate-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ foodName: name, quantity: 100 }),
          });

          if (calcRes.ok) {
            const item = await calcRes.json();
            fetchedItems.push({
              ...item,
              userInput: item.baseAmount || 100, // Pre-fill with base amount
            });
          }
        } catch (calcError) {
          console.error(`Error calculating nutrients for ${name}:`, calcError);
        }
      }

      setItems((prev) => [...prev, ...fetchedItems]);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsError(true);
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSearch = async (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const query = searchQuery.trim();
      setSearchQuery("");
      try {
        const res = await fetch("/api/calculate-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodName: query, quantity: 100 }),
        });
        if (res.ok) {
          const newItem = await res.json();
          setItems((prev) => [
            ...prev,
            { ...newItem, userInput: newItem.baseAmount || 100 },
          ]);
        }
      } catch (error) {
        console.error("Error adding missing item:", error);
      }
    }
  };

  const handleRemove = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id, value) => {
    setItems((items) =>
      items.map((item) => (item.id === id ? { ...item, userInput: value } : item))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-40 overflow-x-hidden selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-6 flex items-center justify-center min-h-[72px]">
        <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
          AI Vision Food Log
        </h1>
      </header>

      <main className="w-full max-w-xl mx-auto p-4 md:p-6 flex flex-col gap-8 animate-in fade-in duration-500">
        {/* Upload Zone */}
        <section className="mt-2 w-full">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {!photoSelected ? (
            <div
              onClick={handleSimulateUpload}
              className="group relative overflow-hidden bg-white hover:bg-slate-50 border-2 border-dashed border-indigo-200/80 rounded-3xl p-10 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-[1.01]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-indigo-100 to-indigo-50 p-5 rounded-full text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Camera size={36} strokeWidth={1.5} />
              </div>
              <div className="text-center relative">
                <h3 className="font-bold text-slate-800 text-lg mb-1.5">
                  Scan Your Meal
                </h3>
                <p className="text-sm text-slate-500 font-medium max-w-[240px] mx-auto">
                  Take a photo or upload from gallery to auto-detect ingredients
                  and macros.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden h-56 bg-slate-900 shadow-xl border border-white/10 ring-1 ring-slate-900/5 group">
              {selectedImageURLs.length > 0 && (
                <div className="absolute inset-0 flex overflow-x-auto snap-x scrollbar-hide">
                  {selectedImageURLs.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Scanned Food ${index + 1}`}
                      className="flex-shrink-0 w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity duration-700 snap-center"
                    />
                  ))}
                </div>
              )}

              {isScanning ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[6px] z-10 transition-all">
                  <div className="relative flex items-center justify-center w-20 h-20 mb-5">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
                    <Loader2 className="animate-spin text-white w-8 h-8 absolute" />
                  </div>
                  <p className="text-white font-semibold text-lg tracking-wide animate-pulse">
                    Analyzing Image...
                  </p>
                  <p className="text-indigo-200/80 text-sm mt-1 font-medium">
                    Identifying ingredients and calories
                  </p>
                </div>
              ) : isError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md p-6 text-center">
                  <div className="bg-red-500/20 p-3 rounded-full mb-3">
                    <Trash2 className="text-red-200" size={28} />
                  </div>
                  <p className="text-white font-semibold mb-2">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setPhotoSelected(false);
                      setIsError(false);
                    }}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur px-5 py-2 rounded-full text-sm font-medium text-white transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : !hasAnalyzed ? (
                <div className="absolute inset-0 flex flex-col justify-between p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSimulateUpload}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase text-white transition-colors flex items-center gap-2"
                    >
                      <PlusCircle size={14} /> Add More
                    </button>
                    <button
                      onClick={handleAnalyze}
                      className="bg-indigo-600 hover:bg-indigo-500 backdrop-blur-md px-5 py-2 rounded-full text-xs font-semibold tracking-wide uppercase text-white transition-colors flex items-center gap-2 shadow-lg ring-1 ring-white/20 animate-pulse"
                    >
                      <Loader2 size={14} /> Analyze
                    </button>
                  </div>
                  <div className="text-white flex items-center gap-2 opacity-80 pt-16">
                    <h3 className="font-semibold text-sm">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} ready to analyze
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col justify-between p-5 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSimulateUpload}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase text-white transition-colors flex items-center gap-2"
                    >
                      <PlusCircle size={14} /> Add Additional
                    </button>
                    <button
                      onClick={() => {
                        setPhotoSelected(false);
                        setSelectedFiles([]);
                        setSelectedImageURLs([]);
                        setItems([]);
                        setHasAnalyzed(false);
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase text-white transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Clear All
                    </button>
                  </div>
                  <div className="text-white flex items-center gap-2 animate-in slide-in-from-bottom-2">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <h3 className="font-bold text-lg text-emerald-50">
                      Scan Successful
                    </h3>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Results & Items Section */}
        {!isScanning && photoSelected && !isError && (
          <section className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
                Detected Items
                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-[11px] font-bold">
                  {items.length}
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const isFluidOrBulk =
                  item.unitType === "ml" || item.unitType === "g";
                const currentCalories = Math.round(
                  ((Number(item.userInput) || 0) / item.baseAmount) * item.kcal
                );

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5"
                  >
                    <div className="p-5 flex flex-col gap-4">
                      {/* Top Row: Info & Remove */}
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                              Base: {item.baseUnitLabel}
                            </span>
                            <span className="flex items-center gap-1 text-orange-600/80 bg-orange-50 px-2.5 py-1 rounded-md">
                              <Flame size={12} className="text-orange-500" />{" "}
                              {item.kcal} kcal
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Smart Input Row */}
                      <div className="flex items-center gap-3 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex-1 flex items-center gap-2 pl-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                            Amount
                          </label>
                          <div className="relative flex-1 flex items-center bg-white border border-slate-200/80 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                            <button
                              type="button"
                              onClick={() => {
                                const step = (item.unitType === 'g' || item.unitType === 'ml') ? 10 : 1;
                                handleUpdateQuantity(item.id, Math.max(0, (Number(item.userInput) || 0) - step));
                              }}
                              className="px-3 py-2 h-full text-slate-400 hover:text-indigo-600 transition-colors text-xl font-medium leading-none focus:outline-none"
                            >
                              −
                            </button>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={item.userInput}
                                onChange={(e) =>
                                  handleUpdateQuantity(item.id, e.target.value)
                                }
                                className="w-full bg-transparent py-2.5 px-1 text-sm font-bold text-slate-700 outline-none text-center placeholder:text-slate-300"
                                placeholder={"0"}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase pointer-events-none pr-1">
                              {item.unitType}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const step = (item.unitType === 'g' || item.unitType === 'ml') ? 10 : 1;
                                handleUpdateQuantity(item.id, (Number(item.userInput) || 0) + step);
                              }}
                              className="px-3 py-2 h-full text-slate-400 hover:text-indigo-600 transition-colors text-xl font-medium leading-none focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right pr-2 pl-3 border-l border-slate-200/80 whitespace-nowrap min-w-[85px]">
                          <span className="text-xl font-black text-slate-800">
                            {currentCalories}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1 font-bold uppercase tracking-wider relative -top-1">
                            kcal
                          </span>
                        </div>
                      </div>

                      {/* Quick Select Chips */}
                      {isFluidOrBulk && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            { label: "Small", val: 150 },
                            { label: "Standard", val: 250 },
                            { label: "Large", val: 500 },
                          ].map((chip) => (
                            <button
                              key={chip.val}
                              onClick={() =>
                                handleUpdateQuantity(item.id, chip.val)
                              }
                              className="bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-1.5 px-3.5 rounded-full transition-colors border border-indigo-100/50 hover:border-indigo-200 shadow-sm"
                            >
                              {chip.label} {chip.val}
                              {item.unitType}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="text-center p-10 mt-2 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PieChart className="text-slate-400" size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-600 mb-1">
                    No items found
                  </h3>
                  <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
                    Try rescanning or search manually below to add items.
                  </p>
                </div>
              )}
            </div>

            {/* Manual Add Item */}
            <div className="mt-4 pb-2">
              <div className="relative group shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl">
                <PlusCircle
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleManualSearch}
                  placeholder="Missing something? Search to add..."
                  className="w-full bg-white border-2 border-transparent border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/30 transition-all hover:border-slate-200"
                />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded">
                    Press Enter
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Live Macro Summary - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.08)] transform transition-transform duration-500">
        <div className="max-w-xl mx-auto px-5 pb-6 pt-5 space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">
                Meal Summary
              </span>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                  {totals.kcal}
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest relative -top-1">
                  kcal
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="bg-orange-50/80 rounded-xl px-3.5 py-2.5 border border-orange-100 flex flex-col items-center min-w-[70px]">
                <div className="flex items-center gap-1 mb-1">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-[10px] font-bold uppercase text-orange-600/80 tracking-widest">
                    Pro
                  </span>
                </div>
                <span className="text-base font-black text-orange-950">
                  {totals.protein}
                  <span className="text-[10px] ml-0.5 text-orange-600 font-bold">
                    g
                  </span>
                </span>
              </div>

              <div className="bg-emerald-50/80 rounded-xl px-3.5 py-2.5 border border-emerald-100 flex flex-col items-center min-w-[70px]">
                <div className="flex items-center gap-1 mb-1">
                  <Wheat size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-emerald-600/80 tracking-widest">
                    Carb
                  </span>
                </div>
                <span className="text-base font-black text-emerald-950">
                  {totals.carbs}
                  <span className="text-[10px] ml-0.5 text-emerald-600 font-bold">
                    g
                  </span>
                </span>
              </div>

              <div className="bg-yellow-50/80 rounded-xl px-3.5 py-2.5 border border-yellow-100 flex flex-col items-center min-w-[70px]">
                <div className="flex items-center gap-1 mb-1">
                  <Beef size={12} className="text-yellow-500" />
                  <span className="text-[10px] font-bold uppercase text-yellow-600/80 tracking-widest">
                    Fat
                  </span>
                </div>
                <span className="text-base font-black text-yellow-950">
                  {totals.fat}
                  <span className="text-[10px] ml-0.5 text-yellow-600 font-bold">
                    g
                  </span>
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={items.length === 0}
            className="w-full bg-slate-900 focus:ring-4 focus:ring-slate-900/20 disabled:bg-slate-300 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_8px_30px_rgba(15,23,42,0.2)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.3)] group outline-none"
          >
            Confirm & Log Meal
            <ChevronRight
              size={20}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
