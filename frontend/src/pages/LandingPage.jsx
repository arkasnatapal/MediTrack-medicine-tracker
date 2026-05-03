import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pill, Menu, X } from "lucide-react";
import EditorialHero from "../components/landing/EditorialHero";
import TrustAndImpact from "../components/landing/TrustAndImpact";
import InteractiveShowcase from "../components/landing/InteractiveShowcase";
import HorizontalScrollFeatures from "../components/landing/HorizontalScrollFeatures";
import StatsEditorial from "../components/landing/StatsEditorial";
import SupportSection from "../components/landing/SupportSection";
import TestimonialEditorial from "../components/landing/TestimonialEditorial";
import SupportFooter from "../components/landing/SupportFooter";
import SEO from "../components/SEO";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show global navbar only after scrolling past the hero (e.g., 600px)
      setShowNavbar(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Stats", href: "#stats" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "About", href: "/about" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <SEO 
        title="MediTrack - Medicine Tracking Redefined"
        description="Experience a premium, AI-powered medicine tracking platform designed for the modern lifestyle."
      />

      {/* Premium Minimal Navbar - Appears on Scroll */}
      <AnimatePresence>
        {showNavbar && (
          <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                  <img src="/logo.png" className='h-10' alt="MediTrack Logo" />
                <span className="text-xl font-black tracking-tighter text-slate-900">MediTrack</span>
              </Link>

              <div className="hidden md:flex items-center gap-12">
                <div className="flex items-center gap-8">
                  {navLinks.map((link) => (
                    <a 
                      key={link.name} 
                      href={link.href} 
                      className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-bold text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-full transition-all">
                    Login
                  </Link>
                  <Link to="/signup" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all">
                    Join Now
                  </Link>
                </div>
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-900">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] bg-white px-6 md:hidden flex flex-col"
          >
            {/* Mobile Menu Header */}
            <div className="h-20 flex items-center justify-between border-b border-slate-50 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Pill size={18} />
                </div>
                <span className="text-xl font-black tracking-tighter text-slate-900">MediTrack</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-900 bg-slate-50 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-black text-slate-900 tracking-tighter flex items-center justify-between group"
                >
                  {link.name}
                  <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <X size={16} className="rotate-45" /> {/* Using X as an arrow/plus placeholder or just a clean icon */}
                  </span>
                </a>
              ))}
              <div className="pt-12 flex flex-col gap-4">
                 <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center text-xl font-bold border border-slate-200 rounded-3xl">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center text-xl font-bold bg-slate-900 text-white rounded-3xl">
                  Join Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <div id="hero">
          <EditorialHero />
        </div>

        <TrustAndImpact />

        <InteractiveShowcase />

        <div id="features" className="relative z-10">
          <HorizontalScrollFeatures />
        </div>

        <div id="stats">
          <StatsEditorial />
        </div>

        <SupportSection />

        <div id="testimonials">
          <TestimonialEditorial />
        </div>

        <SupportFooter />
      </main>
    </div>
  );
};

export default LandingPage;
