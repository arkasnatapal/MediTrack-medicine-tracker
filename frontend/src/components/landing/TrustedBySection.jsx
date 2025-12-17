import React from "react";
import { motion } from "framer-motion";
import { Building2, Stethoscope, HeartPulse, ShieldPlus, Activity } from "lucide-react";

const logos = [
  { name: "HealthCorp", icon: <Building2 className="w-6 h-6" /> },
  { name: "MediCare+", icon: <ShieldPlus className="w-6 h-6" /> },
  { name: "UniHealth", icon: <Stethoscope className="w-6 h-6" /> },
  { name: "Vitality", icon: <Activity className="w-6 h-6" /> },
  { name: "PulseLabs", icon: <HeartPulse className="w-6 h-6" /> },
  { name: "CareGivers", icon: <Building2 className="w-6 h-6" /> },
];

const TrustedBySection = () => {
  return (
    <section className="py-10 border-y border-white/5 bg-[#020617]/50 backdrop-blur-sm overflow-hidden relative">
      <div className="container mx-auto px-8 lg:px-12 text-center mb-8">
        <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
          Trusted by caregivers, students, and families
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative flex overflow-x-hidden group">
        {/* Gradient Masks for smooth fade out at edges */}
        <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-[#020617] to-transparent z-10" />
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-[#020617] to-transparent z-10" />

        {/* Marquee Track - Duplicated for seamless loop */}
        <motion.div
          className="flex gap-16 items-center whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 30,
            ease: "linear",
          }}
        >
          {/* First Set */}
          {logos.map((logo, index) => (
            <div
              key={`logo-1-${index}`}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors duration-300 cursor-pointer"
            >
              {logo.icon}
              <span className="text-lg font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}
          
          {/* Second Set (Duplicate) */}
          {logos.map((logo, index) => (
            <div
              key={`logo-2-${index}`}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors duration-300 cursor-pointer"
            >
              {logo.icon}
              <span className="text-lg font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}

          {/* Third Set (Extra buffer) */}
          {logos.map((logo, index) => (
            <div
              key={`logo-3-${index}`}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors duration-300 cursor-pointer"
            >
              {logo.icon}
              <span className="text-lg font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}
           {/* Fourth Set (Extra buffer for wide screens) */}
           {logos.map((logo, index) => (
            <div
              key={`logo-4-${index}`}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors duration-300 cursor-pointer"
            >
              {logo.icon}
              <span className="text-lg font-bold tracking-tight">{logo.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBySection;
