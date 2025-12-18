import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Pill, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SearchModal = ({ isOpen, onClose, medicines }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ');
    const filtered = medicines.filter(medicine => {
      const name = medicine.name.toLowerCase();
      const form = (medicine.form || '').toLowerCase();
      const category = (medicine.category || '').toLowerCase();
      
      return searchTerms.every(term => 
        name.includes(term) || form.includes(term) || category.includes(term)
      );
    });

    setResults(filtered.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(-1); // Reset selection on new search
  }, [query, medicines]);

  const handleSelect = (medicineId) => {
    navigate(`/medicines/${medicineId}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]._id);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search your medicines..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-lg font-medium"
              />
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim() === '' ? (
                <div className="py-8 text-center text-slate-400">
                  <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Type to search your inventory</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1" ref={resultsRef}>
                  {results.map((medicine, index) => (
                    <button
                      key={medicine._id}
                      onClick={() => handleSelect(medicine._id)}
                      className={`w-full p-3 flex items-center gap-4 rounded-2xl transition-colors group text-left ${
                        index === selectedIndex 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                        index === selectedIndex
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 scale-110'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110'
                      }`}>
                        <Pill className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate ${
                          index === selectedIndex ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {medicine.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{medicine.form || 'Medicine'}</span>
                          <span>•</span>
                          <span>{medicine.dosage || 'No dosage'}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 transition-colors ${
                        index === selectedIndex ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-emerald-500'
                      }`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No medicines found matching "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
