import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowUpRight, Check, X, Calendar, Clock, Heart, ShieldAlert, Activity, FileText, BrainCircuit } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const InteractiveShowcase = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Staggered Entrance for Widgets - ONLY Fade and Scale (No Y movement)
      gsap.from(".showcase-widget", {
        opacity: 0,
        scale: 0.9,
        stagger: 0.15,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".widgets-container",
          start: "top 90%",
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 px-6 md:px-12 lg:px-24 bg-white overflow-hidden">
      <div className="relative w-full max-w-7xl mx-auto rounded-[3.5rem] overflow-hidden bg-emerald-50/50 min-h-[900px] p-8 md:p-16 md:pb-32 flex flex-col justify-between group shadow-2xl">
        
        {/* Fixed Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hills-bg.png" 
            alt="Landscape background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
        </div>

        {/* Header Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12 mb-24">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Tools that work the way <br /> 
              <span className="text-emerald-700 uppercase">your body needs.</span>
            </h2>
          </div>
          <div className="max-w-xs text-right">
            <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium">
              Experience clinical precision through our suite of intelligent, glass-transparent health tools.
            </p>
            <button className="bg-white/60 backdrop-blur-xl text-slate-900 border border-white/40 px-8 py-3 rounded-full flex items-center gap-3 font-bold text-sm hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-lg group/btn">
              Get Started
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover/btn:rotate-45 transition-transform duration-500">
                <ArrowUpRight size={14} />
              </div>
            </button>
          </div>
        </div>

        {/* Interactive Widgets Grid */}
        <div className="widgets-container relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          
          {/* Left Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Medication Adherence */}
            <div className="showcase-widget bg-white/50 backdrop-blur-2xl p-7 rounded-[2.5rem] border border-white/60 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">94%</h4>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Medication Adherence</p>
                </div>
                <div className="flex gap-1.5 items-end h-8">
                   {[40, 70, 90, 85, 94].map((v, i) => (
                     <div key={i} className="w-2 bg-emerald-500/80 rounded-full" style={{ height: `${v}%` }} />
                   ))}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-bold flex justify-between pt-4 border-t border-slate-200/50">
                <span className="uppercase tracking-widest">Growth</span>
                <span className="text-emerald-600">+12%</span>
              </div>
            </div>

            {/* Widget 2: Calendar */}
            <div className="showcase-widget bg-emerald-800/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/30 shadow-2xl text-white relative group/cal">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-4xl font-black tracking-tighter mb-1">06</h3>
                   <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Friday, April</p>
                 </div>
                 
                 <div className="bg-white/20 p-4 rounded-3xl border border-white/20 group-hover/cal:bg-white group-hover/cal:text-emerald-900 transition-colors duration-500">
                   <div className="flex items-center justify-between mb-3 gap-6">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Dosage</span>
                     <Clock size={10} className="opacity-70" />
                   </div>
                   <h4 className="text-sm font-bold leading-tight text-white group-hover/cal:text-emerald-900">Next intake <br /> at 14:00</h4>
                 </div>
               </div>

               <div className="flex justify-between items-center pt-6 border-t border-white/10">
                 <div className="flex -space-x-3">
                   {[1, 2].map(i => (
                     <img key={i} src={`https://i.pravatar.cc/100?img=${i+48}`} className="w-11 h-11 rounded-full border-2 border-emerald-900/50 object-cover shadow-lg" />
                   ))}
                 </div>
                 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                    <ArrowUpRight size={16} />
                 </div>
               </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {/* Widget 3: Women's Health Status */}
            <div className="showcase-widget aspect-square bg-rose-400/30 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] flex flex-col items-center justify-center text-rose-700 cursor-pointer group/health shadow-xl">
              <motion.div 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg shadow-rose-200"
              >
                <Heart size={28} fill="currentColor" />
              </motion.div>
              <span className="text-sm font-black tracking-tighter uppercase">Women's Health</span>
              <span className="text-[10px] text-rose-800/40 font-bold uppercase tracking-widest mt-1">Active Cycle</span>
            </div>

            {/* Widget 4: Interactions */}
            <div className="showcase-widget bg-white/60 backdrop-blur-2xl p-7 rounded-[2.5rem] border border-white/60 shadow-xl">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Safety Status</h4>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">Score: 98</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                   <ShieldAlert size={20} />
                 </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-xl border border-white/20">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Drug-Drug Safe</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-xl border border-white/20">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Food-Drug Safe</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5">
            {/* Widget 5: Medical Reports & AI */}
            <div className="showcase-widget bg-white/60 backdrop-blur-3xl rounded-[3rem] overflow-hidden border border-white/70 shadow-2xl">
              <div className="p-9 pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">AI Health Insights</h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Predictive Analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="px-9 pt-0">
                <div className="w-full bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden group/ai">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-10">
                      <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white uppercase tracking-widest">Analysis 2025</span>
                      <Activity className="text-emerald-400" size={18} />
                    </div>
                    <h5 className="text-white text-3xl font-black tracking-tighter mb-4 leading-none">Optimal <br /> Recovery Path</h5>
                    <p className="text-white/50 text-[10px] leading-relaxed font-medium max-w-xs">
                      AI intelligence has processed your health metrics to predict your wellness trajectory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-9">
                <div className="bg-emerald-50 rounded-[2rem] p-6 flex items-center justify-between border border-emerald-100 group/report hover:bg-emerald-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-md">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-emerald-900 mb-1">Health Report</h4>
                      <p className="text-[10px] font-bold text-emerald-700/40 uppercase tracking-widest">Verified by AI</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default InteractiveShowcase;
