import React from 'react';
import { motion } from 'framer-motion';
import PublicPageLayout from '../components/PublicPageLayout';
import { Cookie, Shield, Settings, Info } from 'lucide-react';

const Cookies = () => {
  const cookieTypes = [
    {
      icon: Shield,
      title: 'Essential Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      examples: 'Authentication, security, session management',
    },
    {
      icon: Settings,
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization.',
      examples: 'Language preferences, theme settings, user preferences',
    },
    {
      icon: Info,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      examples: 'Page views, user behavior, performance metrics',
    },
  ];

  return (
    <PublicPageLayout
      title="Cookie Policy"
      subtitle="How we use cookies to improve your experience"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Cookie className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                What are cookies?
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Cookies are small text files that are placed on your device when you visit our website. They help us 
              provide you with a better experience by remembering your preferences and understanding how you use our service.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              This Cookie Policy explains what cookies are, how we use them, and how you can control them.
            </p>
          </div>
        </motion.div>

        {/* Cookie Types */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Types of Cookies We Use
          </h2>
          <div className="space-y-6">
            {cookieTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                    <type.icon className="text-emerald-600 dark:text-emerald-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {type.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                      {type.description}
                    </p>
                    <div className="text-sm text-slate-500 dark:text-slate-500">
                      <span className="font-semibold">Examples:</span> {type.examples}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Managing Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Managing Your Cookie Preferences
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              You can control and manage cookies in various ways. Please note that removing or blocking cookies can 
              impact your user experience and some features may no longer be fully functional.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2" />
                <p className="text-slate-600 dark:text-slate-400">
                  Most browsers allow you to refuse or accept cookies through their settings
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2" />
                <p className="text-slate-600 dark:text-slate-400">
                  You can delete cookies that have already been set on your device
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2" />
                <p className="text-slate-600 dark:text-slate-400">
                  You can set your browser to notify you when cookies are being sent
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-800/50"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Updates to This Policy
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an 
            updated revision date.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Last updated: November 2024
          </p>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default Cookies;
