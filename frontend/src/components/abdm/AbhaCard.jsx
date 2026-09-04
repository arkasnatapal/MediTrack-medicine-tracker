import React, { useState } from 'react';
import { ShieldCheck, QrCode, Copy, Check, Download, Sparkles, Smartphone, UserCheck, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AbhaCard = ({ profile, onAbhaGenerated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    aadhaarNumber: '',
    mobileNumber: profile?.phoneNumber || '',
    preferredAbhaAddress: ''
  });

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAbhaGenerated(form);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isLinked = profile?.abhaStatus === 'VERIFIED' && profile?.abhaNumber;

  return (
    <div className="w-full">
      {/* Unlinked Banner or ABHA Card Display */}
      {!isLinked ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 shadow-2xl border border-blue-500/30"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide border border-blue-400/30">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                ABDM National Health Mission
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Create Your Official <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-green-400">ABHA Health Card</span>
              </h2>
              
              <p className="text-slate-300 text-sm leading-relaxed">
                Connect MediTrack with Ayushman Bharat Digital Mission (ABDM). Get your 14-digit national health ID for instant hospital OPD registration, digitized prescriptions, and secure health data consent management.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start text-xs text-slate-300">
                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Aadhaar Verified
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <QrCode className="w-3.5 h-3.5 text-blue-400" /> Instant OPD QR Token
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> ABDM Privacy Encryption
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center gap-3 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              Create / Link ABHA Card
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* Authentic ABHA Digital Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-xl mx-auto rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl border border-slate-700/60"
        >
          {/* Header Banner matching NHA National Colors */}
          <div className="relative bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 via-white to-green-600 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-black text-amber-400">
                  NHA
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Government of India</div>
                <div className="text-sm font-bold text-white tracking-wide">Ayushman Bharat Digital Mission</div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED ABHA
            </span>
          </div>

          {/* Body Section */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left/Middle Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Health Card Holder</div>
                <div className="text-xl font-extrabold text-white">{profile.name}</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>ABHA Number</span>
                  <button 
                    onClick={() => handleCopy(profile.abhaNumber)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] font-normal"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-lg md:text-xl font-mono font-bold text-amber-300 tracking-wider">
                  {profile.abhaNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">ABHA Address</div>
                  <div className="font-mono text-slate-200 font-medium truncate">{profile.abhaAddress}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Blood Group</div>
                  <div className="font-semibold text-emerald-400">{profile.bloodGroup || 'O+'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Gender</div>
                  <div className="font-medium text-slate-200 capitalize">{profile.gender || 'Male'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Date of Birth</div>
                  <div className="font-medium text-slate-200">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '15/06/1995'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right QR Code Section */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner text-slate-900 border border-slate-300 text-center">
              <img 
                src={profile.abhaQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(profile.abhaNumber)}`} 
                alt="ABHA QR Code" 
                className="w-32 h-32 object-contain"
              />
              <div className="mt-2 text-[10px] font-bold text-slate-700 tracking-wide uppercase">Scan for Instant OPD Token</div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Linked with MediTrack Account
            </span>
            <button 
              onClick={() => window.print()}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Print / Save Card
            </button>
          </div>
        </motion.div>
      )}

      {/* ABHA Registration / Linking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Create / Link ABHA Card</h3>
                    <p className="text-xs text-slate-400">National Health Authority (NHA) Sandbox API</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGenerateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Aadhaar Number (12 Digits)</label>
                  <input 
                    type="text" 
                    maxLength={12}
                    placeholder="e.g. 9876 5432 1098"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobile Number (Aadhaar Linked)</label>
                  <input 
                    type="text" 
                    placeholder="+91 98765 43210"
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Preferred ABHA Address (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. username@abdm"
                    value={form.preferredAbhaAddress}
                    onChange={(e) => setForm({ ...form, preferredAbhaAddress: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-800/40 text-slate-300 text-[11px] space-y-1">
                  <div className="font-semibold text-blue-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> Automated Verification
                  </div>
                  <p>In accordance with ABDM NHA guidelines, an automated OTP verification token will be generated to issue your 14-digit ABHA Number and digital QR token.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Creating Card...' : 'Issue ABHA Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AbhaCard;
