import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ArrowLeft, ArrowRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote: (
      <>
        Chatting with MediTrack <span className="italic text-slate-400 font-medium">felt different.</span> 
        It wasn't just an app, it felt like a <span className="text-emerald-600">safe space</span> for my health journey.
      </>
    ),
    author: "Sarah Leso",
    role: "Small Business Owner",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    quote: (
      <>
        The <span className="text-emerald-600">diagnostic precision</span> and ease of use makes MediTrack an 
        <span className="italic text-slate-400 font-medium"> essential part</span> of my patients' daily routine.
      </>
    ),
    author: "Dr. James Miller",
    role: "Cardiologist",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    quote: (
      <>
        Managing my <span className="text-emerald-600">family's health</span> used to be a nightmare. Now, it's 
        all in one <span className="italic text-slate-400 font-medium">beautiful, organized</span> place.
      </>
    ),
    author: "Elena Rodriguez",
    role: "Parent & Caregiver",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800"
  }
];

const TestimonialEditorial = () => {
  const [[page, direction], setPage] = useState([0, 0]);

  const currentIndex = Math.abs(page % testimonials.length);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <section className="py-40 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto h-[600px] lg:h-[700px] relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div 
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 }
              }}
              className="absolute inset-0 flex flex-col lg:flex-row items-center gap-20"
            >
              {/* Large Image */}
              <div className="w-full lg:w-1/2 aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative group flex-shrink-0">
                <img 
                  src={testimonials[currentIndex].image} 
                  alt={testimonials[currentIndex].author} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay" />
              </div>

              {/* Testimonial Content */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <Quote className="text-emerald-500 mb-8" size={60} strokeWidth={1} />
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-12">
                  {testimonials[currentIndex].quote}
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="w-px h-12 bg-slate-200" />
                  <div>
                    <p className="text-xl font-bold text-slate-900">{testimonials[currentIndex].author}</p>
                    <p className="text-slate-500 font-medium">{testimonials[currentIndex].role}</p>
                  </div>
                </div>

                {/* Navigation Buttons - Absolute positioning to avoid movement */}
                <div className="flex gap-4 mt-16">
                  <button 
                    onClick={() => paginate(-1)}
                    className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group"
                  >
                    <ArrowLeft size={20} className="group-active:scale-90 transition-transform" />
                  </button>
                  <button 
                    onClick={() => paginate(1)}
                    className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group"
                  >
                    <ArrowRight size={20} className="group-active:scale-90 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TestimonialEditorial;
