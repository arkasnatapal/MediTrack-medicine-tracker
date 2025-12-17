import React from "react";
import { motion } from "framer-motion";

const stats = [
  { label: "Doses Tracked", value: "10k+" },
  { label: "Missed Meds Reduced", value: "97%" },
  { label: "Active Users", value: "5,000+" },
  { label: "Countries", value: "40+" },
];

const StatsSection = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-[#020617]/30 backdrop-blur-sm">
      <div className="container mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-2">
                {stat.value}
              </h3>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
