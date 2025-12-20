import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const OrganizeWithAIButton = ({ onOrganize, loading = false }) => {
  return (
    <motion.button
      onClick={onOrganize}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20  rounded-2xl hover:bg-white/20 transition-all font-bold text-sm"
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
    >
      {/* Shimmer effect */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" /> */}
      
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-black dark:text-white" />
          <span className='text-black dark:text-white'>Organizing...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5 text-black dark:text-white " />
          <span className='text-black dark:text-white'>Organize with AI</span>
        </>
      )}
    </motion.button>
  );
};

export default OrganizeWithAIButton;
