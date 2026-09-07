import React, { useState } from 'react';
import { Play, Copy, Check, ArrowRight, Sparkles, Terminal, Code2, Shield, Database } from 'lucide-react';

export default function HeroOverview({ setActiveTab, activeSubItem, setActiveSubItem }) {
  const [activePkgManager, setActivePkgManager] = useState('pnpm');
  const [copiedPkg, setCopiedPkg] = useState(false);

  const pkgCommands = {
    npm: 'npm install @meditrack/interop-sdk',
    pnpm: 'pnpm add @meditrack/interop-sdk',
    yarn: 'yarn add @meditrack/interop-sdk',
    cURL: 'curl -X POST http://localhost:5002/api/v1/auth/token -d \'{"grant_type":"client_credentials"}\'',
    python: 'pip install meditrack-fhir-sdk'
  };

  const handleCopyPkg = () => {
    navigator.clipboard.writeText(pkgCommands[activePkgManager]);
    setCopiedPkg(true);
    setTimeout(() => setCopiedPkg(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Hero Media Card with Video Play Overlay */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl group bg-[#041912] border border-white/10">
        <img
          src="/assets/doc_hero_team_banner.png"
          alt="MediTrack Developer Team Video"
          className="w-full h-[280px] sm:h-[340px] object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Video Dark Overlay & Play Button */}
        <div className="absolute inset-0 bg-[#062319]/40 group-hover:bg-[#062319]/25 transition-colors flex items-center justify-center">
          <button
            onClick={() => setActiveTab('wizard')}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#062319]/90 backdrop-blur-md text-[#a6f120] flex items-center justify-center shadow-2xl transition-transform transform group-hover:scale-110 ring-4 ring-[#a6f120]/30 cursor-pointer"
            title="Watch 3-min Overview"
          >
            <Play className="h-8 w-8 ml-1 fill-[#a6f120] text-[#a6f120]" />
          </button>
        </div>
      </div>

      {/* 2. Document Heading */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Get started
        </h1>
        <p className="text-white/70 text-base leading-relaxed">
          Welcome to the <strong className="text-white">MediTrack Healthcare Interoperability Platform</strong> documentation! This page will give you an introduction to the 80% of MediTrack and HL7 FHIR concepts that you will use on a daily basis.
        </p>
      </div>

      {/* 3. Package Manager Tabs (Underline Style) */}
      <div className="space-y-4 pt-2">
        <div className="flex border-b border-white/10 space-x-6 text-sm font-semibold text-white/50">
          {['npm', 'pnpm', 'yarn', 'cURL', 'python'].map((mgr) => (
            <button
              key={mgr}
              onClick={() => setActivePkgManager(mgr)}
              className={`pb-3 transition-colors cursor-pointer ${
                activePkgManager === mgr
                  ? 'border-b-2 border-[#a6f120] text-[#a6f120] font-bold'
                  : 'hover:text-white'
              }`}
            >
              {mgr}
            </button>
          ))}
        </div>

        {/* Dark Rounded Pill Code Block */}
        <div className="relative rounded-2xl bg-[#020d09] p-4 shadow-xl border border-white/10 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center space-x-3 overflow-x-auto pr-8">
            <span className="text-white/40 select-none">$</span>
            <span className="text-slate-100 font-semibold">{pkgCommands[activePkgManager]}</span>
          </div>

          <button
            onClick={handleCopyPkg}
            className="p-2 text-white/60 hover:text-white rounded-lg bg-white/5 border border-white/10 transition-colors cursor-pointer"
            title="Copy command"
          >
            {copiedPkg ? <Check className="h-4 w-4 text-[#a6f120]" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 4. Detailed Concepts Text */}
      <div className="space-y-4 text-sm text-white/70 leading-relaxed pt-2">
        <p>
          All clinical FHIR resources and API endpoints are packed inside the MediTrack Gateway engine. Besides that, the platform contains multiple interactive tools for hospital onboarding, SMART-on-FHIR credentials, real-time webhooks, and HIPAA audit trails.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div
            onClick={() => setActiveTab('apidocs')}
            className="p-5 bg-[#041912] border border-white/10 rounded-3xl shadow-xl hover:border-[#a6f120]/50 cursor-pointer transition-all space-y-2"
          >
            <div className="h-8 w-8 rounded-xl bg-[#a6f120]/15 text-[#a6f120] flex items-center justify-center font-bold">
              <Code2 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white font-display">Interactive REST API Docs</h3>
            <p className="text-xs text-white/60">
              Test endpoints live against http://localhost:5002 with cURL, JS, Python, Go, and Java SDK snippets.
            </p>
          </div>

          <div
            onClick={() => setActiveTab('explorer')}
            className="p-5 bg-[#041912] border border-white/10 rounded-3xl shadow-xl hover:border-[#a6f120]/50 cursor-pointer transition-all space-y-2"
          >
            <div className="h-8 w-8 rounded-xl bg-[#a6f120]/15 text-[#a6f120] flex items-center justify-center font-bold">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white font-display">Live FHIR R4 Explorer</h3>
            <p className="text-xs text-white/60">
              Inspect Patient, Observation, Encounter, Condition, Medication, and $everything FHIR bundles.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <button
            onClick={() => setActiveTab('apidocs')}
            className="px-6 py-3.5 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-extrabold text-xs rounded-full shadow-lg shadow-[#a6f120]/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <span>Next: Explore Interactive API Reference</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
