import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    id: 2,
    name: "Papiya Layek",
    role: "Student",
    image: "/images/feedbacks/6c753b6a-c2dd-465e-b326-57173fd8244c.jpeg",
    text: "I found the menstrual health calculator really useful. It’s simple to use and helps me understand and track my cycle better without any confusion",
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
    id: 4,
    name: "Aishiki Joardar",
    role: "Medical Student",
    image: "/images/feedbacks/26ba4426-bfaa-456d-af5f-997a2d1b7bc6.jpeg",
    text: "MediTrack helps me store and track all my medical reports digitally, analyze my health progress, and never miss routine doctor visits. It replaced paper records that I often misplaced, making health management simple and stress-free.",
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
  { id: 5,
    name: "Atrayee Ghosh",
    role: "Medical Student",
    image: "/images/feedbacks/5.jpeg",
    text: "The UI is simple and clean, and the AI features genuinely feel like the future of healthcare. Highly recommended for daily usage.",
    rating: 5,
  },
  // {
  //   id: 5,
  //   name: "Michael Chang",
  //   role: "Tech Enthusiast",
  //   image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  //   text: "The UI is stunning and the AI features genuinely feel like the future of healthcare.",
  //   rating: 4,
  // },
  // {
  //   id: 6,
  //   name: "Jessica Parker",
  //   role: "Fitness Coach",
  //   image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  //   text: "Love how it integrates daily health metrics. A must-have for anyone serious about wellness.",
  //   rating: 5,
  // },
];

const ReviewCard = ({ review }) => (
  <div className="w-[300px] md:w-[350px] flex-shrink-0 mx-3 p-5 rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg">
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors">
          <img
            src={review.image}
            alt={review.name}
            className="w-full h-full object-cover select-none"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>
      </div>
      <div>
        <h4 className="text-white font-bold text-base leading-tight">
          {review.name}
        </h4>
        <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">{review.role}</p>
      </div>
    </div>
    <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
        <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < review.rating ? "text-emerald-500 fill-emerald-500" : "text-slate-800 fill-slate-800"}`} 
        />
        ))}
    </div>
    <p className="text-slate-300 text-sm leading-relaxed font-light">
      "{review.text}"
    </p>
  </div>
);

const ReviewMarquee = () => {
  return (
    <section className="py-16 overflow-hidden relative bg-[#020617]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-4 mb-10 text-center relative z-20">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Community <span className="text-emerald-400">Voices</span>
        </h2>
      </div>

      <div className="flex w-full overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: "-50%" }}
          transition={{
            duration: 50,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{ width: "fit-content" }}
        >
          {[...reviews, ...reviews, ...reviews, ...reviews].map((review, idx) => (
            <ReviewCard key={`${review.id}-${idx}`} review={review} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewMarquee;
