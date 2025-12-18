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

          {/* Visual Content - Connected Pipeline */}
          <div className="lg:w-1/2 relative w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[500px] aspect-[4/5] bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8"
            >
               {/* Background Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] -z-10 rounded-[2.5rem]" />

               {/* SVG Connections Layer */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(20, 184, 166, 0.1)" />
                      <stop offset="50%" stopColor="rgba(20, 184, 166, 0.5)" />
                      <stop offset="100%" stopColor="rgba(20, 184, 166, 0.1)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Paths from Inputs to Core */}
                  {/* Left (Food) -> Center */}
                  <motion.path 
                    d="M 85 110 C 85 180, 250 180, 250 220" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2"
                  />
                  {/* Center (Meds) -> Center */}
                  <motion.path 
                    d="M 250 110 L 250 220" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2"
                  />
                  {/* Right (Vitals) -> Center */}
                  <motion.path 
                    d="M 415 110 C 415 180, 250 180, 250 220" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2"
                  />

                  {/* Path from Core to Output */}
                  <motion.path 
                    d="M 250 300 L 250 360" 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2"
                  />

                  {/* Animated Data Packets */}
                  <motion.circle r="3" fill="#2dd4bf">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 85 110 C 85 180, 250 180, 250 220" />
                  </motion.circle>
                  <motion.circle r="3" fill="#3b82f6">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 250 110 L 250 220" />
                  </motion.circle>
                  <motion.circle r="3" fill="#ef4444">
                    <animateMotion dur="3.5s" repeatCount="indefinite" path="M 415 110 C 415 180, 250 180, 250 220" />
                  </motion.circle>
                  
                  {/* Output Packet */}
                  <motion.circle r="4" fill="#10b981">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 250 300 L 250 360" />
                  </motion.circle>
               </svg>

               {/* HTML Elements Layer */}
               <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  
                  {/* Top Row: Inputs */}
                  <div className="flex justify-between px-2">
                    {[
                      { icon: <Utensils size={18} />, label: "Food", color: "bg-teal-500" },
                      { icon: <Pill size={18} />, label: "Meds", color: "bg-blue-500" },
                      { icon: <Activity size={18} />, label: "Vitals", color: "bg-red-500" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: -20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-20 h-24 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 backdrop-blur-md shadow-lg"
                      >
                        <div className={`p-2.5 rounded-xl ${item.color}/20 text-white`}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Middle: AI Core */}
                  <div className="flex justify-center items-center">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping opacity-20" />
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl rotate-45 flex items-center justify-center shadow-2xl shadow-teal-500/30 border border-white/20 z-20">
                        <Brain className="text-white -rotate-45 w-10 h-10" />
                      </div>
                      {/* Connecting Nodes */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-teal-400 rounded-full z-30" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 rounded-full z-30" />
                       
                    </div>
                  </div>

                  {/* Bottom: Thesis Output */}
                  <div className="flex justify-center">
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full max-w-[280px] bg-white dark:bg-[#0f172a] rounded-2xl p-1 shadow-2xl border border-teal-500/30"
                    >
                        <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-5 border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">Health Thesis</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Ready</div>
                                    </div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>

                            <button
                                onClick={handleDownload}
                                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
                                    isDownloaded 
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
                                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-lg hover:scale-[1.02]"
                                }`}
                            >
                                {isDownloaded ? (
                                    <>
                                    <CheckCircle size={16} />
                                    <span>Saved</span>
                                    </>
                                ) : (
                                    <>
                                    <Download size={16} />
                                    <span className="text-black dark:text-black">Download</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                  </div>

               </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HealthAnalysisSection;
