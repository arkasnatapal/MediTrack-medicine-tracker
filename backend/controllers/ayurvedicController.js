const AyurvedicProfile = require('../models/AyurvedicProfile');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Report = require('../models/Report');
const IntelligenceSnapshot = require('../models/IntelligenceSnapshot'); 
const { google } = require('googleapis');
const { sendEmail } = require('../utils/sendEmail');
const OAuth2 = google.auth.OAuth2;
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = process.env.GEMINI_API_FAMILY_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_FAMILY_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash";

// Helper to get AI Suggestion
async function generateAyurvedicInsight(user, medicines, reports, feedback, cycleData, intelligence) {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
    You are an expert Ayurvedic Physician. Analyze the following patient data and provide a daily health plan AND a long-term healing path.
    
    PATIENT PROFILE:
    - Name: ${user.name}
    - Age: ${user.age || 'Unknown'}
    - Gender: ${user.gender}
    - Blood Group: ${user.bloodGroup || 'Unknown'}
    - Emergency/Family History: ${JSON.stringify(user.familyMedicalHistory)}
    
    CURRENT MEDICAL CONTEXT:
    - Active Medicines: ${medicines.map(m => `${m.name} (${m.dosage})`).join(', ')}
    - Recent Reports Summary: ${reports.map(r => r.domain).join(', ')}
    
    INTELLIGENCE & PREDICTIONS (Use this for Healing Path):
    - Future Threat: ${intelligence?.predictedThreat ? JSON.stringify(intelligence.predictedThreat) : "No prediction available."}
    - Domain Health: ${intelligence?.domains ? JSON.stringify(Object.fromEntries(intelligence.domains)) : "No domain data."}

    RECENT FEEDBACK (Today/Yesterday):
    ${JSON.stringify(feedback)}

    CYCLE DATA (if applicable):
    ${JSON.stringify(cycleData)}

    TASK:
    1. Determine current Dosha imbalance (Vata, Pitta, Kapha).
    2. Suggest a DAILY ROUTINE for the next 24 hours.
    3. Suggest Diet, Yoga, and Natural remedies.
    4. [CRITICAL] Create a "healingPath" to cure/prevent the specific diseases identified in "INTELLIGENCE" or general prevention if none.
    5. [MANDATORY] GENETIC PREVENTION: Iterate through 'Emergency/Family History'. For EACH condition found, provide a specific, simple Ayurvedic/Natural habit to prevent it. Use VERY SIMPLE language.
    
    RETURN JSON ONLY:
    {
      "constituency": { "vata": 0-100, "pitta": 0-100, "kapha": 0-100, "primary": "Dosha Name" },
      "focus": "Short title for the day",
      "diet": ["Tip 1", "Tip 2", "Food to avoid"],
      "lifestyle": ["Activity 1", "Sleep tip"],
      "herbs": ["Safe herb 1", "Safe herb 2"],
      "yoga": { "name": "Pose Name", "benefits": "Why this helps today" },
      "quote": "Inspiring ayurvedic quote",
      "geneticInsights": [
           { 
             "condition": "e.g. Diabetes (Father)", 
             "recommendation": "e.g. Chew 2 Neem leaves daily on empty stomach.", 
             "category": "Ayurveda" 
           }
      ],
      "healingPath": {
          "title": "Title of the Condition to Cure/Prevent",
          "description": "Why this path is chosen (e.g. 'To reverse pre-diabetes identified in intelligence')",
          "source": "Reasoning (e.g. 'High blood sugar trends')",
          "recommendations": [
              {
                  "category": "Yoga", 
                  "title": "Asana Name", 
                  "content": "Step-by-step instructions.",
                  "timeToPerform": "e.g. 10 mins morning",
                  "imageQuery": "yoga pose name"
              },
               {
                  "category": "Ayurveda", 
                  "title": "Remedy Name", 
                  "content": "Preparation instructions.",
                  "timeToPerform": "Before bed",
                  "imageQuery": "Ayurvedic herb name"
              }
          ]
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("AI Generation Error:", err);
    return null;
  }
}

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let profile = await AyurvedicProfile.findOne({ userId });

    if (!profile) {
      profile = new AyurvedicProfile({ userId });
    }

    // Check if suggestion needs refresh (older than 24h or doesn't exist)
    const now = new Date();
    const lastGen = profile.dailySuggestion?.generatedAt;
    const needsRefresh = !lastGen || (now - new Date(lastGen)) > 24 * 60 * 60 * 1000;

    if (needsRefresh) {
        // Fetch Context
        const user = await User.findById(userId);
        const medicines = await Medicine.find({ userId, quantity: { $gt: 0 } }); // Active meds
        const reports = await Report.find({ userId }).sort({ reportDate: -1 }).limit(3);
        const intelligence = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 }); // Get Intelligence
        const lastFeedback = profile.dailyFeedback.slice(-1)[0] || {};

        const insight = await generateAyurvedicInsight(user, medicines, reports, lastFeedback, profile.cycleData, intelligence);
        
        if (insight) {
            profile.constituency = insight.constituency;
            profile.dailySuggestion = {
                generatedAt: now,
                validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                content: {
                    focus: insight.focus,
                    diet: insight.diet,
                    lifestyle: insight.lifestyle,
                    herbs: insight.herbs,
                    yoga: insight.yoga,
                    quote: insight.quote
                }
            };
            if (insight.healingPath) {
                profile.healingPath = insight.healingPath;
            }
            await profile.save();
        }
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching ayurvedic profile' });
  }
};

