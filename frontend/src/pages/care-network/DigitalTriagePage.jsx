import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ShieldAlert, PhoneCall, AlertTriangle, CheckCircle2, ArrowRight, Activity, Building2 } from 'lucide-react';
import { triageService } from '../../services/triageService';

const commonSymptomsList = [
  'Chest pain / Chest tightness',
  'Difficulty breathing / Shortness of breath',
  'High Fever',
  'Severe Headache / Dizziness',
  'Severe Abdominal Pain',
  'Vomiting / Nausea',
  'Joint / Bone Pain',
  'Skin Rash / Allergic reaction',
  'Persistent Cough'
];

const DigitalTriagePage = () => {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const toggleSymptom = (s) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(item => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await triageService.evaluateSymptoms({
        symptoms: selectedSymptoms,
        freeTextDescription: freeText,
        age,
        gender
      });
      setTriageResult(result);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-black uppercase">
            <Stethoscope className="w-4 h-4" />
            <span>Digital Triage Engine • Clinical Pathway Routing</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {triageResult?.providerMode || 'Demo / Standard Triage Mode'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
          DIGITAL TRIAGE & URGENCY ASSESSMENT
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Understand symptom urgency and receive immediate recommendations to suitable PHCs, CHCs, or District emergency hospitals.
        </p>
      </div>

      {!triageResult ? (
        /* SYMPTOM INTAKE FORM */
        <form onSubmit={handleEvaluate} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              Select Current Symptoms:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {commonSymptomsList.map(s => {
                const isChecked = selectedSymptoms.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`p-3 rounded-2xl text-xs font-bold text-left transition-all border ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '} {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              Describe how you feel (Optional):
            </label>
            <textarea
              rows="3"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Describe your pain level, duration, or any pre-existing health condition..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
            <span>{loading ? 'Evaluating Symptoms...' : 'Evaluate Symptom Urgency'}</span>
          </button>
        </form>
      ) : (
        /* TRIAGE EVALUATION RESULT */
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
          <div className={`p-6 rounded-2xl border space-y-3 ${
            triageResult.triageLevel === 'EMERGENCY'
              ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-white/80 dark:bg-black/40">
                Urgency: {triageResult.urgencyLevel}
              </span>
              <span className="text-xs font-bold opacity-80">{triageResult.providerMode}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black">{triageResult.headline}</h2>
            <p className="text-sm font-medium leading-relaxed">{triageResult.recommendation}</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Recommended Actions</h3>

            <div className="flex flex-col sm:flex-row gap-3">
              {triageResult.escalateToEmergency && (
                <a
                  href="tel:108"
                  className="flex-1 py-3.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CALL 108 EMERGENCY</span>
                </a>
              )}

              <button
                onClick={() => navigate('/care-network/find-care')}
                className="flex-1 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>FIND SUITABLE CARE FACILITY</span>
              </button>

              <button
                onClick={() => navigate('/care-network/appointments')}
                className="flex-1 py-3.5 px-5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <span>BOOK APPOINTMENT</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300">⚠️ Disclaimer & Medical Safety Note</p>
            <p>{triageResult.disclaimer}</p>
          </div>

          <button
            onClick={() => setTriageResult(null)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            ← Re-evaluate with different symptoms
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalTriagePage;
