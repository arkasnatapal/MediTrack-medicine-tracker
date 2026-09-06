import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Lock, Building2, Sparkles, AlertCircle, RefreshCw, CheckCircle2, FileText, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import AbhaCard from '../components/abdm/AbhaCard';
import AbdmConsentManager from '../components/abdm/AbdmConsentManager';
import AbdmOpdScanModal from '../components/abdm/AbdmOpdScanModal';
import { abdmService } from '../services/abdmService';

const AbdmHubPage = () => {
  const [profile, setProfile] = useState(null);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpdModalOpen, setIsOpdModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, consentRes] = await Promise.all([
        abdmService.getAbhaProfile(),
        abdmService.getConsentRequests()
      ]);
      if (profRes && profRes.profile) setProfile(profRes.profile);
      if (consentRes && consentRes.consents) setConsents(consentRes.consents);
    } catch (err) {
      console.error('Error loading ABDM Hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateAbha = async (formData) => {
    const res = await abdmService.generateAbhaCard(formData);
    if (res && res.abha) {
      setProfile(prev => ({
        ...prev,
        ...res.abha
      }));
    }
  };

  const handleRespondConsent = async (consentId, action) => {
    const res = await abdmService.respondConsentRequest(consentId, action);
    if (res && res.success) {
      setConsents(prev => prev.map(c => {
        if (c._id === consentId) {
          return { ...c, status: action === 'GRANT' ? 'GRANTED' : 'DENIED', respondedAt: new Date().toISOString() };
        }
        return c;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Hero Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 via-white/10 to-green-500/20 text-slate-200 text-xs font-semibold border border-slate-700/80 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              National Health Authority (NHA) Ecosystem
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ABDM Digital Health <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-green-400">Hub</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Manage your official ABHA Health Card, generate instant Scan & Share OPD tokens for government hospitals, and control health record access.
            </p>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpdModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-xl flex items-center gap-2.5 shrink-0"
          >
            <QrCode className="w-5 h-5 text-slate-950" />
            Scan & Share OPD Token
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* ABHA Card Section */}
            <AbhaCard 
              profile={profile} 
              onAbhaGenerated={handleGenerateAbha} 
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  01
                </div>
                <h4 className="font-bold text-white text-base">ABHA Health Identity</h4>
                <p className="text-xs text-slate-400">
                  Unique 14-digit national identifier linking all your prescriptions, lab tests, and hospital visits seamlessly.
                </p>
              </div>

              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  02
                </div>
                <h4 className="font-bold text-white text-base">Scan & Share OPD Queue</h4>
                <p className="text-xs text-slate-400">
                  Scan hospital QR code or generate a digital token to skip physical registration lines at public health facilities.
                </p>
              </div>

              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  03
                </div>
                <h4 className="font-bold text-white text-base">ABDM Consent Manager</h4>
                <p className="text-xs text-slate-400">
                  Granular control over who accesses your medical records. Grant or revoke hospital data requests anytime.
                </p>
              </div>
            </div>

            {/* Consent Manager Section */}
            <AbdmConsentManager 
              consents={consents} 
              onRespondConsent={handleRespondConsent}
            />
          </div>
        )}

        {/* OPD Scan Token Modal */}
        {isOpdModalOpen && (
          <AbdmOpdScanModal 
            abdmService={abdmService}
            userAbhaNumber={profile?.abhaNumber}
            onClose={() => setIsOpdModalOpen(false)}
          />
        )}

      </div>
    </div>
  );
};

export default AbdmHubPage;


