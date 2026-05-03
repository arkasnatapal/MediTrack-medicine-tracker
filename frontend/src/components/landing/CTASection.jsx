import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-40 relative overflow-hidden bg-white">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-emerald-50 rounded-[4rem] p-12 md:p-32 text-center relative overflow-hidden shadow-sm border border-emerald-100"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} />
              Limited Beta Access
            </div>
            
            <h2 className="text-4xl md:text-7xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tighter">
              Experience the future <br className="hidden md:block" />
              of <span className="italic font-medium text-slate-400">personal health.</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-500 mb-16 font-light leading-relaxed max-w-2xl mx-auto">
              Join thousands of users who have transformed their medical routine with MediTrack's intelligent care system.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-12 py-6 rounded-full bg-slate-900 text-white font-bold text-xl hover:bg-emerald-600 transition-all duration-500 shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 group">
                  Get Started Free
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/contact" className="text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-sm">
                Talk to Sales
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
