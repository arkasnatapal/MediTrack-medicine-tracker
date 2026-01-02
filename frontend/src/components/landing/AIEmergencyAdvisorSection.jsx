import React from "react";
import { motion } from "framer-motion";
import { Siren, ShieldAlert, MapPin, Activity, PhoneCall, ArrowRight } from "lucide-react";

const AIEmergencyAdvisorSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Pulse Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-wider"
          >
            <Siren size={14} className="animate-pulse" />
            <span>Emergency Response</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            Seconds Matter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              AI That Saves Lives.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg"
          >
            Instant guidance when you need it most. From first aid protocols to automated emergency broadcasts, MediTrack ensures you're never alone in a crisis.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: <PhoneCall className="w-8 h-8 text-red-500" />,
              title: "One-Tap SOS",
              desc: "Instantly alert emergency contacts with your live location and status.",
              borderColor: "group-hover:border-red-500/50"
            },
            {
              icon: <Activity className="w-8 h-8 text-orange-500" />,
              title: "AI First Aid",
              desc: "Real-time, step-by-step audio and visual guidance for medical emergencies.",
              borderColor: "group-hover:border-orange-500/50"
            },
            {
              icon: <MapPin className="w-8 h-8 text-blue-500" />,
              title: "Hospital Finder",
              desc: "Smart routing to the nearest ER with traffic-aware navigation.",
              borderColor: "group-hover:border-blue-500/50"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className={`p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/5 transition-all duration-300 group ${item.borderColor}`}
            >
              <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Demo UI Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 pointer-events-none" />
          <div className="p-1 border-b border-white/10 bg-black/20 flex items-center gap-2 px-4">
             <div className="w-3 h-3 rounded-full bg-red-500" />
             <div className="w-3 h-3 rounded-full bg-yellow-500" />
             <div className="w-3 h-3 rounded-full bg-green-500" />
             <div className="ml-auto text-xs text-slate-500 font-mono">EMERGENCY_MODE_ACTIVE</div>
          </div>
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
             <div className="flex-1 space-y-4">
               <div className="flex items-center gap-3 text-red-400 font-mono text-sm mb-2">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                 </span>
                 BROADCASTING LIVE LOCATION
               </div>
               <h3 className="text-3xl font-bold text-white">"Help! Severe allergic reaction."</h3>
               <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-red-500">
                 <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                   <ShieldAlert size={18} className="text-red-500" />
                   AI Advisor Protocol:
                 </h4>
                 <ul className="space-y-2 text-slate-300 text-sm">
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">1.</span>
                     Administer Epinephrine auto-injector immediately if available.
                   </li>
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">2.</span>
                     Lay person flat with legs raised. Do not stand.
                   </li>
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">3.</span>
                     Emergency services have been notified (ETA: 4 mins).
                   </li>
                 </ul>
               </div>
             </div>
             <div className="w-full md:w-1/3">
                <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 animate-pulse">
                   <PhoneCall size={20} />
                   Call Emergency (911)
                </button>
             </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AIEmergencyAdvisorSection;
