import React from 'react';
import { motion } from 'framer-motion';
import PublicPageLayout from '../components/PublicPageLayout';
import { FileText, AlertCircle, Shield, Users, Ban, Scale } from 'lucide-react';

const TermsAndConditions = () => {
  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using MediTrack, you accept and agree to be bound by these Terms of Service',
        'If you do not agree to these terms, please do not use our services',
        'We reserve the right to modify these terms at any time with notice to users',
        'Continued use after changes constitutes acceptance of modified terms',
      ],
    },
    {
      icon: Users,
      title: 'User Accounts',
      content: [
        'You must be at least 18 years old to create an account',
        'You are responsible for maintaining the confidentiality of your account credentials',
        'You agree to provide accurate and complete information',
        'One person or entity may not maintain more than one account',
        'You are responsible for all activities that occur under your account',
      ],
    },
    {
      icon: Shield,
      title: 'Acceptable Use',
      content: [
        'Use MediTrack only for lawful purposes and in accordance with these Terms',
        'Do not use the service to harm, threaten, or harass others',
        'Do not attempt to gain unauthorized access to our systems',
        'Do not upload malicious code or interfere with service operation',
        'Do not misrepresent your identity or affiliation',
      ],
    },
    {
      icon: AlertCircle,
      title: 'Medical Disclaimer',
      content: [
        'MediTrack is a medication management tool, not a substitute for professional medical advice',
        'Always consult with qualified healthcare professionals for medical decisions',
        'We do not provide medical advice, diagnosis, or treatment',
        'Information provided is for informational purposes only',
        'In case of medical emergency, contact emergency services immediately',
      ],
    },
    {
      icon: Ban,
      title: 'Prohibited Activities',
      content: [
        'Violating any applicable laws or regulations',
        'Infringing on intellectual property rights',
        'Transmitting spam, chain letters, or unsolicited communications',
        'Collecting user information without consent',
        'Engaging in any fraudulent or deceptive practices',
      ],
    },
    {
      icon: Scale,
      title: 'Limitation of Liability',
      content: [
        'MediTrack is provided "as is" without warranties of any kind',
        'We are not liable for any indirect, incidental, or consequential damages',
        'Our liability is limited to the amount you paid for the service',
        'We do not guarantee uninterrupted or error-free service',
        'You use the service at your own risk',
      ],
    },
  ];

  return (
    <PublicPageLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using MediTrack"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Welcome to MediTrack. These Terms of Service ("Terms") govern your access to and use of our 
              medication management platform and services.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Please read these Terms carefully. By using MediTrack, you agree to be bound by these Terms. 
              If you don't agree to these Terms, do not use our services.
            </p>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <section.icon className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-600 mt-2" />
                    <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Additional Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 space-y-6"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Termination
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms. 
              You may also terminate your account at any time through your account settings.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Governing Law
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes 
              arising from these Terms will be resolved through binding arbitration.
            </p>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-800/50"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Questions About These Terms?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            If you have any questions about these Terms of Service, please contact our legal team.
          </p>
          <a
            href="mailto:legal@meditrack.com"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            legal@meditrack.com
          </a>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default TermsAndConditions;
