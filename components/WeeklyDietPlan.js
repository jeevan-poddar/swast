"use client";

import React, { useMemo, useState } from 'react';
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";// Reusable "Shadcn-like" Card Components built with Tailwind CSS
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-950 dark:text-slate-50 ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = '' }) => <div className={`p-6 flex flex-col space-y-1.5 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

export default function WeeklyDietPlan({ weeklyPlan, budgetLimit = 66 }) {
  const { data: session } = useSession();
  const [activeDay, setActiveDay] = useState('monday');
  const [isSyncing, setIsSyncing] = useState(false);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // 1. Aggregating Top Section (The Grocery List)
  const shoppingList = useMemo(() => {
    if (!weeklyPlan) return [];
    const aggregator = {};

    Object.values(weeklyPlan).forEach(dayData => {
      if (!dayData?.meals) return;
      Object.keys(dayData.meals).forEach(slot => {
        const meal = dayData.meals[slot];
        if (!meal?.components) return;
        
        meal.components.forEach(comp => {
          const key = comp.name.toLowerCase();
          if (!aggregator[key]) {
            aggregator[key] = {
              name: comp.name,
              quantity: 0,
              unit: comp.unit,
              cost: 0,
              // Marking items that are free according to our strict rule (Rice/Wheat cost 0)
              isExempt: comp.cost === 0 && (key.includes('rice') || key.includes('wheat'))
            };
          }
          aggregator[key].quantity += comp.quantity;
          aggregator[key].cost += comp.cost;
        });
      });
    });

    // Sort by most expensive overall item first
    return Object.values(aggregator).sort((a, b) => b.cost - a.cost);
  }, [weeklyPlan]);

  if (!weeklyPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
        <span className="text-4xl mb-4">🍽️</span>
        <h2 className="text-xl font-bold">No Weekly Plan yet</h2>
        <p className="text-sm">Generate a customized plan first to view your dashboard.</p>
      </div>
    );
  }

  const handleSyncPlan = async () => {
    if (!session?.user?._id) {
      alert("Please log in to sync your plan.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/diet-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user._id,
          weeklyPlan,
          budget: budgetLimit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync plan');
      }

      alert("Plan synced successfully to your profile!");
    } catch (error) {
      console.error("Error syncing plan:", error);
      alert("Failed to sync plan. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const currentDayData = weeklyPlan[activeDay];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      
      {/* 2. Action Button Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        {/* Abstract background flair */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 left-12 w-32 h-32 bg-cyan-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mb-6 md:mb-0 z-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight">Your Weekly Protocol</h1>
          <p className="text-blue-100 mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full text-sm">
            Elite Performance Fueling
          </p>
        </div>
        <button 
          onClick={handleSyncPlan}
          disabled={isSyncing}
          className="z-10 group bg-white text-indigo-700 hover:bg-slate-50 transition-all duration-200 font-bold text-lg px-8 py-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.3)] disabled:opacity-75 active:scale-95 transform flex items-center gap-3"
        >
          {isSyncing ? (
            <>
              Syncing... <Loader2 className="animate-spin" size={20} />
            </>
          ) : (
            <>
              Sync Plan to Profile 
              <span className="group-hover:translate-x-1 transition-transform">⚡</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Top Section: Shopping List */}
      <Card className="border-t-4 border-t-emerald-500 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
             <span className="text-2xl">🛒</span>
             <div>
                <CardTitle className="text-slate-800 dark:text-slate-100">Weekly Shopping List</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aggregated ingredients for your Mon-Sun protocol.</p>
             </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shoppingList.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2">
                      {item.name}
                      {item.isExempt && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          Exempt
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-0.5">
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-500">
                      ₹{item.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>

      {/* 4. Bottom Section: Tabs / Calendar */}
      <div className="pt-4 space-y-8">
        
        {/* Horizontal Scroll Tabs */}
        <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-hide snap-x px-1">
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`snap-center shrink-0 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-sm border ${
                activeDay === day 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md transform -translate-y-1' 
                : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <span className="capitalize tracking-wide">{day}</span>
            </button>
          ))}
        </div>

        {/* 5. Day View */}
        {currentDayData && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            {/* Day Header & Cost Breakdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 md:px-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-3xl font-extrabold capitalize text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <span className="text-indigo-500 dark:text-indigo-400">📅</span> {activeDay}
              </h2>
              <div className="flex flex-col items-end bg-slate-50 dark:bg-slate-900/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">Total Daily Cost</span>
                <span className={`text-3xl font-black ${currentDayData.daily_cost <= budgetLimit ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ₹{Number(currentDayData.daily_cost).toFixed(2)} 
                  <span className="text-lg opacity-40 font-medium ml-1">/ ₹{budgetLimit}</span>
                </span>
                {currentDayData.daily_cost > budgetLimit && (
                  <span className="text-xs font-bold text-rose-500 mt-1 bg-rose-100 dark:bg-rose-950/30 px-2 py-0.5 rounded-md">Over Budget!</span>
                )}
              </div>
            </div>

            {/* Meals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['breakfast', 'lunch', 'snack', 'dinner'].map(slot => {
                const meal = currentDayData.meals?.[slot];
                if (!meal) return null;

                // Derive meal cost if API didn't compute it explicitly per meal
                const mealCost = meal.components?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;

                return (
                  <Card key={slot} className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors duration-300 overflow-hidden shadow-sm hover:shadow-md">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                             {slot === 'breakfast' && '🌅 '}
                             {slot === 'lunch' && '☀️ '}
                             {slot === 'snack' && '⚡ '}
                             {slot === 'dinner' && '🌙 '}
                             {slot}
                          </p>
                          <CardTitle className="text-xl text-slate-800 dark:text-slate-100 font-bold">{meal.meal_name || 'Unplanned'}</CardTitle>
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          ₹{mealCost.toFixed(2)}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-5 flex flex-col justify-between h-full">
                      {/* Components Bullet List */}
                      <ul className="space-y-4 mb-6">
                        {meal.components?.map((comp, idx) => (
                          <li key={idx} className="flex items-center text-[15px] group">
                            <span className="min-w-[80px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-center text-sm mr-4 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-300">
                              {comp.quantity}{comp.unit}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium capitalize flex-1">{comp.name}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Macros Tag Row (Optional: if the ai returns total macros for the meal) */}
                      {meal.macros && (
                         <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 text-xs flex-wrap">
                           <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-3 py-1.5 rounded-lg font-bold border border-rose-100 dark:border-rose-900/50">Pr: {meal.macros.protein}g</span>
                           <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-1.5 rounded-lg font-bold border border-amber-100 dark:border-amber-900/50">Cb: {meal.macros.carbs}g</span>
                           <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold border border-emerald-100 dark:border-emerald-900/50">Ft: {meal.macros.fats}g</span>
                           <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold ml-auto">{meal.macros.kcal} kcal</span>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
