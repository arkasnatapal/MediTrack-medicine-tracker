import React from "react";
import { motion } from "framer-motion";
import { Bell, Users, Bot, Shield, Clock, Activity, Utensils, FolderOpen, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI Health Assistant",
    description: "Your 24/7 personal health companion. Ask about drug interactions, side effects, or get personalized wellness advice instantly.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/20",
    gradient: "from-emerald-500/20 to-teal-600/20",
    colSpan: "md:col-span-2 lg:col-span-1",
  },
  {
    icon: <Utensils className="w-6 h-6" />,
    title: "Smart Food Tracking",
    description: "Track your meals and get AI-powered insights on how your diet affects your medication efficacy.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "group-hover:shadow-orange-500/20",
    gradient: "from-orange-500/20 to-red-600/20",
    colSpan: "md:col-span-1",
  },
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "Intelligent Folders",
    description: "Automatically organize your medicines into smart categories like 'Heart Health', 'Vitamins', or 'Antibiotics'.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    glow: "group-hover:shadow-purple-500/20",
    gradient: "from-purple-500/20 to-indigo-600/20",
    colSpan: "md:col-span-1",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Smart Reminders",
    description: "Adaptive notifications that sync with your lifestyle, ensuring you never miss a dose.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "group-hover:shadow-sky-500/20",
    gradient: "from-sky-500/20 to-blue-600/20",
    colSpan: "md:col-span-1",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Family Care",
    description: "Manage medications for your entire family, including children and elderly parents, from one account.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    glow: "group-hover:shadow-pink-500/20",
    gradient: "from-pink-500/20 to-rose-600/20",
    colSpan: "md:col-span-1",
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Health Analytics",
    description: "Visualize your adherence trends and health improvements with beautiful, easy-to-understand charts.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "group-hover:shadow-blue-500/20",
    gradient: "from-blue-500/20 to-cyan-600/20",
    colSpan: "md:col-span-1",
  },
  // {
  //   icon: <Sparkles className="w-6 h-6" />,
  //   title: "Body Thesis Engine",
  //   description: "Our AI generates a living 'thesis' of your health by analyzing your daily habits and vitals.",
  //   color: "text-teal-400",
  //   bg: "bg-teal-500/10",
  //   border: "border-teal-500/20",
  //   glow: "group-hover:shadow-teal-500/20",
  //   gradient: "from-teal-500/20 to-emerald-600/20",
  //   colSpan: "md:col-span-1",
  // },
  // {
  //   icon: <FolderOpen className="w-6 h-6" />,
  //   title: "Report Decoder",
  //   description: "Upload complex lab reports and get instant, plain-English summaries and actionable insights.",
  //   color: "text-indigo-400",
  //   bg: "bg-indigo-500/10",
  //   border: "border-indigo-500/20",
  //   glow: "group-hover:shadow-indigo-500/20",
  //   gradient: "from-indigo-500/20 to-purple-600/20",
  //   colSpan: "md:col-span-1",
  // },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[#020617] -z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
      
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-medium"
          >
            <Sparkles size={14} />
            <span>Powerful Features</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">stay healthy</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            Discover a suite of intelligent tools designed to simplify your medical routine and keep your loved ones safe.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`group relative p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm hover:bg-slate-800/40 transition-all duration-500 overflow-hidden ${feature.colSpan || ''}`}
            >
              {/* Hover Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} ${feature.border} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg ${feature.glow}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
