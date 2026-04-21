"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  PieChart,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Plus
} from "lucide-react";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MealTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // YYYY-MM-DD string
  const [dayLog, setDayLog] = useState(null);
  const [weeklyTargets, setWeeklyTargets] = useState(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);

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
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?._id) {
      loadMonthData();
      if (!weeklyTargets) loadNutrients();
    }
  }, [currentDate, session]);

  useEffect(() => {
    if (selectedDay && session?.user?._id) {
      loadDayLog(selectedDay);
      setIsDayPanelOpen(true);
    }
  }, [selectedDay, session]);

  const loadNutrients = async () => {
    try {
      const data = await calculateNutrients(session.user._id);
      setWeeklyTargets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMonthData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/meal-log/month?userId=${session.user._id}&year=${year}&month=${month}`);
      if (res.ok) setMonthData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadDayLog = async (dateStr) => {
    try {
      const res = await fetch(`/api/meal-log?userId=${session.user._id}&date=${dateStr}`);
      if (res.ok) setDayLog(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const calendarCells = Array.from({ length: 42 });

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getLogForDate = (dateStr) => monthData.find(log => log.date === dateStr);

  const StatusDot = ({ status }) => {
    if (status === 'eaten') return <div className="w-2 h-2 rounded-full bg-green-500" />;
    if (status === 'not_eaten') return <div className="w-2 h-2 rounded-full bg-red-500" />;
    return <div className="w-2 h-2 rounded-full bg-gray-300" />;
  };

  // --- Day Panel Logic ---
  const currentDayOfWeekName = selectedDay ? DAYS_OF_WEEK[new Date(selectedDay).getDay()] : null;
  const currentTarget = weeklyTargets && currentDayOfWeekName ? weeklyTargets[currentDayOfWeekName] : null;

  const updateMealStatus = async (mealType, status) => {
    try {
      const payload = { userId: session.user._id, date: selectedDay, mealType, status };
      const res = await fetch('/api/meal-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadDayLog(selectedDay);
        await loadMonthData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMeal = async (mealType) => {
    if (!confirm(`Are you sure you want to remove ${mealType}?`)) return;
    try {
      const res = await fetch(`/api/meal-log?userId=${session.user._id}&date=${selectedDay}&mealType=${mealType}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadDayLog(selectedDay);
        await loadMonthData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addNewMeal = async () => {
    if (!newMealName.trim()) return;
    const mealType = newMealName.trim().toLowerCase();
    try {
      const payload = { userId: session.user._id, date: selectedDay, mealType, status: 'not_reported' };
      const res = await fetch('/api/meal-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewMealName("");
        setIsAddingMeal(false);
        await loadDayLog(selectedDay);
        await loadMonthData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openReportModal = (mealType) => {
    setActiveMealType(mealType);
    setScannedItems(dayLog?.[mealType]?.items || []);
    setPhotoSelected(false);
    setIsScanning(false);
    setIsModalOpen(true);
  };

  // --- Modal Logic ---
  const handleSimulateUpload = () => {
    if (!isScanning) fileInputRef.current?.click();
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
      if (res.ok) {
        const detectedNames = await res.json();
        const fullItems = [];
        for (const name of detectedNames) {
          const calcRes = await fetch("/api/calculate-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ foodName: name, quantity: 100 })
          });
          if (calcRes.ok) fullItems.push(await calcRes.json());
        }
        setScannedItems(prev => [...prev, ...fullItems]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      try {
        const res = await fetch("/api/calculate-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodName: searchQuery.trim(), quantity: 100 })
        });
        if (res.ok) {
          const newItem = await res.json();
          setScannedItems(prev => [...prev, newItem]);
          setSearchQuery("");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const updateScannedItemQty = (id, val) => {
    setScannedItems(items => items.map(i => i.id === id ? { ...i, userInput: val } : i));
  };
  const removeScannedItem = (id) => {
    setScannedItems(items => items.filter(i => i.id !== id));
  };

  const sumNutrients = (itemsToSum) => {
    const sums = { kcal: 0, protein: 0, carbs: 0, fats: 0, fiber_g: 0, water_L: 0, sodium_mg: 0, potassium_mg: 0, magnesium_mg: 0, iron_mg: 0, calcium_mg: 0, vitamin_D_mcg: 0, vitamin_B12_mcg: 0, omega_3_mg: 0, antioxidant_VitE_mg: 0 };
    itemsToSum.forEach(i => {
      const ratio = (Number(i.userInput) || 0) / i.baseAmount;
      Object.keys(sums).forEach(k => {
        if (typeof i[k] === 'number' || (k === 'fats' && typeof i.fat === 'number')) {
            const valKey = k === 'fats' ? 'fat' : k;
            sums[k] += (i[valKey] || 0) * ratio;
        }
      });
    });
    // round all
    Object.keys(sums).forEach(k => sums[k] = Math.round(sums[k] * 10) / 10);
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
        totalNutrients
      };
      const res = await fetch('/api/meal-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        await loadDayLog(selectedDay);
        await loadMonthData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate day totals for progress bars
  const dayTotals = useMemo(() => {
    if (!dayLog || !currentTarget) return null;
    const sums = { kcal: 0, protein: 0, carbs: 0, fats: 0, fiber_g: 0, water_L: 0, sodium_mg: 0, potassium_mg: 0, magnesium_mg: 0, iron_mg: 0, calcium_mg: 0, vitamin_D_mcg: 0, vitamin_B12_mcg: 0, omega_3_mg: 0, antioxidant_VitE_mg: 0 };
    const mealsList = dayLog.mealsList || ['breakfast', 'lunch', 'dinner'];
    mealsList.forEach(m => {
      if (dayLog[m]?.status === 'eaten' && dayLog[m]?.totalNutrients) {
        Object.keys(sums).forEach(k => sums[k] += (dayLog[m].totalNutrients[k] || 0));
      }
    });

    // Add currently scanned items if modal is open (acting as preview)
    if (isModalOpen && scannedItems.length > 0) {
      const currentModalSums = sumNutrients(scannedItems);
      const existingMealSums = dayLog[activeMealType]?.totalNutrients || {};
      
      // If editing existing, subtract old, add new
      Object.keys(sums).forEach(k => {
         sums[k] -= (existingMealSums[k] || 0);
         sums[k] += currentModalSums[k];
      });
    }
    
    return sums;
  }, [dayLog, currentTarget, isModalOpen, scannedItems, activeMealType]);

  const ProgressBar = ({ label, current, max, unit }) => {
    const percentage = Math.min((current / max) * 100, 100) || 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500">{current.toFixed(1)} / {max} {unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* LEFT: Calendar */}
      <div className={`flex-1 p-4 md:p-8 ${isDayPanelOpen ? 'hidden md:block' : 'block'}`}>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
            ))}
            
            {calendarCells.map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              
              if (!isCurrentMonth) return <div key={i} className="bg-white min-h-[100px]" />;

              const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth()+1).toString().padStart(2,'0')}-${dayNum.toString().padStart(2,'0')}`;
              const log = getLogForDate(dateStr);
              const isSelected = selectedDay === dateStr;

              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDay(dateStr)}
                  className={`bg-white min-h-[100px] p-2 border-t flex flex-col cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{dayNum}</span>
                  <div className="mt-auto flex justify-center gap-1 mb-1 flex-wrap px-1">
                    {(log?.mealsList || ['breakfast', 'lunch', 'dinner']).map(m => (
                      <StatusDot key={m} status={log?.[m]?.status} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Day Panel */}
      {isDayPanelOpen && (
        <div className="w-full md:w-96 bg-white border-l shadow-2xl md:shadow-none min-h-screen fixed md:relative right-0 top-0 z-20 flex flex-col overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10">
            <div>
              <h3 className="font-bold text-lg">{new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}</h3>
              <p className="text-xs text-gray-500">{currentTarget ? `${currentTarget.calories} kcal Target` : 'Loading target...'}</p>
            </div>
            <button onClick={() => setIsDayPanelOpen(false)} className="p-2 md:hidden hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-4">
            {(dayLog?.mealsList || ['breakfast', 'lunch', 'dinner']).map((meal) => {
              const status = dayLog?.[meal]?.status || 'not_reported';
              return (
                <div key={meal} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold capitalize flex items-center gap-2">
                       {status === 'eaten' ? <CheckCircle2 size={16} className="text-green-500"/> : 
                        status === 'not_eaten' ? <XCircle size={16} className="text-red-500"/> : 
                        <Clock size={16} className="text-gray-400"/>}
                       {meal}
                    </h4>
                    <div className="flex items-center gap-3">
                      {status === 'eaten' && dayLog[meal]?.totalNutrients && (
                        <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {dayLog[meal].totalNutrients.kcal || 0} kcal
                        </span>
                      )}
                      <button onClick={() => deleteMeal(meal)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {status !== 'eaten' && (
                      <button 
                        onClick={() => openReportModal(meal)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
                      >
                        Report Meal
                      </button>
                    )}
                    {status === 'eaten' && (
                      <button 
                        onClick={() => openReportModal(meal)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Edit Log
                      </button>
                    )}
                    {status !== 'not_eaten' && (
                       <button 
                         onClick={() => updateMealStatus(meal, 'not_eaten')}
                         className="px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition"
                       >
                         Skip
                       </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Meal Button */}
            <div className="mt-4">
              {isAddingMeal ? (
                <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border shadow-inner">
                  <input 
                    type="text" 
                    value={newMealName} 
                    onChange={e => setNewMealName(e.target.value)} 
                    placeholder="Meal name (e.g., Snack)" 
                    className="flex-1 bg-white border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 ring-blue-500"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && addNewMeal()}
                  />
                  <button onClick={addNewMeal} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors">Add</button>
                  <button onClick={() => setIsAddingMeal(false)} className="text-gray-500 hover:text-gray-700 p-1"><X size={16} /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingMeal(true)} 
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add Custom Meal
                </button>
              )}
            </div>

            {/* Quick nutrient summary for the day */}
            {currentTarget && dayTotals && (
              <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-bold text-sm mb-4 uppercase text-gray-500 tracking-wider">Day Progress</h4>
                <ProgressBar label="Calories" current={dayTotals.kcal} max={currentTarget.calories} unit="kcal" />
                <ProgressBar label="Protein" current={dayTotals.protein} max={currentTarget.macros.protein_g} unit="g" />
                <ProgressBar label="Carbs" current={dayTotals.carbs} max={currentTarget.macros.carbs_g} unit="g" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Report Meal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            
            {/* Modal Left: Upload & Items */}
            <div className="flex-1 flex flex-col h-full border-r border-gray-100">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg capitalize">Report {activeMealType}</h3>
                <button onClick={() => setIsModalOpen(false)} className="md:hidden"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Upload Zone */}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                {!photoSelected ? (
                  <div onClick={handleSimulateUpload} className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50">
                    <Camera size={32} className="text-blue-500 mb-2"/>
                    <p className="font-semibold text-blue-900 text-sm">Tap to scan meal</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden h-32 bg-gray-900 flex items-center justify-center">
                    {isScanning ? (
                       <div className="flex flex-col items-center">
                         <Loader2 className="animate-spin text-white w-6 h-6 mb-2" />
                         <span className="text-white text-sm font-medium">Analyzing...</span>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center">
                         <CheckCircle2 className="text-green-400 w-8 h-8 mb-2" />
                         <button onClick={() => {setPhotoSelected(false); setIsScanning(false)}} className="text-xs text-white bg-white/20 px-3 py-1 rounded-full">Rescan</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {scannedItems.map(item => (
                    <div key={item.id} className="border rounded-xl p-3 flex justify-between items-center bg-white shadow-sm">
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.kcal} kcal per {item.baseUnitLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                           type="number" 
                           value={item.userInput} 
                           onChange={(e) => updateScannedItemQty(item.id, e.target.value)}
                           className="w-16 border rounded p-1 text-sm text-center focus:ring-2 ring-blue-500 outline-none"
                        />
                        <span className="text-xs text-gray-500 w-8">{item.unitType}</span>
                        <button onClick={() => removeScannedItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                  
                  {scannedItems.length === 0 && !isScanning && photoSelected && (
                    <p className="text-center text-sm text-gray-500 py-4">No items detected.</p>
                  )}
                </div>

                {/* Manual Add */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleManualSearch}
                    placeholder="Search manual item (press Enter)"
                    className="w-full bg-gray-50 border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 ring-blue-500 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Modal Right: Live Nutrients */}
            <div className="w-full md:w-80 bg-gray-50 flex flex-col h-full border-t md:border-t-0">
               <div className="p-4 border-b flex justify-between items-center bg-white">
                  <h3 className="font-bold text-sm tracking-widest uppercase text-gray-500 flex items-center gap-2">
                    <Activity size={16}/> Impact Analysis
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="hidden md:block text-gray-400 hover:text-gray-800"><X size={20}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {currentTarget && dayTotals ? (
                   <>
                     {/* MACROS */}
                     <div>
                       <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Macros (Day Total)</h4>
                       <ProgressBar label="Energy" current={dayTotals.kcal} max={currentTarget.calories} unit="kcal" />
                       <ProgressBar label="Protein" current={dayTotals.protein} max={currentTarget.macros.protein_g} unit="g" />
                       <ProgressBar label="Carbs" current={dayTotals.carbs} max={currentTarget.macros.carbs_g} unit="g" />
                       <ProgressBar label="Fats" current={dayTotals.fats} max={currentTarget.macros.fats_g} unit="g" />
                     </div>

                     {/* MICROS */}
                     <div>
                       <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Key Micros (Day Total)</h4>
                       <ProgressBar label="Fiber" current={dayTotals.fiber_g} max={currentTarget.micros.fiber_g} unit="g" />
                       <ProgressBar label="Water" current={dayTotals.water_L} max={currentTarget.micros.water_L} unit="L" />
                       <ProgressBar label="Iron" current={dayTotals.iron_mg} max={currentTarget.micros.iron_mg} unit="mg" />
                       <ProgressBar label="Calcium" current={dayTotals.calcium_mg} max={currentTarget.micros.calcium_mg} unit="mg" />
                       <ProgressBar label="Vit B12" current={dayTotals.vitamin_B12_mcg} max={currentTarget.micros.vitamin_B12_mcg} unit="mcg" />
                     </div>
                   </>
                 ) : (
                   <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading targets...</div>
                 )}
               </div>

               <div className="p-4 bg-white border-t mt-auto">
                 <button 
                  onClick={saveMealLog}
                  disabled={isSaving || scannedItems.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-md shadow-blue-500/20 flex justify-center items-center"
                 >
                   {isSaving ? <Loader2 size={20} className="animate-spin" /> : "Confirm & Log Meal"}
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
