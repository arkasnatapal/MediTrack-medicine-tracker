const IntelligenceSnapshot = require('../models/IntelligenceSnapshot');
const Report = require('../models/Report');
const Medicine = require('../models/Medicine');
const FoodItem = require('../models/FoodItem');
const MedicineLog = require('../models/MedicineLog');
const Reminder = require('../models/Reminder');
const DailyHealthReview = require('../models/DailyHealthReview');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require('crypto');

// Initialize Gemini
const genAI = process.env.GEMINI_API_CHAT_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash-lite";

// --- Helper: Generate Data Version Hash (Global Change Detection) ---
async function generateDataVersion(userId) {
  try {
    const [reportCount, reportLast] = await Promise.all([
      Report.countDocuments({ userId }),
      Report.findOne({ userId }).sort({ createdAt: -1 }).select('createdAt')
    ]);

    const [medCount, medLast] = await Promise.all([
      Medicine.countDocuments({ userId }),
      Medicine.findOne({ userId }).sort({ updatedAt: -1 }).select('updatedAt')
    ]);

    const [logCount, logLast] = await Promise.all([
      MedicineLog.countDocuments({ userId }),
      MedicineLog.findOne({ userId }).sort({ updatedAt: -1 }).select('updatedAt')
    ]);

    const [reviewCount, reviewLast] = await Promise.all([
        DailyHealthReview.countDocuments({ userId }),
        DailyHealthReview.findOne({ userId }).sort({ createdAt: -1 }).select('createdAt')
    ]);

    // Simple string to hash
    const dataString = `
      R:${reportCount}-${reportLast?.createdAt?.getTime() || 0}
      M:${medCount}-${medLast?.updatedAt?.getTime() || 0}
      L:${logCount}-${logLast?.updatedAt?.getTime() || 0}
      Rev:${reviewCount}-${reviewLast?.createdAt?.getTime() || 0}
    `;

    return crypto.createHash('md5').update(dataString).digest('hex');
  } catch (error) {
    console.error("Error generating data version:", error);
    return Date.now().toString();
  }
}

// --- Helper: Rule-Based Adherence Analysis (Free on Quota) ---
function analyzeAdherence(medicines, logs, reminders) {
  let score = 100;
  const issues = [];
  
  // 1. Check for Active Reminders
  const medsWithoutReminders = medicines.filter(m => !reminders.some(r => r.medicine.toString() === m._id.toString()));
  if (medsWithoutReminders.length > 0) {
    score -= (medsWithoutReminders.length * 5);
    issues.push(`${medsWithoutReminders.length} medicines have no active reminders.`);
  }

  // 2. Check Recent Logs (Last 50)
  if (logs.length > 0) {
    const missed = logs.filter(l => l.status === 'skipped').length;
    const late = logs.filter(l => l.status === 'taken_late').length;
    
    if (missed > 0) {
      score -= (missed * 10);
      issues.push(`Missed ${missed} doses recently.`);
    }
    if (late > 0) {
      score -= (late * 2);
      issues.push(`Taken ${late} doses late.`);
    }
  }

  // 3. Inventory Check
  const lowStock = medicines.filter(m => m.quantity < 5).length;
  if (lowStock > 0) {
    score -= 5;
    issues.push(`${lowStock} medicines are running low on stock.`);
  }

  return {
    score: Math.max(0, score),
    summary: issues.length === 0 ? "Excellent adherence and inventory management." : "Some attention needed for medication routines.",
    issues
  };
}

