import React, { useState } from "react";
import { motion } from "framer-motion";
import { Utensils, Pill, Activity, FileText, Download, CheckCircle, Brain, Database, Sparkles } from "lucide-react";

const HealthAnalysisSection = () => {
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <section className="py-32 relative overflow-hidden bg-[#020617]">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10" />
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617] -z-20" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text Content */}
          <div className="lg:w-1/2 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-bold uppercase tracking-wider"
            >
              <Database size={14} />
              <span>Data Pipeline</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight"
            >
              From Raw Data to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Actionable Thesis.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10"
            >
              See how our AI transforms your daily inputs into a comprehensive health report. We aggregate food logs, medication history, and vital signs to construct a complete biological profile.
            </motion.p>

            <div className="space-y-6">
              {[
                { icon: <Utensils size={20} />, title: "1. Data Ingestion", desc: "Real-time tracking of meals and meds." },
                { icon: <Brain size={20} />, title: "2. Neural Synthesis", desc: "AI analyzes correlations and patterns." },
                { icon: <FileText size={20} />, title: "3. Thesis Generation", desc: "A structured, downloadable health report." },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual Content - Neural Stack */}
          <div className="lg:w-1/2 relative w-full flex justify-center mt-12 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[500px] flex flex-col items-center gap-8"
            >
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-500/10 blur-[100px] rounded-full -z-10" />

               {/* Top Layer: Data Inputs */}
               <div className="w-full grid grid-cols-3 gap-4">
                 {[
                   { icon: <Utensils size={20} />, label: "Food Logs", color: "from-orange-400 to-red-500" },
                   { icon: <Pill size={20} />, label: "Meds", color: "from-blue-400 to-indigo-500" },
                   { icon: <Activity size={20} />, label: "Vitals", color: "from-emerald-400 to-teal-500" },
                 ].map((item, i) => (
                   <motion.div
                     key={i}
                     initial={{ y: 0, opacity: 1 }}
                     whileInView={{ 
                       y: 0, 
                       opacity: 1,

                     }}
                     viewport={{ once: true }}
                     className="relative group"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl group-hover:bg-white/10 transition-all duration-500" />
                     <div className="relative h-32 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 p-2 hover:border-white/20 transition-colors">
                       <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                         <div className="text-white">
                           {item.icon}
                         </div>
                       </div>
                       <span className="text-xs font-bold text-slate-300 text-center">{item.label}</span>
                     </div>
                   </motion.div>
                 ))}
               </div>

               {/* Middle Layer: Neural Core */}
               <div className="relative py-4">
                 {/* Connecting Beams */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-teal-500/50 to-transparent" />
                 
                 <div className="relative z-10 w-32 h-32 flex items-center justify-center">
                   {/* Spinning Rings */}
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 rounded-full border border-teal-500/30 border-t-teal-400 border-r-transparent"
                   />
                   <motion.div 
                     animate={{ rotate: -360 }}
                     transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-2 rounded-full border border-emerald-500/30 border-b-emerald-400 border-l-transparent"
                   />
                   
                   {/* Core */}
                   <div className="relative w-20 h-20 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                     <Brain className="w-10 h-10 text-teal-400" />
                     <div className="absolute inset-0 bg-teal-400/20 rounded-full animate-ping" />
                   </div>
                 </div>
               </div>

               {/* Bottom Layer: Thesis Output */}
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.6 }}
                 className="w-full"
               >
                 <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-1">
                   <div className="bg-[#020617]/50 rounded-[1.3rem] p-6 border border-white/5">
                     <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
                           <FileText size={24} />
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-white">Health Thesis</h3>
                           <p className="text-xs text-teal-400 font-medium uppercase tracking-wider">Analysis Complete</p>
                         </div>
                       </div>
                       <Sparkles className="text-amber-400 animate-pulse" size={20} />
                     </div>

                     <div className="space-y-3 mb-6">
                       {[
                         { label: "Metabolic Rate", value: "Optimized", color: "text-emerald-400" },
                         { label: "Medication Adherence", value: "98%", color: "text-blue-400" },
                         { label: "Health Score", value: "Improving", color: "text-purple-400" },
                       ].map((stat, i) => (
                         <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                           <span className="text-slate-400">{stat.label}</span>
                           <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                         </div>
                       ))}
                     </div>

                     <button
                       onClick={handleDownload}
                       className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 group ${
                         isDownloaded 
                           ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
                           : "bg-white text-slate-900 hover:bg-teal-50 hover:shadow-lg hover:shadow-teal-500/10"
                       }`}
                     >
                       {isDownloaded ? (
                         <>
                           <CheckCircle size={18} />
                           <span>Report Saved</span>
                         </>
                       ) : (
                         <>
                           <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                           <span className="text-black dark:text-black">Download Full Report</span>
                         </>
                       )}
                     </button>
                   </div>
                 </div>
               </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HealthAnalysisSection;
