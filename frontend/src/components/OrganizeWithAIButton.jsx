import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const OrganizeWithAIButton = ({ onOrganize, loading = false }) => {
  return (
    <motion.button
      onClick={onOrganize}
      disabled={loading}
      className="group relative px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
      
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Organizing...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          <span>Organize with AI</span>
        </>
      )}
    </motion.button>
  );
};

export default OrganizeWithAIButton;
