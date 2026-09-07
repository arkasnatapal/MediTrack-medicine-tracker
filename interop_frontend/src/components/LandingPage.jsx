import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Sparkles, Shield, Database, Zap, Lock, Terminal, 
  Activity, ChevronRight, CheckCircle2, FileCode, Play, Radio, 
  Cpu, Layers, ExternalLink, Globe, Copy, Check, MousePointer,
  RefreshCw, Clock, Server, Code2, HelpCircle, ChevronDown, Send
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ setActiveTab }) {
  const [selectedResource, setSelectedResource] = useState('Patient');
  const [copied, setCopied] = useState(false);

  // Live API Sandbox State
  const [sandboxEndpoint, setSandboxEndpoint] = useState('patient');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiResponseTime, setApiResponseTime] = useState('11ms');
  const [openFaq, setOpenFaq] = useState(null);

  // Animation Refs
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const headerRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroCtaRef = useRef(null);
  const galleryRef = useRef(null);
  
  // Card Refs
  const leftCardRef = useRef(null);
  const middleCodeRef = useRef(null);
  const middleEhrRef = useRef(null);
  const rightTopCardRef = useRef(null);
  const rightBottomCardRef = useRef(null);
  const codeContentRef = useRef(null);

  // Section Refs
  const metricsRef = useRef(null);
  const sandboxRef = useRef(null);
  const featuresRef = useRef(null);
  const featuresCardsRef = useRef([]);
  const roadmapRef = useRef(null);
  const faqRef = useRef(null);
  const onboardingRef = useRef(null);
  const contactRef = useRef(null);

  const fhirPayloads = {
    Patient: `{
  "resourceType": "Patient",
  "id": "P-882041",
  "active": true,
  "name": [{ "use": "official", "family": "Sharma", "given": ["Aarav"] }],
  "gender": "male",
  "birthDate": "1988-04-12",
  "managingOrganization": { "display": "City General Hospital" }
}`,
    Observation: `{
  "resourceType": "Observation",
  "id": "OBS-9921",
  "status": "final",
  "category": [{ "coding": [{ "code": "vital-signs", "display": "Vital Signs" }] }],
  "code": { "coding": [{ "code": "8867-4", "display": "Heart rate" }] },
  "subject": { "reference": "Patient/P-882041" },
  "valueQuantity": { "value": 72, "unit": "beats/min" }
}`,
    Encounter: `{
  "resourceType": "Encounter",
  "id": "ENC-4029",
  "status": "in-progress",
  "class": { "code": "IMP", "display": "inpatient encounter" },
  "type": [{ "text": "Cardiology Consultation" }],
  "subject": { "reference": "Patient/P-882041" },
  "period": { "start": "2026-09-06T10:30:00Z" }
}`,
    MedicationRequest: `{
  "resourceType": "MedicationRequest",
  "id": "MED-1104",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": { "text": "Amoxicillin 500mg Oral Capsule" },
  "subject": { "reference": "Patient/P-882041" },
  "dosageInstruction": [{ "text": "Take 1 capsule 3 times daily for 7 days" }]
}`
  };

  const sandboxApiEndpoints = {
    patient: {
      method: 'GET',
      url: '/api/v1/fhir/Patient/P-882041',
      response: `{
  "resourceType": "Patient",
  "id": "P-882041",
  "active": true,
  "name": [{ "family": "Sharma", "given": ["Aarav"] }],
  "telecom": [{ "system": "phone", "value": "+91 98765 43210" }],
  "gender": "male",
  "birthDate": "1988-04-12",
  "address": [{ "city": "Mumbai", "country": "IND" }]
}`
    },
    observation: {
      method: 'GET',
      url: '/api/v1/fhir/Observation?category=vital-signs',
      response: `{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [{
    "resource": {
      "resourceType": "Observation",
      "id": "OBS-9921",
      "code": { "text": "Systolic Blood Pressure" },
      "valueQuantity": { "value": 124, "unit": "mmHg" }
    }
  }]
}`
    },
    encounter: {
      method: 'GET',
      url: '/api/v1/fhir/Encounter?status=in-progress',
      response: `{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [{
    "resource": {
      "resourceType": "Encounter",
      "id": "ENC-4029",
      "status": "in-progress",
      "class": { "display": "Inpatient Emergency" }
    }
  }]
}`
    },
    auth: {
      method: 'POST',
      url: '/api/v1/auth/token',
      response: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Im1lZGl0cmFjay1rZXktMSJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "patient/*.read observation/*.read encounter/*.read",
  "patient": "P-882041"
}`
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fhirPayloads[selectedResource]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteApi = () => {
    setIsLoadingApi(true);
    setTimeout(() => {
      setIsLoadingApi(false);
      setApiResponseTime(`${Math.floor(Math.random() * 6 + 8)}ms`);
    }, 400);
  };

  // GSAP Animations Setup
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Load Animation
      const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });

      tl.fromTo(headerRef.current, 
        { y: -50, opacity: 0 }, 
        { y: 0, opacity: 1 }
      )
      .fromTo(heroBadgeRef.current, 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, ease: 'back.out(1.7)' }, 
        '-=0.6'
      )
      .fromTo(heroTitleRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1 }, 
        '-=0.6'
      )
      .fromTo(heroSubRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1 }, 
        '-=0.6'
      )
      .fromTo(heroCtaRef.current, 
        { y: 20, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1 }, 
        '-=0.5'
      );

      // 2. Asymmetric Gallery ScrollTrigger
      if (galleryRef.current) {
        gsap.fromTo(leftCardRef.current, 
          { x: -80, opacity: 0, scale: 0.9 }, 
          { 
            x: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: galleryRef.current, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );

        gsap.fromTo(middleCodeRef.current, 
          { y: 60, opacity: 0, scale: 0.95 }, 
          { 
            y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: galleryRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );

        gsap.fromTo(middleEhrRef.current, 
          { y: 60, opacity: 0, scale: 0.95 }, 
          { 
            y: 0, opacity: 1, scale: 1, duration: 1, delay: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: galleryRef.current, start: 'top 75%', toggleActions: 'play none none reverse' }
          }
        );

        gsap.fromTo(rightTopCardRef.current, 
          { x: 80, opacity: 0, scale: 0.9 }, 
          { 
            x: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: galleryRef.current, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );

        gsap.fromTo(rightBottomCardRef.current, 
          { x: 80, opacity: 0, scale: 0.9 }, 
          { 
            x: 0, opacity: 1, scale: 1, duration: 1.2, delay: 0.2, ease: 'power3.out',
            scrollTrigger: { trigger: galleryRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 3. ScrollTrigger for Live Metrics Section
      if (metricsRef.current) {
        gsap.fromTo(metricsRef.current.children, 
          { y: 40, opacity: 0, scale: 0.95 }, 
          { 
            y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8, ease: 'back.out(1.5)',
            scrollTrigger: { trigger: metricsRef.current, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 4. ScrollTrigger for Live Sandbox
      if (sandboxRef.current) {
        gsap.fromTo(sandboxRef.current, 
          { y: 50, opacity: 0, scale: 0.97 }, 
          { 
            y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: sandboxRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 5. ScrollTrigger for Core Feature Cards
      if (featuresRef.current) {
        gsap.fromTo(featuresCardsRef.current, 
          { y: 60, opacity: 0 }, 
          { 
            y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: featuresRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 6. ScrollTrigger for Roadmap Steps
      if (roadmapRef.current) {
        gsap.fromTo(roadmapRef.current.children, 
          { y: 50, opacity: 0 }, 
          { 
            y: 0, opacity: 1, stagger: 0.15, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: roadmapRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 7. ScrollTrigger for Onboarding Paths
      if (onboardingRef.current) {
        gsap.fromTo(onboardingRef.current.children, 
          { y: 50, opacity: 0, scale: 0.96 }, 
          { 
            y: 0, opacity: 1, scale: 1, stagger: 0.2, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: onboardingRef.current, start: 'top 80%', toggleActions: 'play none none reverse' }
          }
        );
      }

      // 8. ScrollTrigger for Contact Banner
      if (contactRef.current) {
        gsap.fromTo(contactRef.current, 
          { y: 40, opacity: 0, scale: 0.98 }, 
          { 
            y: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: contactRef.current, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Code Payload Switch Animation
  useEffect(() => {
    if (codeContentRef.current) {
      gsap.fromTo(codeContentRef.current, 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [selectedResource]);

  // Dynamic Mouse Spotlight
  const handleMouseMove = (e) => {
    if (spotlightRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(spotlightRef.current, {
        x: x,
        y: y,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  };

  const faqs = [
    {
      q: "How does MediTrack handle HIPAA compliance & patient data privacy?",
      a: "MediTrack enforces end-to-end AES-256 bit encryption in transit and at rest, SMART-on-FHIR OAuth 2.0 token isolation, and real-time tamper-proof audit trails compliant with HIPAA § 164.312 and ABDM M1/M2/M3 security specifications."
    },
    {
      q: "Can MediTrack map legacy HL7 v2 (ADT/ORU) and CDA feeds into FHIR R4?",
      a: "Yes! MediTrack includes a built-in conversion transformer that ingests HL7 v2.x messages and CDA document bundles and converts them into validated HL7 FHIR R4 JSON payloads seamlessly."
    },
    {
      q: "Which EHR systems and Hospital Information Systems (HIS) are supported out-of-the-box?",
      a: "MediTrack provides pre-configured connectors for Epic Systems, Oracle Cerner, MEDITECH Expanse, Allscripts, AthenaHealth, and Ayushman Bharat Digital Mission (ABDM) Health Repository nodes."
    },
    {
      q: "How do real-time webhooks handle network drops or hospital server downtime?",
      a: "All webhook deliveries are signed with HMAC-SHA256 signatures and backed by an exponential backoff retry engine (up to 72 hours) with dead-letter queue monitoring."
    }
  ];

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#062319] text-slate-100 font-sans selection:bg-[#a6f120] selection:text-[#062319] relative overflow-x-hidden"
    >
      {/* Dynamic Spotlight Glow */}
      <div 
        ref={spotlightRef}
        className="pointer-events-none fixed -top-[250px] -left-[250px] w-[550px] h-[550px] bg-[#a6f120]/10 rounded-full blur-[130px] z-30 transition-opacity"
      ></div>

      {/* Ambient Background Glowing Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute top-[1400px] right-0 w-[800px] h-[600px] bg-[#a6f120]/5 rounded-full blur-[200px] pointer-events-none"></div>

      {/* 1. Full-Bleed Glass Header */}
      <header 
        ref={headerRef} 
        className="sticky top-0 z-50 bg-[#062319]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between"
      >
        {/* Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab('landing')}
        >
          <div className="h-10 w-10 rounded-xl bg-[#a6f120] flex items-center justify-center text-[#062319] shadow-lg shadow-[#a6f120]/20 group-hover:rotate-12 transition-transform duration-300">
            <Sparkles className="h-5 w-5 fill-[#062319]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-2xl tracking-tight text-white font-display">MediTrack</span>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 rounded-full">
              FHIR R4 API
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-white/80">
          <button 
            onClick={() => setActiveTab('landing')} 
            className="text-white font-bold hover:text-[#a6f120] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-[#a6f120]"
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('apidocs')} 
            className="hover:text-[#a6f120] transition-colors"
          >
            API Docs
          </button>
          <button 
            onClick={() => setActiveTab('explorer')} 
            className="hover:text-[#a6f120] transition-colors"
          >
            FHIR Explorer
          </button>
          <button 
            onClick={() => setActiveTab('wizard')} 
            className="hover:text-[#a6f120] transition-colors"
          >
            Onboarding
          </button>
          <button 
            onClick={() => setActiveTab('security')} 
            className="hover:text-[#a6f120] transition-colors"
          >
            HIPAA Security
          </button>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('apidocs')}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
          >
            Developer Portal
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className="px-5 py-2.5 rounded-full border border-white/40 hover:border-[#a6f120] text-white hover:text-[#a6f120] font-semibold text-xs transition-all hover:bg-white/10 shadow-sm cursor-pointer"
          >
            Get in touch
          </button>
        </div>
      </header>

      {/* Main Full-Bleed Content Wrapper */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 pb-16">
        
        {/* 2. Hero Headline Section */}
        <section className="relative z-20 text-center max-w-4xl mx-auto mb-16 pt-4">
          
          {/* Badge */}
          <div 
            ref={heroBadgeRef}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[11px] font-medium text-white/90 mb-6 shadow-md"
          >
            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#a6f120] shadow-[0_0_10px_#a6f120]"></div>
            <span className="tracking-wide">Powering Healthcare Interoperability</span>
          </div>

          {/* Main Headline */}
          <h1 
            ref={heroTitleRef}
            className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white tracking-tight leading-[1.05] text-center font-display"
          >
            The Future of <br />
            <span className="text-[#a6f120]">Healthcare Interoperability</span>
          </h1>

          {/* Subtitle */}
          <p 
            ref={heroSubRef}
            className="text-white/75 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto text-center mt-6 leading-relaxed font-normal"
          >
            Our commitment to healthcare interoperability is paving the way for a connected, safer patient journey. Join us on a mission where standard FHIR R4 APIs transform how health systems communicate.
          </p>

          {/* CTAs */}
          <div 
            ref={heroCtaRef}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <button
              onClick={() => setActiveTab('explorer')}
              className="bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-extrabold text-xs sm:text-sm px-8 py-4 rounded-full shadow-xl shadow-[#a6f120]/25 transition-all transform hover:scale-105 flex items-center space-x-2 cursor-pointer"
            >
              <span>See our solutions</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab('wizard')}
              className="border border-white/40 hover:border-white text-white hover:bg-white/10 font-extrabold text-xs sm:text-sm px-8 py-4 rounded-full transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Get in touch</span>
            </button>
          </div>
        </section>

        {/* 3. Asymmetric Image Gallery Cards */}
        <section ref={galleryRef} className="relative z-20 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Card 1 (Left Tall Card) */}
            <div 
              ref={leftCardRef}
              className="lg:col-span-3 rounded-[28px] overflow-hidden bg-[#0a3124] border border-white/10 relative shadow-2xl group min-h-[380px] lg:min-h-[460px] flex flex-col justify-end transition-all duration-500 hover:border-[#a6f120]/50"
            >
              <img
                src="/assets/card_interop_network.png"
                alt="HL7 FHIR Network"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#062319]/25 to-transparent"></div>
              
              <div className="relative p-4 m-3 bg-[#062319]/85 backdrop-blur-md rounded-2xl border border-white/15 text-white space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a6f120] font-bold">
                  <span>HL7 FHIR R4 Core</span>
                  <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-[#a6f120] animate-pulse" /> Live Stream</span>
                </div>
                <div className="text-xs font-bold text-white">Bi-directional Data Streams</div>
              </div>
            </div>

            {/* Middle Section: Interactive Code Explorer + EHR Card */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Interactive Code Switcher */}
              <div 
                ref={middleCodeRef}
                className="rounded-[28px] bg-[#041912] border border-white/10 p-6 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between transition-all duration-500 hover:border-[#a6f120]/40"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4 text-[#a6f120]" />
                      <span className="text-xs font-bold text-white font-mono">Live FHIR Payload Switcher</span>
                    </div>

                    {/* Resource Selector */}
                    <div className="flex items-center space-x-1 bg-[#062319] p-1 rounded-xl border border-white/10 text-[11px] font-mono">
                      {Object.keys(fhirPayloads).map((res) => (
                        <button
                          key={res}
                          onClick={() => setSelectedResource(res)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            selectedResource === res 
                              ? 'bg-[#a6f120] text-[#062319] font-bold shadow-md' 
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="relative bg-[#020d09] p-4 sm:p-5 rounded-2xl border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[210px] shadow-inner">
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 transition-colors cursor-pointer"
                      title="Copy JSON Payload"
                    >
                      {copied ? <Check className="h-4 w-4 text-[#a6f120]" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <pre ref={codeContentRef} className="text-slate-200">
                      <code>{fhirPayloads[selectedResource]}</code>
                    </pre>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs border-t border-white/10 mt-4">
                  <span className="text-white/60 text-[11px]">Strict schema validation against HL7 US Core</span>
                  <button 
                    onClick={() => setActiveTab('explorer')}
                    className="text-[#a6f120] font-bold hover:underline flex items-center space-x-1 text-xs cursor-pointer"
                  >
                    <span>Launch Explorer</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* EHR Sync Card */}
              <div 
                ref={middleEhrRef}
                className="rounded-[28px] overflow-hidden bg-[#0a3124] border border-white/10 relative shadow-2xl group h-[190px] sm:h-[220px] flex flex-col justify-end transition-all duration-500 hover:border-[#a6f120]/50"
              >
                <img
                  src="/assets/card_ehr_sync.png"
                  alt="EHR Pipelines"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#062319]/20 to-transparent"></div>
                
                <div className="relative p-4 m-3 bg-[#062319]/85 backdrop-blur-md rounded-2xl border border-white/15 text-white flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-[#a6f120] font-bold">100+ EHR Systems Connected</div>
                    <div className="text-xs font-bold text-white">Epic • Cerner • MEDITECH • ABDM</div>
                  </div>
                  <span className="px-3 py-1 text-[10px] font-mono bg-[#a6f120]/20 text-[#a6f120] rounded-full border border-[#a6f120]/30 font-bold">
                    Sub-12ms
                  </span>
                </div>
              </div>
            </div>

            {/* Right Cards Stack */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Card 2 (Right Top Card) */}
              <div 
                ref={rightTopCardRef}
                className="rounded-[28px] overflow-hidden bg-[#0a3124] border border-white/10 relative shadow-2xl group h-[210px] lg:h-[230px] flex flex-col justify-end transition-all duration-500 hover:border-[#a6f120]/50"
              >
                <img
                  src="/assets/card_smart_fhir.png"
                  alt="SMART-on-FHIR"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#062319]/20 to-transparent"></div>
                
                <div className="relative p-4 m-3 bg-[#062319]/85 backdrop-blur-md rounded-2xl border border-white/15 text-white">
                  <div className="text-[11px] font-mono text-[#a6f120] font-bold">SMART-on-FHIR Auth</div>
                  <div className="text-xs font-bold text-white">OAuth 2.0 Client Scopes</div>
                </div>
              </div>

              {/* Card 4 (Bottom Right Card) */}
              <div 
                ref={rightBottomCardRef}
                className="rounded-[28px] overflow-hidden bg-[#0a3124] border border-white/10 relative shadow-2xl group flex-1 min-h-[230px] lg:min-h-[260px] flex flex-col justify-end transition-all duration-500 hover:border-[#a6f120]/50"
              >
                <img
                  src="/assets/card_hipaa_security.png"
                  alt="HIPAA Security Shield"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062319] via-[#062319]/20 to-transparent"></div>
                
                <div className="relative p-4 m-3 bg-[#062319]/85 backdrop-blur-md rounded-2xl border border-white/15 text-white space-y-1">
                  <div className="text-[11px] font-mono text-[#a6f120] font-bold">HIPAA & ABDM Security</div>
                  <div className="text-xs font-bold text-white">AES-256 Encrypted Audit Trail</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. NEW DETAIL: Live Platform Metrics Stats Bar */}
        <section ref={metricsRef} className="py-8 mb-24 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-[24px] bg-[#041912] border border-white/10 shadow-xl space-y-2 hover:border-[#a6f120]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
              <span>UPTIME SLA</span>
              <Activity className="h-4 w-4 text-[#a6f120]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-display">99.99%</div>
            <p className="text-[11px] text-white/50">Zero-downtime failover cluster</p>
          </div>

          <div className="p-6 rounded-[24px] bg-[#041912] border border-white/10 shadow-xl space-y-2 hover:border-[#a6f120]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
              <span>LATENCY</span>
              <Clock className="h-4 w-4 text-[#a6f120]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#a6f120] font-display">&lt; 12ms</div>
            <p className="text-[11px] text-white/50">Median JSON response time</p>
          </div>

          <div className="p-6 rounded-[24px] bg-[#041912] border border-white/10 shadow-xl space-y-2 hover:border-[#a6f120]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
              <span>RESOURCES</span>
              <Server className="h-4 w-4 text-[#a6f120]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-display">20+</div>
            <p className="text-[11px] text-white/50">HL7 FHIR R4 resource types</p>
          </div>

          <div className="p-6 rounded-[24px] bg-[#041912] border border-white/10 shadow-xl space-y-2 hover:border-[#a6f120]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
              <span>COMPLIANCE</span>
              <Shield className="h-4 w-4 text-[#a6f120]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-display">100%</div>
            <p className="text-[11px] text-white/50">HIPAA §164.312 & ABDM M1/M2/M3</p>
          </div>
        </section>

        {/* 5. NEW DETAIL: Live Interactive API Query Sandbox Console */}
        <section ref={sandboxRef} className="mb-24 p-8 sm:p-10 rounded-[32px] bg-[#041912] border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#a6f120] font-bold">
                <Terminal className="h-4 w-4" />
                <span>INTERACTIVE API QUERY SANDBOX</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Test Live Gateway Endpoints</h2>
              <p className="text-xs text-white/60">Execute real-time synthetic requests against MediTrack FHIR API Gateway.</p>
            </div>

            {/* Endpoint Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-[#062319] p-1.5 rounded-2xl border border-white/10 font-mono text-xs">
              <button
                onClick={() => setSandboxEndpoint('patient')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${sandboxEndpoint === 'patient' ? 'bg-[#a6f120] text-[#062319] font-bold' : 'text-white/70 hover:text-white'}`}
              >
                /Patient/P-882041
              </button>
              <button
                onClick={() => setSandboxEndpoint('observation')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${sandboxEndpoint === 'observation' ? 'bg-[#a6f120] text-[#062319] font-bold' : 'text-white/70 hover:text-white'}`}
              >
                /Observation?vital-signs
              </button>
              <button
                onClick={() => setSandboxEndpoint('encounter')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${sandboxEndpoint === 'encounter' ? 'bg-[#a6f120] text-[#062319] font-bold' : 'text-white/70 hover:text-white'}`}
              >
                /Encounter?in-progress
              </button>
              <button
                onClick={() => setSandboxEndpoint('auth')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${sandboxEndpoint === 'auth' ? 'bg-[#a6f120] text-[#062319] font-bold' : 'text-white/70 hover:text-white'}`}
              >
                /auth/token
              </button>
            </div>
          </div>

          {/* Request Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#020d09] p-4 rounded-2xl border border-white/10 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md font-extrabold text-[11px] ${sandboxApiEndpoints[sandboxEndpoint].method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                {sandboxApiEndpoints[sandboxEndpoint].method}
              </span>
              <span className="text-white font-bold">{sandboxApiEndpoints[sandboxEndpoint].url}</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-[11px] text-white/60">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">200 OK</span>
                <span>Latency: <strong className="text-[#a6f120]">{apiResponseTime}</strong></span>
              </div>
              
              <button
                onClick={handleExecuteApi}
                disabled={isLoadingApi}
                className="px-4 py-2 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className={`h-3.5 w-3.5 ${isLoadingApi ? 'animate-spin' : ''}`} />
                <span>{isLoadingApi ? 'Sending...' : 'Execute Request'}</span>
              </button>
            </div>
          </div>

          {/* Response Body Box */}
          <div className="bg-[#020d09] p-5 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner max-h-[300px]">
            <div className="flex justify-between items-center text-[10px] text-white/40 border-b border-white/10 pb-2 mb-3">
              <span>RESPONSE BODY (application/fhir+json)</span>
              <span>Content-Length: {sandboxApiEndpoints[sandboxEndpoint].response.length} bytes</span>
            </div>
            <pre className="text-slate-200">
              <code>{sandboxApiEndpoints[sandboxEndpoint].response}</code>
            </pre>
          </div>
        </section>

        {/* 6. Comprehensive 6-Core Platform Capabilities Architecture */}
        <section ref={featuresRef} className="py-8 mb-24 relative">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-[11px] font-mono text-[#a6f120]">
              <span>ENTERPRISE ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Built for Modern Health Ecosystems
            </h2>
            <p className="text-white/70 text-xs sm:text-sm max-w-2xl mx-auto">
              Everything required to ingest, translate, authorize, and deliver clinical health records across hospital boundaries with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div
              ref={(el) => (featuresCardsRef.current[0] = el)}
              onClick={() => setActiveTab('explorer')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                HL7 FHIR R4 Native Schema
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Bi-directional JSON translation for Patient, Practitioner, Encounter, Observation, Condition, MedicationRequest, DiagnosticReport, and DocumentReference.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>Explore FHIR APIs</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div
              ref={(el) => (featuresCardsRef.current[1] = el)}
              onClick={() => setActiveTab('credentials')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                SMART-on-FHIR OAuth 2.0
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Client credentials token exchange, scoped permissions (<code className="text-[#a6f120]">patient/*.read</code>), PKCE verification, and database tenant isolation.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>OAuth Credentials</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div
              ref={(el) => (featuresCardsRef.current[2] = el)}
              onClick={() => setActiveTab('webhooks')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                Signed HMAC Webhooks
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Receive sub-second event notifications directly in your hospital backend with HMAC-SHA256 signatures for <code className="text-[#a6f120]">patient.created</code> and ADT events.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>Webhook Engine</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div
              ref={(el) => (featuresCardsRef.current[3] = el)}
              onClick={() => setActiveTab('security')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                HIPAA Audit Inspector
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Query real-time audit event logs recording actor ID, request path, HTTP status code, and IP metadata for full regulatory compliance.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>Audit Logs</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Feature 5 */}
            <div
              ref={(el) => (featuresCardsRef.current[4] = el)}
              onClick={() => setActiveTab('apidocs')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                HL7 v2 & CDA Transformer
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Ingest legacy ADT A01/A08 & ORU R01 messages and convert them automatically into validated HL7 FHIR R4 JSON payloads.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>View Converter Docs</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Feature 6 */}
            <div
              ref={(el) => (featuresCardsRef.current[5] = el)}
              onClick={() => setActiveTab('wizard')}
              className="p-8 rounded-[32px] bg-[#041912] border border-white/10 hover:border-[#a6f120]/60 transition-all duration-300 cursor-pointer space-y-4 group shadow-xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#a6f120] transition-colors font-display">
                Multi-EHR Connectors
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Out-of-the-box integration adapters for Epic Systems, Oracle Cerner, MEDITECH, Allscripts, and ABDM Health Repositories.
              </p>
              <div className="text-xs font-bold text-[#a6f120] flex items-center space-x-1 pt-2">
                <span>Connect Your HIS</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>

          </div>
        </section>

        {/* 7. NEW DETAIL: 4-Step Integration Roadmap Timeline */}
        <section ref={roadmapRef} className="py-8 mb-24">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-[11px] font-mono text-[#a6f120]">
              <span>HOSPITAL ONBOARDING WORKFLOW</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Go Live in 4 Simple Steps
            </h2>
            <p className="text-white/70 text-xs sm:text-sm max-w-xl mx-auto">
              From developer registration to production EHR synchronization in under 15 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-[28px] bg-[#041912] border border-white/10 space-y-3 relative hover:border-[#a6f120]/40 transition-all">
              <div className="text-3xl font-extrabold text-[#a6f120] font-mono">01</div>
              <h3 className="text-base font-bold text-white font-display">Register Client App</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Generate OAuth 2.0 client ID & secret in the Developer Dashboard and configure scope permissions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-[28px] bg-[#041912] border border-white/10 space-y-3 relative hover:border-[#a6f120]/40 transition-all">
              <div className="text-3xl font-extrabold text-[#a6f120] font-mono">02</div>
              <h3 className="text-base font-bold text-white font-display">Configure Webhooks</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Set up HMAC-SHA256 listening endpoints for real-time <code className="text-[#a6f120]">patient.created</code> notification hooks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-[28px] bg-[#041912] border border-white/10 space-y-3 relative hover:border-[#a6f120]/40 transition-all">
              <div className="text-3xl font-extrabold text-[#a6f120] font-mono">03</div>
              <h3 className="text-base font-bold text-white font-display">Test FHIR Explorer</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Execute synthetic REST queries against the FHIR R4 sandbox to verify bi-directional JSON schemas.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-[28px] bg-[#041912] border border-white/10 space-y-3 relative hover:border-[#a6f120]/40 transition-all">
              <div className="text-3xl font-extrabold text-[#a6f120] font-mono">04</div>
              <h3 className="text-base font-bold text-white font-display">Deploy Production Sync</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Connect live EHR feed with sub-12ms response times and HIPAA automated audit logging.
              </p>
            </div>

          </div>
        </section>

        {/* 8. NEW DETAIL: Interactive Technical FAQ Accordion */}
        <section ref={faqRef} className="py-8 mb-24 max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-[11px] font-mono text-[#a6f120]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Technical FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-[24px] bg-[#041912] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-white text-sm sm:text-base cursor-pointer hover:text-[#a6f120] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-[#a6f120] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 9. Onboarding & API Portals Section */}
        <section ref={onboardingRef} className="py-8 mb-16 z-20 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Developer Portal */}
            <div className="p-8 sm:p-10 rounded-[32px] bg-[#041912] border border-white/10 flex flex-col justify-between space-y-6 shadow-2xl hover:border-[#a6f120]/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#a6f120] font-bold bg-[#a6f120]/15 px-3 py-1 rounded-full border border-[#a6f120]/30">
                    FOR DEVELOPERS
                  </span>
                  <ExternalLink className="h-4 w-4 text-white/40" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">Developer API Reference</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Full customization and interactive API execution. Generate code snippets in cURL, JavaScript, Python, Go, and Java to power your integration.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('apidocs')}
                className="w-full py-4 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-extrabold text-xs sm:text-sm rounded-full flex items-center justify-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <span>Open Interactive API Docs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Hospital Onboarding */}
            <div className="p-8 sm:p-10 rounded-[32px] bg-[#041912] border border-white/10 flex flex-col justify-between space-y-6 shadow-2xl hover:border-[#a6f120]/40 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-400/15 px-3 py-1 rounded-full border border-cyan-400/30">
                    FOR HOSPITALS & EHRS
                  </span>
                  <ExternalLink className="h-4 w-4 text-white/40" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">Hospital Onboarding Wizard</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Launch a guided hospital integration workflow in minutes — issue client credentials, select scopes, and execute synthetic connection tests.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('wizard')}
                className="w-full py-4 bg-[#062319] hover:bg-[#0a3325] text-white font-extrabold text-xs sm:text-sm rounded-full border border-white/30 flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span>Launch Onboarding Wizard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </section>

        {/* 10. Contact Engineering Banner */}
        <section ref={contactRef} className="p-8 sm:p-12 rounded-[32px] bg-gradient-to-r from-[#041912] via-[#062319] to-[#041912] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl z-20 relative">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white font-display">Have questions? Talk to engineering</h3>
            <p className="text-xs sm:text-sm text-white/60">Our healthcare interoperability specialists respond within 24 hours.</p>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-xs">
            <a 
              href="mailto:interop@meditrack.org" 
              className="px-6 py-3.5 rounded-full bg-[#a6f120] text-[#062319] font-bold flex items-center gap-2 shadow-lg hover:bg-[#b8f53c] transition-all hover:scale-105"
            >
              <span>interop@meditrack.org</span>
            </a>
          </div>
        </section>

      </main>

      {/* 11. Full-Bleed Footer */}
      <footer className="border-t border-white/10 bg-[#041912] py-12 px-4 sm:px-8 lg:px-12 text-xs text-white/60">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="font-extrabold text-lg text-white font-display">MediTrack Platform</div>
            <p className="text-xs text-white/50 leading-relaxed">
              HL7 FHIR R4 Interoperability Platform & API Gateway for modern healthcare ecosystems.
            </p>
          </div>

          <div>
            <div className="font-bold text-white mb-3 font-mono text-[#a6f120]">Platform</div>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveTab('apidocs')} className="hover:text-white transition-colors">API Reference</button></li>
              <li><button onClick={() => setActiveTab('explorer')} className="hover:text-white transition-colors">FHIR R4 Explorer</button></li>
              <li><button onClick={() => setActiveTab('wizard')} className="hover:text-white transition-colors">Hospital Wizard</button></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3 font-mono text-[#a6f120]">Standards</div>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors">SMART-on-FHIR OAuth</button></li>
              <li><button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors">ABDM M1/M2/M3</button></li>
              <li><button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors">HIPAA Audit Trail</button></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-3 font-mono text-[#a6f120]">Developers</div>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveTab('credentials')} className="hover:text-white transition-colors">Client Credentials</button></li>
              <li><button onClick={() => setActiveTab('webhooks')} className="hover:text-white transition-colors">Webhook Listeners</button></li>
              <li><button onClick={() => setActiveTab('apidocs')} className="hover:text-white transition-colors">SDK Code Generators</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto text-center border-t border-white/10 pt-6 text-[11px] text-white/40 font-mono">
          © 2026 MediTrack Healthcare Interoperability Platform. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
