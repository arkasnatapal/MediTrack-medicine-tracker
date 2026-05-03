import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Pill, Activity, Heart, Shield, Stethoscope, Syringe, Thermometer, Tablets, Sparkles, ArrowLeft } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-white font-sans">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/40 backdrop-blur-3xl border border-white/40 text-slate-900 hover:bg-white transition-all duration-300 group shadow-sm"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm">Home</span>
      </Link>

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img 
          src="/hills-bg.png" 
          alt="Background" 
          className="w-full h-full object-cover object-bottom opacity-40 grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-emerald-50/30" />
      </div>



      {/* Left Section - Editorial Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10 border-r border-slate-100/50">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-xl"
        >
          {/* Logo Container */}
          <div className="mb-16 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
              <Pill size={24} />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">MediTrack</span>
          </div>
          
          <h1 className="text-7xl font-bold mb-10 leading-[0.9] text-slate-900 tracking-tighter">
            Health <br />
            Tracking <br />
            <span className="text-emerald-600 italic">Redefined.</span>
          </h1>
          
          <p className="text-2xl text-slate-500 font-medium mb-16 leading-relaxed max-w-md">
            Experience a premium medical ecosystem designed for modern families. 
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div>
               <div className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">128K+</div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
            </div>
            <div>
               <div className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">99.9%</div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accuracy Rate</p>
            </div>
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
            <div className="relative bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-white/40 p-10 sm:p-12">

              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <Pill size={20} />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">MediTrack</span>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tighter mb-4 leading-tight">
                  {title}
                </h2>
                
                <div className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                  {subtitle}
                </div>
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
