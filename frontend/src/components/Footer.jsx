import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, Github, Twitter, Linkedin, Mail, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', path: '/features' },
      // { name: 'Pricing', path: '/pricing' },
      { name: 'FAQ', path: '/faq' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      // { name: 'Careers', path: '/careers' },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/arkasnatapal', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/the_jax_08', label: 'Twitter' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/arkasnata-pal-6a3682276/', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-[#0B0F17] border-t border-slate-200/50 dark:border-slate-800/50 pt-16 pb-8 transition-colors duration-300 overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-1"
          >
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-2xl shadow-lg group-hover:shadow-emerald-500/50 transition-all group-hover:scale-110">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                MediTrack
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Your smart companion for managing medicines, tracking expiry dates, and staying healthy.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:scale-110 shadow-sm hover:shadow-md"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wider uppercase mb-4 flex items-center gap-2">
                {category}
                <Sparkles className="h-3 w-3 text-emerald-500" />
              </h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.path}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-emerald-500 group-hover:w-4 transition-all duration-300" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left flex items-center gap-2">
              <span>&copy; {currentYear} MediTrack. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" /> in India
              </span>
            </p>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <a 
                href="mailto:support@meditrack.com"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
              >
               meditrack.ultimate.team@gmail.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
