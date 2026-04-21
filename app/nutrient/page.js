"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { calculateNutrients } from "@/action/nutirentCalculation";
import {
  Activity,
  Droplet,
  Flame,
  Zap,
  Brain,
  Bone,
  ArrowLeft,
} from "lucide-react";

const page = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!weeklyData || !weeklyData[selectedDay]) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">
          No nutrition data available. Please complete your profile.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Go Home
        </button>
      </div>
    );
  }

  const currentData = weeklyData[selectedDay];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Weekly Targets
            </h1>
            <p className="text-gray-500 text-sm">
              Based on your dynamic tasks and goals
            </p>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                selectedDay === day
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hero: Calories */}
          <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-between">
            <div>
              <h2 className="text-gray-500 font-medium mb-1 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-500" /> Total Energy
                Required
              </h2>
              <div className="flex items-end space-x-2">
                <span className="text-5xl font-black text-gray-900">
                  {currentData.calories}
                </span>
                <span className="text-xl text-gray-500 mb-1">kcal</span>
              </div>
            </div>
            <div className="hidden md:block text-right text-sm text-gray-400">
              Adjusts daily based on your activity MET values.
            </div>
          </div>

          {/* Macros: Protein */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-red-500">
            <h3 className="text-gray-500 font-medium mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-red-500" /> Protein
            </h3>
            <div className="text-3xl font-bold text-gray-900">
              {currentData.macros.protein_g}g
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Muscle repair & synthesis
            </p>
          </div>

          {/* Macros: Carbs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
            <h3 className="text-gray-500 font-medium mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-blue-500" /> Carbohydrates
            </h3>
            <div className="text-3xl font-bold text-gray-900">
              {currentData.macros.carbs_g}g
            </div>
            <p className="text-xs text-gray-400 mt-2">Primary task fuel</p>
          </div>

          {/* Macros: Fats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-yellow-400">
            <h3 className="text-gray-500 font-medium mb-4 flex items-center">
              <Brain className="w-4 h-4 mr-2 text-yellow-500" /> Fats
            </h3>
            <div className="text-3xl font-bold text-gray-900">
              {currentData.macros.fats_g}g
            </div>
            <p className="text-xs text-gray-400 mt-2">Hormone & brain health</p>
          </div>

          {/* Micros List */}
          <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Functional & Micronutrients
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Fiber</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.fiber_g} g
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center">
                  <Droplet className="w-3 h-3 mr-1 text-blue-400" /> Water
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.water_L} L
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Sodium (Sweat)</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.sodium_mg} mg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Potassium</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.potassium_mg} mg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Magnesium</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.magnesium_mg} mg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Iron</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.iron_mg} mg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center">
                  <Bone className="w-3 h-3 mr-1 text-gray-400" /> Calcium
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.calcium_mg} mg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Vitamin D</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.vitamin_D_mcg} mcg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Vitamin B12</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.vitamin_B12_mcg} mcg
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Omega-3</span>
                <span className="text-lg font-semibold text-gray-800">
                  {currentData.micros.omega_3_mg} mg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button for Gemini generation later */}
        <div className="mt-8">
          <button className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
            Generate Budget Meal Plan for Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default page;
