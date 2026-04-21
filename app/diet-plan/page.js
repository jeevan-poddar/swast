'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import WeeklyDietPlan from '../../components/WeeklyDietPlan';

export default function DietPlanPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState('Loading'); // Loading, Input, Generating, Results
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [loadingText, setLoadingText] = useState('Checking active plan...');
  const [apiData, setApiData] = useState(null);

  const dailyBudget = monthlyBudget ? (parseFloat(monthlyBudget) / 30).toFixed(2) : '0.00';

  useEffect(() => {
    async function checkExistingPlan() {
      if (session?.user?._id) {
        try {
          const res = await fetch(`/api/diet-plan?userId=${session.user._id}`);
          if (res.ok) {
            const data = await res.json();
            setApiData({ weekly_plan: data.weeklyPlan });
            if (data.budget) {
               setMonthlyBudget((data.budget * 30).toString());
            }
            setStep('Results');
            return;
          }
        } catch (error) {
          console.error("Error fetching existing plan:", error);
        }
      }
      setStep('Input');
    }
    
    if (session !== undefined) { // once session state is known (either null or containing user)
      if (step === 'Loading') {
        checkExistingPlan();
      }
    }
  }, [session, step]);

  useEffect(() => {
    let interval;
    if (step === 'Generating') {
      const texts = [
        'Calculating 13 nutrients...', 
        'Checking market prices...', 
        'Building recipes...'
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleGenerate = async () => {
    if (!monthlyBudget || isNaN(monthlyBudget) || Number(monthlyBudget) <= 0) return;
    
    setStep('Generating');
    
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
          magnesium: 400
        }
      };

      const response = await fetch('/api/generate-weekly-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      const data = await response.json();
      setApiData(data);
      setStep('Results');
    } catch (error) {
      console.error("Failed to generate plan:", error);
      setStep('Input'); 
      alert('Failed to generate diet plan. Please try again.');
    }
  };

  if (step === 'Results' && apiData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <WeeklyDietPlan 
          weeklyPlan={apiData.weekly_plan} 
          budgetLimit={parseFloat(dailyBudget)} 
        />
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-12 flex justify-center">
            <button 
              onClick={() => setStep('Input')}
              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Start Over
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      {step === 'Loading' && (
        <div className="flex flex-col items-center justify-center p-12 text-center w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">{loadingText}</p>
        </div>
      )}

      {step === 'Input' && (
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Weekly Fueling</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Set your monthly budget to generate a personalized 7-day diet plan.</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Monthly Grocery Budget (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input 
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-medium text-lg outline-none"
                />
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculated Daily Limit:</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  ₹{dailyBudget}
                </span>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!monthlyBudget || isNaN(monthlyBudget) || Number(monthlyBudget) <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgba(79,70,229,0.2)] disabled:shadow-none transition-all transform active:scale-95"
            >
              Generate 7-Day Plan <span className="ml-2">✨</span>
            </button>
          </div>
        </div>
      )}

      {step === 'Generating' && (
        <div className="flex flex-col items-center justify-center p-12 text-center w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/40 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">
              🥗
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Crafting Your Plan</h2>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
            {loadingText}
          </p>
        </div>
      )}
    </div>
  );
}
