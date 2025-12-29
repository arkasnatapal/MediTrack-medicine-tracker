const { GoogleGenerativeAI } = require("@google/generative-ai");
const FoodItem = require("../models/FoodItem");
const Medicine = require("../models/Medicine");
const MedicineLog = require("../models/MedicineLog");
const { findAndUploadImage } = require("./imageExtraction.service");

// Initialize Gemini
const genAI = process.env.GEMINI_API_CHAT_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Strict Rule-Based Logic for Status Flagging
 */
const evaluateCycleStatus = (cycleLength) => {
    if (!cycleLength) return { status: "Unknown", color: "gray" };
    if (cycleLength < 21) return { status: "Too Short", color: "orange" };
    if (cycleLength <= 35) return { status: "Normal", color: "green" };
    if (cycleLength <= 45) return { status: "Slightly Irregular", color: "yellow" };
    if (cycleLength < 90) return { status: "Irregular", color: "orange" };
    return { status: "Missed Periods", color: "red" };
};

/**
 * Cycle Trend Analysis Logic
 * Detecting PCOD/PCOS markers based on cycle gaps
 */
const analyzeCycleTrends = (history, currentCycleLength) => {
    // 1. Collect all cycle lengths (consecutive start dates)
    let cycleLengths = [];
    
    // Add current cycle if receiving valid length
    if (currentCycleLength) cycleLengths.push(currentCycleLength);

    // Extract lengths from history (if history stores start/end or just start)
    // Assuming history objects have { start, end, cycleLength }
    if (history && history.length > 0) {
        history.forEach(h => {
             if (h.cycleLength) cycleLengths.push(h.cycleLength);
             else if (h.start && h.end) {
                 const s = new Date(h.start);
                 const e = new Date(h.end);
                 const days = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
                 cycleLengths.push(days);
             }
        });
    }

    // Only analyze if we have some data (at least 2 cycles for a trend, but 1 is okay for immediate status)
    const recentCycles = cycleLengths.slice(0, 6); // Look at last 6 cycles
    if (recentCycles.length === 0) return null;

    // 2. Logic Implementation
    // Check the latest few cycles to determine status
    const latestGap = recentCycles[0];
    
    let status = "Balanced";
    let color = "emerald";
    let recommendation = "Your cycle rhythm is healthy.";
    let flagged = false;

    // Priority Checks (Critical -> High -> Monitor -> Normal)
    
    // Check for >= 90 days (Critical) in ANY of the recent 3 cycles
    const hasCriticalGap = recentCycles.slice(0, 3).some(len => len >= 90);
    
    if (hasCriticalGap) {
        status = "Critical Alert";
        color = "red";
        recommendation = "Doctor consultation reliability advised. Gaps over 90 days can indicate amenorrhea or other conditions.";
        flagged = true;
    } 
    // Check for > 45 days (High Irregularity)
    else if (latestGap > 45) {
        status = "High Irregularity";
        color = "orange";
        recommendation = "Cycle is significantly longer than average. Monitor closely for PCOD symptoms.";
        flagged = true;
    }
    // Check for 36-45 days (Monitor)
    else if (latestGap > 35) {
        status = "Monitor";
        color = "amber";
        recommendation = "Cycle is slightly longer than optimal. Maintain a balanced diet and tracking.";
        flagged = true;
    }
    // Normal (<= 35)
    else if (latestGap <= 35 && latestGap >= 21) {
        status = "Stable";
        color = "emerald";
        recommendation = "Your cycle indicates good reproductive health.";
    }
    else if (latestGap < 21) {
        status = "Short Cycle";
        color = "amber";
        recommendation = "Cycle is shorter than usual (Polymenorrhea range).";
        flagged = true;
    }

    return {
        status,
        color,
        recommendation,
        averageLength: Math.round(recentCycles.reduce((a, b) => a + b, 0) / recentCycles.length),
        historyCount: recentCycles.length,
        flagged
    };
};

