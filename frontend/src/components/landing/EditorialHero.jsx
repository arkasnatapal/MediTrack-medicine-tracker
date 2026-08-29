import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Pill, Heart, Activity, ArrowUpRight, ShieldCheck, Star, Zap, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const EditorialHero = () => {
  const containerRef = useRef(null);
  const heroImageRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animations
      gsap.from(".headline-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });



      // Floating Animation for Orbiting Cards
      gsap.to(".orbit-card", {
        y: "-=15",
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.5,
          from: "random",
        },
      });


    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative pt-24 md:pt-28 pb-0 overflow-hidden bg-cover bg-center bg-top"
      style={{ backgroundImage: "url('/sky-bg.png')" }}
    >
      {/* Navbar Overlay - Image Match */}
      <div className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4">
        <div className="bg-white/50 backdrop-blur-3xl rounded-full px-4 py-2 flex md:py-2.5 items-center justify-between shadow-sm border border-white/60">
          <div className="hidden md:flex gap-1 items-center w-full justify-around">
            <Link to="/" className="bg-emerald-700 text-white px-8 py-2 rounded-full text-sm font-extrabold shadow-lg shadow-emerald-900/10">Home</Link>
            <a href="#testimonial" className="text-slate-700 text-sm font-extrabold hover:text-slate-950 transition-colors px-4">Testimonial</a>
            <a href="#features" className="text-slate-700 text-sm font-extrabold hover:text-slate-950 transition-colors px-4">Features</a>
            <a href="#about" className="text-slate-700 text-sm font-extrabold hover:text-slate-950 transition-colors px-4 border-r border-slate-300">About Us</a>
          </div>
          
          <div className="flex md:hidden items-center gap-2 px-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Pill size={16} />
            </div>
            <span className="text-sm font-black text-slate-950 tracking-tighter">MediTrack</span>
          </div>

          <div className="flex items-center gap-4 md:ml-8 whitespace-nowrap">
            <Link to="/login" className="hidden md:flex bg-white rounded-full pl-4 md:pl-6 pr-1 py-1 items-center gap-3 md:gap-6 border border-white/90 shadow-sm hover:shadow-md transition-all group">
              <span className="text-xs md:text-sm font-black text-slate-950 tracking-tighter uppercase">Log In</span>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white group-hover:bg-emerald-500 transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-sm"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[80%] bg-white shadow-2xl p-8 flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Pill size={18} />
                </div>
                <span className="text-lg font-black text-slate-950 tracking-tighter">MediTrack</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-950"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              <Link to="/" className="text-2xl font-bold text-slate-950" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <a href="#testimonial" className="text-2xl font-bold text-slate-700" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              <a href="#features" className="text-2xl font-bold text-slate-700" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#about" className="text-2xl font-bold text-slate-700" onClick={() => setIsMenuOpen(false)}>About Us</a>
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <Link to="/login" className="w-full py-4 rounded-2xl border border-slate-200 text-center font-bold text-slate-950" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="w-full py-4 rounded-2xl bg-slate-950 text-white text-center font-bold" onClick={() => setIsMenuOpen(false)}>
                Join Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Hero Content */}
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Headlines */}
        <div className="max-w-4xl mx-auto mb-10 mt-12 md:mt-16">
          <h1 className="text-4xl md:text-7xl font-black text-slate-950 leading-tight tracking-tight mb-6 headline-text">
            <span className="text-slate-950">Health tracking </span><span className="text-emerald-800">redefined</span> <br />
            <span className="text-slate-950">Completely effortless.</span>
          </h1>
          <p className="text-slate-800 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed headline-text font-bold">
            From first steps to ongoing care, MediTrack offers safe, evidence-based <br className="hidden md:block" />
            support for individuals, families, and healthcare systems.
          </p>
        </div>

        {/* Join Now Button */}
        <div className="mb-8 headline-text relative z-30">
          <Link to="/signup" className="inline-flex items-center bg-slate-950 text-white pl-8 pr-3 py-3 rounded-full gap-6 mx-auto group hover:bg-emerald-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform active:scale-95">
            <span className="font-extrabold text-white text-sm md:text-base tracking-tight">Join Now</span>
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-emerald-700 transition-all">
              <ArrowUpRight size={22} className="text-slate-950" />
            </div>
          </Link>
        </div>

        {/* ── Spiral UI: Desktop ── */}
        <div
          className="relative max-w-5xl mx-auto hidden md:flex items-center justify-center"
          style={{ height: '520px', perspective: '2000px' }}
        >
          <div
            className="orbit-container relative w-full h-full flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >

            {/* Far-Left: Today's Session */}
            <div
              className="orbit-card absolute w-56 p-5 bg-emerald-50/80 backdrop-blur-2xl border border-white/70 rounded-[2rem] shadow-2xl z-10 text-left"
              style={{ left: '0%', top: '50%', transform: 'translateY(-50%) rotateY(28deg) translateZ(-60px)', transformOrigin: 'left center' }}
            >
              <div className="text-[9px] text-emerald-900 font-bold uppercase tracking-widest mb-1">Therapy</div>
              <div className="absolute top-4 right-5 text-3xl font-black text-emerald-950/15">06</div>
              <h3 className="text-sm font-black text-emerald-950 mb-3">Today's Session</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/80 rounded-full px-2.5 py-1 border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-[9px] font-bold text-slate-800">1hr</span>
                </div>
                <span className="text-[9px] text-slate-600 font-bold">08:00–09:00</span>
              </div>
            </div>

            {/* Center-Left: Medicine Streak */}
            <div
              className="orbit-card absolute w-48 p-5 bg-white/80 backdrop-blur-2xl border border-white/70 rounded-[2rem] shadow-2xl z-20 text-left"
              style={{ left: '16%', top: '8%', transform: 'rotateY(14deg) translateZ(20px)' }}
            >
              <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Streak</div>
              <h3 className="text-xs font-black text-slate-950 mb-2">Medicine Streak</h3>
              <div className="flex items-end gap-1 h-9 mb-1">
                {[0.5, 0.8, 0.4, 1, 0.7, 0.6].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm"
                    style={{ height: `${h * 100}%`, background: i === 3 ? '#059669' : 'rgba(16,185,129,0.3)' }} />
                ))}
              </div>
              <div className="text-[9px] text-emerald-800 font-bold">+5% this month</div>
            </div>

            {/* Central Image */}
            <div
              className="hero-main-img absolute"
              style={{ left: '46%', top: '55%', transform: 'translate(-50%, -52%) translateZ(40px)', width: '420px', zIndex: 30 }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-[80px] scale-150" />
              <img
                src="/hero-portrait.png"
                alt="Central Health Person"
                className="w-full object-cover object-top rounded-[4rem] shadow-2xl brightness-[1.05]"
                style={{ height: '560px', maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)' }}
              />
            </div>

            {/* Center-Right: Daily Journal */}
            <div
              className="orbit-card absolute w-48 p-5 bg-white/85 backdrop-blur-2xl border border-white/70 rounded-[2rem] shadow-2xl z-20 text-left"
              style={{ right: '16%', top: '8%', transform: 'rotateY(-14deg) translateZ(20px)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
                <span className="text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">5% ↑</span>
              </div>
              <h3 className="text-xs font-black text-slate-950 mt-2 mb-1">Health Score</h3>
              <span className="text-2xl font-black text-slate-950">86</span>
              <span className="text-[9px] text-slate-600 font-bold ml-1">/100</span>
              <div className="flex items-end gap-0.5 h-5 mt-2">
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
                  <div key={i} className="w-2 bg-emerald-600 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                ))}
              </div>
            </div>

            {/* Far-Right: Track Your Mood */}
            <div
              className="orbit-card absolute w-56 p-5 bg-white/85 backdrop-blur-2xl border border-white/70 rounded-[2rem] shadow-2xl z-10 text-left"
              style={{ right: '0%', top: '50%', transform: 'translateY(-50%) rotateY(-28deg) translateZ(-60px)', transformOrigin: 'right center' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-950">Track<br />Your Health</h3>
                <div className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Pleasant</div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 rounded-full"
                    style={{ height: `${20 + Math.sin(i) * 6}px`, background: i < 7 ? '#059669' : 'rgba(100,116,139,0.2)' }} />
                ))}
              </div>
              <div className="text-[9px] font-bold text-slate-950">
                78% <span className="text-slate-600 font-bold">healthy this week</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="md:hidden flex flex-col items-center gap-6 mt-4 relative">
          {/* Portrait Container */}
          <div className="relative w-72 h-[320px] flex items-center justify-center overflow-visible">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] scale-125" />
            <img
              src="/hero-portrait.png"
              alt="Central Health Person"
              className="absolute w-full object-cover object-top rounded-[3rem] shadow-2xl brightness-[1.05]"
              style={{ 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
                height: '400px',
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' 
              }}
            />
          </div>
          {/* Two mini cards side by side */}
          <div className="flex gap-4 w-full max-w-sm px-4 mt-8 z-10">
            <div className="orbit-card flex-1 p-3 bg-emerald-50/80 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-lg text-left">
              <div className="text-[8px] text-emerald-900 font-bold uppercase tracking-widest mb-1">Therapy</div>
              <h3 className="text-xs font-black text-emerald-950">Today's Session</h3>
              <div className="text-[8px] text-slate-700 font-bold mt-1">1hr · 08:00–09:00</div>
            </div>
            <div className="orbit-card flex-1 p-3 bg-white/80 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-lg text-left">
              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Mood</div>
              <h3 className="text-xs font-black text-slate-950">Track Your Mood</h3>
              <div className="text-[8px] font-bold text-emerald-800 mt-1">78% happy</div>
            </div>
          </div>
        </div>

        {/* Footer Stats Row */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mt-12 md:-mt-16 gap-10 md:gap-8 relative z-20">
          {/* Left Stats */}
          <div className="text-center md:text-left">
            <div className="text-5xl md:text-7xl font-black text-emerald-800 mb-2">99%</div>
            <p className="text-slate-900 text-xs md:text-base font-bold underline underline-offset-8 decoration-emerald-500/40 mb-6 md:mb-8 max-w-[200px] md:max-w-none mx-auto md:mx-0">Satisfaction for our services</p>
            <div className="flex gap-3 justify-center md:justify-start">
              {[Heart, Star, Pill, Activity, ShieldCheck].map((Icon, i) => (
                <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white shadow-lg">
                  <Icon size={14} className="md:w-[18px] md:h-[18px]" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Community Stats */}
          <div className="text-center md:text-right max-w-xs">
            <div className="flex justify-center md:justify-end gap-1 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full border border-slate-400" />)}
            </div>
            <div className="flex items-center justify-center md:justify-end gap-4 mb-4 md:mb-6">
               <div className="flex -space-x-3">
                 {[1, 2, 3].map(i => (
                   <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                 ))}
               </div>
               <div className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter">128K+</div>
            </div>
            <p className="text-[10px] md:text-sm font-bold text-slate-700 leading-snug">
              Our user community keeps growing, proof we can <span className="text-slate-950 font-black">reach everybody's hearts</span>
            </p>
          </div>
        </div>

      </div>

      {/* Bottom fade — seamless blend into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-[55vh] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
    </section>
  );
};

export default EditorialHero;
