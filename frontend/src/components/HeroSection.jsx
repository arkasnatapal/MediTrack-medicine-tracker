import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Bell, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="relative overflow-hidden bg-white pt-16 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
                Smart Medicine Management
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block xl:inline">Never miss a</span>{' '}
                <span className="block text-primary-600 xl:inline">dose or expiry</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                MediTrack helps you manage your medicine inventory, tracks expiry dates, and sends timely reminders. Stay healthy and organized with our smart platform.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/signup"
                    className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/features"
                    className="btn-secondary flex items-center justify-center text-base px-8 py-3 md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 border-t border-gray-100 pt-8 flex justify-center lg:justify-start gap-8"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Secure Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Smart Reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Expiry Alerts</span>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
          >
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                <img
                  className="w-full"
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
                  alt="Medicine management app"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
