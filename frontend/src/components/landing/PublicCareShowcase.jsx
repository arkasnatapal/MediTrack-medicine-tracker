import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, Stethoscope, Clock, Activity, Pill, Video, 
  ArrowUpRight, MapPin, Sparkles, CheckCircle2, Zap, Bed, 
  PhoneCall, ChevronRight, ShieldCheck, HeartPulse, Send,
  Download, FileText, Check, ShieldAlert, Users
} from "lucide-react";

const PublicCareShowcase = () => {
  return (
    <section className="py-28 px-4 sm:px-6 md:px-12 lg:px-20 bg-[#090d16] text-slate-100 relative overflow-hidden font-sans border-t border-slate-800/60">
      
      {/* Ambient background glowing radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">
            <Zap size={14} className="text-emerald-400 animate-pulse" />
            <span>Public Care Network Ecosystem</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Connected public healthcare <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              all in one place.
            </span>
          </h2>

          <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
            Experience tier-based public healthcare integration. From Primary Health Centers (PHC) to District Hospitals, manage OPD tokens, triage, diagnostics, and teleconsultation seamlessly.
          </p>
        </motion.div>

        {/* BENTO GRID CONTAINER WITH SCROLL ANIMATIONS */}
        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch overflow-hidden py-2">
          
          {/* TOP LEFT CARD: Sliders in from LEFT */}
          <motion.div 
            initial={{ opacity: 0, x: -70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-cyan-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 inline-block">
                Tier 1 - Tier 4 Locator
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Public Healthcare Portal
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                Locate nearby government medical centers with live bed capacity, specialist staff, and turn-by-turn GPS navigation.
              </p>
            </div>

            {/* Inner Dashboard Mockup Card */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 group-hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-md">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">District General Hospital</h4>
                    <p className="text-[10px] font-semibold text-slate-400">Taluka Central • 1.2 km away</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  24/7 Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Beds</span>
                  <span className="text-2xl font-black text-white">62 <span className="text-xs font-bold text-slate-400">ICU/OPD</span></span>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specialists</span>
                  <span className="text-2xl font-black text-emerald-400">8 <span className="text-xs font-bold text-slate-400">On Duty</span></span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TOP MIDDLE CARD: Slides UP from bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-amber-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block">
                OPD Queue Tracker
              </span>
              <h3 className="text-2xl font-black text-white">
                Live OPD Tokens
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Reserve consultation tokens digitally & track live queue wait times.
              </p>
            </div>

            {/* Inner Floating Token Card */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl text-center space-y-2 group-hover:border-amber-500/30 transition-colors">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Live OPD Token</span>
              <div className="text-4xl font-black text-white tracking-tight">
                #37
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                ~12 Mins Estimated Wait
              </p>
            </div>
          </motion.div>

          {/* TOP RIGHT CARD: Slides in from RIGHT */}
          <motion.div 
            initial={{ opacity: 0, x: 70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-purple-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 inline-block">
                AI Urgency Engine
              </span>
              <h3 className="text-2xl font-black text-white">
                Digital AI Triage
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Smart symptom evaluation with rapid 108/112 SOS dispatch.
              </p>
            </div>

            {/* Inner Urgency Card */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-2 group-hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-purple-400" />
                  <span>Clinical Urgency</span>
                </span>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Non-Emergency
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-snug">
                Recommended: OPD Consultation token reserved at local PHC.
              </p>
            </div>
          </motion.div>

          {/* BOTTOM LEFT CARD: Slides in from LEFT */}
          <motion.div 
            initial={{ opacity: 0, x: -70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-rose-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 inline-block">
                Remote Medical Officers
              </span>
              <h3 className="text-2xl font-black text-white">
                Specialist Teleconsult
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Direct HD video consultation with verified government medical officers.
              </p>
            </div>

            {/* Inner Video Chat Bubble Snippet */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 group-hover:border-rose-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    DR
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Dr. Mehta, Medical Officer</h5>
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online for Video</span>
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Video size={16} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM MIDDLE CARD: Slides UP from bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-emerald-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                Multi-Tier Integration
              </span>
              <h3 className="text-2xl font-black text-white">
                Seamless Integration
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Connects records across PHC, CHC, District Hospital & OpenFDA drug info.
              </p>
            </div>

            {/* Orbiting Icons Display */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex items-center justify-around group-hover:border-emerald-500/30 transition-colors">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
                <Building2 size={20} />
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                <Pill size={20} />
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                <Activity size={20} />
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
                <ShieldCheck size={20} />
              </div>
            </div>
          </motion.div>

          {/* BOTTOM RIGHT CARD: Slides in from RIGHT */}
          <motion.div 
            initial={{ opacity: 0, x: 70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl hover:border-amber-500/40 transition-all duration-500 group relative overflow-hidden"
          >
            <div className="mb-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block">
                Diagnostics & Pharmacy
              </span>
              <h3 className="text-2xl font-black text-white">
                Diagnostic & Pharmacy
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Real-time ECG, X-Ray, CT machine uptime & essential drug inventory.
              </p>
            </div>

            {/* Inner Diagnostic Table Snippet */}
            <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-2 group-hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-2">
                <span>Diagnostic Test</span>
                <span>Uptime Status</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>⚡ ECG Machine</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>⚡ Digital X-Ray</span>
                <span className="text-emerald-400 font-bold">Available</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM ACTION CTA STRIP */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            to="/care-network"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-95 group"
          >
            <span>Access MediTrack Public Care Network</span>
            <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform duration-300 text-slate-950" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default PublicCareShowcase;
