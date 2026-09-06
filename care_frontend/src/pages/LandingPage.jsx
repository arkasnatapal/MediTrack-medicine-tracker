import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Stethoscope, ShieldCheck, Activity, ArrowUpRight, 
  HeartPulse, UserCheck, PhoneCall, Layers, CheckCircle2, 
  Sun, Moon, Star, X, ExternalLink, Sparkles, Check, Hospital, 
  Users, ChevronRight, FileCode2, ArrowRight, MessageSquare, Plus, Minus,
  Globe, Linkedin, Instagram, Facebook, Mail, Phone, MapPin, Radio
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  useScrollReveal();

  // State for API Modal (Separate External Portal)
  const [showApiModal, setShowApiModal] = useState(false);

  // State for FAQ Accordion
  const [openFaq, setOpenFaq] = useState(0);

  // State for Professionals Green Section Accordion
  const [activeTrustTab, setActiveTrustTab] = useState(0);

  // Fallback handler for broken remote images
  const handleImgError = (e, name = 'Doctor') => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=fff&bold=true`;
  };

  const trustItems = [
    {
      title: "Why Hospitals & PHCs Trust Us",
      points: [
        "Zero expensive hardware—runs inside standard web browsers.",
        "Built-in LiveKit WebRTC HD video teleconsultations."
      ]
    },
    {
      title: "Turnkey OPD & Emergency Bed Allocation",
      points: [
        "Real-time OPD patient queue management & digital priority tokens.",
        "Instant ICU & emergency bed reservation across district hospital nodes."
      ]
    },
    {
      title: "Offline-First Rural Synchronization",
      points: [
        "Uninterrupted clinical operation during remote village network dropouts.",
        "Automated background re-synchronization with zero paper record loss."
      ]
    }
  ];

  const faqData = [
    {
      q: "How does MediTrack Care support rural health centers (PHCs & CHCs)?",
      a: "MediTrack Care provides an out-of-the-box, zero-setup digital ecosystem (care_backend + care_frontend). Rural primary health centers can immediately log OPD queues, track emergency bed capacity, and launch LiveKit HD video consultations with city doctors."
    },
    {
      q: "How do specialist doctors connect for remote teleconsultations?",
      a: "Specialist doctors sign into the Doctor Portal to view incoming tele-triage requests. Each video session includes automatic 10 follow-up message rules between village nurses and doctors."
    },
    {
      q: "Does MediTrack Care work during rural internet outages?",
      a: "Yes! The platform includes offline-first synchronization. Health workers can register OPD patients offline, and data automatically reconciles when connectivity resumes."
    },
    {
      q: "Where is the Enterprise HMIS API Layer hosted?",
      a: "The API Layer operates on a separate developer website (https://api.meditrack-health.org). Click the 'API Layer' button in the navbar to request early integration keys."
    },
    {
      q: "Is there any hardware installation required?",
      a: "None! MediTrack Care runs seamlessly inside standard web browsers on laptops, tablets, or mobile phones."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col relative selection:bg-teal-600 selection:text-white overflow-x-hidden transition-colors duration-300 font-sans">
      {/* Background Ambient Glow */}
      <div className="atmospheric-bg" />

      {/* Redesigned Full-Width Floating Header */}
      <header className="w-full sticky top-3 z-50 px-4 sm:px-8 lg:px-12">
        <div className="w-full max-w-[1536px] mx-auto bg-[var(--nav-bg)] backdrop-blur-2xl border border-[var(--border-card)] px-6 py-3.5 rounded-full shadow-xl flex items-center justify-between transition-colors duration-300">
          
          {/* Left Brand Identity */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
                MediTrack <span className="text-teal-600 dark:text-teal-400 font-bold">Care</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider font-mono uppercase">
                Public Health Ecosystem
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold text-[var(--text-muted)]">
            <a href="#about" className="hover:text-[var(--text-main)] transition-colors">Home</a>
            <a href="#about" className="hover:text-[var(--text-main)] transition-colors">About Us</a>
            <a href="#services" className="hover:text-[var(--text-main)] transition-colors">Our Services</a>
            <a href="#trust" className="hover:text-[var(--text-main)] transition-colors">Programs</a>
            <a href="#faq" className="hover:text-[var(--text-main)] transition-colors">FAQ</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full bg-[var(--bg-pill)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-main)] hover:border-teal-500 transition-all shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-700" />}
            </button>

            {/* Dedicated API Layer Portal Button */}
            <button
              onClick={() => setShowApiModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all shadow-sm"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>API Layer</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>

            {/* System Admin Link */}
            <Link
              to="/admin/login"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors px-2.5 py-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-pill)]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </Link>

            {/* Access Portal Primary Action Button */}
            <Link
              to="/facility/auth?mode=login"
              className="btn-arrow-primary text-xs py-2.5 px-5"
            >
              <span>Access Portal</span>
              <span className="btn-arrow-circle">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Full-Screen Layout Wrapper */}
      <main className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-6 pb-12 relative z-10 flex-grow">
        
        {/* Section 2: Full-Width Widescreen Hero Container Card */}
        <section className="w-full relative rounded-[36px] overflow-hidden mb-16 border border-[var(--border-card)] shadow-2xl bg-slate-950 text-white min-h-[580px] lg:min-h-[640px] flex flex-col justify-between p-8 md:p-14 reveal-on-scroll">
          {/* High-Quality Background Image featuring Doctors, Nurses & Hospital Care */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(8, 15, 26, 0.93) 0%, rgba(10, 20, 32, 0.75) 50%, rgba(13, 148, 136, 0.2) 100%), linear-gradient(180deg, rgba(8, 15, 26, 0.4) 0%, rgba(4, 25, 30, 0.85) 100%), url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80')`
            }}
          />

          {/* Top Rating & Verification Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white shadow-lg">
              <div className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                <span className="ml-1 text-white">4.9</span>
              </div>
              <span className="text-white/40">•</span>
              <span className="text-emerald-300 font-semibold">2,400+ Public Health Centers Connected</span>
            </div>

            {/* External API Layer Notification Pill */}
            <button
              onClick={() => setShowApiModal(true)}
              className="hidden md:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-teal-300" />
              <span>Enterprise HMIS API Gateway</span>
              <ArrowUpRight className="w-3 h-3 text-teal-300" />
            </button>
          </div>

          {/* Center Display Typography */}
          <div className="relative z-10 my-12 max-w-3xl">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 drop-shadow-lg">
              Unified Public Healthcare & <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Telemedicine Engine
              </span>
            </h1>

            <p className="text-slate-200 text-base sm:text-lg max-w-xl font-normal leading-relaxed mb-8 drop-shadow font-sans">
              Connecting primary health centers, rural clinics, district hospitals, and specialist clinicians with automated OPD triage, emergency bed allocation, and LiveKit HD video teleconsultations.
            </p>

            {/* Action Pill Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/facility/auth?mode=login')}
                className="btn-arrow-primary text-sm py-3.5 px-6"
              >
                <span>Access Facility Portal</span>
                <span className="btn-arrow-circle">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </span>
              </button>

              <button
                onClick={() => navigate('/doctor/auth?mode=login')}
                className="btn-arrow-secondary text-sm py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
              >
                <span>Access Doctor Portal</span>
                <span className="btn-arrow-circle bg-white/20">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Right Floating Glass Badge */}
          <div className="relative z-10 flex justify-end">
            <div className="bg-black/60 backdrop-blur-md border border-white/25 p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3.5 shadow-2xl max-w-xs text-white">
              <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-emerald-400 object-cover" 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80" 
                  onError={(e) => handleImgError(e, 'Dr. A')}
                  alt="Doctor" 
                />
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-emerald-400 object-cover" 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80" 
                  onError={(e) => handleImgError(e, 'Dr. B')}
                  alt="Doctor" 
                />
                <img 
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-emerald-400 object-cover" 
                  src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80" 
                  onError={(e) => handleImgError(e, 'Dr. C')}
                  alt="Doctor" 
                />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">24/7 Specialist Tele-Triage</span>
                <span className="text-[11px] text-emerald-300 font-semibold">1,800+ Verified Doctors</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Public Healthcare Stats Bar */}
        <section className="w-full banner-green-card p-8 md:p-14 mb-16 reveal-on-scroll">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b border-white/15 pb-8 mb-6">
            <div>
              <span className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white block font-mono">2,400+</span>
              <span className="text-xs sm:text-sm text-teal-100 font-medium block mt-1">Connected PHCs & Clinics</span>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white block font-mono">98%</span>
              <span className="text-xs sm:text-sm text-teal-100 font-medium block mt-1">Referral Triage Accuracy</span>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white block font-mono">1,800+</span>
              <span className="text-xs sm:text-sm text-teal-100 font-medium block mt-1">Specialist Doctors Available</span>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white block font-mono">120+</span>
              <span className="text-xs sm:text-sm text-teal-100 font-medium block mt-1">District Hospital Networks</span>
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm text-teal-100/90 font-medium tracking-wide">
            Powering public healthcare infrastructure across rural primary health centers, community clinics, and district hospital networks.
          </p>
        </section>

        {/* Section 4: "We provide a dedicated digital infrastructure..." (About Section) */}
        <section id="about" className="w-full py-12 mb-16 reveal-on-scroll">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[var(--text-main)] max-w-3xl leading-tight">
              We provide a dedicated digital infrastructure committed to connecting public hospitals, rural PHCs, and specialist doctors.
            </h2>

            {/* Verification Badge */}
            <div className="flex items-center space-x-3 bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-card)] shrink-0 self-start md:self-auto shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">Govt Verified Network</span>
                <span className="text-[11px] text-[var(--text-muted)]">Public Health Infrastructure</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left Dual Photo Frames */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
              <div className="rounded-[32px] overflow-hidden border border-[var(--border-card)] h-72 sm:h-96 shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" 
                  onError={(e) => handleImgError(e, 'PHC Consultation')}
                  alt="Rural Healthcare Consultation" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-[32px] overflow-hidden border border-[var(--border-card)] h-72 sm:h-96 shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80" 
                  onError={(e) => handleImgError(e, 'Telemedicine')}
                  alt="Telemedicine Doctor" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right Checklist & Details */}
            <div className="lg:col-span-5 space-y-6">
              <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-sans">
                Our platform equips healthcare facilities, medical officers, nurses, and specialist clinicians to coordinate patient care seamlessly across districts.
              </p>

              <div className="space-y-4">
                {[
                  "Zero-Setup Out-of-the-Box Digital Ecosystem for PHCs & CHCs",
                  "LiveKit HD Teleconsultations with City Specialist Doctors",
                  "Real-Time Bed Allocation & Integrated EHR Patient History"
                ].map((text, i) => (
                  <div key={i} className="flex items-center space-x-3 text-xs sm:text-sm font-bold text-[var(--text-main)]">
                    <div className="w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  onClick={() => navigate('/facility/auth?mode=register')}
                  className="btn-arrow-primary"
                >
                  <span>Register Facility</span>
                  <span className="btn-arrow-circle">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Services / What We Offer Grid */}
        <section id="services" className="w-full py-12 mb-16 reveal-on-scroll">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-2">
              Public Healthcare Capabilities / What We Offer
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
              Comprehensive Hospital Administration & Tele-triage Engine
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Facility Portal (OPD & Triage)",
                desc: "Zero-setup OPD queue management, emergency priority triage, and real-time bed capacity tracking for public hospitals.",
                img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                link: "/facility/auth?mode=login"
              },
              {
                title: "Doctor Portal (Teleconsult)",
                desc: "LiveKit HD video telemedicine with automated 10 follow-up message allocation rules for specialist doctors.",
                img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
                link: "/doctor/auth?mode=login"
              },
              {
                title: "Diagnostic & EHR Record Sync",
                desc: "Centralized electronic patient medical records, lab order routing, and e-prescription fulfillment across district networks.",
                img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
                link: "/facility/auth?mode=login"
              }
            ].map((service, i) => (
              <div 
                key={i} 
                className="bg-[var(--bg-card)] rounded-[32px] p-5 border border-[var(--border-card)] hover:border-[var(--border-card-hover)] transition-all duration-300 shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="rounded-[24px] overflow-hidden h-56 mb-5 relative">
                    <img 
                      src={service.img} 
                      onError={(e) => handleImgError(e, service.title)}
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-main)] mb-2 px-2">{service.title}</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed px-2 mb-6 font-sans">{service.desc}</p>
                </div>

                <div className="px-2 pb-2 flex justify-end">
                  <button 
                    onClick={() => navigate(service.link)}
                    className="w-11 h-11 rounded-full bg-[var(--bg-pill)] border border-[var(--border-card)] group-hover:bg-teal-600 group-hover:text-white text-[var(--text-main)] flex items-center justify-center transition-all shadow-sm"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Experienced & Certified Medical Professionals (Fully Interactive 3 Accordion Tabs) */}
        <section id="trust" className="w-full py-12 mb-16 reveal-on-scroll">
          <div className="bg-[var(--trust-card-bg)] rounded-[36px] p-8 md:p-14 border border-[var(--border-card)] shadow-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column Interactive Accordion */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] mb-3">
                    Trusted Public Healthcare Infrastructure
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    Register your facility or clinician profile to join the connected public healthcare network.
                  </p>
                </div>

                {/* 3 Interactive Accordion Cards */}
                <div className="space-y-4">
                  {trustItems.map((item, idx) => {
                    const isActive = activeTrustTab === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setActiveTrustTab(idx)}
                        className={`rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                          isActive 
                            ? 'p-6 bg-teal-700 dark:bg-emerald-800 text-white shadow-lg border border-teal-500' 
                            : 'p-4 bg-teal-900/30 dark:bg-emerald-950/40 border border-teal-500/20 text-[var(--text-main)] hover:border-teal-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-sm sm:text-base font-bold">
                            {item.title}
                          </h4>
                          {isActive ? (
                            <ArrowRight className="w-4 h-4 text-emerald-200 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          )}
                        </div>

                        {isActive && (
                          <ul className="mt-3 text-xs sm:text-sm text-emerald-100 space-y-1.5 font-sans border-t border-white/20 pt-3">
                            {item.points.map((pt, pIdx) => (
                              <li key={pIdx}>• {pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/facility/auth?mode=login')}
                  className="btn-arrow-primary"
                >
                  <span>Access Facility Portal</span>
                  <span className="btn-arrow-circle">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>
              </div>

              {/* Right Column Photo with Graph Overlay */}
              <div className="lg:col-span-6">
                <div className="rounded-[32px] overflow-hidden border border-[var(--border-card)] shadow-2xl relative h-[460px]">
                  <img 
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80" 
                    onError={(e) => handleImgError(e, 'Surgical Unit')}
                    alt="Doctors smiling" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Floating Bottom Translucent Widget */}
                  <div className="absolute bottom-6 right-6 p-3.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/20 shadow-2xl flex items-center space-x-3.5 text-white max-w-xs">
                    <img 
                      className="w-10 h-10 rounded-xl object-cover" 
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=100&q=80" 
                      onError={(e) => handleImgError(e, 'Node Triage')}
                      alt="Activity" 
                    />
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 uppercase block tracking-wider">Live Node Triage</span>
                      <div className="flex items-end space-x-1 h-5 mt-1">
                        <div className="w-2 h-3 bg-emerald-400 rounded-t" />
                        <div className="w-2 h-5 bg-emerald-400 rounded-t" />
                        <div className="w-2 h-4 bg-emerald-400 rounded-t" />
                        <div className="w-2 h-5 bg-emerald-400 rounded-t" />
                        <div className="w-2 h-2 bg-white/40 rounded-t" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 8: Horizontal Callout Banner */}
        <section className="w-full relative rounded-[36px] overflow-hidden mb-16 border border-[var(--border-card)] shadow-2xl min-h-[380px] flex items-center p-8 md:p-16 reveal-on-scroll">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(105deg, rgba(8, 15, 26, 0.92) 0%, rgba(13, 148, 136, 0.5) 60%, rgba(4, 47, 38, 0.7) 100%), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80')`
            }}
          />

          <div className="relative z-10 max-w-xl text-white">
            <span className="text-[10px] uppercase tracking-widest font-bold text-teal-300 block mb-2">
              PUBLIC HEALTHCARE NETWORK
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
              Unify Your Health Facility with the MediTrack Network
            </h2>

            <button
              onClick={() => navigate('/facility/auth?mode=register')}
              className="btn-arrow-primary text-sm py-3.5 px-7"
            >
              <span>Register Facility Portal</span>
              <span className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </span>
            </button>
          </div>
        </section>

        {/* Section 9: "Frequently Asked Questions" (FAQ Section) */}
        <section id="faq" className="w-full py-12 mb-16 reveal-on-scroll">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans">
              Everything you need to know about facility onboarding, teleconsultations, and platform security.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Emerald Green Card */}
            <div className="lg:col-span-4 faq-green-card p-8 text-white shadow-xl flex flex-col justify-between min-h-[340px]">
              <div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Do you have more questions?
                </h3>
                <p className="text-xs sm:text-sm text-teal-100 font-sans leading-relaxed">
                  End-to-end guidance for public health centers, doctors, and healthcare administrators.
                </p>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => alert("Contact MediTrack Support at info@meditrack.care")}
                  className="w-full py-3 px-6 rounded-full bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition shadow-lg text-center"
                >
                  Contact Support
                </button>
              </div>
            </div>

            {/* Right FAQ Accordion List */}
            <div className="lg:col-span-8 space-y-4">
              {faqData.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl bg-[var(--bg-pill)] border border-[var(--border-card)] transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full flex items-center justify-between text-left font-display text-sm sm:text-base font-bold text-[var(--text-main)]"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <Minus className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 ml-2" /> : <Plus className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />}
                    </button>
                    {isOpen && (
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-3 leading-relaxed font-sans pt-3 border-t border-[var(--border-card)]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* Full-Width Widescreen Footer */}
      <footer className="w-full footer-green-bg p-8 md:p-16 text-white text-xs font-sans reveal-on-scroll">
        <div className="max-w-[1536px] mx-auto">
          <div className="grid md:grid-cols-12 gap-8 mb-12 border-b border-white/20 pb-12">
            
            {/* Left Column Contact Details */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="font-display text-2xl font-bold text-white mb-4">Contact Support</h3>
              
              <div className="space-y-3 text-xs sm:text-sm text-emerald-100">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <span>123 Health Ave, Wellness City, MediTrack HQ</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-emerald-300" />
                  <span>info@meditrack.care</span>
                </div>
              </div>

              {/* Doctor Thumbnail */}
              <div className="pt-2">
                <div className="w-36 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80" 
                    onError={(e) => handleImgError(e, 'MediTrack')}
                    alt="Doctors" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            </div>

            {/* Right Column Social Channels & API Link */}
            <div className="md:col-span-5 space-y-4">
              <h3 className="font-display text-2xl font-bold text-white mb-4">Network Connectivity</h3>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Stay updated with the latest public health infrastructure deployments, telemedicine features, and API releases.
              </p>

              {/* Social Icon Pills */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer">
                  <Facebook className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Line */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200">
            <span>Copyright © {new Date().getFullYear()} MediTrack Care Network. All rights reserved.</span>
            
            <div className="flex items-center space-x-6">
              <button onClick={() => setShowApiModal(true)} className="hover:text-white transition font-bold underline">Enterprise API Layer</button>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* API Layer Separate Website Notice Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setShowApiModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--bg-pill)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              <FileCode2 className="w-6 h-6" />
            </div>

            <h3 className="font-display text-xl font-bold text-[var(--text-main)] mb-1">
              MediTrack Enterprise API Gateway
            </h3>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-4 border border-amber-500/20">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Separate External Developer Site</span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-6 font-sans">
              The <strong>MediTrack Open API Gateway</strong> is hosted on a separate dedicated developer portal for enterprise hospital networks and private HMIS vendors.
            </p>

            <div className="p-4 rounded-2xl bg-[var(--bg-pill)] border border-[var(--border-card)] text-xs space-y-2 mb-6 font-mono">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-main)]">
                <span>API Base Endpoint</span>
                <span className="text-teal-600 dark:text-teal-400">FHIR R4</span>
              </div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 bg-[var(--bg-main)] p-2.5 rounded-xl truncate border border-[var(--border-card)]">
                https://api.meditrack-health.org/fhir/v1
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-5 py-2.5 text-xs font-semibold rounded-full border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Redirecting to MediTrack API Developer Portal (https://api.meditrack-health.org)...");
                  setShowApiModal(false);
                }}
                className="btn-arrow-primary text-xs py-2.5 px-5"
              >
                <span>Open API Portal</span>
                <span className="btn-arrow-circle">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
