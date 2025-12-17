import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Pill, Activity, Heart, Shield, Stethoscope, Syringe, Thermometer, Tablets, Sparkles, ArrowLeft } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const medicalIcons = [Pill, Activity, Heart, Shield, Stethoscope, Syringe, Thermometer, Tablets];

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-gray-50 dark:bg-[#020617] transition-colors duration-500">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group backdrop-blur-md"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-gray-50 to-gray-50 dark:from-emerald-900/20 dark:via-[#020617] dark:to-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay" />
        
        {/* Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Floating Medical Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {medicalIcons.map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            className="absolute"
          >
            <Icon size={Math.random() * 40 + 20} className="text-emerald-600/20 dark:text-emerald-500/20" />
          </motion.div>
        ))}
      </div>

      {/* Left Section - Info Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 flex items-center gap-4"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-hover:bg-emerald-500/30 transition-colors" />
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 border border-white/10">
                <Pill size={32} className="text-white" />
              </div>
            </div>
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              MediTrack
            </span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold mb-8 leading-tight text-slate-900 dark:text-white"
          >
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">Reimagined.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-slate-600 dark:text-slate-400 mb-12 leading-relaxed"
          >
            Experience the future of healthcare management. Secure, intelligent, and designed for your entire family.
          </motion.p>

          {/* Feature List */}
          <div className="space-y-6">
            {[
              { icon: Shield, title: 'Bank-Grade Security', desc: 'End-to-end encryption for your data' },
              { icon: Activity, title: 'Real-time Analytics', desc: 'Visualize your health progress' },
              { icon: Heart, title: 'Family Sync', desc: 'Care for loved ones seamlessly' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-5 group"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300">
                  <feature.icon className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Glassmorphic Form Container */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-[2.5rem] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/70 dark:bg-[#0f172a]/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 p-8 sm:p-10">
              {/* Mobile Logo */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="lg:hidden flex items-center justify-center gap-3 mb-8"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Pill className="text-white" size={20} />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  MediTrack
                </span>
              </motion.div>

              {/* Header */}
              <div className="text-center mb-8">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-3xl font-bold text-slate-900 dark:text-white mb-3"
                >
                  {title}
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-slate-500 dark:text-slate-400"
                >
                  {subtitle}
                </motion.div>
              </div>

              {/* Form Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
