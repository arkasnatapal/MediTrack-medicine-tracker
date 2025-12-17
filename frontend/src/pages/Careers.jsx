import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';

const Careers = () => {
  const openings = [
    {
      title: 'Senior Full Stack Developer',
      location: 'Remote',
      type: 'Full-time',
      description: 'Join our engineering team to build scalable healthcare solutions.',
    },
    {
      title: 'Product Designer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      description: 'Design beautiful and intuitive user experiences for our health platform.',
    },
    {
      title: 'Healthcare Data Analyst',
      location: 'Remote',
      type: 'Full-time',
      description: 'Analyze health data to improve our AI-powered features and insights.',
    },
  ];

  const benefits = [
    'Competitive salary and equity',
    'Health, dental, and vision insurance',
    'Flexible work hours and remote options',
    'Professional development budget',
    'Unlimited PTO',
    'Latest tech equipment',
  ];

  return (
    <PublicPageLayout
      title="Join Our Team"
      subtitle="Help us build the future of health management"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Join Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Why Work at MediTrack?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              We're on a mission to make healthcare management accessible to everyone. Join a team of passionate 
              individuals who are making a real difference in people's lives every day.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Open Positions */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Open Positions
          </h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      {job.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg group-hover:shadow-emerald-500/50 transition-all whitespace-nowrap"
                  >
                    Apply Now
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-800/50"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Don't see a perfect fit?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We're always looking for talented people. Send us your resume!
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/50 transition-all"
          >
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default Careers;
