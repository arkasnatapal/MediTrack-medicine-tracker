import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Pill, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const PublicPageLayout = ({ children, title, subtitle }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0B0F17] dark:to-slate-900 transition-colors duration-300">
      {/* Navbar */}
      

      {/* Hero Section */}
      {title && (
        <div className="relative overflow-hidden py-20 sm:py-32">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative">
        {children}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicPageLayout;
