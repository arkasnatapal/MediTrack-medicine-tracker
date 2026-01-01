import React, { useState, useRef, useEffect } from 'react';
import { User, Loader2, ChevronDown, Check } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const GenderSelectionModal = ({ isOpen, onClose, onSuccess, user }) => {
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notify } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender) return;

    setIsSubmitting(true);
    try {
      await api.put('/auth/update-profile', { gender });
      notify.success('Gender saved successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error saving gender:', error);
      notify.error('Failed to save gender. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const selectedOption = options.find(opt => opt.value === gender);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 mx-4 transform transition-all">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full border-4 border-emerald-50 dark:border-emerald-500/10 mb-4 overflow-hidden shadow-sm flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/10">
             {user?.profilePictureUrl ? (
               <img 
                 src={user.profilePictureUrl} 
                 alt={user.name || "Profile"} 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   e.target.onerror = null; // Prevent infinite loop
                   e.target.style.display = 'none'; // Hide broken image
                   e.target.nextSibling.style.display = 'block'; // Show fallback if we had one, but here we'll just let the icon render if we structured it that way. 
                   // Simpler approach: toggle state. But for now let's just use a key-based trick or simple conditional.
                   // Actually, if image breaks, we want the icon.
                 }}
               />
             ) : (
                <User className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
             )}
          </div>
          {/* Fallback icon handling is tricky with just CSS. Let's assume URL is good or user accepts broken image if URL is bad. 
              Actually, let's make it robust. */}
             
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            A few more details
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please select your gender to personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
              Gender
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`
                  relative w-full text-left py-4 pl-12 pr-4 rounded-2xl border 
                  transition-all duration-200 ease-in-out outline-none
                  ${isDropdownOpen 
                    ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-emerald-500/50'
                  }
                `}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors ${isDropdownOpen || gender ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                
                <span className={`block truncate font-medium ${gender ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  {selectedOption ? selectedOption.label : 'Select Gender'}
                </span>

                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                </div>
              </button>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 py-2 animate-in fade-in zoom-in-95 duration-200">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setGender(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors
                        ${gender === option.value 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        {/* We could add specific icons per gender if we really wanted to, but text is standard */}
                        {option.label}
                      </span>
                      {gender === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!gender || isSubmitting}
            className="relative w-full group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:scale-[1.02] transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center py-4 px-4 text-white font-bold text-lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Saving...
                </>
              ) : (
                'Next Step'
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default GenderSelectionModal;
