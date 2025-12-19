import React from 'react';
import { motion } from 'framer-motion';
import PublicPageLayout from '../components/PublicPageLayout';
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Personal information you provide when creating an account (name, email, password)',
        'Health-related data including medication details, dosages, and schedules',
        'Usage data and analytics to improve our services',
        'Device information and IP addresses for security purposes',
      ],
    },
    {
      icon: Lock,
      title: 'How We Use Your Information',
      content: [
        'Provide and maintain our medication management services',
        'Send you important reminders and notifications',
        'Improve and personalize your experience',
        'Analyze usage patterns to enhance our platform',
        'Communicate with you about updates and support',
      ],
    },
    {
      icon: Shield,
      title: 'Data Security',
      content: [
        'Industry-standard encryption for data in transit and at rest',
        'Regular security audits and vulnerability assessments',
        'Strict access controls and authentication measures',
        'Secure backup and disaster recovery procedures',
        'Compliance with healthcare data protection regulations',
      ],
    },
    {
      icon: Eye,
      title: 'Data Sharing and Disclosure',
      content: [
        'We never sell your personal information to third parties',
        'Data may be shared with service providers under strict agreements',
        'Legal obligations may require disclosure to authorities',
        'Anonymous, aggregated data may be used for research',
      ],
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: [
        'Access and download your personal data at any time',
        'Request correction of inaccurate information',
        'Delete your account and associated data',
        'Opt-out of non-essential communications',
        'Export your health records in standard formats',
      ],
    },
  ];

  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="Your privacy and data security are our top priorities"
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
              At MediTrack, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our application and services.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              By using MediTrack, you agree to the collection and use of information in accordance with this policy. 
              We are committed to protecting your personal and health information with the highest standards of security.
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

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-800/50"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Mail className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Questions About Privacy?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, 
                please don't hesitate to contact us.
              </p>
              <a
                href="mailto:meditrack.ultimate.team@gmail.com"
                className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                 meditrack.ultimate.team@gmail.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default PrivacyPolicy;
