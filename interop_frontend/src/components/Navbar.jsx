import React from 'react';
import { Activity, BookOpen, Code, Database, Key, Radio, Server, Shield, Sparkles, Wand2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Overview & Quickstart', icon: Activity },
    { id: 'wizard', label: 'Hospital Onboarding Wizard', icon: Wand2, badge: 'New' },
    { id: 'apidocs', label: 'API & FHIR Reference', icon: BookOpen },
    { id: 'explorer', label: 'Live FHIR Explorer', icon: Database },
    { id: 'credentials', label: 'OAuth Credentials', icon: Key },
    { id: 'webhooks', label: 'Webhooks & Events', icon: Radio },
    { id: 'security', label: 'Security & Compliance', icon: Shield }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-sans">MediTrack</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  HL7 FHIR R4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hospital Interoperability & Developer Portal</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Badge & CTA */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-300">Gateway:</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <button
              onClick={() => setActiveTab('wizard')}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
              <span>Connect Your HIS</span>
            </button>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="lg:hidden flex overflow-x-auto gap-1 py-2 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