// --- Helper: Future Prediction Layer (AI - Only on Trigger) ---
async function calculateFuturePrediction(userId, domains, adherenceAnalysis, lastSnapshot) {
  if (!genAI) return null;

  const currentAdherenceScore = adherenceAnalysis.score;
  const lastAdherenceScore = lastSnapshot?.globalAdherence?.score || 0;
  // const adherenceChanged = Math.abs(currentAdherenceScore - lastAdherenceScore) > 5; // Logic handled in caller

  // Derive "Prediction Basis" strings for UI
  const predictionBasis = [];
  for (const [name, data] of domains) {
    predictionBasis.push(`${name} (${data.trend})`);
  }
  predictionBasis.push(`Adherence: ${currentAdherenceScore}% (${adherenceAnalysis.summary})`);
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });

  const domainContext = Array.from(domains.entries()).map(([k, v]) => `${k}: ${v.trend} (Score: ${v.healthScore}) - ${v.summary}`).join('\n');

  const prompt = `
    Generate a "Future Health Prediction" based on current stable insights.
    
    DOMAINS:
    ${domainContext}
    
    ADHERENCE:
    Score: ${currentAdherenceScore}/100
    Issues: ${adherenceAnalysis.issues.join(', ') || "None"}
    
    TASK:
    Predict health trajectory for the next 7-14 days.
    - If adherence is poor, risk increases.
    - If domains are stable types (e.g. skin) vs critical (cardio), weigh accordingly.
    - Cross-reference: Poor adherence + High Risk Domain = HIGH ALERT.
    
    OUTPUT JSON:
    {
      "title": "Short prediction headline",
      "severity": "high" | "medium" | "low" | "good",
      "timeframe": "Next 7-14 days",
      "description": "2-3 sentences explaining the likely future state.",
      "suggestions": ["Preventative action 1", "Preventative action 2"],
      "reasoning": ["Basis point 1", "Basis point 2"]
    }
  `;

  try {
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      data.predictionBasis = predictionBasis; 
      return data;
  } catch (e) {
      console.error("Future Prediction AI Failed:", e);
      return lastSnapshot?.predictedThreat || null; // Fallback
  }
}


