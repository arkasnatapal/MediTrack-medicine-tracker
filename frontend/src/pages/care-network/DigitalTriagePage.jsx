import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, ShieldAlert, PhoneCall, AlertTriangle, CheckCircle2,
  ArrowRight, ArrowLeft, Activity, Building2, BookOpen, MessageSquare, Info, ShieldCheck,
  RefreshCw, HeartPulse, Thermometer, ShieldBan, Printer, FileText, ChevronDown, ChevronRight, HelpCircle, Sparkles
} from 'lucide-react';
import { triageService } from '../../services/triageService';
import MarkdownRenderer from '../../components/MarkdownRenderer';

const cleanRecommendation = (text) => {
  if (!text) return '';
  let cleaned = text.replace(/^\[Gemini[^\]]*\]\s*/i, '').trim();
  // Strip "**Paragraph 1: ...**" and convert to "### ..."
  cleaned = cleaned.replace(/\*\*Paragraph\s+\d+:\s*(.*?)\*\*/gi, '### $1');
  // Strip "Paragraph 1: ", "Paragraph 2: "
  cleaned = cleaned.replace(/Paragraph\s+\d+:\s*/gi, '');
  // Strip "### 1. ", "### 2. ", "1. ", "2. " prefixes on headings
  cleaned = cleaned.replace(/^###\s+\d+\.\s*/gm, '### ');
  return cleaned;
};

const getProviderLabel = (mode) => {
  if (!mode) return 'MediTrack Clinical AI';
  if (mode.includes('SAFETY_ENGINE') || mode.includes('Deterministic')) {
    return 'MediTrack Clinical Safety Engine';
  }
  return 'MediTrack Clinical AI Engine';
};

const commonSymptomsList = [
  'Chest pain / Chest tightness',
  'Difficulty breathing / Shortness of breath',
  'High Fever / Chills',
  'Severe Headache / Dizziness',
  'Severe Abdominal Pain',
  'Vomiting / Nausea',
  'Joint / Bone Pain',
  'Skin Rash / Allergic reaction',
  'Persistent Cough'
];

