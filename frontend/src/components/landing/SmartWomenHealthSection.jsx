import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles, Moon, Calendar, Activity, Lock, Heart, Zap } from "lucide-react";

/**
 * The Living Essence Orb
 * A dynamic, liquid-like orb that feels alive and reacts to interaction.
 */
const SmartWomenHealthSection = () => {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Smooth mouse tracking for parallax
  const springConfig = { damping: 25, stiffness: 150 };
  const mouseX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 0]), springConfig);
  const mouseY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 0]), springConfig);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x * 40); // Parallax intensity
    mouseY.set(y * 40);
  };

  return (
    <section 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className="py-32 relative overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow delay-1000" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* The Living Orb */}
        <div className="relative h-[500px] w-full flex items-center justify-center order-2 lg:order-1">
          <motion.div
            style={{ y, opacity }}
            className="relative w-[350px] h-[350px] flex items-center justify-center"
          >
            <motion.div
              style={{ x: mouseX, y: mouseY }}
              className="relative w-full h-full flex items-center justify-center"
            >
            {/* Outer Energy Field */}
            <div className="absolute inset-[-50px] border border-purple-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-[-20px] border border-pink-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

            {/* Core - The Liquid Blob */}
            <div className="relative w-full h-full rounded-full">
              {/* Layer 1: Base */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-20 blur-xl" 
              />
              
              {/* Layer 2: Swirling Liquid */}
              <div className="absolute inset-4 rounded-full overflow-hidden bg-[#020617]/50 backdrop-blur-sm border border-white/10 shadow-[0_0_60px_rgba(168,85,247,0.3)]">
                <div className="absolute inset-[-50%] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent w-[200%] h-[200%] animate-[spin_8s_linear_infinite]" />
                <div className="absolute inset-[-50%] bg-gradient-to-b from-transparent via-pink-500/20 to-transparent w-[200%] h-[200%] animate-[spin_12s_linear_infinite_reverse]" />
              </div>

              {/* Central Information */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <motion.div
                   animate={{ y: [0, -5, 0] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                   <Moon className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] mb-2" />
                </motion.div>
                <h3 className="text-3xl font-black text-white tracking-widest drop-shadow-lg">DAY 14</h3>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                   <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-xs font-bold text-emerald-300 uppercase">High Fertility</span>
                </div>
              </div>
            </div>

            {/* Orbiting Satellites */}
            {[
              { icon: <Zap size={18} />, label: "Energy", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", angle: 0 },
              { icon: <Heart size={18} />, label: "Health", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", angle: 120 },
              { icon: <Calendar size={18} />, label: "Cycle", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", angle: 240 },
            ].map((item, i) => (
              <motion.div
                key={i}
                animate={{ 
                  rotate: 360,
                  transition: { duration: 20, repeat: Infinity, ease: "linear", delay: i * -5 } 
                }}
                className="absolute w-full h-full inset-0 pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6">
                  <motion.div 
                    animate={{ rotate: -360 }} // Counter-rotate to keep icon upright
                    transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: i * -5 }}
                    className={`w-12 h-12 rounded-xl ${item.bg} ${item.border} border backdrop-blur-md flex items-center justify-center ${item.color} shadow-lg shadow-black/50`}
                  >
                    {item.icon}
                  </motion.div>
                </div>
              </motion.div>
            ))}

            </motion.div>
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-sm font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(236,72,153,0.2)]"
          >
            <Sparkles size={14} />
            <span>Women's Health Intelligence</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-[1.1]">
            Sync With Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
              Natural Rhythm.
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
            Your body is a dynamic system. Our AI visualizes your cycle as a living, breathing interface—helping you predict energy shifts, manage symptoms, and optimize your life phases.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Cycle Syncing", desc: "Phase-specific wellness advice." },
              { title: "Hormonal Insights", desc: "Predict mood and energy shifts." },
              { title: "Symptom Decoding", desc: "Understand your body's signals." },
              { title: "Vaulted Privacy", desc: "Your intimate data stays yours." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-pink-500/30 transition-all group cursor-default"
              >
                <h4 className="font-bold text-white mb-1 group-hover:text-pink-300 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 group-hover:bg-pink-400 transition-colors" />
                  {item.title}
                </h4>
                <p className="text-slate-400 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default SmartWomenHealthSection;
