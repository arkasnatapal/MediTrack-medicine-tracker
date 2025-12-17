import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Bot, Sparkles, Brain, Activity, MessageSquare, Zap, CheckCircle2 } from "lucide-react";

const AIShowcaseSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Sophisticated Background */}
      <div className="absolute inset-0 bg-[#020617]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#020617] to-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        
        {/* Subtle animated beams */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Content */}
        <motion.div
           style={{ opacity }}
           className="relative"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md mb-8"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-200">Next-Gen Health AI</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Intelligent Care, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Always Available.
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">
            Your personal health companion that never sleeps. From analyzing symptoms to managing complex medication schedules, get instant, accurate support whenever you need it.
          </p>

          <div className="space-y-4">
            {[
              { title: "Smart Symptom Analysis", desc: "Instant guidance based on your inputs" },
              { title: "Medication Management", desc: "Reminders & interaction checks" },
              { title: "24/7 Health Monitoring", desc: "Continuous tracking & insights" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Content - Stable, Premium Interface */}
        <div className="relative mx-auto w-full max-w-md">
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-50" />
          
          <motion.div
            style={{ y }}
            className="relative bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">MediTrack Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-6 space-y-6 h-[400px] relative">
              {/* Message 1: User */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex justify-end"
              >
                <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-lg text-sm">
                  Can I take my blood pressure meds with breakfast?
                </div>
              </motion.div>

              {/* Message 2: AI */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="flex justify-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex-shrink-0 flex items-center justify-center border border-emerald-500/20 mt-1">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-slate-800 text-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm max-w-[90%] border border-white/5 text-sm shadow-lg">
                  <p className="mb-2">Yes, taking <strong>Lisinopril</strong> with food is perfectly fine and may help reduce stomach upset.</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified against your profile</span>
                  </div>
                </div>
              </motion.div>

              {/* Typing Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 2 }}
                className="absolute bottom-8 left-6 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1 items-center shadow-sm">
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75" />
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIShowcaseSection;
