import React from 'react';
import { motion } from 'framer-motion';
import PublicPageLayout from '../components/PublicPageLayout';
import { Target, Users, Heart, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To simplify health management and empower individuals and families to take control of their wellness journey.',
    },
    {
      icon: Users,
      title: 'Our Team',
      description: 'A dedicated group of healthcare professionals and technology experts committed to improving lives.',
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'Privacy, security, and user-centric design are at the core of everything we build.',
    },
    {
      icon: Award,
      title: 'Our Vision',
      description: 'To become the most trusted health management platform used by millions worldwide.',
    },
  ];

  return (
    <PublicPageLayout
      title="About MediTrack"
      subtitle="Empowering healthier lives through innovative technology"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Our Story
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                MediTrack was born from a simple observation: managing medications and health records shouldn't be complicated. 
                We saw families struggling to keep track of multiple prescriptions, missing doses, and losing important health information.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Founded in 2024, we set out to create a solution that would make health management accessible, intuitive, and secure. 
                Today, MediTrack serves thousands of users, helping them stay on top of their health with confidence.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our platform combines cutting-edge technology with a deep understanding of healthcare needs, creating a seamless 
                experience that puts you in control of your health journey.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                <value.icon className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {value.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default About;