// --- Helper: Analyze Single Domain (AI) ---
async function analyzeDomain(userId, domainName, newReports, previousContext) {
  if (!genAI) throw new Error("Gemini API key not configured");
  
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });

  const prompt = `
    You are a specialized medical AI analyzer for the domain: ${domainName}.
    
    TASK:
    Update the health intelligence for this domain based on NEW reports.
    
    PREVIOUS CONTEXT (If any):
    ${previousContext ? JSON.stringify(previousContext) : "No previous analysis."}

    NEW REPORTS TO ANALYZE:
    ${newReports.map(r => `- ${r.folderName} (${new Date(r.reportDate).toLocaleDateString()}): ${r.aiAnalysis?.summary || 'No pre-summary'}`).join('\n')}

    instructions:
    1. Integrate the new findings into the health view.
    2. Determine if the condition in this domain is improving, stable, or worsening.
    3. Generate a Health Score (0-100) specifically for ${domainName}.

    OUTPUT JSON:
    {
      "summary": "Concise clinical summary for ${domainName} (max 2 sentences).",
      "healthScore": number,
      "trend": "improving" | "stable" | "declining",
      "keyFindings": ["Point 1", "Point 2"]
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

// --- Main Generator Function ---
async function generateHealthIntelligence(userId, force = false) {
  // 1. Check Global Data Version
  const currentDataVersion = await generateDataVersion(userId);
  const lastSnapshot = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 });

  // If data hasn't changed at all and not strictly forced, return existing
  if (lastSnapshot && lastSnapshot.dataVersion === currentDataVersion && !force) {
    return { updated: false, snapshot: lastSnapshot, reason: "data_unchanged" };
  }

  // 2. Fetch All Data
  const [allReports, medicines, medicineLogs, reminders] = await Promise.all([
    Report.find({ userId }).sort({ reportDate: -1 }), // Fetch all to categorize
    Medicine.find({ userId }),
    MedicineLog.find({ userId }).sort({ scheduledTime: -1 }).limit(50),
    Reminder.find({ targetUser: userId, active: true })
  ]);

  // 3. Adherence Analysis (Rule-Based, Always Runs if Version Changed)
  const adherenceAnalysis = analyzeAdherence(medicines, medicineLogs, reminders);

  // 4. Domain Analysis Strategy
  const domains = lastSnapshot?.domains ? new Map(lastSnapshot.domains) : new Map();
  const reportDomains = [...new Set(allReports.map(r => r.domain || 'General'))]; // Get all unique domains
  let atLeastOneDomainUpdated = false;

  for (const domainName of reportDomains) {
    // A. Get Last Analyzed Time for this Domain
    const lastDomainState = domains.get(domainName);
    const lastAnalyzedAt = lastDomainState?.lastAnalyzedAt ? new Date(lastDomainState.lastAnalyzedAt) : new Date(0);

    // B. Find NEW Reports for this Domain (Created AFTER last analysis)
    // Note: We use 'createdAt' usually to check for *new uploads*.
    const domainReports = allReports.filter(r => (r.domain || 'General') === domainName);
    const newReports = domainReports.filter(r => new Date(r.createdAt) > lastAnalyzedAt);

    if (newReports.length > 0) {
      // TRIGGER AI: New Data Available
      try {
        console.log(`[AI] Analyzing Domain: ${domainName} with ${newReports.length} new reports.`);
        const aiResult = await analyzeDomain(userId, domainName, newReports, lastDomainState);
        
        // Update State
        domains.set(domainName, {
          summary: aiResult.summary,
          healthScore: aiResult.healthScore,
          trend: aiResult.trend,
          keyFindings: aiResult.keyFindings,
          lastAnalyzedAt: new Date(), // Set to NOW
          reportCount: domainReports.length
        });
        atLeastOneDomainUpdated = true;
      } catch (err) {
        console.error(`Error analyzing domain ${domainName}:`, err);
        // Keep previous state on error
      }
    } else {
      // NO New Data: Keep previous state exactly (No AI Cost)
      // If no state exists yet (e.g. migration), we might strictly need to run once.
      // logic: if (!lastDomainState) consider it "new" effectively? 
      // User said "DO NOT reprocess old reports". So if no state exists, we technically skip?
      // BUT: If the user *just* uploaded them, they are 'new' compared to Date(0).
      // So the logic `newReports.filter(createdAt > 0)` covers the first run too.
      // If we are migrating old users, they might have old reports but no domain state.
      // To satisfy "DO NOT reprocess old reports", we should NOT run if they are old.
      // But how do we get initial state? 
      // Let's assume "reprocess old reports" means "don't re-run unchanged stuff".
      // If a user has NO intelligence but has reports, they probably want intelligence.
      // I will allow logic to run if `!lastDomainState`.
      
      if (!lastDomainState && domainReports.length > 0) {
         // First run for this domain ever
         try {
            console.log(`[AI] Initializing Domain: ${domainName}`);
            const aiResult = await analyzeDomain(userId, domainName, domainReports.slice(0, 3), null); // Limit context
            domains.set(domainName, {
              ...aiResult,
              lastAnalyzedAt: new Date(),
              reportCount: domainReports.length
            });
            atLeastOneDomainUpdated = true;
         } catch(e) { console.error(e); }
      }
    }
  }

  // 5. Calculate Global Score (Weighted)
  let totalScore = 0;
  let domainCount = 0;
  for (const [key, val] of domains) {
    totalScore += val.healthScore;
    domainCount++;
  }
  const avgDomainScore = domainCount > 0 ? (totalScore / domainCount) : 80;

  // 5.4 Daily Health Review Analysis (Subjective Layer)
  // Logic: Check if there are NEW reviews since last processed date.
  let selfReportedTrend = lastSnapshot?.selfReportedTrend || null;
  
  try {
      const lastProcessedReviewDate = lastSnapshot?.selfReportedTrend?.lastProcessedReviewDate 
            ? new Date(lastSnapshot.selfReportedTrend.lastProcessedReviewDate) 
            : new Date(0);

      const recentReviews = await DailyHealthReview.find({ 
          userId, 
          reviewForDate: { $gt: lastProcessedReviewDate }
      }).sort({ reviewForDate: 1 });

      if (recentReviews.length > 0) {
          console.log(`[AI] Analyzing ${recentReviews.length} new daily reviews...`);
          
          const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
          
          // Contextualize with existing trend
          const prevTrend = selfReportedTrend?.trend || "unknown";

          const reviewText = recentReviews.map(r => 
              `Date: ${new Date(r.reviewForDate).toLocaleDateString()}, Mood: ${r.mood}, Note: ${r.reviewText || "N/A"}`
          ).join('\n');

          const prompt = `
            Analyze these new daily patient self-reports.
            Previous Trend: ${prevTrend}
            
            NEW REVIEWS:
            ${reviewText}
            
            TASK:
            1. Determine the subjective health trend based ONLY on these new insights.
            2. Summarize the patient's self-reported feeling.
            
            OUTPUT JSON:
            {
               "trend": "improving" | "stable" | "declining",
               "summary": "Short summary of patient feelings (max 1 sentence)."
            }
          `;

          const result = await model.generateContent(prompt);
          const aiRes = JSON.parse(result.response.text());

          selfReportedTrend = {
              trend: aiRes.trend,
              summary: aiRes.summary,
              lastProcessedReviewDate: recentReviews[recentReviews.length - 1].reviewForDate // Move pointer
          };
          
          atLeastOneDomainUpdated = true; // Trigger future prediction update
      }
  } catch (err) {
      console.error("Error analyzing daily reviews:", err);
  }

  // --- SCORE CALCULATION (Updated with Subjective Weight) ---
  // Weights: Domains (60%), Adherence (30%), Subjective (10%)
  // If no subjective data yet, fallback to 70/30.
  
  let globalScore;
  let subjectiveScore = 80; // Default Neutral

  if (selfReportedTrend) {
      switch (selfReportedTrend.trend) {
          case 'improving': subjectiveScore = 95; break;
          case 'stable': subjectiveScore = 85; break;
          case 'declining': subjectiveScore = 65; break;
          default: subjectiveScore = 80;
      }
      globalScore = Math.round((avgDomainScore * 0.6) + (adherenceAnalysis.score * 0.3) + (subjectiveScore * 0.1));
      console.log(`[Score] Domains: ${avgDomainScore} (60%), Adherence: ${adherenceAnalysis.score} (30%), Subjective: ${subjectiveScore} (10%) -> Total: ${globalScore}`);
  } else {
      globalScore = Math.round((avgDomainScore * 0.7) + (adherenceAnalysis.score * 0.3));
      console.log(`[Score] Domains: ${avgDomainScore} (70%), Adherence: ${adherenceAnalysis.score} (30%) -> Total: ${globalScore}`);
  }

  // 5.5 Future Prediction Layer (Managed)
  // Logic: Regenerate ONLY if (Domains Updated OR Adherence Changed OR No previous prediction)
  let futurePrediction = lastSnapshot?.predictedThreat;
  const adherenceChanged = !lastSnapshot || Math.abs(adherenceAnalysis.score - (lastSnapshot.globalAdherence?.score || 0)) > 5;
  
  if (atLeastOneDomainUpdated || adherenceChanged || !futurePrediction) {
      console.log("[AI] Regenerating Future Prediction...");
      futurePrediction = await calculateFuturePrediction(userId, domains, adherenceAnalysis, lastSnapshot);
  } else {
      console.log("[AI] Skipping Future Prediction (Stable)");
  }

  // 6. Create & Save Snapshot
  const newSnapshot = new IntelligenceSnapshot({
    userId,
    healthScore: globalScore,
    trend: 'stable', // Global trend, simplified for now
    summary: adherenceAnalysis.summary, // Global summary is adherence-focused + domain overview
    highlights: adherenceAnalysis.issues,
    medicationInsights: adherenceAnalysis.issues,
    domains: domains,
    domains: domains,
    selfReportedTrend: selfReportedTrend, // [NEW] Subjective Layer
    predictedThreat: futurePrediction, // [NEW] Separate Layer
    globalAdherence: {
      summary: adherenceAnalysis.summary,
      score: adherenceAnalysis.score,
      issues: adherenceAnalysis.issues,
      lastAnalyzedAt: new Date()
    },

    previousSnapshotId: lastSnapshot?._id,
    dataVersion: currentDataVersion,
    generatedAt: new Date()
  });

  await newSnapshot.save();
  return { updated: true, snapshot: newSnapshot };
}

// --- Controller Exports ---

exports.getIntelligence = async (req, res) => {
  try {
    const userId = req.user.id;
    let snapshot = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 });

    // Auto-Run if stale or missing (Logic Delegated to Generator)
    // We check if data version changed inside generateHealthIntelligence
    // Here we just trigger it.
    
    // Rate limit check: Don't Spam Generator on every page load
    // But since generator checks DataVersion hash, it's cheap to call.
    // User Update: Run only after 24 hours to save AI credits.
    if (!snapshot || (Date.now() - new Date(snapshot.generatedAt).getTime() > 24 * 60 * 60 * 1000)) { // 24 hours debounce
         try {
            const result = await generateHealthIntelligence(userId, false);
            if (result.updated) snapshot = result.snapshot;
         } catch (e) { console.error("Auto-gen error", e); }
    }

    if (!snapshot) return res.status(200).json({ exists: false, message: "No intelligence." });

    res.status(200).json({ exists: true, snapshot });
  } catch (error) {
    console.error("Error fetching intelligence:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.refreshIntelligence = async (req, res) => {
  try {
    const result = await generateHealthIntelligence(req.user.id, true);
    res.json(result);
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
