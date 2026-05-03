import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: "Satisfaction Rate", value: "99%" },
  { label: "Active Community", value: "128K+" },
  { label: "Medications Tracked", value: "2.4M", highlight: true },
  { label: "AI Accuracy", value: "99.9%" },
];

const StatsEditorial = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stat-item", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });

      gsap.from(".stat-number", {
        innerText: 0,
        duration: 2.5,
        snap: { innerText: 1 },
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Centered Stats Layout */}
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20 items-center justify-center w-full">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`stat-item text-center flex flex-col items-center ${
                  stat.highlight ? 'md:scale-110 z-10' : 'opacity-80'
                }`}
              >
                <div className="relative">
                  {stat.highlight && (
                    <div className="absolute -inset-4 bg-emerald-50 rounded-full blur-2xl -z-10 opacity-60" />
                  )}
                  <h3 className={`text-6xl md:text-7xl font-black text-slate-900 mb-4 tracking-tighter stat-number leading-none ${
                    stat.highlight ? 'text-emerald-700' : ''
                  }`}>
                    {stat.value}
                  </h3>
                </div>
                <div className="h-px w-8 bg-slate-200 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] px-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsEditorial;
