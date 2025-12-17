import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicPageLayout from '../components/PublicPageLayout';
import { ChevronDown } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does MediTrack work?',
      answer: 'MediTrack helps you manage your medications by tracking dosages, setting reminders, and monitoring expiry dates. Simply add your medications, set up reminders, and let our smart system keep you on track.',
    },
    {
      question: 'Is my health data secure?',
      answer: 'Absolutely. We use industry-standard encryption to protect your data. Your health information is stored securely and is never shared with third parties without your explicit consent.',
    },
    {
      question: 'Can I manage medications for my family?',
      answer: 'Yes! With our Family Care feature, you can manage medications and health records for multiple family members from a single account.',
    },
    {
      question: 'How do reminders work?',
      answer: 'Our smart reminder system sends you notifications at the times you specify. You can customize reminder frequency, timing, and even snooze options to fit your schedule.',
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Yes, MediTrack is fully responsive and works seamlessly on all devices including smartphones, tablets, and desktops.',
    },
    {
      question: 'What is the AI Health Assistant?',
      answer: 'Our AI Health Assistant is a chatbot that can answer your health-related questions, provide medication information, and offer general health guidance. It\'s available 24/7 to help you.',
    },
    {
      question: 'Can I export my health records?',
      answer: 'Yes, Pro users can export their health records and medication history in various formats for sharing with healthcare providers.',
    },
    {
      question: 'How much does MediTrack cost?',
      answer: 'We offer a free plan with basic features, and a Pro plan at $9.99/month with advanced features. Enterprise plans are also available for organizations.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.',
    },
    {
      question: 'Do you offer customer support?',
      answer: 'Yes! Free users get email support, while Pro users receive priority support. Enterprise customers get dedicated support channels.',
    },
  ];

  return (
    <PublicPageLayout
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions about MediTrack"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-bold text-slate-900 dark:text-white pr-8">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-800/50"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Still have questions?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Our team is here to help. Get in touch with us anytime.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default FAQ;
