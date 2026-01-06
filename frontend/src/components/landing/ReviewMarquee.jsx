import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Alex Thompson",
    role: "Diabetes Warrior",
    image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=150&q=80",
    text: "MediTrack has completely transformed how I manage my glucose levels. The AI insights are incredible.",
    rating: 5,
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Caregiver",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    text: "As a caregiver for my elderly mother, this app gives me peace of mind I never had before.",
    rating: 5,
  },
  {
    id: 3,
    name: "Dr. James Wilson",
    role: "Cardiologist",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    text: "I recommend this to all my patients. The medication adherence tracking is top-notch.",
    rating: 5,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    role: "Busy Mom",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    text: "Managing health records for the whole family used to be a nightmare. Now it's a breeze.",
    rating: 5,
  },
  {
    id: 5,
    name: "Michael Chang",
    role: "Tech Enthusiast",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    text: "The UI is stunning and the AI features genuinely feel like the future of healthcare.",
    rating: 4,
  },
  {
    id: 6,
    name: "Jessica Parker",
    role: "Fitness Coach",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    text: "Love how it integrates daily health metrics. A must-have for anyone serious about wellness.",
    rating: 5,
  },
];

const ReviewCard = ({ review }) => (
  <div className="w-[350px] md:w-[450px] flex-shrink-0 mx-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300 group">
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors">
          <img
            src={review.image}
            alt={review.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      </div>
      <div>
        <h4 className="text-white font-semibold text-lg leading-tight">
          {review.name}
        </h4>
        <p className="text-sm text-emerald-400 font-medium">{review.role}</p>
      </div>
    </div>
    <p className="mt-4 text-slate-300 leading-relaxed italic">
      "{review.text}"
    </p>
  </div>
);

const ReviewMarquee = () => {
  return (
    <section className="py-20 overflow-hidden relative bg-black/50">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black via-black/80 to-transparent z-10" />

      <div className="container mx-auto px-4 mb-16 text-center relative z-20">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Thousands</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Join the community of proactive health enthusiasts who are transforming their lives with MediTrack.
        </p>
      </div>

      <div className="flex flex-col gap-8 relative z-0">
        {/* Row 1: Left to Right (Actually moves left, so standard) */}
        <div className="flex w-full overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: "-50%" }}
            transition={{
              duration: 80,
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {[...reviews, ...reviews, ...reviews].map((review, idx) => (
              <ReviewCard key={`${review.id}-row1-${idx}`} review={review} />
            ))}
          </motion.div>
        </div>

        {/* Row 2: Right to Left (Moves right) */}
        <div className="flex w-full overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: "0%" }}
            initial={{ x: "-50%" }}
            transition={{
              duration: 80,
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {[...reviews, ...reviews, ...reviews].map((review, idx) => (
              <ReviewCard key={`${review.id}-row2-${idx}`} review={review} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ReviewMarquee;
