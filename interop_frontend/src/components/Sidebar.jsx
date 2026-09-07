import React, { useState } from 'react';
import { Search, FileText, Send, Layout, MessageSquare, ChevronDown, ChevronRight, Sparkles, BookOpen, Database, Key, Radio, Shield, Wand2 } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, activeSubItem, setActiveSubItem }) {
  const [gettingStartedOpen, setGettingStartedOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [fastSearch, setFastSearch] = useState('');

  const topMenuItems = [
    { id: 'overview', label: 'Documentation', icon: FileText },
    { id: 'explorer', label: 'Roadmap & FHIR', icon: Send },
    { id: 'wizard', label: 'Templates & Wizard', icon: Layout },
    { id: 'webhooks', label: 'Community', icon: MessageSquare }
  ];

  return (
    <aside className="w-64 flex-shrink-0 space-y-6 pr-4 border-r border-white/10 py-6 min-h-[calc(100vh-6.5rem)]">
      {/* Fast Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-white/40" />
        <input
          type="text"
          placeholder="Fast search"
          value={fastSearch}
          onChange={(e) => setFastSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#020d09] text-white placeholder-white/40 rounded-full text-xs font-medium border border-white/15 focus:outline-none focus:border-[#a6f120] transition-all"
        />
      </div>

      {/* Main Top Menu Icons */}
      <div className="space-y-1">
        {topMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#a6f120]/15 text-[#a6f120] font-extrabold border border-[#a6f120]/30 shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#a6f120]' : 'text-white/40'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Categorized Tree */}
      <div className="space-y-4 pt-2">
        {/* Intro */}
        <div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-[11px] font-mono font-bold text-white/40 uppercase tracking-wider px-3 hover:text-white"
          >
            Intro
          </button>
        </div>

        {/* Getting started Section */}
        <div className="space-y-1">
          <button
            onClick={() => setGettingStartedOpen(!gettingStartedOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-white hover:text-[#a6f120] cursor-pointer"
          >
            <span>Getting started</span>
            {gettingStartedOpen ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
          </button>

          {gettingStartedOpen && (
            <div className="pl-2 space-y-1 font-medium text-xs">
              <button
                onClick={() => { setActiveTab('overview'); setActiveSubItem('install'); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'overview' && activeSubItem === 'install'
                    ? 'bg-[#a6f120] text-[#062319] font-bold shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Install</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#062319] text-[#a6f120] rounded-full border border-[#a6f120]/30">React</span>
              </button>

              <button
                onClick={() => { setActiveTab('overview'); setActiveSubItem('quickstart'); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'overview' && activeSubItem === 'quickstart' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Quickstart
              </button>

              <button
                onClick={() => { setActiveTab('apidocs'); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'apidocs' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Interactive API Docs
              </button>

              <button
                onClick={() => { setActiveTab('explorer'); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'explorer' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                FHIR R4 Schemas
              </button>

              <button
                onClick={() => { setActiveTab('credentials'); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'credentials' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Usage & Authorization
              </button>
            </div>
          )}
        </div>

        {/* Advanced Usage Section */}
        <div className="space-y-1">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-white hover:text-[#a6f120] cursor-pointer"
          >
            <span>Advanced Usage</span>
            {advancedOpen ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
          </button>

          {advancedOpen && (
            <div className="pl-2 space-y-1 font-medium text-xs">
              <button
                onClick={() => setActiveTab('wizard')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'wizard' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Hospital Onboarding
              </button>

              <button
                onClick={() => setActiveTab('credentials')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'credentials' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                OAuth 2.0 Credentials
              </button>

              <button
                onClick={() => setActiveTab('webhooks')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'webhooks' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                HMAC-SHA256 Webhooks
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'security' ? 'text-[#a6f120] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                HIPAA Audit Trail
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
