import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, Sun, Moon, Github, Globe, Sparkles, Home } from 'lucide-react';

export default function Header({ isDarkMode, setIsDarkMode, activeTab, setActiveTab }) {
  const [version, setVersion] = useState('v4.0.1');

  return (
    <header className="sticky top-0 z-50 bg-[#062319]/90 backdrop-blur-xl border-b border-white/10 transition-colors duration-200">
      {/* Top Navbar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Version Selector */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#a6f120]/15 hover:bg-[#a6f120]/25 text-[#a6f120] font-bold text-xs rounded-full border border-[#a6f120]/30 transition-all cursor-pointer"
            title="Return to Landing Homepage"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>

          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
              MediTrack<span className="text-[#a6f120]">Me</span>
            </span>
            <div className="relative group">
              <button className="flex items-center space-x-1 px-2.5 py-1 bg-[#020d09] text-white/80 hover:text-white rounded-full text-xs font-semibold border border-white/15 transition-all">
                <span>{version}</span>
                <ChevronDown className="h-3 w-3 text-white/40" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Search Pill */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-3 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search documentation, FHIR schemas, APIs..."
              className="w-full pl-11 pr-12 py-2.5 bg-[#020d09] text-white placeholder-white/40 rounded-full text-xs font-medium border border-white/15 focus:border-[#a6f120] focus:outline-none transition-all shadow-inner"
            />
            <kbd className="absolute right-4 top-2.5 px-2 py-0.5 text-[10px] font-mono text-white/40 bg-white/5 rounded border border-white/10 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Nav Links */}
        <div className="flex items-center space-x-4">
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-white/80">
            <button onClick={() => setActiveTab('landing')} className="hover:text-[#a6f120] transition-colors">Landing Page</button>
            <button onClick={() => setActiveTab('apidocs')} className="hover:text-[#a6f120] transition-colors">Reference</button>
            <button onClick={() => setActiveTab('explorer')} className="hover:text-[#a6f120] transition-colors">FHIR Explorer</button>
            <button onClick={() => setActiveTab('credentials')} className="hover:text-[#a6f120] transition-colors">Sign In</button>
          </nav>

          <button
            onClick={() => setActiveTab('wizard')}
            className="px-4 py-2 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-xs rounded-full shadow-md shadow-[#a6f120]/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Connect HIS</span>
          </button>
        </div>
      </div>

      {/* Sub-Header Breadcrumb Bar */}
      <div className="bg-[#041912] border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs text-white/60">
          {/* Left Breadcrumb Trail */}
          <div className="flex items-center space-x-2 font-medium">
            <div className="flex -space-x-1.5 overflow-hidden">
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#062319]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" />
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#062319]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar" />
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#062319]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Avatar" />
            </div>

            <button className="font-semibold text-white hover:text-[#a6f120] flex items-center gap-1">
              <span>Dev Team Workspace</span>
              <ChevronDown className="h-3 w-3 text-white/40" />
            </button>
            <span>›</span>
            <span>Help Center</span>
            <span>›</span>
            <span>API</span>
            <span>›</span>
            <span className="font-semibold text-white">Documentation</span>
          </div>

          {/* Right Secondary Options */}
          <div className="flex items-center space-x-4">
            <button className="hidden sm:flex items-center space-x-1 hover:text-white">
              <Globe className="h-3.5 w-3.5" />
              <span>English, USA</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            <button onClick={() => setActiveTab('security')} className="flex items-center space-x-1 hover:text-white">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Support</span>
            </button>

            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white">
              <Github className="h-3.5 w-3.5" />
            </a>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1 rounded-full text-white/60 hover:text-[#a6f120] transition-colors"
              title="Toggle Theme"
            >
              <Sun className="h-4 w-4 text-[#a6f120]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
