import React from "react";
import { motion } from "framer-motion";

const Loader = ({ fullScreen = true, text = "Loading..." }) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const rippleVariants = {
    animate: {
      scale: [1, 2],
      opacity: [0.5, 0],
      borderWidth: ["2px", "0px"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
      },
    },
  };

  const crossVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const rotateVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const LoaderContent = () => (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />

        {/* Outer Rotating Ring */}
        <motion.div
          variants={rotateVariants}
          animate="animate"
          className="absolute inset-0 rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-400/30"
        />

        {/* Counter-Rotating Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-dotted border-teal-500/30 dark:border-teal-400/30"
        />

        {/* Ripples */}
        <motion.div
          variants={rippleVariants}
          animate="animate"
          className="absolute inset-0 rounded-full border-emerald-500 dark:border-emerald-400"
        />
        <motion.div
          variants={rippleVariants}
          animate="animate"
          transition={{ delay: 1, duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-emerald-500 dark:border-emerald-400"
        />

        {/* Central Medical Cross */}
        <motion.div
          variants={crossVariants}
          animate="animate"
          className="relative z-10 flex items-center justify-center"
        >
          <div className="relative w-12 h-12">
            {/* Vertical Bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-12 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full shadow-lg shadow-emerald-500/30" />
            {/* Horizontal Bar */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-12 h-3 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full shadow-lg shadow-emerald-500/30" />
            
            {/* Center Shine */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/20 blur-sm rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg font-medium tracking-widest uppercase text-emerald-800 dark:text-emerald-200"
        >
          {text}
        </motion.p>
        
        {/* Loading Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
            />
          ))}
        </div>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#0B0F17]/90 backdrop-blur-md transition-colors duration-500"
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
