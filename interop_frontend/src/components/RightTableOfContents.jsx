import React from 'react';
import { Link2, Play, ArrowUp, Sparkles, HelpCircle } from 'lucide-react';

export default function RightTableOfContents({ activeSubItem, setActiveSubItem, setActiveTab }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="w-64 flex-shrink-0 space-y-6 pl-4 border-l border-white/10 py-6 hidden xl:block min-h-[calc(100vh-6.5rem)]">
      {/* Top Package URL Pill */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-[#020d09] text-white/80 rounded-2xl text-xs font-mono border border-white/15 shadow-sm truncate">
        <Link2 className="h-3.5 w-3.5 text-[#a6f120] flex-shrink-0" />
        <span className="truncate">meditrack.org/fhir</span>
      </div>

      {/* On this page Navigation */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          On this page
        </h4>

        <nav className="space-y-1 text-xs font-medium">
          {[
            { id: 'install', label: 'Install' },
            { id: 'quickstart', label: 'Quickstart' },
            { id: 'usage', label: 'Usage example' },
            { id: 'schemas', label: 'FHIR R4 Schemas' },
            { id: 'apirunner', label: 'Interactive API Console' }
          ].map((item) => {
            const isActive = activeSubItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubItem(item.id);
                  if (item.id === 'schemas') setActiveTab('explorer');
                  else if (item.id === 'apirunner') setActiveTab('apidocs');
                  else setActiveTab('overview');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'border border-[#a6f120]/40 bg-[#a6f120]/15 text-[#a6f120] font-bold shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Back to top Button */}
      <div className="pt-2">
        <button
          onClick={scrollToTop}
          className="flex items-center space-x-1.5 text-xs font-semibold text-white/40 hover:text-[#a6f120] transition-colors cursor-pointer"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span>Back to top</span>
        </button>
      </div>

      {/* Bottom Floating Tutorial Card */}
      <div className="bg-[#041912] border border-white/15 rounded-3xl p-4 space-y-3 shadow-2xl mt-8">
        <div>
          <h4 className="text-sm font-extrabold text-white font-display">Need help?</h4>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            Learn basics with this 5-min Video Tutorial
          </p>
        </div>

        {/* Video Thumbnail */}
        <div
          onClick={() => setActiveTab('wizard')}
          className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-md"
        >
          <img
            src="/assets/doc_tutorial_thumbnail.png"
            alt="Tutorial Thumbnail"
            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[#062319]/40 group-hover:bg-[#062319]/20 transition-colors flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-[#062319]/90 text-[#a6f120] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-[#a6f120]/40">
              <Play className="h-4 w-4 ml-0.5 fill-[#a6f120] text-[#a6f120]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
