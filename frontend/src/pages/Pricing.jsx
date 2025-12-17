import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PublicPageLayout from '../components/PublicPageLayout';
import { Check, Sparkles } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for individuals getting started',
      features: [
        'Up to 10 medications',
        'Basic reminders',
        'Single user account',
        'Mobile app access',
        'Email support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '9.99',
      description: 'Best for families and power users',
      features: [
        'Unlimited medications',
        'Smart AI reminders',
        'Up to 5 family members',
        'AI Health Assistant',
        'Priority support',
        'Advanced analytics',
        'Export health reports',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For healthcare organizations',
      features: [
        'Everything in Pro',
        'Unlimited family members',
        'Custom integrations',
        'Dedicated support',
        'HIPAA compliance',
        'Team management',
        'API access',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <PublicPageLayout
      title="Simple, Transparent Pricing"
      subtitle="Choose the plan that's right for you and your family"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border-2 ${
                plan.popular 
                  ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' 
                  : 'border-slate-200/50 dark:border-slate-700/50 shadow-lg'
              } transition-all`}>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  {plan.price === 'Custom' ? (
                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 ml-2">
                        /month
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full text-center py-3 px-6 rounded-2xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/50'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Have questions?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Check out our{' '}
            <Link to="/faq" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              FAQ page
            </Link>{' '}
            or{' '}
            <Link to="/contact" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              contact us
            </Link>
          </p>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
};

export default Pricing;
