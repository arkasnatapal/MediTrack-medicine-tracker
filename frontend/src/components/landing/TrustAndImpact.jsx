import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, Quote } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const TrustAndImpact = () => {
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Award Wreath Animation
      gsap.from(".award-item", {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: ".award-container",
          start: "top 80%",
        },
      });

      // Split Text Animation for Headline
      const words = headlineRef.current.innerText.split(" ");
      headlineRef.current.innerHTML = words
        .map(word => `<span class="inline-block opacity-0 translate-y-8">${word}</span>`)
        .join(" ");

      gsap.to(headlineRef.current.querySelectorAll("span"), {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        duration: 0.8,
        ease: "power4.out",
        scrollTrigger: {
          trigger: headlineRef.current,
          start: "top 85%",
        },
      });

      // Left column reveal
      gsap.from(".impact-left", {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".impact-grid",
          start: "top 80%",
        },
      });

      // Testimonial reveal
      gsap.from(".impact-testimonial", {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".impact-grid",
          start: "top 70%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const partners = [
    "Caregivers", "Hospitals", "Personal Health", "Fitness", 
    "HealthCorp", "Visionwork", "MediTrack Pro", "Luminous", 
    "Polymath", "Quxtient", "Stacked Lab", "Wellness Center"
  ];

  return (
    <section ref={sectionRef} className="py-32 bg-[#F9FBFF] text-slate-900 overflow-hidden">
      <div className="container mx-auto px-10 md:px-20 lg:px-32">
        
        {/* Integrating With Section - Infinite Marquee */}
        <div className="pt-16 mb-20 md:mb-40">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center mb-10 md:mb-16 block">Integrating With</span>
          
          <div className="relative flex overflow-x-hidden">
            <motion.div 
              className="flex whitespace-nowrap gap-24 items-center py-4"
              animate={{ x: [0, -1500] }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...partners, ...partners].map((partner, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <div className="w-3 h-3 rounded-sm bg-slate-400 group-hover:bg-emerald-600 transition-colors" />
                  </div>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{partner}</span>
                </div>
              ))}
            </motion.div>
            
            {/* Edge Gradients for smooth fade */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#F9FBFF] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#F9FBFF] to-transparent z-10" />
          </div>
        </div>

        {/* Impact Section */}
        <div className="impact-grid grid lg:grid-cols-12 gap-20 items-start">
          {/* Left Side */}
          <div className="impact-left lg:col-span-3 space-y-20">
            <div>
              <div className="w-12 h-12 text-emerald-500/20 mb-8">
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z"/></svg>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">2024 - Present</h4>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Leading Digital Health</p>
            </div>
            
            <div className="pt-8">
              <Link to="/about">
                <button className="px-10 py-3.5 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-500 shadow-sm">
                  About Us
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:col-span-9">
            <h2 
              ref={headlineRef}
              className="text-4xl md:text-[5.5rem] font-bold text-slate-900 leading-[1] tracking-tight mb-20 whitespace-pre-wrap"
            >
              The impact of clinical <span className="text-emerald-600">Bio-tracking</span> for patients with chronic <span className="text-emerald-500">pathologies</span> is revolutionary. Our <span className="text-emerald-500">Diagnostic</span> insights empower seamless <span className="text-emerald-500">therapeutic</span> adherence.
            </h2>

            <div className="impact-testimonial flex flex-col md:flex-row items-center gap-10 border-t border-slate-100 pt-12">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?img=${i+25}`} 
                    alt="Avatar" 
                    className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-lg" 
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-base md:text-xl text-slate-600 italic font-medium leading-relaxed max-w-2xl">
                  "The results demonstrate the potential as a preventive tool as well as providing on-demand support for us!"
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustAndImpact;
