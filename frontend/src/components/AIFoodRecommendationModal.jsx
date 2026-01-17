import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChefHat, Clock, Sparkles, ArrowRight, Utensils, Calendar, Leaf, MoveRight, Loader2, Play, Sun, Moon, Sunset, Save, Check } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const AIFoodRecommendationModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(1); // 1: Input, 2: Loading, 3: Result
  const [loadingText, setLoadingText] = useState("Analyzing your pantry...");
  
  // Inputs
  const [ingredients, setIngredients] = useState("");
  const [tagList, setTagList] = useState([]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:30");
  const [goal, setGoal] = useState("immediate"); // 'immediate' | 'weekly'
  
  // Result
  const [result, setResult] = useState(null);

  // Handle Input
  const handleAddTag = (e) => {
    if (e.key === "Enter" && ingredients.trim()) {
      e.preventDefault();
      setTagList([...tagList, ingredients.trim()]);
      setIngredients("");
    }
  };

  const removeTag = (idx) => {
    setTagList(tagList.filter((_, i) => i !== idx));
  };

  const generateRecommendation = async () => {
    if (tagList.length === 0) return alert("Please add at least one ingredient!");
    
    setStep(2);
    setLoadingText("Analyzing your pantry...");

    // Simulator loading steps
    const timers = [
      setTimeout(() => setLoadingText("Checking health profile..."), 1500),
      setTimeout(() => setLoadingText("Scanning for medicine interactions..."), 3000),
      setTimeout(() => setLoadingText(goal === 'weekly' ? "Planning your week..." : "Crafting the perfect recipe..."), 5000),
    ];

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/food/ai-recommend`,
        {
          ingredients: tagList,
          wakeUpTime: wakeTime,
          sleepTime: sleepTime,
          goal
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setResult(res.data.data);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate recommendation. Please try again.");
      setStep(1); // Go back
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setTagList([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:rotate-90 transition-transform duration-300"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <div className="p-8 md:p-10 min-h-[500px] flex flex-col">
          
          {/* STEP 1: INPUT */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  AI Chef
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                  What's in your kitchen?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Enter ingredients you have. Our AI will craft the perfect meal tailored to your health and medicines.
                </p>
              </div>

              {/* Ingredients Input */}
              <div className="max-w-xl mx-auto w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type ingredient & hit Enter (e.g. Potato, Chicken)"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-teal-500 outline-none text-lg font-medium transition-all text-slate-900 dark:text-white"
                  />
                  <div className="absolute right-3 top-3">
                    <button 
                      onClick={() => {
                        if (ingredients.trim()) {
                            setTagList([...tagList, ingredients.trim()]);
                            setIngredients("");
                        }
                      }}
                      className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4 min-h-[60px]">
                  <AnimatePresence>
                    {tagList.map((tag, i) => (
                      <motion.span
                        key={i + tag}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-sm shadow-sm"
                      >
                        {tag}
                        <button onClick={() => removeTag(i)} className="hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                    {tagList.length === 0 && (
                      <span className="text-slate-400 text-sm italic py-2">No ingredients added yet...</span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Wake Time */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wake Up</label>
                  <input 
                    type="time" 
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-transparent font-bold text-xl text-slate-700 dark:text-white outline-none"
                  />
                </div>
                 {/* Sleep Time */}
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sleep</label>
                  <input 
                    type="time" 
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full bg-transparent font-bold text-xl text-slate-700 dark:text-white outline-none"
                  />
                </div>
                {/* Goal */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setGoal('immediate')}
                        className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                            goal === 'immediate' 
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                                : 'border-transparent bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        One Meal Now
                    </button>
                    <button 
                        onClick={() => setGoal('weekly')}
                         className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                            goal === 'weekly' 
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        7-Day Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={generateRecommendation}
                  disabled={tagList.length === 0}
                  className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl font-bold text-white shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <span className="flex items-center gap-3 text-lg">
                    <ChefHat className="w-6 h-6" />
                    {goal === 'weekly' ? 'Design My Week' : 'Cook Something Now'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-8 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
                <Loader2 className="w-20 h-20 text-teal-500 animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white animate-pulse">
                  {loadingText}
                </h3>
                <p className="text-slate-500">This might take a few seconds...</p>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 3 && result && (
            <div className="animate-in slide-in-from-bottom-8 duration-700">
              {/* --- IMMEDIATE MEAL VIEW --- */}
              {result.type === 'immediate' && (
                <div className="space-y-8">
                  {/* Hero */}
                  <div className="relative h-64 md:h-80 rounded-[2rem] overflow-hidden group">
                    <img 
                      src={result.imageUrl} 
                      alt={result.dishName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8 text-white">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
                        <Clock className="w-3 h-3" />
                        Best choice for {result.bestTime}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{result.dishName}</h2>
                      <p className="text-lg text-white/90 max-w-2xl font-medium">{result.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Recipe & Ingredients */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Reason Engine */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
                         <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-2xl text-indigo-600 dark:text-indigo-300">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-1">Why this meal?</h4>
                                <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">{result.reasoning}</p>
                            </div>
                         </div>
                      </div>

                      {/* Recipe Steps */}
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                          <div className="w-8 h-1 bg-teal-500 rounded-full" />
                          Instructions
                        </h3>
                        <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                          {result.recipe.map((step, idx) => (
                            <div key={idx} className="relative pl-8">
                              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-500" />
                              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white mr-2">Step {idx + 1}:</span>
                                {step.replace(/^Step \d+: /, '')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Nutrition & Ingredients List */}
                    <div className="space-y-6">
                      {/* Nutrition Tags */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                           <Leaf className="w-4 h-4 text-emerald-500" /> Nutrition
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                           {Object.entries(result.nutrition).map(([key, val]) => (
                             <div key={key} className="bg-white dark:bg-slate-700 p-3 rounded-2xl text-center shadow-sm">
                                <div className="text-xl font-black text-slate-900 dark:text-white">{val}</div>
                                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{key}</div>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Ingredients Used */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 h-fit">
                         <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                           <Utensils className="w-4 h-4 text-amber-500" /> Ingredients
                         </h4>
                         <div className="flex flex-wrap gap-2">
                            {result.ingredientsUsed.map((ing, i) => (
                                <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold">
                                    {ing}
                                </span>
                            ))}
                            {result.missingIngredients?.map((ing, i) => (
                                <span key={i + 'miss'} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-sm font-bold line-through decoration-slate-400">
                                    {ing}
                                </span>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- WEEKLY VIEW --- */}
              {result.type === 'weekly' && (
                <div className="space-y-10">
                   <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-full font-bold text-sm border border-indigo-100 dark:border-indigo-500/20">
                        <Calendar className="w-4 h-4" />
                        7-Day Healing Plan
                     </div>
                     <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-1">
                        Your Recovery Roadmap
                     </h2>
                     <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        {result.overview}
                     </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {result.schedule.map((dayPlan, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                           <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                                {dayPlan.day}
                              </h3>
                              <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg tracking-wider md:text-xs ${
                                dayPlan.type.toLowerCase().includes('non') 
                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' 
                                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                              }`}>
                                {dayPlan.type}
                              </span>
                           </div>
                           
                           <div className="space-y-5">
                              {/* Breakfast */}
                              <div className="relative pl-3">
                                <div className="absolute left-0 top-1 w-0.5 h-full bg-amber-200 dark:bg-amber-500/30 rounded-full"></div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breakfast</span>
                                </div>
                                <div className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {dayPlan.breakfast}
                                </div>
                              </div>

                              {/* Lunch */}
                              <div className="relative pl-3">
                                <div className="absolute left-0 top-1 w-0.5 h-full bg-orange-200 dark:bg-orange-500/30 rounded-full"></div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Sunset className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lunch</span>
                                </div>
                                <div className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {dayPlan.lunch}
                                </div>
                              </div>

                              {/* Dinner */}
                              <div className="relative pl-3">
                                <div className="absolute left-0 top-1 w-0.5 h-full bg-indigo-200 dark:bg-indigo-500/30 rounded-full"></div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dinner</span>
                                </div>
                                <div className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    {dayPlan.dinner}
                                </div>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                   
                   <div className="p-8 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 rounded-[2rem] border border-teal-100 dark:border-teal-500/20 text-center">
                     <h4 className="font-bold text-teal-800 dark:text-teal-300 mb-2 flex items-center justify-center gap-2">
                        <Leaf className="w-5 h-5" />
                        Health Focus
                     </h4>
                     <p className="text-teal-700 dark:text-teal-400 max-w-2xl mx-auto">
                        {result.healthFocus}
                     </p>
                   </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-center gap-4 pt-10 pb-4">
                <button 
                  onClick={reset}
                  className="px-6 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <MoveRight className="w-4 h-4 rotate-180" /> Start Over
                </button>
                
                <button
                    onClick={() => onSave(result)}
                    className="flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                >
                    <Save className="w-4 h-4" />
                    Save to Dashboard
                </button>
              </div>
            </div>
          )}
        
        </div>
      </motion.div>
    </div>
  );
};

export default AIFoodRecommendationModal;
