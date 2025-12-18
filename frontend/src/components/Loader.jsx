import React from "react";
import { motion } from "framer-motion";

const Loader = ({ fullScreen = true, text = "Loading..." }) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.08, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const ringVariants = {
    animate: {
      scale: [1, 1.5],
      opacity: [0.5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut",
      },
    },
  };

  const LoaderContent = () => (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Expanding Ring (Heartbeat Echo) */}
        <motion.div
          variants={ringVariants}
          animate="animate"
          className="absolute inset-0 rounded-full border-2 border-teal-500/30"
        />
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full scale-75 animate-pulse" />

        {/* The Pill */}
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="relative z-10"
        >
          {/* Pill Body */}
          <div className="relative w-12 h-12">
             {/* We create a pill shape using a rotated capsule or just a stylized icon */}
             {/* Let's make a nice 3D-ish capsule using CSS gradients */}
             <div className="w-12 h-12 flex items-center justify-center">
                <div className="w-8 h-14 bg-gradient-to-b from-teal-400 to-emerald-600 rounded-full shadow-lg shadow-teal-500/40 flex flex-col overflow-hidden rotate-45 transform transition-transform">
                    {/* Top Half Highlight */}
                    <div className="h-1/2 w-full bg-white/10 backdrop-blur-sm border-b border-white/10" />
                    {/* Shine */}
                    <div className="absolute top-2 right-2 w-2 h-4 bg-white/40 rounded-full blur-[1px]" />
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2">
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-bold tracking-[0.2em] uppercase text-teal-800 dark:text-teal-200"
        >
          {text}
        </motion.p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-[#0B0F17]/95 backdrop-blur-sm transition-colors duration-500"
      >
        <LoaderContent />
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <LoaderContent />
    </div>
  );
};

export default Loader;
