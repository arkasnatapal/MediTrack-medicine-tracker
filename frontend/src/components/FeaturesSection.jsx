import React from 'react';
import { ScanLine, Bell, Calendar, BarChart3, Shield, Smartphone } from 'lucide-react';

const features = [
  {
    name: 'Smart OCR Scanning',
    description: 'Instantly add medicines by scanning their labels. Our AI extracts name and expiry date automatically.',
    icon: ScanLine,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Expiry Reminders',
    description: 'Get timely notifications before your medicines expire so you never use unsafe medication.',
    icon: Calendar,
    color: 'bg-red-100 text-red-600',
  },
  {
    name: 'Daily Dosage Alerts',
    description: 'Set up daily reminders to take your medication on time, every time.',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    name: 'Inventory Analytics',
    description: 'Visualize your medicine stock with intuitive charts and track consumption patterns.',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Secure Cloud Storage',
    description: 'Your health data is encrypted and safely stored in the cloud, accessible from anywhere.',
    icon: Shield,
    color: 'bg-green-100 text-green-600',
  },
  {
    name: 'Mobile Friendly',
    description: 'Responsive design that works perfectly on your phone, tablet, or desktop computer.',
    icon: Smartphone,
    color: 'bg-indigo-100 text-indigo-600',
  },
];

const FeaturesSection = () => {
  return (
    <div className="py-24 bg-gray-50" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage your health
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            MediTrack provides a comprehensive suite of tools to help you organize your medicine cabinet and stay on top of your health regimen.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${feature.color}`}>
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-base text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
