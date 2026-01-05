import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { QrCode, Shield, Fingerprint, Share2, Smartphone, ScanLine, Wifi } from "lucide-react";

const IdentityShowcaseSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Scroll animations
  const y = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.8]);

  // Mouse tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { stiffness: 150, damping: 20 });
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const glareOpacity = useTransform(useMotionValue(0), [0, 1], [0, 1]); // Placeholder for glare opacity logic if needed

  return (
    <section
      ref={containerRef}
      className="relative min-h-[140vh] py-32 overflow-hidden flex items-center justify-center perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Cyber Background */}
      <div className="absolute inset-0 bg-[#020617] overflow-hidden">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Blending Gradients - Top and Bottom */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#020617] to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020617] to-transparent z-10" />

        {/* Moving Spotlights */}
        <motion.div 
            animate={{ 
                x: [0, 100, 0], 
                y: [0, -50, 0],
                opacity: [0.3, 0.6, 0.3] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 blur-[150px] rounded-full mix-blend-screen" 
        />
        <motion.div 
            animate={{ 
                x: [0, -100, 0], 
                y: [0, 50, 0],
                opacity: [0.3, 0.6, 0.3] 
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen" 
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center gap-20">
          
          {/* Header Area */}
          <div className="text-center max-w-4xl mx-auto space-y-8 relative">
             <motion.div
              style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-full h-[200px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl pointer-events-none"
             />

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-emerald-500/30 text-emerald-400 text-sm font-medium backdrop-blur-md shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
            >
              <ScanLine size={16} className="animate-pulse" />
              <span className="animate-pulse">Next-Gen Identity Protocol</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]"
            >
              The Future is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-200 animate-gradient-x">
                Contactless.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Forget physical cards. Your entire medical history, instantly verifiable via secure blockchain-backed QR.
            </motion.p>
          </div>

          {/* 3D Holographic Card Container */}
          <div className="relative w-[90%] md:w-full max-w-[500px] perspective-[1500px] group">
            
            {/* Ambient Glow - Adjusted for Green Theme */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-500/30 to-teal-500/30 blur-[80px] rounded-full animate-pulse-slow pointer-events-none" />

            <motion.div
              style={{ rotateX, rotateY, scale }}
              className="relative z-20 cursor-none"
            >
              {/* Card Geometry */}
              <div className="relative w-full aspect-[1.586/1] rounded-[24px] md:rounded-[32px] shadow-2xl transition-all duration-200">
                
                {/* Main Card Surface - Green Gradient */}
                <div className="absolute inset-0 rounded-[24px] md:rounded-[32px] overflow-hidden"
                     style={{
                        background: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)', // teal-700 to emerald-600
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                     }}
                >
                  {/* Subtle Noise Texture */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                  
                  {/* Dynamic Glare Effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-50 mix-blend-overlay"
                    style={{
                        background: `radial-gradient(circle at ${mouseX.get() * 100 + 50}% ${mouseY.get() * 100 + 50}%, rgba(255,255,255,0.4), transparent 60%)`
                    }}
                  />

                  {/* Card Content */}
                  <div className="relative h-full p-6 md:p-8 flex flex-col justify-between text-white z-10">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Logo Icon Container */}
                        <img src="/logo.png" className='h-10' alt="MediTrack Logo" />
                        <div>
                          <h3 className="font-bold text-lg md:text-xl tracking-tight leading-tight">MediTrack</h3>
                          <p className="text-[10px] md:text-xs text-emerald-100/80 font-medium tracking-wider uppercase">Health Identity</p>
                        </div>
                      </div>
                      
                      {/* Official ID Badge */}
                      <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 border border-white/10 rounded-lg backdrop-blur-sm">
                        <span className="text-[10px] md:text-xs font-bold tracking-widest text-white/90">OFFICIAL ID</span>
                      </div>
                    </div>

                    {/* Profile Section */}
                    <div className="flex items-center gap-4 md:gap-6 mt-2">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm">
                                <img 
                                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                                    alt="User" 
                                    className="w-full h-full rounded-full object-cover border-2 border-transparent"
                                />
                            </div>
                            {/* Verified Checkmark */}
                            <div className="absolute bottom-0 right-0 translate-x-1 translate-y-1 bg-emerald-500 border-2 border-[#0f766e] rounded-full p-0.5 md:p-1">
                                <Shield className="w-3 h-3 md:w-4 md:h-4 text-white fill-current" /> 
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl md:text-2xl font-bold text-white truncate mb-0.5">Alex Morgan</h2>
                            <p className="text-emerald-50/80 text-xs md:text-sm truncate mb-3">alex.morgan@example.com</p>
                            
                            <div className="flex items-center gap-3">
                                {/* ID Pill */}
                                <div className="px-3 py-1 bg-black/20 rounded-full border border-white/5 backdrop-blur-md">
                                    <code className="text-xs md:text-sm font-mono font-bold tracking-wider text-white">MT-56PAJK</code>
                                </div>
                                {/* Copy Button (Visual) */}
                                
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end">
                       <div className="space-y-0.5 md:space-y-1">
                          <p className="text-[9px] md:text-[10px] text-emerald-100/70 tracking-widest font-bold uppercase">Member Since</p>
                          <p className="text-sm md:text-lg font-bold text-white">2026</p>
                       </div>
                       
                       {/* QR Code */}
                       <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-lg">
                           <QrCode size={42} className="text-zinc-900 md:hidden" />
                           <QrCode size={52} className="text-zinc-900 hidden md:block" />
                       </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
            {[
              {
                title: "Zero Friction",
                desc: "Walk into any partner hospital and get recognized instantly.",
                icon: <Fingerprint className="text-cyan-400" />
              },
              {
                title: "Cryptographic Security",
                desc: "Your data is encrypted. Only you hold the keys to share it.",
                icon: <Shield className="text-emerald-400" />
              },
              {
                title: "Smart Sync",
                desc: "Updates in real-time. New prescription? It's already on your card.",
                icon: <Wifi className="text-purple-400" />
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        {React.cloneElement(feature.icon, { size: 28 })}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                 </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default IdentityShowcaseSection;