const DigitalTriagePage = () => {
  const navigate = useNavigate();
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  // Phase 1: Intake State
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('male');
  const [showVitals, setShowVitals] = useState(false);
  
  // Vitals State
  const [spo2, setSpo2] = useState('');
  const [tempF, setTempF] = useState('');
  const [pulse, setPulse] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');

  // Workflow Steps: 'INTAKE' -> 'QUESTIONNAIRE' -> 'RESULT'
  const [step, setStep] = useState('INTAKE');
  
  // Phase 2: Follow-up Questions State
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Loading & Result State
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const toggleSymptom = (s) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(item => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  // Step 1 -> Step 2: Fetch Tailored Follow-up Questions
  const handleStartAssessment = async (e) => {
    if (e) e.preventDefault();
    if (selectedSymptoms.length === 0 && !freeText.trim()) {
      alert('Please select at least one symptom or describe your symptoms in text.');
      return;
    }

    setLoading(true);

    const vitalsObj = (spo2 || tempF || pulse || bpSystolic) ? {
      spo2: spo2 ? parseInt(spo2) : null,
      temperature_f: tempF ? parseFloat(tempF) : null,
      pulse_bpm: pulse ? parseInt(pulse) : null,
      bp_systolic: bpSystolic ? parseInt(bpSystolic) : null
    } : null;

    try {
      // Preliminary evaluation call to extract tailored follow-up questions
      const initialEval = await triageService.evaluateSymptoms({
        symptoms: selectedSymptoms,
        freeTextDescription: freeText,
        message: freeText,
        age,
        gender,
        vitals: vitalsObj
      });

      if (initialEval && initialEval.followUpQuestions && initialEval.followUpQuestions.length > 0) {
        setQuestions(initialEval.followUpQuestions);
        setCurrentQIndex(0);
        setAnswers({});
        setStep('QUESTIONNAIRE');
      } else {
        // If no extra questions needed or emergency triggered, proceed directly to result
        setTriageResult(initialEval);
        setStep('RESULT');
      }
    } catch (err) {
      console.error('Triage assessment start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qId, option) => {
    setAnswers({
      ...answers,
      [qId]: option
    });
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      // Finished all questions -> Finalize Triage
      handleFinalizeTriage();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    } else {
      setStep('INTAKE');
    }
  };

  // Step 2 -> Step 3: Finalize Triage with All Combined Answers
  const handleFinalizeTriage = async () => {
    setLoading(true);

    // Combine freeText with answered questions for complete context
    const answerSummaries = Object.entries(answers).map(([qId, val]) => {
      const qObj = questions.find(q => q.id === qId);
      return qObj ? `${qObj.question}: ${val}` : `${qId}: ${val}`;
    }).join('; ');

    const combinedMessage = freeText
      ? `${freeText}. Clinical assessment details: ${answerSummaries}`
      : `Patient assessment details: ${answerSummaries}`;

    const vitalsObj = (spo2 || tempF || pulse || bpSystolic) ? {
      spo2: spo2 ? parseInt(spo2) : null,
      temperature_f: tempF ? parseFloat(tempF) : null,
      pulse_bpm: pulse ? parseInt(pulse) : null,
      bp_systolic: bpSystolic ? parseInt(bpSystolic) : null
    } : null;

    try {
      const result = await triageService.evaluateSymptoms({
        symptoms: selectedSymptoms,
        freeTextDescription: combinedMessage,
        message: combinedMessage,
        age,
        gender,
        vitals: vitalsObj
      });
      setTriageResult(result);
      setStep('RESULT');
    } catch (err) {
      console.error('Finalize triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('INTAKE');
    setSelectedSymptoms([]);
    setFreeText('');
    setSpo2('');
    setTempF('');
    setPulse('');
    setBpSystolic('');
    setTriageResult(null);
    setQuestions([]);
    setAnswers({});
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:py-0 print:px-0">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-black uppercase">
            <Stethoscope className="w-4 h-4" />
            <span>Interactive Guided Clinical Triage</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            MediTrack Clinical AI & Guided Assessment
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          DIGITAL TRIAGE & CARE NAVIGATION
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Answer step-by-step clinical questions to evaluate urgency levels, first aid protocols, and care pathways.
        </p>

        {/* PROGRESS STEPPER BAR */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-500 print:hidden">
          <div className={`flex items-center gap-1.5 ${step === 'INTAKE' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white dark:text-slate-900 flex items-center justify-center text-[10px]">1</span>
            <span>Symptom Selection</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${step === 'QUESTIONNAIRE' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white dark:text-slate-900 flex items-center justify-center text-[10px]">2</span>
            <span>Clinical Questionnaire</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${step === 'RESULT' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-current text-white dark:text-slate-900 flex items-center justify-center text-[10px]">3</span>
            <span>Triage & Care Report</span>
          </div>
        </div>
      </div>

      {/* CONSENT NOTICE BANNER */}
      {!consentAccepted ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold">MediTrack Clinical Triage Disclaimer</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                MediTrack's AI triage engine provides interactive clinical decision support, first-aid guidance, and facility navigation. It does not replace a doctor's in-person diagnosis. In life-threatening emergencies, call 108 immediately.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setConsentAccepted(true)}
              className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              <span>Begin Guided Triage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : step === 'INTAKE' ? (
        /* STEP 1: INITIAL SYMPTOM & VITALS INTAKE */
        <form onSubmit={handleStartAssessment} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              1. Select Your Primary Symptoms:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {commonSymptomsList.map(s => {
                const isChecked = selectedSymptoms.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`p-3.5 rounded-2xl text-xs font-bold text-left transition-all border flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <span>{s}</span>
                    <span className="text-xs font-black">{isChecked ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Patient Age:</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Unspecified</option>
              </select>
            </div>
          </div>

          {/* OPTIONAL PHYSIOLOGICAL VITALS SECTION */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowVitals(!showVitals)}
              className="flex items-center justify-between w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all"
            >
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Add Physiological Vitals (SpO2, Pulse, Temp, BP) — Optional</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showVitals ? 'rotate-180' : ''}`} />
            </button>

            {showVitals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">SpO2 % (Oxygen)</label>
                  <input
                    type="number"
                    placeholder="e.g. 96"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Body Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 98.6"
                    value={tempF}
                    onChange={(e) => setTempF(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Pulse (BPM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 75"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">BP Systolic (mmHg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              2. Describe Your Symptoms in Natural Language:
            </label>
            <textarea
              rows="3"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Describe your symptoms, onset time, pain characteristics..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Preparing Guided Questionnaire...</span>
              </>
            ) : (
              <>
                <span>Continue to Clinical Follow-Up Questionnaire</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      ) : step === 'QUESTIONNAIRE' ? (
        /* STEP 2: STEP-BY-STEP INTERACTIVE CLINICAL QUESTIONNAIRE */
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Clinical Question {currentQIndex + 1} of {questions.length}
              </h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
              Category: {questions[currentQIndex]?.category || 'Clinical Assessment'}
            </span>
          </div>

          {/* QUESTION BOX */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {questions[currentQIndex]?.question}
            </h3>

            {/* OPTIONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {questions[currentQIndex]?.options?.map((opt, idx) => {
                const isSelected = answers[questions[currentQIndex].id] === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAnswer(questions[currentQIndex].id, opt)}
                    className={`p-4 rounded-2xl text-xs sm:text-sm font-bold text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP NAVIGATION FOOTER */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevQuestion}
              className="py-3 px-5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={!answers[questions[currentQIndex]?.id] || loading}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Clinical Data...</span>
                </>
              ) : currentQIndex === questions.length - 1 ? (
                <>
                  <span>Complete Assessment & View Report</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 3: FINAL COMPREHENSIVE TRIAGE REPORT CARD */
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
          
          {/* PRINT & UTILITY BAR */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 print:hidden">
            <span className="text-xs font-bold text-slate-500">Triage Session ID: {triageResult?.session_id}</span>
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Clinical Triage Summary</span>
            </button>
          </div>

          {/* TOP URGENCY CARD WITH CLINICAL RISK SCORE */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            triageResult?.triageLevel === 'EMERGENCY'
              ? 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200'
              : triageResult?.triageLevel === 'URGENT'
              ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                triageResult?.triageLevel === 'EMERGENCY'
                  ? 'bg-rose-600 text-white'
                  : triageResult?.triageLevel === 'URGENT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                Triage Level: {triageResult?.triageLevel} ({triageResult?.urgencyLevel})
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {getProviderLabel(triageResult?.providerMode)}
              </span>
            </div>

            {/* CLINICAL RISK SCORE BAR */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-black">
                <span>Clinical Severity Risk Score Index:</span>
                <span>{triageResult?.riskScore || 20} / 100</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (triageResult?.riskScore || 20) >= 70
                      ? 'bg-rose-500'
                      : (triageResult?.riskScore || 20) >= 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${triageResult?.riskScore || 20}%` }}
                />
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-slate-800 dark:text-slate-100">
              <MarkdownRenderer content={cleanRecommendation(triageResult?.recommendation)} />
            </div>


            {triageResult?.redFlags && triageResult.redFlags.length > 0 && (
              <div className="pt-2 border-t border-current/10 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Triggered Emergency Warning Indicators:</p>
                <ul className="list-disc list-inside text-xs space-y-1 font-semibold">
                  {triageResult.redFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* INSTANT FIRST AID PROTOCOL STEPS */}
          {triageResult?.firstAidSteps && triageResult.firstAidSteps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Instant Emergency First Aid & Action Protocol</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {triageResult.firstAidSteps.map((fa) => (
                  <div key={fa.step} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                        {fa.step}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{fa.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium pl-8">
                      {fa.instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WHAT NOT TO DO (CONTRAINDICATIONS) */}
          {triageResult?.contraindications && triageResult.contraindications.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2 uppercase">
                <ShieldBan className="w-4 h-4 text-rose-600" />
                <span>Critical Safety Precautions ("What NOT to do")</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-rose-800 dark:text-rose-200 space-y-1 font-medium">
                {triageResult.contraindications.map((ci, idx) => (
                  <li key={idx}>{ci}</li>
                ))}
              </ul>
            </div>
          )}

          {/* RECOMMENDED ACTIONS */}
          <div className="space-y-3 print:hidden">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Recommended Care Pathway Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {triageResult?.escalateToEmergency && (
                <a
                  href="tel:108"
                  className="py-4 px-5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 col-span-1 sm:col-span-2"
                >
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                  <span>CALL 108 EMERGENCY AMBULANCE</span>
                </a>
              )}

              <button
                onClick={() => navigate(`/care-network/find-care?facilityType=${triageResult?.recommendedFacilityType}`)}
                className="py-3.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>FIND NEARBY {triageResult?.recommendedFacilityType} FACILITIES</span>
              </button>

              <button
                onClick={() => navigate('/care-network/appointments')}
                className="py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>BOOK OPD APPOINTMENT</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 print:hidden"
          >
            ← Start New Guided Triage Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalTriagePage;
