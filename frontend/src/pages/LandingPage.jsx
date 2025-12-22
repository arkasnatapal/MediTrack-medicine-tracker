import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pill, Menu, X } from "lucide-react";
import HeroSection from "../components/landing/HeroSection";
import TrustedBySection from "../components/landing/TrustedBySection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FamilySection from "../components/landing/FamilySection";
import AIShowcaseSection from "../components/landing/AIShowcaseSection";
import StatsSection from "../components/landing/StatsSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import HealthAnalysisSection from "../components/landing/HealthAnalysisSection";
import ReportThesisSection from "../components/landing/ReportThesisSection";
import SEO from "../components/SEO";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Body Thesis", href: "#body-thesis" },
    { name: "Report Decoder", href: "#report-decoder" },
    { name: "Family", href: "#family" },
    { name: "AI Assistant", href: "#ai-showcase" },
  ];

  useEffect(() => {
    // Scroll detection for navbar visibility
    const handleScroll = () => {
      // Show navbar only after scrolling past the hero section (100vh)
      const heroHeight = window.innerHeight;
      setShowNavbar(window.scrollY > heroHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);

    // Parallax effect for floating elements
    gsap.utils.toArray(".parallax-element").forEach((layer) => {
      const depth = layer.dataset.depth;
      const movement = -(layer.offsetHeight * depth);
      gsap.to(layer, {
        y: movement,
        ease: "none",
        scrollTrigger: {
          trigger: layer,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };



  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
      <SEO 
        title="MediTrack - Smartest Way to Manage Health"
        description="MediTrack uses advanced AI to track medications, analyze health trends, and provide personalized insights for you and your family."
        keywords="medicine tracker, AI health assistant, family health, medical reports, health analysis"
      />
      {/* Navbar - Appears only after Hero */}
      <AnimatePresence>
        {showNavbar && (
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-white/10">
                      <Pill className="text-white" size={20} />
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">MediTrack</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                  {navLinks.map((link, index) => (
                    <button
                      key={link.name}
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group"
                    >
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300 ease-out" />
                    </button>
                  ))}

                  <div className="h-6 w-px bg-white/10 mx-2" />

                  {/* CTA Buttons */}
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="group relative px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl overflow-hidden shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 hover:shadow-emerald-500/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Get Started</span>
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden bg-[#020617] border-t border-white/10 overflow-hidden"
                >
                  <div className="px-4 py-6 space-y-4">
                    {navLinks.map((link, index) => (
                      <motion.button
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => scrollToSection(link.href)}
                        className="block w-full text-left px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        {link.name}
                      </motion.button>
                    ))}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <Link
                        to="/login"
                        className="px-4 py-3 text-sm font-semibold text-center text-slate-300 border border-slate-800 rounded-xl hover:bg-white/5 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/signup"
                        className="px-4 py-3 text-sm font-bold text-center text-white bg-emerald-600 rounded-xl shadow-lg transition-all active:scale-95"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Global Background Gradients - Enhanced */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] mix-blend-screen animate-pulse-slow delay-1000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[120px] mix-blend-screen animate-pulse-slow delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay brightness-100 contrast-150" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col">
        <div id="hero" className="relative">
          <HeroSection />
        </div>
        
        <div className="relative z-20 bg-[#020617]">
          <TrustedBySection />
          <div id="features">
            <FeaturesSection />
          </div>
          <div id="family">
            <FamilySection />
          </div>
          <div id="how-it-works">
            <HowItWorksSection />
          </div>
          <div id="ai-showcase">
            <AIShowcaseSection />
          </div>
          <div id="body-thesis">
            <HealthAnalysisSection />
          </div>
          <div id="report-decoder">
            <ReportThesisSection />
          </div>
          <StatsSection />
          <div id="testimonials">
            <TestimonialsSection />
          </div>
          <CTASection />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#020617] relative z-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Pill size={20} />
            <span className="font-bold text-lg">MediTrack</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} MediTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
