import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Stethoscope, ShieldCheck, Activity, Network, ArrowRight, HeartPulse, UserCheck, PhoneCall, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Dynamic ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-teal-400 bg-clip-text text-transparent">
                MediTrack Care Network
              </span>
              <span className="block text-xs text-teal-400 font-semibold tracking-wider uppercase">Provider Ecosystem 2.0</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              System Admin
            </Link>
            <Link
              to="/patient-simulator"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 transition border border-teal-500/30 flex items-center gap-1.5"
            >
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
              Patient Simulator
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-6">
          <Network className="w-3.5 h-3.5" />
          <span>Connected Digital Public Healthcare Ecosystem</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          Unified Provider Ecosystem for <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Seamless Healthcare Coordination</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Connecting PHCs, CHCs, District Hospitals, Diagnostic Laboratories, and Clinicians to deliver unbroken continuity of care.
        </p>

        {/* Primary Pathway Choices */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16 text-left">
          {/* Facility Gateway */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 hover:border-teal-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition">
              <Building2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Healthcare Facility Portal</h3>
            <p className="text-slate-400 text-sm mb-6">
              For PHCs, CHCs, Rural Hospitals, District Hospitals, and Diagnostic Centers. Manage queue tokens, bed capacities, referrals, transfers & inventory.
            </p>

            <div className="flex items-center space-x-3">
              <Link
                to="/facility/auth?mode=login"
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm text-center transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                Facility Login <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/facility/auth?mode=register"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Doctor Gateway */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition">
              <Stethoscope className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Doctor Portal</h3>
            <p className="text-slate-400 text-sm mb-6">
              For individual Clinicians practicing across multiple hospitals or teleconsultation networks. Clinical queue management, prescriptions & referrals.
            </p>

            <div className="flex items-center space-x-3">
              <Link
                to="/doctor/auth?mode=login"
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm text-center transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                Doctor Login <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/doctor/auth?mode=register"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Network Core Capabilities */}
      <section className="border-t border-slate-800/60 bg-slate-900/30 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Enterprise Healthcare Network Infrastructure</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Designed to power end-to-end care workflows without broken handoffs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
              <Layers className="w-6 h-6 text-teal-400 mb-3" />
              <h4 className="text-base font-bold text-white mb-2">Many-to-Many Associations</h4>
              <p className="text-xs text-slate-400">Doctors associate dynamically with multiple facilities across departments with custom permissions.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
              <PhoneCall className="w-6 h-6 text-cyan-400 mb-3" />
              <h4 className="text-base font-bold text-white mb-2">Teleconsultation & 10 Post-Session Messages</h4>
              <p className="text-xs text-slate-400">Real-time teleconsultation with doctor disconnect rule allocating 10 post-session follow-up text/voice clip messages.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800">
              <UserCheck className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-base font-bold text-white mb-2">System Admin Verification</h4>
              <p className="text-xs text-slate-400">Multi-stage verification safeguarding provider integrity with security audit log tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-auto">
        MediTrack Care Network Provider Ecosystem v2.0 • Public Healthcare Integration System
      </footer>
    </div>
  );
}
