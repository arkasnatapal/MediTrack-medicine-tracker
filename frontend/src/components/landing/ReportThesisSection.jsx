import React from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, CheckCircle, ArrowRight, FileCheck, Microscope, Stethoscope, Wand2, Database } from "lucide-react";

const ReportThesisSection = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-[#020617]">
      {/* Magical Particles Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/10 rounded-full blur-[150px] -z-10 animate-pulse-slow" />
      
      {/* Floating Orbs */}
      <motion.div 
        animate={{ y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ y: [0, 50, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-20 left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
          
          {/* Text Content */}
          <div className="lg:w-1/2 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <Wand2 size={14} className="animate-pulse" />
              <span>Medical Intelligence</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tight"
            >
              Reports, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">Decoded.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10"
            >
              Upload complex lab reports and let our AI generate a clear, structured "Thesis" of your condition. We translate medical jargon into actionable insights, highlighting key risks and improvements over time.
            </motion.p>

            <div className="space-y-6">
              {[
                { title: "Jargon Translation", desc: "Complex terms explained in plain English.", icon: <FileText size={20} /> },
                { title: "Trend Analysis", desc: "See how your vitals change across multiple reports.", icon: <Database size={20} /> },
                { title: "Actionable Next Steps", desc: "AI-suggested questions for your doctor.", icon: <CheckCircle size={20} /> },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-5 group cursor-pointer p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-indigo-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                    <p className="text-slate-500 text-sm group-hover:text-slate-400 transition-colors">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual Content - The "Magical Transformation" */}
          <div className="lg:w-1/2 relative perspective-1000">
            <motion.div
              initial={{ opacity: 0, rotateY: -15 }}
              whileInView={{ opacity: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, type: "spring" }}
              className="relative z-10"
            >
              {/* Abstract Document Stack */}
              <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
                
                {/* Glowing Aura */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10 animate-pulse-slow" />

                {/* Back Card (Raw Report) */}
                <motion.div 
                  animate={{ rotate: [0, -6, 0], scale: [0.9, 0.94, 0.9] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-4 right-4 bottom-4 bg-slate-800/80 backdrop-blur-sm rounded-[2rem] border border-white/5 shadow-2xl transform -rotate-6 opacity-60"
                />
                
                {/* Middle Card (Processing) */}
                <motion.div 
                  animate={{ rotate: [0, 4, 0], scale: [0.95, 1, 0.95] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-2 left-2 right-2 bottom-2 bg-slate-800/90 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl transform rotate-3 opacity-80"
                />

                {/* Front Card (The Thesis) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/95 to-[#0f172a]/95 backdrop-blur-xl rounded-[2rem] border border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col group hover:border-indigo-400/50 transition-colors duration-500">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent opacity-50" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tracking-wide">Generated Thesis</div>
                        <div className="text-[10px] text-indigo-300 font-mono uppercase tracking-wider">AI-POWERED SUMMARY</div>
                      </div>
                    </div>
                    <Sparkles className="text-amber-400 animate-pulse relative z-10" size={20} />
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-5 flex-1 overflow-hidden relative">
                    {/* Glowing Scan Line - Enhanced */}
                    <motion.div
                      animate={{ top: ["-20%", "120%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-indigo-400/10 to-transparent z-20 pointer-events-none"
                    />

                    {/* Mock Text Lines - Animated */}
                    <div className="space-y-3 opacity-50">
                      <div className="h-3 bg-white/20 rounded-full w-3/4" />
                      <div className="h-3 bg-white/10 rounded-full w-full" />
                      <div className="h-3 bg-white/10 rounded-full w-5/6" />
                    </div>

                    {/* Key Insight Box - Enhanced */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      className="mt-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-2 mb-3 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Microscope size={14} />
                        <span>Critical Finding</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        Hemoglobin levels have improved by <span className="text-emerald-400 font-bold text-base">12%</span>. Vitamin D deficiency detected - consider supplementation.
                      </p>
                    </motion.div>

                    {/* Doctor Questions - Enhanced */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-2 mb-3 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Stethoscope size={14} />
                        <span>Ask Your Doctor</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium italic">
                        "Is the current dosage of Metformin still appropriate given the improved glucose levels?"
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 bg-black/30 border-t border-white/5 flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Processed in 1.2s
                    </span>
                    <div className="flex gap-1.5 opacity-70">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ReportThesisSection;
