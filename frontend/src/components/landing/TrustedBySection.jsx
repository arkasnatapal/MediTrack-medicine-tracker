import React from "react";
import { motion } from "framer-motion";
import { Building2, Stethoscope, HeartPulse, ShieldPlus, Activity } from "lucide-react";

const logos = [
  { name: "HealthCorp", icon: <Building2 className="w-5 h-5" /> },
  { name: "MediCare+", icon: <ShieldPlus className="w-5 h-5" /> },
  { name: "UniHealth", icon: <Stethoscope className="w-5 h-5" /> },
  { name: "Vitality", icon: <Activity className="w-5 h-5" /> },
  { name: "PulseLabs", icon: <HeartPulse className="w-5 h-5" /> },
  { name: "CareGivers", icon: <Building2 className="w-5 h-5" /> },
];

const TrustedBySection = () => {
  return (
    <section className="py-20 bg-white overflow-hidden relative border-y border-slate-50">
      <div className="container mx-auto px-8 text-center mb-12">
        <p className="text-xs text-slate-400 font-bold tracking-[0.4em] uppercase">
          Integrating with leading healthcare providers
        </p>
      </div>

      <div className="relative flex overflow-x-hidden">
        <motion.div
          className="flex gap-20 items-center whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: "linear",
          }}
        >
          {[1, 2, 3, 4].map((setIndex) => (
            <React.Fragment key={setIndex}>
              {logos.map((logo, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className="flex items-center gap-3 text-slate-300 hover:text-slate-900 grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer"
                >
                  {logo.icon}
                  <span className="text-xl font-bold tracking-tighter">{logo.name}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </motion.div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
      </div>
    </section>
  );
};

export default TrustedBySection;
