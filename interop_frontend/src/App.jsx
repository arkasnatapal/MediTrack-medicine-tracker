import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightTableOfContents from './components/RightTableOfContents';
import HeroOverview from './components/HeroOverview';
import HospitalOnboardingWizard from './components/HospitalOnboardingWizard';
import ApiReference from './components/ApiReference';
import FhirExplorer from './components/FhirExplorer';
import DeveloperDashboard from './components/DeveloperDashboard';
import WebhookManager from './components/WebhookManager';
import SecurityCompliance from './components/SecurityCompliance';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'overview' | 'apidocs' | 'explorer' | 'wizard' | 'credentials' | 'webhooks' | 'security'
  const [activeSubItem, setActiveSubItem] = useState('install');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // If activeTab is 'landing', render the Fullscreen GSAP Landing Page
  if (activeTab === 'landing') {
    return <LandingPage setActiveTab={setActiveTab} />;
  }

  // Otherwise, render the 3-Column Documentation Portal with Dark Forest Green theme
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#062319] text-slate-100 selection:bg-[#a6f120] selection:text-[#062319]">
      {/* 1. Header & Sub-Header Breadcrumb Bar */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main 3-Column Layout Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 py-6">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSubItem={activeSubItem}
          setActiveSubItem={setActiveSubItem}
        />

        {/* Center Main Content Body */}
        <main className="flex-1 min-w-0 py-2">
          {activeTab === 'overview' && (
            <HeroOverview
              setActiveTab={setActiveTab}
              activeSubItem={activeSubItem}
              setActiveSubItem={setActiveSubItem}
            />
          )}
          {activeTab === 'apidocs' && <ApiReference />}
          {activeTab === 'explorer' && <FhirExplorer />}
          {activeTab === 'wizard' && <HospitalOnboardingWizard setActiveTab={setActiveTab} />}
          {activeTab === 'credentials' && <DeveloperDashboard />}
          {activeTab === 'webhooks' && <WebhookManager />}
          {activeTab === 'security' && <SecurityCompliance />}
        </main>

        {/* Right Sidebar (Table of Contents & Tutorial Video Card) */}
        <RightTableOfContents
          activeSubItem={activeSubItem}
          setActiveSubItem={setActiveSubItem}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* 3. Footer */}
      <footer className="border-t border-white/10 bg-[#041912] py-8 text-center text-xs text-white/50 space-y-2 mt-auto">
        <div className="flex flex-wrap justify-center items-center gap-3 font-medium">
          <button onClick={() => setActiveTab('landing')} className="text-[#a6f120] font-bold hover:underline">
            MediTrack Landing Homepage
          </button>
          <span>•</span>
          <span className="text-white font-bold">Healthcare Interoperability Platform</span>
          <span>•</span>
          <span className="text-[#a6f120] font-semibold">HL7 FHIR Release 4 (4.0.1)</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">OAuth 2.0 SMART-on-FHIR</span>
        </div>
        <div className="text-white/40">
          Enabling external hospitals, EHRs, clinics, and laboratories to integrate seamlessly.
        </div>
      </footer>
    </div>
  );
}
