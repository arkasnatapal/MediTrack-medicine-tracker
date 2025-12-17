import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-emerald-900/20 to-slate-900/40 border border-emerald-500/20 rounded-3xl p-12 md:p-20 text-center backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-emerald-900/20"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 z-0" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to stop missing medicines?
            </h2>
            <p className="text-lg text-slate-300 mb-10">
              Start your MediTrack journey today. It’s free to get started and
              secure for the whole family.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/features">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm w-full sm:w-auto"
                >
                  Explore Features
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
