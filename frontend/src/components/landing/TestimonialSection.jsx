import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  {
    id: 4,
    name: "Papiya Layek",
    role: "Student",
    image: "/images/feedbacks/1.jpeg",
    text: "I found the menstrual health calculator really useful. It’s simple to use and helps me understand and track my cycle better without any confusion.",
    rating: 5,
  },
  {
    id: 3,
    name: "Sasmit Banerjee",
    role: "Student Researcher",
    image: "/images/feedbacks/2.jpeg",
    text: "MediTrack is a family-focused health companion that simplifies care through smart reminders, emergency support, and seamless family integration. Its AI-powered insights and detailed reports make it a reliable and user-friendly solution for real-life healthcare management.",
    rating: 5,
  },
  {
    id: 2,
    name: "Aishiki Joardar",
    role: "Medical Student",
    image: "/images/feedbacks/26ba4426-bfaa-456d-af5f-997a2d1b7bc6.jpeg",
    text: "MediTrack helps me store and track all my medical reports digitally, analyze my health progress, and never miss routine doctor visits. It replaced paper records that I often misplaced.",
    rating: 5,
  },
  {
    id: 1,
    name: "Riya Paul",
    role: "Student",
    image: "/images/feedbacks/3.jpeg",
    text: "I’m really impressed by how intuitive MediTrack is. It organizes prescriptions intelligently, provides timely reminders, and feels secure and personalized—making it easy to stay consistent with health goals without the stress of paperwork or complex schedules.",
    rating: 5,
  },
  // {
  //   id: 5,
  //   name: "Michael Chang",
  //   role: "Tech Enthusiast",
  //   image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  //   text: "The UI is stunning and the AI features genuinely feel like the future of healthcare. Highly recommended for tech-savvy users.",
  //   rating: 4,
  // },
];

const TestimonialSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextReview = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const setReview = (index) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(nextReview, 8000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header content similar to image but adapted */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row items-end justify-between gap-8 md:px-12">
           <div className="relative">
              <Quote className="absolute -top-12 -left-8 w-24 h-24 text-emerald-500/10 rotate-180" />
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white relative z-10">
                What they say <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  about us
                </span>
              </h2>
           </div>
           
           {/* Navigation Arrows (Top Left in design, moved here for balance or keep left if preferred? 
               The design has arrows above profile. I'll stick to design layout below.) 
           */}
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-5 relative flex flex-col gap-6">
               
               {/* Controls */}
               <div className="flex items-center gap-3 ml-2">
                  <button 
                    onClick={prevReview}
                    className="w-12 h-12 rounded-full border border-white/10 hover:border-emerald-500/50 flex items-center justify-center text-slate-400 hover:text-white transition-all group bg-[#020617]/50 backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button 
                    onClick={nextReview}
                    className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 transition-all group"
                  >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
               </div>

               <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, ease: "circOut" }}
                  className="w-full"
                >
                  {/* Main Profile Card */}
                  <div className="relative group w-full max-w-md">
                    {/* Neon Glow Behind */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    
                    <div className="relative aspect-[4/3] w-full bg-[#020617] rounded-[2.5rem] p-2 border border-white/10 overflow-hidden shadow-2xl">
                        <img 
                          src={reviews[activeIndex].image} 
                          alt={reviews[activeIndex].name}
                          className="w-full h-full object-cover rounded-[2rem] select-none pointer-events-auto"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                        
                        {/* Watermark */}
                        <div className="absolute bottom-5 right-6 z-20 pointer-events-none select-none">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold drop-shadow-md border border-white/10 px-2 py-1 rounded-full bg-black/20 backdrop-blur-[2px]">
                            © MediTrack • All rights reserved
                          </p>
                        </div>
                    </div>
                  </div>
                </motion.div>
               </AnimatePresence>
            </div>

            {/* Right Column: Content Bubble */}
            <div className="lg:col-span-7 flex flex-col justify-center h-full pt-8 lg:pl-8">
               
               <div className="relative mt-8 lg:mt-0">
                  {/* Decorative Big Quote Icon */}
                  <div className="absolute -top-12 -right-4 lg:-right-8 z-20">
                      <Quote className="w-24 h-24 lg:w-32 lg:h-32 text-emerald-500 dark:text-emerald-500 fill-emerald-500 rotate-180 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="relative bg-[#0F172A]/40 backdrop-blur-xl border border-white/5 p-8 lg:p-12 rounded-3xl border-l-[6px] border-l-emerald-500 shadow-2xl overflow-hidden"
                    >
                       {/* Background Gradient for Card */}
                       <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                       <div className="relative z-10">
                           <div className="flex gap-1.5 mb-6">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-5 h-5 ${i < reviews[activeIndex].rating ? "text-yellow-400 fill-yellow-400" : "text-slate-800 fill-slate-800"}`} 
                                />
                              ))}
                           </div>
                           
                           <p className="text-xl lg:text-2xl text-slate-200 leading-relaxed font-normal mb-8">
                            "{reviews[activeIndex].text}"
                           </p>
                           
                           <div className="flex flex-col gap-1">
                              <h4 className="text-xl font-bold text-white tracking-wide">{reviews[activeIndex].name}</h4>
                              <p className="text-emerald-400 dark:text-emerald-400 font-semibold tracking-wide text-sm uppercase">{reviews[activeIndex].role}</p>
                           </div>
                       </div>
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>



            </div>

          </div>
        </div>

    </section>
  );
};

export default TestimonialSection;