/**
 * AI Analysis Function
 * @param {Object} healthData - Decrypted user health data
 * @param {String} userId - User ID
 * @param {Object} cachedAIResponse - Previous AI response stored in blob
 * @param {Date} lastAnalysisTime - Timestamp of last AI run
 */
const yogaPoses = require("../data/yogaPoses");

/**
 * AI Analysis Function
 * @param {Object} healthData - Decrypted user health data
 * @param {String} userId - User ID
 * @param {Object} cachedAIResponse - Previous AI response stored in blob
 * @param {Date} lastAnalysisTime - Timestamp of last AI run
 */
exports.analyzeHealth = async (healthData, userId, cachedAIResponse, lastAnalysisTime) => {
    // 1. Basic Logical Calculation (Always Run Fresh)
    const { lastPeriodStart, cycleLength } = healthData.cycleData || {};
    let phase = "Unknown";
    let cycleDay = 0;
    
    if (lastPeriodStart) {
        const today = new Date();
        const start = new Date(lastPeriodStart);
        const diffTime = Math.abs(today - start);
        cycleDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Simple Phase Logic
        const effectiveCycleLength = Math.max(cycleLength || 28, 28);
        const adjustedDay = ((cycleDay - 1) % effectiveCycleLength) + 1;
        if (adjustedDay <= 5) phase = "Menstrual";
        else if (adjustedDay <= 13) phase = "Follicular";
        else if (adjustedDay <= 15) phase = "Ovulation";
        else phase = "Luteal";
    }

    const ruleBasedStatus = evaluateCycleStatus(cycleLength || 28);

    // 1.5 Analyze Trends (New)
    const cycleTrends = analyzeCycleTrends(healthData.history, cycleLength);

    // 2. Check Cache Validity (24 Hours)
    const now = new Date();
    let isCacheValid = false;
    if (lastAnalysisTime && cachedAIResponse) {
        const lastRun = new Date(lastAnalysisTime);
        const hoursDiff = Math.abs(now - lastRun) / 36e5;
        if (hoursDiff < 24) {
            isCacheValid = true;
        }
    }

    // if (isCacheValid) {
    //     return {
    //         phase,
    //         cycleDay,
    //         status: ruleBasedStatus,
    //         cycleTrends,
    //         ...cachedAIResponse,
    //         isCached: true,
    //         analysisTimestamp: lastAnalysisTime
    //     };
    // }

    // 3. Prepare Context
    // Extract recent logs for Pain, Energy, Mood
    const recentLogs = healthData.dailyLogs?.slice(-3) || [];
    const lastLog = recentLogs[recentLogs.length - 1] || {};
    
    // Default Inputs if missing
    const userPainLevel = lastLog.pain || 0;
    const userPainAreas = lastLog.painAreas || [];
    const userEnergy = lastLog.energy || "medium";
    const userNotes = lastLog.notes || ""; // Extract Notes
    
    // 4. RULE-BASED YOGA RECOMMENDATION (FILTER ONLY SAFE ONES FIRST)
    // Filter Poses
    let safePoses = yogaPoses.filter(pose => {
        // Safety Check: If period is active, ensure pose is safe
        if (phase === "Menstrual" && !pose.safeDuringPeriods) return false;
        return true;
    });

    // 5. Gemini AI Call (Select & Personalize)
    let aiResponse = { 
        recommendations: {
            nutrition: "Eat balanced meals.",
            exercise: "Gentle movement is recommended.",
            hygiene: "Maintain good hygiene.",
            mood: "Take time for yourself."
        },
        exercises: [], // Will fill with selectedPoses + Gemini text
        flags: []
    };

    // Default Fallback Selection (if AI fails)
    let selectedPoses = safePoses.sort((a,b) => {
        const aMatch = a.targetPainAreas.filter(area => userPainAreas.includes(area)).length;
        const bMatch = b.targetPainAreas.filter(area => userPainAreas.includes(area)).length;
        return bMatch - aMatch;
    }).slice(0, 3);
    
    if (selectedPoses.length === 0) {
        selectedPoses = yogaPoses.filter(p => ["balasana", "savasana"].includes(p.id));
    }


    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });
            
            // Available Poses List for AI to choose from
            const availablePosesList = safePoses.map(p => `- ID: ${p.id}, Name: ${p.name}, Benefits: ${p.baseBenefits.join(", ")}, Targets: ${p.targetPainAreas.join(", ")}`).join("\n");
            
            const prompt = `
            ACT AS: Women's Health Yoga Coach.
            CONTEXT:
            - Period Day: ${cycleDay} (Phase: ${phase})
            - Pain Level: ${userPainLevel}/10
            - Pain Areas: ${userPainAreas.join(", ") || "General"}
            - Energy Level: ${userEnergy}
            - User Notes: "${userNotes}" (Use this for specific food/activity context)
            
            AVAILABLE YOGA POSES:
            ${availablePosesList}

            TASK:
            1. Generate general health recommendations (nutrition, hygiene, mood) based on logs.
            2. Detect any "IMPORTANT NOTICES" or warnings based on the user's logs/notes (e.g. "Sleeplessness can worsen cramps", "Sugar intake inflames pain"). RETURN EMPTY ARRAY if no warnings.
            3. SELECT top 3 yoga poses from the "AVAILABLE YOGA POSES" list above that best match the user's pain areas, energy, and notes.
            4. For EACH selected pose, provide a personalized explanation (why it helps) and steps.

            OUTPUT JSON ONLY:
            {
                "recommendations": {
                    "nutrition": "...",
                    "exercise": "...",
                    "hygiene": "...",
                    "mood": "..."
                },
                "selected_pose_ids": ["id1", "id2", "id3"],
                "exercise_explanations": {
                    "id1": "Explanation...",
                    "id2": "Explanation...",
                    "id3": "Explanation..."
                },
                "exercise_steps": {
                     "id1": ["Step 1...", "Step 2..."],
                     "id2": ["Step 1...", "Step 2..."],
                     "id3": ["Step 1...", "Step 2..."]
                },
                "important_notices": ["Warning 1 based on log...", "Warning 2 based on note..."],
                "flags": []
            }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                aiResponse.recommendations = { ...aiResponse.recommendations, ...parsed.recommendations };
                aiResponse.flags = parsed.flags || [];
                aiResponse.important_notices = parsed.important_notices || [];
                
                // Hydrate the Selected Poses from IDs
                const aiSelectedIds = parsed.selected_pose_ids || [];
                const aiSelectedPoses = safePoses.filter(p => aiSelectedIds.includes(p.id));
                
                // If AI picked valid poses, use them. Else fallback to rule-based.
                const finalPoses = aiSelectedPoses.length > 0 ? aiSelectedPoses : selectedPoses;

                // Merge Explanations and Steps into Exercises
                aiResponse.exercises = finalPoses.map(pose => ({
                    ...pose,
                    why_it_helps: parsed.exercise_explanations?.[pose.id] || pose.baseBenefits[0],
                    benefit: parsed.exercise_explanations?.[pose.id] || pose.baseBenefits[0],
                    steps: parsed.exercise_steps?.[pose.id] || ["Sit comfortably.", "Breathe deeply.", "Hold for 1 minute."],
                    imageUrls: pose.imageUrls,
                    imageUrl: pose.imageUrls[0]
                }));
            } else {
                 // Fallback to default selection but generic explain
                aiResponse.exercises = selectedPoses.map(pose => ({
                    ...pose,
                    why_it_helps: `Helps with ${pose.baseBenefits.join(", ")}.`,
                    benefit: `Helps with ${pose.baseBenefits[0]}.`,
                    steps: ["Sit comfortably.", "Hold position.", "Focus on breathing."],
                    imageUrls: pose.imageUrls,
                    imageUrl: pose.imageUrls[0]
                }));
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            // Fallback if AI fails: Return poses with base benefits
            aiResponse.exercises = selectedPoses.map(pose => ({
                ...pose,
                why_it_helps: `Helps with ${pose.baseBenefits.join(", ")}.`,
                benefit: `Helps with ${pose.baseBenefits[0]}.`,
                steps: ["Sit comfortably.", "Breathe deeply.", "Focus on the target area.", "Hold for 1-2 minutes."],
                imageUrls: pose.imageUrls,
                imageUrl: pose.imageUrls[0]
            }));
        }
    } else {
        // No AI available
        aiResponse.exercises = selectedPoses.map(pose => ({
            ...pose,
            why_it_helps: `Helps with ${pose.baseBenefits.join(", ")}.`,
            benefit: `Helps with ${pose.baseBenefits[0]}.`,
            steps: ["Sit comfortably.", "Breathe deeply.", "Focus on the target area.", "Hold for 1-2 minutes."],
            imageUrls: pose.imageUrls,
            imageUrl: pose.imageUrls[0]
        }));
    }

    return {
        phase,
        cycleDay,
        status: ruleBasedStatus,
        cycleTrends,
        ...aiResponse, 
        isCached: false,
        analysisTimestamp: new Date()
    };
};

/**
 * Analyze Full Period Outcome (Post-Cycle)
 */
exports.analyzePeriodOutcome = async (logs, cycleLength, prevHistory) => {
    if (!genAI) return { summary: "AI Unavailable" };
    
    try {
         const model = genAI.getGenerativeModel({ model: MODEL_NAME });
         const prompt = `
            ACT AS: Compassionate Gynecologist.
            TASK: Generate a post-period summary report.
            
            DATA:
            - Cycle Length: ${cycleLength} days
            - Symptom Logs: ${JSON.stringify(logs)}
            - Previous History Count: ${prevHistory?.length || 0}
            
            OUTPUT JSON ONLY. Do not use Markdown.
            1. "summary": "2-3 sentences summarizing the period experience (e.g. 'You experienced higher pain than usual on Day 2...')"
            2. "clinical_advice": "Specific advice for recovery phase (Follicular)"
            3. "pain_trend": "Trend description (e.g. Peaked on Day 2)"
            4. "mood_trend": "Trend description"
            5. "flags": [Array of strings] - Any immediate health warnings or "doctor consult" flags.
            6. "exercises": [Array of objects] { - PROPOSE 3-4 SPECIFIC MOVEMENTS
                "name": "Exact Name of Asana/Exercise",
                "focus": "Pain Relief / Energy / Relaxation",
                "benefit": "Short benefit string...",
                "duration": "Duration or Reps",
                "steps": ["Step 1...", "Step 2...", "Step 3..."],
                "why_it_helps": "Detailed explanation of physiological benefit for their specific pain/phase."
            }

            CRITICAL INSTRUCTION - EXERCISE SELECTION:
            - CONTEXTUAL PAIN: Use the user's logged 'painAreas' (e.g. 'Lower Back', 'Cramps') to select targeted moves.
            - If Pain > 5: Suggest "Child's Pose", "Cat-Cow", "Supta Baddha Konasana" (Restorative).
            - If Menstrual Phase & Low Energy: Suggest "Yin Yoga" or "Light Walking".
            - If Follicular/Ovulation & High Energy: Suggest "HIIT", "Strength Training", "Power Yoga".
            - If Luteal/PMS: Suggest "Gentle Flow", "Magnesium-rich foods" (in nutrition), "Stretching".
            - ALWAYS tailor to the specific symptoms logged (e.g. "Back Pain" -> "Cat-Cow").
            OUTPUT JSON ONLY. Do not use Markdown.         {
                "summary": "2-3 sentences summarizing the period experience (e.g. 'You experienced higher pain than usual on Day 2...')",
                "clinical_advice": "Specific advice for recovery phase (Follicular)",
                "pain_trend": "Trend description (e.g. Peaked on Day 2)",
                "mood_trend": "Trend description",
                "flags": [],
                "exercises": []
            }
         `;
         
         const result = await model.generateContent(prompt);
         const text = result.response.text();
         const jsonMatch = text.match(/\{[\s\S]*\}/);
         return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: "Analysis failed to parse." };

    } catch (e) {
        console.error("Period Analysis Error", e);
        return { summary: "Error generating report." };
    }
};
