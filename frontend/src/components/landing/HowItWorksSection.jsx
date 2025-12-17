import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description: "Sign up and add your prescriptions manually or by scanning.",
  },
  {
    number: "02",
    title: "Invite your family",
    description: "Add family members to track their health and medications too.",
  },
  {
    number: "03",
    title: "Let AI take over",
    description:
      "MediTrack AI watches for refills, expiries, and reminds you daily.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
       {/* Connecting Gradient */}
       <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-slate-900/80 to-[#020617] z-0" />

      <div className="container mx-auto px-8 lg:px-12 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            How MediTrack Works
          </motion.h2>
          <p className="text-slate-400 text-lg">
            Simple steps to a healthier, more organized life.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-900/10 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-500 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-3xl font-bold text-emerald-500 z-10">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-400 max-w-xs leading-relaxed group-hover:text-slate-300 transition-colors">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
