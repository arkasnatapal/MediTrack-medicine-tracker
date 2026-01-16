import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wind, Flame, Droplets, ArrowRight, Check, Activity, Brain, Heart, Leaf, X } from 'lucide-react';
import axios from 'axios';

// Generated Asset Paths
const introBg = "/assets/onboarding/intro.png";
const doshaBg = "/assets/onboarding/doshas.png";
const aiBg = "/assets/onboarding/ai.png";
const harmonyBg = "/assets/onboarding/harmony.png";

const AyurvedicOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const startGeneration = async () => {
        try {
            const token = localStorage.getItem('token');
            axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/regenerate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.error("Background gen error", e));
        } catch (err) {
            console.error(err);
        }
    };
    startGeneration();
  }, []);

  const handleFinish = async () => {
      try {
          const token = localStorage.getItem('token');
          await axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/onboarding/complete`, {}, {
              headers: { Authorization: `Bearer ${token}` }
          });
          onComplete();
      } catch (err) {
          console.error("Completion failed", err);
          onComplete(); 
      }
  };

  const nextStep = () => setStep(prev => prev + 1);

  const slides = [
      {
          id: 'intro',
          img: introBg,
          title: "The Wisdom of Ages",
          text: (
              <>
                  <p className="mb-4">From the roots of ancient banyan trees where sages meditated, to the palm of your hand.</p>
                  <p>Ayurveda ("The Science of Life") is not just medicine—it is the art of synchronizing your soul with the rhythm of the universe. We bring this 5,000-year-old wisdom into the digital age.</p>
              </>
          )
      },
      {
          id: 'doshas',
          img: doshaBg,
          title: "The Elemental Forces",
          text: (
               <>
                  <p className="mb-4">The universe dances to three unique rhythms. Which one are you?</p>
                  <ul className="space-y-4 text-left bg-black/20 p-3 md:p-4 rounded-lg backdrop-blur-sm">
                      <li className="flex items-center gap-3"><Wind className="text-blue-400 shrink-0" size={20} /> <span className="text-blue-100"><strong>Vata (Air):</strong> The energy of movement and creativity.</span></li>
                      <li className="flex items-center gap-3"><Flame className="text-orange-400 shrink-0" size={20} /> <span className="text-orange-100"><strong>Pitta (Fire):</strong> The energy of digestion and transformation.</span></li>
                      <li className="flex items-center gap-3"><Droplets className="text-emerald-400 shrink-0" size={20} /> <span className="text-emerald-100"><strong>Kapha (Earth):</strong> The energy of structure and lubrication.</span></li>
                  </ul>
               </>
          )
      },
      {
          id: 'science',
          img: aiBg,
          title: "Neural Synergy",
          text: (
              <>
                 <p className="mb-4">Your biology creates data every second. Our AI acts as a digital pulse reader.</p>
                 <p>By analyzing your health logs, symptoms, and medical reports, we build a "Digital Twin" of your wellness profile. This isn't generic advice—it's a precision-engineered path to healing, constantly learning from you.</p>
              </>
          )
      },
      {
        id: 'harmony',
        img: harmonyBg,
        title: "Harmony Awaits",
        text: (
            <>
               <p className="mb-6">Imagine a day where you wake up with purpose, eat when your fire is strongest, and rest when nature sleeps.</p>
               <p className="font-serif italic text-2xl text-emerald-200 border-l-4 border-emerald-400 pl-4 py-2 bg-emerald-900/40 rounded-r-lg">
                   "When diet is wrong, medicine is of no use. When diet is correct, medicine is of no need."
               </p>
            </>
        ),
        action: true
      }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl transition-all font-sans">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl h-auto max-h-[90vh] md:h-[85vh] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row border border-slate-700"
        >
             {/* Close Button (Optional) */}
             <button onClick={handleFinish} className="absolute top-4 right-4 md:top-6 md:right-6 z-50 text-white/70 hover:text-white transition-colors bg-black/40 border border-white/10 p-2 rounded-full backdrop-blur-md">
                 <X size={20} />
             </button>

             <AnimatePresence mode='wait'>
                <motion.div 
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row w-full h-full relative"
                >
                    {/* Visual Half */}
                    <div className="h-[35%] md:h-full md:w-3/5 relative overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900 z-10 hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 md:hidden" />
                        
                        <motion.img 
                            src={slides[step].img} 
                            alt="Visual"
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 10, ease: "linear" }}
                            className="w-full h-full object-cover object-center md:object-center"
                        />
                        
                        {/* Artwork Credit / Subtle Overlay */}
                        {/* <div className="absolute bottom-6 left-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                             <div className="flex items-center gap-2 text-[10px] text-white/60 tracking-widest uppercase border border-white/20 px-2 py-1 rounded bg-black/30 backdrop-blur-sm">
                                 <Sparkles size={10} /> AI Generated Art
                             </div>
                        </div> */}
                    </div>

                    {/* Content Half */}
                    <div className="h-[65%] md:h-full md:w-2/5 px-5 pt-6 pb-20 md:p-12 md:pl-0 flex flex-col relative bg-slate-900 overflow-y-auto no-scrollbar">
                         {/* Progress */}
                         <div className="flex gap-2 mb-6 md:mb-8 shrink-0">
                            {slides.map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={false}
                                    animate={{ 
                                        width: i === step ? 32 : 8,
                                        backgroundColor: i === step ? '#10b981' : '#334155'
                                    }}
                                    className="h-1.5 rounded-full transition-all duration-300" 
                                />
                            ))}
                         </div>

                         <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex-1 flex flex-col justify-center"
                         >
                             <h2 className="text-2xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-4 md:mb-6 font-serif">
                                 {slides[step].title}
                             </h2>
                             
                             <div className="text-slate-300 text-sm md:text-lg leading-relaxed space-y-3 md:space-y-4 mb-8">
                                 {slides[step].text}
                             </div>
                         </motion.div>

                         <div className="mt-auto pt-2 flex items-center justify-between shrink-0">
                             {step > 0 ? (
                                 <button onClick={() => setStep(prev => prev - 1)} className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                                     Back
                                 </button>
                             ) : <div></div>}

                             {slides[step].action ? (
                                 <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleFinish}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3 md:px-8 bg-emerald-500 md:py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 text-sm md:text-base"
                                 >
                                     Begin Journey <ArrowRight size={18} />
                                 </motion.button>
                             ) : (
                                 <motion.button
                                     whileHover={{ scale: 1.1 }}
                                     whileTap={{ scale: 0.9 }}
                                     onClick={nextStep}
                                     className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all hover:border-transparent cursor-pointer"
                                 >
                                     <ArrowRight size={20} className="md:w-6 md:h-6" />
                                 </motion.button>
                             )}
                         </div>
                    </div>
                </motion.div>
             </AnimatePresence>
        </motion.div>
    </div>
  );
};

export default AyurvedicOnboarding;
