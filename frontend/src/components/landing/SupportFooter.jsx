import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Play, 
  Apple, 
  ArrowUpRight, 
  Sparkles 
} from "lucide-react";

const SupportFooter = () => {
  const socialLinks = [
    { name: "Instagram", icon: <Instagram size={14} />, href: "#" },
    { name: "X", icon: <Twitter size={14} />, href: "#" },
    { name: "Youtube", icon: <Youtube size={14} />, href: "#" },
    { name: "Playstore", icon: <Play size={14} />, href: "#" },
    { name: "App Store", icon: <Apple size={14} />, href: "#" },
  ];

  const legalLinks = [
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
    { name: "Cookies", href: "/cookies" },
  ];

  const footerLinks = [
    { name: "Home", href: "#hero" },
    { name: "Testimonial", href: "#testimonials" },
    { name: "Features", href: "#features" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden pt-32 pb-12 bg-white">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 bg-white">
        <img 
          src="/hills-bg.png" 
          alt="Landscape Background" 
          className="w-full h-full object-cover object-bottom"
        />
        {/* Heavy white gradient at the top for headline readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white/30" />
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-7xl h-full flex flex-col">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8"
            >
              Connected for better care
            </motion.div>

            {/* Headline */}
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-medium tracking-tight text-slate-400 leading-[1] mb-4"
            >
              When <span className="text-emerald-500 font-bold">support</span> becomes accessible <span className="text-slate-900 font-bold">anytime</span>. 
              <br className="hidden md:block" />
              People feel seen, heard, and empowered to heal at their own pace
            </motion.h2>
          </div>

          {/* Decorative Star */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="hidden lg:block text-emerald-200/60 mt-10 mr-10"
          >
            <Sparkles size={160} strokeWidth={0.5} />
          </motion.div>
        </div>

        {/* Middle Content Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mt-auto mb-20 gap-12">
          {/* Socials & Legals */}
          <div className="space-y-12">
            <div className="space-y-6">
              {/* <h4 className="text-lg font-bold text-slate-900">Social Media</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a 
                    key={social.name}
                    href={social.href}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md"
                  >
                    {social.icon}
                    <span>{social.name}</span>
                  </a>
                ))}
              </div> */}
            </div>

            {/* Legal Links */}
            <div className="flex gap-6 pt-4">
              {legalLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-sm font-bold text-black hover:underline transition-colors decoration-slate-200 underline-offset-4"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-right space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Have a question or need help?</h3>
              <p className="text-2xl md:text-3xl font-medium text-slate-600">Yep, We are here to help!</p>
            </div>
            
            <Link 
              to="/contact"
              className="inline-flex items-center gap-4 px-8 py-5 bg-slate-900 text-white rounded-full text-lg font-bold hover:bg-emerald-600 transition-all group shadow-xl"
            >
              Get in touch
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                <ArrowUpRight size={20} />
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="pt-12 border-t border-slate-900/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm font-bold text-white">
            @2025 MediTrack all rights reserved.
          </p>

          {/* <div className="hidden md:flex flex-wrap justify-center gap-3">
            {footerLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-6 py-2.5 bg-white rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all group"
              >
                {link.name}
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <ArrowUpRight size={12} />
                </div>
              </a>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default SupportFooter;
