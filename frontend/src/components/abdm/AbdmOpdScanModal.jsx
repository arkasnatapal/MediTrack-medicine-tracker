import React, { useState } from 'react';
import { QrCode, Building2, Clock, CheckCircle2, RefreshCw, AlertCircle, Ticket, Sparkles, ChevronRight, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AbdmOpdScanModal = ({ abdmService, userAbhaNumber, onClose }) => {
  const [selectedFacility, setSelectedFacility] = useState('FAC-IN-DL-AIIMS-01');
  const [selectedDept, setSelectedDept] = useState('General OPD & Medicine');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);

  const facilitiesList = [
    { id: 'FAC-IN-DL-AIIMS-01', name: 'All India Institute of Medical Sciences (AIIMS Delhi)', type: 'APEX / DISTRICT HOSPITAL' },
    { id: 'FAC-IN-WB-JAL-PHC-01', name: 'Primary Health Centre (PHC) Jalpaiguri', type: 'PRIMARY HEALTH CENTRE' },
    { id: 'FAC-IN-WB-RURAL-01', name: 'Community Health Centre (CHC) Mainaguri', type: 'COMMUNITY HEALTH CENTRE' },
    { id: 'FAC-IN-DL-PHC-02', name: 'Primary Health Centre (PHC) Najafgarh', type: 'PRIMARY HEALTH CENTRE' }
  ];

  const departmentsList = [
    'General OPD & Medicine',
    'Pediatrics & Child Health',
    'Orthopedics & Fracture Care',
    'Maternal & Gynaecology',
    'Dermatology & Skin Care',
    'ENT & Ophthalmology'
  ];

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await abdmService.generateOpdScanToken({
        facilityId: selectedFacility,
        department: selectedDept
      });
      if (res && res.token) {
        setGeneratedToken(res.token);
      }
    } catch (err) {
      console.error('Error generating token:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">ABHA Scan & Share OPD Token</h3>
              <p className="text-xs text-slate-400">Skip the Registration Queue at Government Hospitals</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {!userAbhaNumber ? (
          /* Warning if ABHA not linked */
          <div className="bg-amber-950/60 p-5 rounded-2xl border border-amber-800/60 space-y-3 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="font-bold text-amber-200 text-base">ABHA Card Required</h4>
            <p className="text-xs text-slate-300">
              Please issue or link your 14-digit ABHA Health Card first before generating instant OPD Scan & Share tokens.
            </p>
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all"
            >
              Back to ABHA Setup
            </button>
          </div>
        ) : !generatedToken ? (
          /* Form Selection */
          <form onSubmit={handleGenerateToken} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Select Public Healthcare Facility
              </label>
              <select 
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {facilitiesList.map(fac => (
                  <option key={fac.id} value={fac.id}>{fac.name} ({fac.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" /> Department / Clinic
              </label>
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1.5 text-slate-300 text-[11px]">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Instant OPD Registration
              </div>
              <p>
                Generates a digital queue token with your ABHA ID (<span className="font-mono text-amber-200">{userAbhaNumber}</span>). Show this token at Counter #1 for direct priority entry.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating Token...' : 'Generate OPD Token'}
              </button>
            </div>
          </form>
        ) : (
          /* Generated Digital Queue Token Display */
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4 text-center"
          >
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-bl-2xl uppercase tracking-widest">
                ACTIVE QUEUE TOKEN
              </div>

              <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                {generatedToken.facilityName}
              </div>
              <div className="text-sm font-bold text-slate-200 mb-4">
                {generatedToken.department}
              </div>

              <div className="inline-block bg-slate-800/90 px-6 py-3 rounded-2xl border border-slate-700 mb-4 shadow-inner">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Token Number</div>
                <div className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                  {generatedToken.tokenNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/90 p-3 rounded-2xl border border-slate-800 mb-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Assigned Counter</div>
                  <div className="font-bold text-emerald-400">{generatedToken.counterNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Est. Wait Time</div>
                  <div className="font-bold text-amber-300 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> ~{generatedToken.estimatedWaitMinutes} mins
                  </div>
                </div>
              </div>

              <div className="flex justify-center bg-white p-3 rounded-2xl w-36 h-36 mx-auto shadow-md">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(JSON.stringify(generatedToken))}`} 
                  alt="OPD Token QR" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-2">
                Present this QR code at hospital OPD reception
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
            >
              Done & Close
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AbdmOpdScanModal;
