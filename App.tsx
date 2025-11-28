import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, 
  startOfToday, getISOWeek 
} from 'date-fns';
import { HABITS, HabitType, WeeklyLog, HabitConfig } from './types';
import { getStoredData, saveStoredData } from './services/storage';
import { getWeeklyInsights } from './services/geminiService';
import { Icon } from './components/Icon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Helper to get date key format YYYY-MM-DD
const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [data, setData] = useState<WeeklyLog>({});
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Initialize data
  useEffect(() => {
    const stored = getStoredData();
    setData(stored);
  }, []);

  // Compute current week's days
  const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);

  // Derived state: Current Week's Data
  const currentWeekData = useMemo(() => {
    return weekDays.map(day => {
      const key = getDateKey(day);
      return {
        date: day,
        key: key,
        log: data[key] || {}
      };
    });
  }, [data, weekDays]);

  // Calculate completion stats for chart
  const chartData = useMemo(() => {
    return currentWeekData.map(d => {
      let score = 0;
      let totalPossible = 0;

      HABITS.forEach(h => {
        const val = d.log[h.id];
        if (h.type === HabitType.BOOLEAN) {
          totalPossible += 1;
          if (val === true) score += 1;
        } else if (h.type === HabitType.MAX_COUNTER) {
          totalPossible += h.max!;
          if (typeof val === 'number') score += Math.min(val, h.max!);
        } else if (h.type === HabitType.COUNTER) {
           // For open counters, we count "some activity" as 1 point for the graph
           totalPossible += 1;
           if (val && typeof val === 'number' && val > 0) score += 1;
        }
      });
      
      const percentage = totalPossible === 0 ? 0 : Math.round((score / totalPossible) * 100);
      return {
        name: format(d.date, 'EEE'),
        score: percentage
      };
    });
  }, [currentWeekData]);

  const handleUpdate = (dateKey: string, habitId: string, value: boolean | number) => {
    const newData = { ...data };
    if (!newData[dateKey]) newData[dateKey] = {};
    
    newData[dateKey] = {
      ...newData[dateKey],
      [habitId]: value
    };
    
    setData(newData);
    saveStoredData(newData);
  };

  const handleGeminiInsights = async () => {
    setLoadingInsights(true);
    const result = await getWeeklyInsights(startOfCurrentWeek, data);
    setInsights(result);
    setLoadingInsights(false);
  };

  // Input Components
  const renderInput = (habit: HabitConfig, dateKey: string, currentVal: number | boolean | undefined) => {
    if (habit.type === HabitType.BOOLEAN) {
      return (
        <button
          onClick={() => handleUpdate(dateKey, habit.id, !currentVal)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentVal 
              ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg scale-105' 
              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
          }`}
          aria-label={`Toggle ${habit.label}`}
        >
          {currentVal ? <Icon name="Check" size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
        </button>
      );
    }

    if (habit.type === HabitType.MAX_COUNTER) {
      const val = (currentVal as number) || 0;
      return (
        <div className="flex items-center justify-center space-x-1">
          <button 
             onClick={() => handleUpdate(dateKey, habit.id, Math.max(0, val - 1))}
             disabled={val <= 0}
             className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center font-bold text-sm transition-colors"
          >-</button>
          
          <input
            type="number"
            min="0"
            max={habit.max}
            value={val === 0 ? '' : val}
            placeholder="0"
            onChange={(e) => {
              const inputVal = e.target.value;
              if (inputVal === '') {
                handleUpdate(dateKey, habit.id, 0);
              } else {
                const parsed = parseInt(inputVal);
                if (!isNaN(parsed)) {
                  // Allow user to type, but clamp to max
                  const clamped = Math.min(Math.max(0, parsed), habit.max!);
                  handleUpdate(dateKey, habit.id, clamped);
                }
              }
            }}
            className={`w-10 text-center font-semibold text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-100 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
               val >= habit.max! ? 'text-emerald-600' : 'text-slate-700'
            }`} 
          />

          <button 
             onClick={() => handleUpdate(dateKey, habit.id, Math.min(habit.max!, val + 1))}
             disabled={val >= habit.max!}
             className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm transition-colors ${
               val >= habit.max! ? 'bg-emerald-100 text-emerald-600 opacity-50' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
             }`}
          >+</button>
        </div>
      );
    }

    if (habit.type === HabitType.COUNTER) {
      const val = (currentVal as number) || 0;
      return (
        <div className="flex items-center justify-center space-x-2 bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
           <input
             type="number"
             min="0"
             value={val === 0 ? '' : val}
             placeholder="0"
             onChange={(e) => handleUpdate(dateKey, habit.id, parseInt(e.target.value) || 0)}
             className="w-16 bg-transparent text-center font-medium text-slate-700 focus:outline-none"
           />
           <span className="text-xs text-slate-400">{habit.unit || 'x'}</span>
        </div>
      );
    }
  };

  // Grid column definition: Fixed width for label (sticky), flexible for days
  const gridColsClass = "grid-cols-[160px_repeat(7,minmax(105px,1fr))]";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Icon name="BookHeart" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">Weekly Habit Tracker</h1>
              <p className="text-xs text-slate-500 font-medium">Ibadah & Wellness Log</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 space-x-1 shadow-sm">
            <button 
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-2 hover:bg-slate-50 rounded-md transition text-slate-600"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
            <div className="px-4 py-1 text-sm font-bold text-slate-700 w-40 text-center select-none">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-2 hover:bg-slate-50 rounded-md transition text-slate-600"
            >
              <Icon name="ChevronRight" size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        
        {/* Stats & Gemini Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col min-w-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Weekly Consistency</h2>
                <p className="text-xs text-slate-400 mt-1">Activity completion rate per day</p>
              </div>
            </div>
            <div className="h-64 w-full min-w-0">
               <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                 <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                      dy={10}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 flex flex-col relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Icon name="Sparkles" size={100} className="text-emerald-900" />
            </div>
            
            <h2 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-white/50 rounded-lg">
                <Icon name="Sparkles" size={16} className="text-emerald-600" />
              </div>
              Spiritual Coach
            </h2>
            
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar min-h-[120px]">
              {insights ? (
                <div className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap animate-fadeIn">
                  {insights}
                </div>
              ) : (
                <p className="text-sm text-emerald-700/70 italic leading-relaxed">
                  "Take one step towards Allah, and He will take ten steps towards you."
                  <br/><br/>
                  Get personalized insights for your week.
                </p>
              )}
            </div>

            <button
              onClick={handleGeminiInsights}
              disabled={loadingInsights}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              {loadingInsights ? (
                <>
                  <Icon name="RefreshCcw" className="animate-spin" size={16} />
                  Reflecting...
                </>
              ) : (
                <>Get Advice</>
              )}
            </button>
          </div>
        </section>

        {/* Tracker Grid */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
           {/* Scrollable Container */}
           <div className="overflow-x-auto custom-scrollbar">
             <div className="min-w-[900px] md:min-w-0"> 
               
               {/* Table Header */}
               <div className={`grid ${gridColsClass} bg-slate-50 border-b border-slate-200`}>
                 <div className="sticky left-0 z-20 bg-slate-50 p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider flex items-center border-r border-slate-200/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                   Habit
                 </div>
                 {weekDays.map(day => {
                   const isToday = isSameDay(day, new Date());
                   return (
                    <div key={day.toISOString()} className="p-2 border-l border-slate-100 flex flex-col items-center justify-center">
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isToday 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
                          : 'bg-transparent text-slate-500'
                      }`}>
                         <span className={`text-[10px] font-bold uppercase mb-0.5 ${isToday ? 'text-white' : 'text-slate-400'}`}>
                           {format(day, 'EEE')}
                         </span>
                         <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                           {format(day, 'd')}
                         </span>
                      </div>
                    </div>
                   );
                 })}
               </div>

               {/* Rows */}
               <div className="divide-y divide-slate-100">
                 {HABITS.map(habit => (
                   <div key={habit.id} className={`grid ${gridColsClass} group hover:bg-slate-50/50 transition-colors`}>
                     
                     {/* Habit Label Column (Sticky) */}
                     <div className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 p-4 flex items-center space-x-3 border-r border-slate-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                       <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                         <Icon name={habit.icon} size={18} />
                       </div>
                       <div className="min-w-0">
                         <h3 className="text-sm font-semibold text-slate-800 truncate">{habit.label}</h3>
                         <p className="text-[10px] text-slate-400 truncate hidden sm:block">{habit.description}</p>
                       </div>
                     </div>

                     {/* Days Columns */}
                     {weekDays.map(day => {
                        const dateKey = getDateKey(day);
                        const isToday = isSameDay(day, new Date());
                        return (
                          <div 
                            key={`${habit.id}-${dateKey}`} 
                            className={`flex items-center justify-center p-3 border-l border-slate-100 ${isToday ? 'bg-emerald-50/20' : ''}`}
                          >
                             {renderInput(habit, dateKey, data[dateKey]?.[habit.id])}
                          </div>
                        );
                     })}
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </section>
        
        <div className="text-center pb-8 pt-4">
             <p className="text-slate-400 text-xs">
               Data is stored locally on your device. May your efforts be accepted.
             </p>
        </div>

      </main>
    </div>
  );
};

export default App;