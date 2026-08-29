import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppMode, triggerGoogleTranslate } from '../context/AppModeContext';
import { Globe, Check, ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Comprehensive list of Indian languages + English
const INDIAN_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇮🇳' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली', flag: '🇮🇳' },
  { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'sd', label: 'Sindhi', native: 'سنڌي', flag: '🇮🇳' },
  { code: 'ks', label: 'Kashmiri', native: 'کٲشُر', flag: '🇮🇳' },
  { code: 'gom', label: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
  { code: 'mni', label: 'Manipuri', native: 'মৈতৈলোন্', flag: '🇮🇳' },
  { code: 'sat', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
  { code: 'brx', label: 'Bodo', native: 'बड़ो', flag: '🇮🇳' },
  { code: 'doi', label: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
  { code: 'mai', label: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
];

const LanguageSelector = () => {
  const { language, setLanguage } = useAppMode();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const currentLang = useMemo(() => {
    return INDIAN_LANGUAGES.find((l) => l.code === language) || {
      code: language,
      label: language.toUpperCase(),
      native: language.toUpperCase(),
      flag: '🇮🇳'
    };
  }, [language]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return INDIAN_LANGUAGES;
    const query = searchQuery.toLowerCase().trim();
    return INDIAN_LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(query) ||
        l.native.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle language selection
  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode);
    triggerGoogleTranslate(langCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 shadow-sm
          bg-slate-100/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700
          text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 animate-pulse" />
        <span className="truncate flex items-center gap-1.5">
          <span>{currentLang.flag}</span>
          <span>{currentLang.native}</span>
          <span className="opacity-60 text-[10px]">({currentLang.code.toUpperCase()})</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-[9999] overflow-hidden
              bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
              border border-slate-200 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-800"
          >
            {/* Header & Search Bar */}
            <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/50 space-y-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Indian Languages
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {INDIAN_LANGUAGES.length} Languages
                </span>
              </div>

              {/* Search Field */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Indian language..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none transition-all
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700
                    text-slate-800 dark:text-slate-100 focus:border-emerald-500 dark:focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Language Options List */}
            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => {
                  const isSelected = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors duration-150 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{lang.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-xs leading-snug">{lang.native}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            {lang.label} ({lang.code.toUpperCase()})
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No Indian language matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
