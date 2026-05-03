import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Smile, Frown, Meh, Heart, Clock, ArrowUpRight, Pill, Activity, Bell } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SupportSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Floating animation for the floating widgets
      gsap.to(".float-widget", {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.5,
          from: "random"
        }
      });

      // Phone entrance
      gsap.from(".phone-mockup", {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-40 bg-white overflow-hidden">
      <div className="container mx-auto px-6 text-center max-w-7xl">
        
        {/* Top Tag */}
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">
          Our Impact
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-28">
          Your <span className="text-emerald-500">support</span>, wherever you are.
        </h2>

        {/* Main Composition */}
        <div className="relative w-full h-[600px] flex items-center justify-center">
          
          {/* Left Side Widgets (1 & 2) */}
          <div className="hidden lg:flex flex-col gap-12 absolute left-10 xl:left-20 top-1/2 -translate-y-1/2 z-20">
            {/* Widget 1: Prescription Adherence */}
            <motion.div 
              className="float-widget bg-white p-7 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-50 w-72"
            >
              <div className="text-left mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Pill size={14} className="text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Prescription Adherence</h4>
                </div>
                <div className="flex gap-1 h-10 items-end">
                   {[60, 40, 80, 95].map((h, i) => (
                     <div key={i} className={`flex-1 rounded-lg ${i === 3 ? 'bg-emerald-500' : 'bg-slate-100'}`} style={{ height: `${h}%` }} />
                   ))}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-slate-900">92 <span className="text-xs text-slate-300 font-bold">%</span></span>
                <div className="flex gap-0.5">
                   {[1, 2, 3, 4, 5].map(i => (
                     <div key={i} className="w-1.5 bg-emerald-500 rounded-full" style={{ height: `${i * 4}px` }} />
                   ))}
                </div>
              </div>
            </motion.div>

            {/* Widget 2: Dosage Schedule */}
            <motion.div 
              className="float-widget bg-slate-900 p-7 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-72 text-white text-left"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                   <div className="flex items-center gap-2 mb-2 opacity-60">
                     <Bell size={12} />
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest">Dosage Reminders</span>
                   </div>
                   <h4 className="text-xl font-bold leading-tight">Upcoming <br /> Medication</h4>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                   <Activity size={20} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-medium">
                  <Clock size={14} /> 14:00 Today
                </div>
                <div className="flex -space-x-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900 shadow-xl">
                      <Pill size={16} />
                   </div>
                   <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-slate-900 shadow-xl">
                      <Clock size={16} />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Central Phone Mockup */}
          <div className="phone-mockup relative z-10 w-full max-w-[340px] px-4">
            <img 
              src="/iphone-journal.png" 
              alt="iPhone Medical Dashboard" 
              className="w-full h-auto drop-shadow-[0_60px_100px_rgba(0,0,0,0.15)] scale-105" 
            />
          </div>

          {/* Right Side Widgets (3) */}
          <div className="hidden lg:flex flex-col absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 z-20">
            {/* Widget 3: Mood Selector - REMAINS AS IT IS */}
            <motion.div 
              className="float-widget bg-white/90 backdrop-blur-2xl p-9 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white w-[340px] text-center"
            >
              <h4 className="text-sm font-bold text-slate-900 mb-10">What are you feeling today?</h4>
              <div className="flex justify-between gap-2">
                {[
                  { icon: <Frown className="text-rose-400" />, label: "Very Unpleasant" },
                  { icon: <Meh className="text-orange-400" />, label: "Unpleasant" },
                  { icon: <Meh className="text-slate-400" />, label: "Bored" },
                  { icon: <Smile className="text-emerald-400" />, label: "Pleasant" },
                  { icon: <Heart className="text-blue-400" />, label: "Very Pleasant" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                    <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center transition-all group-hover:scale-125 group-hover:bg-white group-hover:shadow-lg">
                      {React.cloneElement(item.icon, { size: 20 })}
                    </div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>

        {/* Bottom Text */}
        <div className="max-w-2xl mx-auto mt-28">
          <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium">
            MediTrack fits seamlessly into your everyday life. Whether you’re on your phone during a commute, 
            at your desk on a laptop, or winding down before bed with your tablet.
          </p>
        </div>

      </div>
    </section>
  );
};

export default SupportSection;