exports.updateFeedback = async (req, res) => {
    try {
        const { mood, energyLevel, digestion, symptoms, cycleData } = req.body;
        const userId = req.user.id;

        let profile = await AyurvedicProfile.findOne({ userId });
        if (!profile) profile = new AyurvedicProfile({ userId });

        // Update Cycle Data if provided
        if (cycleData) {
            profile.cycleData = { ...profile.cycleData, ...cycleData };
        }

        // Add Feedback
        profile.dailyFeedback.push({
            date: new Date(),
            mood,
            energyLevel,
            digestion,
            symptoms
        });

        // Trigger immediate refresh of suggestion since feedback changed context
        // Fetch Context
        const user = await User.findById(userId);
        const medicines = await Medicine.find({ userId, quantity: { $gt: 0 } });
        const reports = await Report.find({ userId }).sort({ reportDate: -1 }).limit(3);
        const intelligence = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 }); // Get Intelligence
        
        const insight = await generateAyurvedicInsight(user, medicines, reports, { mood, energyLevel, digestion, symptoms }, profile.cycleData, intelligence);

        if (insight) {
             profile.constituency = insight.constituency;
             profile.dailySuggestion = {
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
                content: {
                    focus: insight.focus,
                    diet: insight.diet,
                    lifestyle: insight.lifestyle,
                    herbs: insight.herbs,
                    yoga: insight.yoga,
                    quote: insight.quote
                }
            };
            if (insight.healingPath) {
                profile.healingPath = insight.healingPath;
            }
            if (insight.geneticInsights) {
                profile.geneticInsights = insight.geneticInsights;
            }
        }

        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating feedback' });
    }
};

exports.regenerateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        let profile = await AyurvedicProfile.findOne({ userId });
        if (!profile) profile = new AyurvedicProfile({ userId });

        // Fetch Context
        const user = await User.findById(userId);
        const medicines = await Medicine.find({ userId, quantity: { $gt: 0 } });
        const reports = await Report.find({ userId }).sort({ reportDate: -1 }).limit(3);
        const intelligence = await IntelligenceSnapshot.findOne({ userId }).sort({ generatedAt: -1 }); 
        const lastFeedback = profile.dailyFeedback.slice(-1)[0] || {};

        const insight = await generateAyurvedicInsight(user, medicines, reports, lastFeedback, profile.cycleData, intelligence);
        
        if (insight) {
            profile.constituency = insight.constituency;
            profile.dailySuggestion = {
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
                content: {
                    focus: insight.focus,
                    diet: insight.diet,
                    lifestyle: insight.lifestyle,
                    herbs: insight.herbs,
                    yoga: insight.yoga,
                    quote: insight.quote
                }
            };
            if (insight.healingPath) {
                profile.healingPath = insight.healingPath;
            }
            if (insight.geneticInsights) {
                profile.geneticInsights = insight.geneticInsights;
            }
            await profile.save();
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error regenerating profile' });
    }
};

