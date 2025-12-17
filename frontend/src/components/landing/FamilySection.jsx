import React from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Bell, Heart, Shield, Activity, CheckCircle2, Clock } from "lucide-react";

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className={`relative backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const FloatingCard = ({ children, className = "", delay = 0, yOffset = 10 }) => (
  <motion.div
    animate={{ y: [-yOffset, yOffset, -yOffset] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute z-20 ${className}`}
  >
    <div className="backdrop-blur-md bg-slate-800/80 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30 flex items-center gap-3">
      {children}
    </div>
  </motion.div>
);

const FamilySection = () => {
  return (
    <section className="relative min-h-screen py-32 overflow-hidden bg-[#020617] flex items-center justify-center">
      {/* Seamless Blending Gradients */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#020617] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020617] to-transparent z-10 pointer-events-none" />

      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Glass Dashboard Composition (Now on Left) */}
          <div className="relative h-[600px] flex items-center justify-center order-1 perspective-1000">
            {/* Main Dashboard Card */}
            <GlassCard className="w-full max-w-md aspect-[4/5] p-6 flex flex-col gap-6 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <div className="text-white font-medium">John Doe</div>
                    <div className="text-xs text-emerald-400">Family Admin</div>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-white/5 text-slate-400">
                  <Bell size={18} />
                </div>
              </div>

              {/* Family Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Sarah", role: "Partner", color: "bg-rose-500", status: "All Good" },
                  { name: "Mike", role: "Son", color: "bg-blue-500", status: "1 Missed" },
                  { name: "Emma", role: "Daughter", color: "bg-purple-500", status: "All Good" },
                  { name: "Grandpa", role: "Elder", color: "bg-amber-500", status: "Refill Soon" }
                ].map((member, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-xs font-bold text-white`}>
                        {member.name[0]}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${member.status === "All Good" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </div>
                    <div className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.role}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="flex-1 bg-black/20 rounded-xl p-4 space-y-3">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Recent Updates</div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-slate-300">Sarah took Vitamin D</span>
                  <span className="text-xs text-slate-500 ml-auto">10m</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-amber-500" />
                  <span className="text-slate-300">Grandpa needs refill</span>
                  <span className="text-xs text-slate-500 ml-auto">2h</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MessageCircle size={16} className="text-blue-500" />
                  <span className="text-slate-300">New message from Mike</span>
                  <span className="text-xs text-slate-500 ml-auto">5h</span>
                </div>
              </div>
            </GlassCard>

            {/* Floating Elements */}
            <FloatingCard className="-right-4 top-20" delay={0} yOffset={15}>
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Weekly Report</div>
                <div className="text-xs text-emerald-400">98% Adherence</div>
              </div>
            </FloatingCard>

            <FloatingCard className="-left-8 bottom-32" delay={1} yOffset={20}>
              <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                <Heart size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Family Health</div>
                <div className="text-xs text-slate-400">All vitals normal</div>
              </div>
            </FloatingCard>

            {/* Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -z-10" />
          </div>

          {/* Text Content (Now on Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8 order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium">
              <Users size={16} />
              <span>Family Mode</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Complete Care for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Your Whole Circle
              </span>
            </h2>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              Manage medications, appointments, and health records for your children, parents, and partner—all from a single, beautiful dashboard.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { icon: Shield, title: "Unified Management", desc: "One account to manage everyone's health needs." },
                { icon: MessageCircle, title: "Secure Family Chat", desc: "Private, encrypted messaging for care coordination." },
                { icon: Bell, title: "Smart Notifications", desc: "Get alerts when a family member misses a dose." }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="p-3 rounded-xl bg-slate-800 text-emerald-400 group-hover:scale-110 transition-transform">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default FamilySection;