exports.scheduleReminders = async (req, res) => {
    try {
        const { routine, reminders } = req.body;
        
        const prompt = `
        Act as an Expert Ayurvedic Chronobiologist.
        User's Daily Rhythm:
        - Wake Up: ${routine.wake}
        - Lunch: ${routine.lunch}
        - Dinner: ${routine.dinner}
        - Sleep: ${routine.sleep}

        Tasks to Schedule:
        ${reminders.map(r => `- ${r.title} (${r.category}): ${r.instruction}`).join('\n')}

        Task: Assign the BEST effective time for each task based on Ayurvedic principles (Dinacharya).
        - Yoga/Pranayama: Best before breakfast/empty stomach.
        - Herbs: Specific times (before meals, after meals).
        - Lifestyle: Align with Circadian rhythm.
        
        Return ONLY a JSON array:
        [
          { "title": "Task Name", "time": "HH:mm", "reason": "Why this time?" }
        ]
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        const schedule = JSON.parse(text);
        
        const finalSchedule = schedule.map(s => {
            const original = reminders.find(r => r.title === s.title) || reminders[0]; 
            // Fallback to first if mismatch, but titles should match. 
            // Better: find by approximate completion or pass ID. 
            // Using exact title match for now.
            return {
                ...original,
                scheduledTime: s.time,
                reason: s.reason
            };
        });

        res.json(finalSchedule);

    } catch (error) {
        console.error("AI Schedule Error", error);
        res.status(500).json({ message: "Failed to schedule reminders" });
    }
};

exports.syncReminders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reminders } = req.body; 

        const user = await User.findById(userId);
        let profile = await AyurvedicProfile.findOne({ userId });
        if(!profile) profile = new AyurvedicProfile({ userId });

        const calendarClient = user.google?.accessToken ? new google.calendar('v3') : null;
        let oAuth2Client = null;

        if (calendarClient && user.google.accessToken) {
             oAuth2Client = new OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            oAuth2Client.setCredentials({
                access_token: user.google.accessToken,
                refresh_token: user.google.refreshToken
            });
        }

        const newReminders = [];

        for (const rem of reminders) {
             let eventId = null;
             
             if (oAuth2Client) {
                 try {
                     const event = {
                         summary: `MediTrack: ${rem.title}`,
                         description: rem.instruction,
                         start: {
                             dateTime: getNextDateTime(rem.time),
                             timeZone: 'Asia/Kolkata', 
                         },
                         end: {
                             dateTime: getNextDateTime(rem.time, 30), 
                             timeZone: 'Asia/Kolkata',
                         },
                         recurrence: [`RRULE:FREQ=DAILY;COUNT=${rem.durationDays || 3}`],
                     };
                     
                     const response = await google.calendar({ version: 'v3', auth: oAuth2Client }).events.insert({
                         calendarId: 'primary',
                         resource: event,
                     });
                     eventId = response.data.id;
                 } catch (gErr) {
                     console.error("Google Calendar Sync Error", gErr.message);
                 }
             }

             newReminders.push({
                 title: rem.title,
                 category: rem.type || 'General',
                 instruction: rem.instruction,
                 durationDays: rem.durationDays || 3,
                 scheduledTime: rem.time || "07:00",
                 googleEventId: eventId
             });
        }

        profile.activeReminders.push(...newReminders);
        await profile.save();

        const emailHTML = `
            <div style="font-family: Arial; padding: 20px;">
                <h2 style="color: #059669;">🌿 Ayurvedic Reminders Setup</h2>
                <p>Hello ${user.name}, you have successfully set up reminders.</p>
                <ul>
                    ${newReminders.map(r => `<li><strong>${r.title}</strong> - ${r.scheduledTime} (${r.durationDays} days)</li>`).join('')}
                </ul>
            </div>
        `;
        await sendEmail({ to: user.email, subject: 'Ayurvedic Reminders Setup', html: emailHTML });

        res.json(profile);
    } catch (error) {
        console.error("Sync Error", error);
        res.status(500).json({ message: "Error syncing reminders" });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reminderId } = req.params;

        const profile = await AyurvedicProfile.findOne({ userId });
        const reminder = profile.activeReminders.id(reminderId);

        if (reminder?.googleEventId) {
             const user = await User.findById(userId);
             if (user.google?.accessToken) {
                 const oAuth2Client = new OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                 oAuth2Client.setCredentials({ access_token: user.google.accessToken, refresh_token: user.google.refreshToken });
                 try {
                     await google.calendar({ version: 'v3', auth: oAuth2Client }).events.delete({
                         calendarId: 'primary',
                         eventId: reminder.googleEventId
                     });
                 } catch (e) { console.error("Calendar Delete Error", e.message); }
             }
        }

        profile.activeReminders.pull(reminderId);
        await profile.save();
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: "Error deleting reminder" });
    }
};

function getNextDateTime(timeStr, addMinutes = 0) {
    const today = new Date();
    const [hours, minutes] = (timeStr || "07:00").split(':').map(Number);
    today.setHours(hours, minutes + addMinutes, 0, 0);
    if (today < new Date()) { 
        today.setDate(today.getDate() + 1); 
    }
    return today.toISOString();
}
