const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const FamilyConnection = require("../models/FamilyConnection");
const Medicine = require("../models/Medicine");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const HealthReport = require("../models/HealthReport");
const Report = require("../models/Report");
const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../utils/googleCalendar");

if (!process.env.GEMINI_API_CHAT_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set. AI health chat will not work.");
}

const genAI = process.env.GEMINI_API_CHAT_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY)
  : null;

const MODEL_NAME = "gemini-2.5-flash-lite";

// --- Helper: Fuzzy Medicine Search ---
async function findMedicineFuzzy(userId, medicineName) {
  const cleanName = medicineName.trim();
  const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1. Exact & Contains Match (Case Insensitive)
  let med = await Medicine.findOne({
    userId: userId,
    $or: [
      { name: { $regex: new RegExp(`^${escapedName}$`, "i") } },
      { genericName: { $regex: new RegExp(`^${escapedName}$`, "i") } },
    ],
  });

  if (!med) {
    med = await Medicine.findOne({
      userId: userId,
      $or: [
        { name: { $regex: new RegExp(escapedName, "i") } },
        { genericName: { $regex: new RegExp(escapedName, "i") } },
      ],
    });
  }

  // 2. Normalized Match (Remove spaces and special chars)
  if (!med) {
    const normalizedInput = cleanName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    if (normalizedInput.length > 2) {
      // Only if input is substantial
      const allMeds = await Medicine.find({ userId: userId }).select(
        "name genericName"
      );
      med = allMeds.find((m) => {
        const normName = m.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const normGeneric = m.genericName
          ? m.genericName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
          : "";
        return (
          normName.includes(normalizedInput) ||
          (normGeneric && normGeneric.includes(normalizedInput))
        );
      });
    }
  }

  return med;
}

// --- Helper: Resolve Family Member ---
async function resolveFamilyMember(requesterId, targetNameOrRelation) {
  if (!targetNameOrRelation) return null;
  const lowerTarget = targetNameOrRelation.toLowerCase();

  const connections = await FamilyConnection.find({
    $and: [
      { status: "active" },
      { $or: [{ inviter: requesterId }, { invitee: requesterId }] },
    ],
  }).populate("inviter invitee");

  for (const c of connections) {
    if (!c.inviter || !c.invitee) continue; // Safety check

    const other =
      c.inviter._id.toString() === requesterId ? c.invitee : c.inviter;
    if (!other) continue;

    const rel =
      c.inviter._id.toString() === requesterId
        ? c.relationshipFromInviter
        : c.relationshipFromInvitee;
    const lowerRel = rel ? rel.toLowerCase() : "";

    // Check name (fuzzy)
    if (other.name && other.name.toLowerCase().includes(lowerTarget))
      return { user: other, connection: c };

    // Check relation (bidirectional partial match)
    // e.g. target="my dad", rel="dad" -> match
    // e.g. target="dad", rel="father" -> no match (unless we add aliases)
    if (
      lowerRel &&
      (lowerTarget.includes(lowerRel) || lowerRel.includes(lowerTarget))
    )
      return { user: other, connection: c };
  }
  return null;
}

// --- Tools Definitions ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_family_members",
        description:
          "Get a list of the user's connected family members and their relationships.",
      },
      {
        name: "check_medicine",
        description:
          "Check if a specific medicine exists in a family member's inventory.",
        parameters: {
          type: "OBJECT",
          properties: {
            targetName: {
              type: "STRING",
              description:
                "Name or relationship of the family member (e.g., 'Dad', 'John').",
            },
            medicineName: {
              type: "STRING",
              description: "Name of the medicine to check.",
            },
          },
          required: ["targetName", "medicineName"],
        },
      },
      {
        name: "add_medicine",
        description: "Add a new medicine to a family member's inventory.",
        parameters: {
          type: "OBJECT",
          properties: {
            targetName: {
              type: "STRING",
              description: "Name or relationship of the family member.",
            },
            medicineName: {
              type: "STRING",
              description: "Name of the medicine.",
            },
            quantity: {
              type: "NUMBER",
              description: "Current stock quantity.",
            },
            dosage: {
              type: "STRING",
              description: "Dosage info (e.g., '500mg'). Optional.",
            },
            expiryDate: {
              type: "STRING",
              description:
                "Expiry date in YYYY-MM-DD format. Optional. If unknown, leave empty.",
            },
          },
          required: ["targetName", "medicineName", "quantity"],
        },
      },
      {
        name: "create_reminder",
        description: "Schedule a medicine reminder for a family member.",
        parameters: {
          type: "OBJECT",
          properties: {
            targetName: {
              type: "STRING",
              description: "Name or relationship of the family member.",
            },
            medicineName: {
              type: "STRING",
              description: "Name of the medicine.",
            },
            time: {
              type: "STRING",
              description: "Time for the reminder in HH:MM format (24h).",
            },
            days: {
              type: "ARRAY",
              items: { type: "STRING" },
              description:
                "Days of the week (e.g., ['Monday', 'Wednesday']). Empty for daily.",
            },
          },
          required: ["targetName", "medicineName", "time"],
        },
      },
      {
        name: "delete_reminder",
        description:
          "Delete all reminders for a specific medicine for a family member.",
        parameters: {
          type: "OBJECT",
          properties: {
            targetName: {
              type: "STRING",
              description: "Name or relationship of the family member.",
            },
            medicineName: {
              type: "STRING",
              description: "Name of the medicine.",
            },
          },
          required: ["targetName", "medicineName"],
        },
      },
    ],
  },

  {
    functionDeclarations: [
      {
        name: "add_food",
        description: "Add a new food item to the user's food routine.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Name of the food item." },
            mealType: { type: "STRING", description: "Type of meal (breakfast, lunch, dinner, snack, other)." },
            time: { type: "STRING", description: "Time of the meal (e.g., '08:00'). Optional." },
            days: { type: "ARRAY", items: { type: "STRING" }, description: "Days of the week (e.g., ['Monday']). Optional." },
            notes: { type: "STRING", description: "Additional notes. Optional." },
          },
          required: ["name"],
        },
      },
      {
        name: "update_food",
        description: "Update an existing food item.",
        parameters: {
          type: "OBJECT",
          properties: {
            oldName: { type: "STRING", description: "Current name of the food item to identify it." },
            newName: { type: "STRING", description: "New name. Optional." },
            mealType: { type: "STRING", description: "New meal type. Optional." },
            time: { type: "STRING", description: "New time. Optional." },
            days: { type: "ARRAY", items: { type: "STRING" }, description: "New days. Optional." },
            notes: { type: "STRING", description: "New notes. Optional." },
          },
          required: ["oldName"],
        },
      },
      {
        name: "delete_food",
        description: "Delete a food item from the user's routine.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Name of the food item to delete." },
          },
          required: ["name"],
        },
      },
      {
        name: "get_food_schedule",
        description: "Get the user's food schedule for specific days or all days.",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "STRING", description: "Specific day (e.g., 'Monday'). Optional." },
          },
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `
You are MediTrack AI, a calm and trustworthy medical assistant.

Your role is to explain medical information in simple, reassuring, and human-friendly language.

Rules:
- Never sound alarming or scary.
- Never give direct medical orders.
- Always explain what a result means in everyday terms.
- If something is abnormal, explain its common causes and general next steps.
- Always remind users that this is informational, not a medical diagnosis.
- Prefer clarity over medical jargon.
- Speak like a caring doctor explaining to a non-medical person.

Tone:
- Calm
- Respectful
- Supportive
- Clear

CAPABILITIES:
1. Answer general health questions.
2. Provide detailed information about medicines, including side effects, uses, and contraindications (simulating a web search).
3. Manage Family:
   - List family members.
   - Check if a family member has a specific medicine.
   - Add a medicine to a family member's list if it's missing.
   - Set reminders for family members.
   - Edit/Update reminders for family members.
   - Delete reminders for family members.

RULES FOR FAMILY ACTIONS:
- ALWAYS check if the medicine exists before creating a reminder.
- If the user asks to set a reminder and the medicine is NOT found, ask the user if they want to add it.
- If adding a medicine, ask for the Quantity if not provided.
- Ask for the Expiry Date. If the user doesn't know it, say it's okay and you will add it with a temporary status (null expiry).
- After adding a medicine, ask if they want to proceed with setting the reminder.

MANDATORY FOOTER:
1. IF the user's query is related to medical advice, symptoms, health reports, or specific medicine details:
   - You MUST include the following disclaimer at the very bottom of your response.
   - It MUST be formatted in italics (wrapped in underscores).
   
   "_This explanation is meant to help you understand your health better. It does not replace advice from a qualified doctor._"
   
   **Formatting Instructions for Footer:**
   - Precede the footer with a horizontal rule (---).
   - Use this ⓘ at the start of the footer text.
   
   **Example Output:**
   ------
   ⓘ _This explanation is meant to help you understand your health better. It does not replace advice from a qualified doctor._

2. IF the user's query is operational (e.g., setting reminders, adding family members, general chat) or NOT medical:
   - Do NOT include the footer.
`;

router.post("/health-chat", auth, async (req, res) => {
  try {
    if (!genAI) {
      return res
        .status(500)
        .json({ success: false, message: "AI service not configured." });
    }

    const { message, history } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    // Prepare history
    let historyMessages = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant")
          )
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }))
      : [];

    // Clean history
    while (historyMessages.length > 0 && historyMessages[0].role === "model") {
      historyMessages.shift();
    }

    // --- Food Context Integration ---
    const FoodItem = require("../models/FoodItem");
    const { includeFood } = req.body;

    // Detect food intent if not explicitly requested
    const lowerMsg = message.toLowerCase();
    const foodKeywords = [
      "food",
      "meal",
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "diet",
      "eat",
      "eating",
      "food chart",
    ];
    const mentionsFood = foodKeywords.some((k) => lowerMsg.includes(k));

    let foodSummary = "";

    // Check user settings
    const user = await User.findById(userId);
    const allowAccess = user?.settings?.allowAIAccessToFoodChart;

    if ((includeFood || mentionsFood) && allowAccess) {
        // Fetch more items to cover a potential full week (e.g., 5 meals * 7 days = 35 items)
        const foods = await FoodItem.find({ user: userId }).sort({ time: 1 }).limit(100);
        
        if (foods && foods.length > 0) {
            // Group by Day for clearer context
            const daysMap = {};
            foods.forEach(f => {
                const dayList = (f.days && f.days.length) ? f.days : ["Unscheduled"];
                dayList.forEach(d => {
                    if (!daysMap[d]) daysMap[d] = [];
                    daysMap[d].push(f);
                });
            });

            // Format into a structured string
            foodSummary = Object.entries(daysMap).map(([day, items]) => {
                const itemsStr = items.map(f => {
                    const time = f.time ? `[${f.time}]` : "";
                    const tags = (f.tags && f.tags.length) ? ` (${f.tags.join(", ")})` : "";
                    const notes = f.notes ? ` - Note: ${f.notes}` : "";
                    return `  - ${time} ${f.mealType.toUpperCase()}: ${f.name}${tags}${notes}`;
                }).join("\n");
                return `DAY: ${day}\n${itemsStr}`;
            }).join("\n\n");
        }
    }

    // --- Medical Reports Context Integration ---
    const mentionsHealthReports = [
      "report",
      "analysis",
      "overview",
      "health graph",
      "improvement",
      "my health",
      "body",
    ].some((k) => lowerMsg.includes(k));

    let reportContext = "";

    if (mentionsHealthReports) {
      const reports = await Report.find({ userId: userId }).sort({ reportDate: 1 });
      
      if (reports && reports.length > 0) {
        reportContext = reports.map(r => {
          const date = r.reportDate ? new Date(r.reportDate).toISOString().split('T')[0] : "Unknown Date";
          const score = r.aiAnalysis?.healthScore || "N/A";
          const summary = r.aiAnalysis?.summary || "No summary available";
          const title = r.folderName || "Untitled Report";
          return `- [${date}] "${title}" (Score: ${score}): ${summary}`;
        }).join("\n");
        
        reportContext = `Here are the user's uploaded medical reports (Chronological Order):\n${reportContext}`;
      }
    }

    let finalSystemInstruction = SYSTEM_INSTRUCTION;
    
    // Append the enhanced instructions and data
    finalSystemInstruction += `

---
### 🍎 USER'S FOOD ROUTINE DATA (Context)
${foodSummary ? foodSummary : "No food routine data available yet."}

### 🩺 MEDICAL REPORTS ANALYSIS & GRAPH
${reportContext ? reportContext : "No medical reports available yet."}

### 🧠 ADVANCED HEALTH & NUTRITION PROTOCOLS (CRITICAL)

#### 1. 💊 MEDICINE INFORMATION & SIDE EFFECTS
If the user asks about a medicine (e.g., "What are the side effects of Pan 40?", "Give details of Paracetamol"):
   - **ACTION**: You MUST provide a comprehensive answer using your internal knowledge base (simulating a web search).
   - **CONTENT**: Include:
     - Common side effects (e.g., headache, nausea, dizziness).
     - Uses and benefits.
     - General body effects.
   - **RESTRICTIONS**: 
     - Do NOT start with "I am not a doctor" or "I cannot help".
     - Do NOT refuse to answer.
   - **MANDATORY FOOTER**: End with:
     ---
     ℹ️ <small>_This explanation is meant to help you understand your health better. It does not replace advice from a qualified doctor._</small>

#### 2. 💊 MEDICINE INTERACTION QUERIES
If the user asks about taking a specific medicine (e.g., "Can I take Pan 40?"):
   - **STEP 1: SIDE EFFECTS**: List common side effects first.
   - **STEP 2: FOOD CHART ANALYSIS**: Cross-reference with the User's Food Routine.
   - **STEP 3: DIRECT ADVICE**: Answer clearly.
   - **MANDATORY FOOTER**: End with:
     ---
     ℹ️ <small>_This explanation is meant to help you understand your health better. It does not replace advice from a qualified doctor._</small>

#### 3. 🥗 NUTRITION & DIET ANALYSIS
If the user asks about their food (e.g., "Is my diet good?", "What should I eat?"):
   - **Analyze Nutrition**: Evaluate the protein, carbs, fats, and micronutrients in their Food Routine.
   - **Health Impact**: Tell them if their food is "Good for health" or "Needs improvement".
   - **Solutions**: Suggest specific times to eat or food swaps.

#### 4. 📅 SHOWING THE FOOD CHART
If the user asks "Show me my food chart":
   - **Clarify**: If they didn't specify a day, ask: "For which day? Or would you like the whole week?"
   - **Display**: If they specify, output the data in a clean **Markdown Table** or **List**.
   - **Do not make up data**: Only show what is in the "USER'S FOOD ROUTINE DATA" section above.

#### 5. 📈 HEALTH OVERVIEW & GRAPH GENERATION
If the user asks for a health overview, analysis of reports, or "tell me about my health":
   - **Analyze Reports**: Use the "MEDICAL REPORTS ANALYSIS & GRAPH" section above.
   - **Synthesize**: Create a friendly, easy-to-understand summary of their health journey based on the reports.
   - **Graph Data**: You **MUST** generate a JSON dataset for a health improvement graph.
     - **Format**: Append this EXACT block at the very end of your response:
       \`\`\`json:graph
       [
         { "date": "YYYY-MM-DD", "score": 85, "label": "Blood Test" },
         { "date": "YYYY-MM-DD", "score": 90, "label": "Checkup" }
       ]
       \`\`\`
     - **Score Logic**: Assign a "Health Score" (0-100) for each report based on your analysis (100 = Perfect, <50 = Critical). If the report has a score, use it.
     - **Label**: Use the report title or a short summary.

#### 6. 🌟 PERSONA
   - You are the **World's Best Medicine & Health Tracker Assistant**.
   - Be proactive, caring, and extremely knowledgeable.
   - Empower the user with knowledge (side effects, nutrition facts) rather than just restricting them.
---`;

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: finalSystemInstruction,
      tools: tools,
    });

    const chat = model.startChat({
      history: historyMessages,
    });

    // Send message with retry logic
    let result;
    let retries = 0;
    let success = false;

    while (retries < 3 && !success) {
      try {
        result = await chat.sendMessage(message);
        success = true;
      } catch (err) {
        if (err.status === 429 || (err.message && err.message.includes('429'))) {
          retries++;
          console.log(`Rate limit hit for chat message. Retrying (${retries}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retries)); // Exponential backoff
        } else {
          throw err;
        }
      }
    }

    if (!success) {
      return res.status(429).json({ 
        success: false, 
        message: "The AI service is currently experiencing high traffic. Please try again in a few moments." 
      });
    }

    const response = await result.response;

    // Handle Function Calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // Execute tools
      const functionResponses = [];

      for (const call of functionCalls) {
        const name = call.name;
        const args = call.args;
        let apiResponse = {};

        try {
          if (name === "get_family_members") {
            const connections = await FamilyConnection.find({
              $and: [
                { status: "active" },
                { $or: [{ inviter: userId }, { invitee: userId }] },
              ],
            }).populate("inviter invitee");

            const members = connections
              .filter((c) => c.inviter && c.invitee) // Safety check
              .map((c) => {
                const other =
                  c.inviter._id.toString() === userId ? c.invitee : c.inviter;
                const rel =
                  c.inviter._id.toString() === userId
                    ? c.relationshipFromInviter
                    : c.relationshipFromInvitee;
                return { name: other.name, relationship: rel, id: other._id };
              });
            apiResponse = { members };
          } else if (name === "check_medicine") {
            const resolved = await resolveFamilyMember(userId, args.targetName);
            if (!resolved) {
              apiResponse = {
                error: `Family member '${args.targetName}' not found.`,
              };
            } else {
              const { user: targetUser } = resolved;
              const med = await findMedicineFuzzy(
                targetUser._id,
                args.medicineName
              );

              if (med) {
                apiResponse = {
                  found: true,
                  medicine: {
                    name: med.name,
                    quantity: med.quantity,
                    id: med._id,
                  },
                };
              } else {
                apiResponse = { found: false, message: "Medicine not found." };
              }
            }
          } else if (name === "add_medicine") {
            // ... (add_medicine implementation remains mostly same, just ensuring resolveFamilyMember is used) ...
            const resolved = await resolveFamilyMember(userId, args.targetName);
            if (!resolved) {
              apiResponse = {
                error: `Family member '${args.targetName}' not found.`,
              };
            } else {
              const { user: targetUser, connection } = resolved;

              // Consent check
              const isInviter = connection.inviter._id.toString() === userId;
              if (!connection.allowAiActions && !isInviter) {
                apiResponse = {
                  error:
                    "Permission denied. Ask them to enable 'Allow AI Actions'.",
                };
              } else {
                const newMed = new Medicine({
                  userId: targetUser._id,
                  name: args.medicineName,
                  quantity: args.quantity,
                  dosage: args.dosage || "As prescribed",
                  expiryDate: args.expiryDate
                    ? new Date(args.expiryDate)
                    : null,
                });
                await newMed.save();
                apiResponse = {
                  success: true,
                  message: `Added ${args.medicineName} to ${targetUser.name}'s list.`,
                  medicineId: newMed._id,
                };

                // Notify
                await Notification.create({
                  user: targetUser._id,
                  actor: userId,
                  type: "general",
                  title: "Medicine Added by AI",
                  body: `${userName} added ${args.medicineName} to your list via AI.`,
                });
              }
            }
          } else if (name === "create_reminder") {
            const resolved = await resolveFamilyMember(userId, args.targetName);
            if (!resolved) {
              apiResponse = {
                error: `Family member '${args.targetName}' not found.`,
              };
            } else {
              const { user: targetUser, connection } = resolved;

              // Consent check
              const isInviter = connection.inviter._id.toString() === userId;
              if (!connection.allowAiActions && !isInviter) {
                apiResponse = {
                  error:
                    "Permission denied. Ask them to enable 'Allow AI Actions'.",
                };
              } else {
                const med = await findMedicineFuzzy(
                  targetUser._id,
                  args.medicineName
                );

                if (!med) {
                  apiResponse = {
                    error: "Medicine not found. Please add it first.",
                  };
                } else {
                  const reminder = new Reminder({
                    targetUser: targetUser._id,
                    createdBy: userId,
                    medicine: med._id,
                    medicineName: med.name,
                    times: [args.time],
                    startDate: new Date(),
                    daysOfWeek: args.days || [],
                    createdByType: "ai",
                    source: "ai",
                    active: true,
                  });
                  await reminder.save();

                  // Calendar Sync
                  if (
                    targetUser.google &&
                    targetUser.google.calendarConnected
                  ) {
                    try {
                      const event = await createCalendarEvent(
                        targetUser._id,
                        reminder
                      );
                      if (event && event.id) {
                        reminder.googleEventId = event.id;
                        await reminder.save();
                      }
                    } catch (e) {
                      console.error("Calendar sync failed", e);
                    }
                  }

                  // Notifications
                  await Notification.create({
                    user: targetUser._id,
                    actor: userId,
                    type: "medicine_reminder",
                    title: `Reminder set by ${userName}`,
                    body: `Take ${med.name} at ${args.time}`,
                    meta: { reminderId: reminder._id, medId: med._id },
                  });

                  apiResponse = {
                    success: true,
                    message: `Reminder set for ${targetUser.name} to take ${med.name} at ${args.time}.`,
                  };
                }
              }
            }
          } else if (name === "delete_reminder") {
            const resolved = await resolveFamilyMember(userId, args.targetName);
            if (!resolved) {
              apiResponse = {
                error: `Family member '${args.targetName}' not found.`,
              };
            } else {
              const { user: targetUser, connection } = resolved;

              // Consent check
              const isInviter = connection.inviter._id.toString() === userId;
              if (!connection.allowAiActions && !isInviter) {
                apiResponse = {
                  error:
                    "Permission denied. Ask them to enable 'Allow AI Actions'.",
                };
              } else {
                const med = await findMedicineFuzzy(
                  targetUser._id,
                  args.medicineName
                );

                if (!med) {
                  apiResponse = { error: "Medicine not found." };
                } else {
                  // Find active reminders for this medicine
                  const reminders = await Reminder.find({
                    targetUser: targetUser._id,
                    medicine: med._id,
                    active: true,
                  });

                  if (reminders.length === 0) {
                    apiResponse = {
                      message: `No active reminders found for ${med.name}.`,
                    };
                  } else {
                    // Delete/Deactivate reminders
                    await Reminder.updateMany(
                      { _id: { $in: reminders.map((r) => r._id) } },
                      { $set: { active: false } }
                    );

                    // Remove google calendar event if exists
                    for (const reminder of reminders) {
                      if (
                        reminder.googleEventId &&
                        targetUser.google &&
                        targetUser.google.calendarConnected
                      ) {
                        try {
                          await deleteCalendarEvent(
                            targetUser._id,
                            reminder.googleEventId
                          );
                        } catch (e) {
                          console.error("Calendar deletion failed", e);
                        }
                      }
                    }

                    // Notify
                    await Notification.create({
                      user: targetUser._id,
                      actor: userId,
                      type: "general",
                      title: "Reminder Deleted by AI",
                      body: `${userName} deleted reminders for ${med.name} via AI.`,
                    });

                    apiResponse = {
                      success: true,
                      message: `Deleted ${reminders.length} reminder(s) for ${med.name}.`,
                    };
                  }
                }
              }
            }

          } else if (name === "update_reminder") {
            const resolved = await resolveFamilyMember(userId, args.targetName);
            if (!resolved) {
              apiResponse = {
                error: `Family member '${args.targetName}' not found.`,
              };
            } else {
              const { user: targetUser, connection } = resolved;

              // Consent check
              const isInviter = connection.inviter._id.toString() === userId;
              if (!connection.allowAiActions && !isInviter) {
                apiResponse = {
                  error:
                    "Permission denied. Ask them to enable 'Allow AI Actions'.",
                };
              } else {
                const med = await findMedicineFuzzy(
                  targetUser._id,
                  args.medicineName
                );

                if (!med) {
                  apiResponse = { error: "Medicine not found." };
                } else {
                  // Find active reminders for this medicine
                  const reminders = await Reminder.find({
                    targetUser: targetUser._id,
                    medicine: med._id,
                    active: true,
                  });

                  if (reminders.length === 0) {
                    apiResponse = {
                      message: `No active reminders found for ${med.name}.`,
                    };
                  } else {
                    // Logic to find the specific reminder/time
                    let targetReminder = null;
                    let timeIndex = -1;

                    if (reminders.length === 1) {
                      targetReminder = reminders[0];
                      if (targetReminder.times.length === 1) {
                        timeIndex = 0;
                      } else if (args.oldTime) {
                        timeIndex = targetReminder.times.indexOf(args.oldTime);
                      }
                    } else {
                      // Multiple reminder docs
                      if (args.oldTime) {
                        targetReminder = reminders.find((r) =>
                          r.times.includes(args.oldTime)
                        );
                        if (targetReminder) {
                          timeIndex = targetReminder.times.indexOf(
                            args.oldTime
                          );
                        }
                      }
                    }

                    if (!targetReminder) {
                      if (reminders.length > 1 && !args.oldTime) {
                        apiResponse = {
                          error:
                            "Multiple reminders found. Please specify the current time of the reminder you want to update.",
                        };
                      } else {
                        apiResponse = { error: "Reminder not found." };
                      }
                    } else if (timeIndex === -1) {
                      if (targetReminder.times.length > 1 && !args.oldTime) {
                        apiResponse = {
                          error:
                            "Multiple times found for this reminder. Please specify the current time to update.",
                        };
                      } else if (args.oldTime) {
                        apiResponse = {
                          error: `Time '${args.oldTime}' not found in the reminder.`,
                        };
                      } else {
                        // Fallback for single time if logic above missed it
                        if (targetReminder.times.length === 1) timeIndex = 0;
                      }
                    }

                    if (targetReminder && timeIndex !== -1) {
                      // Update fields
                      let updates = [];
                      if (args.newTime) {
                        targetReminder.times[timeIndex] = args.newTime;
                        updates.push(`time to ${args.newTime}`);
                      }
                      if (args.newDays) {
                        targetReminder.daysOfWeek = args.newDays;
                        updates.push(`days to ${args.newDays.join(", ")}`);
                      }

                      if (updates.length > 0) {
                        // Mark modified if we are modifying array elements directly
                        targetReminder.markModified("times");
                        await targetReminder.save();

                        // Calendar Sync
                        if (
                          targetReminder.googleEventId &&
                          targetUser.google &&
                          targetUser.google.calendarConnected
                        ) {
                          try {
                            await updateCalendarEvent(
                              targetUser._id,
                              targetReminder.googleEventId,
                              targetReminder
                            );
                          } catch (e) {
                            console.error("Calendar update failed", e);
                          }
                        }

                        // Notify
                        await Notification.create({
                          user: targetUser._id,
                          actor: userId,
                          type: "general",
                          title: "Reminder Updated by AI",
                          body: `${userName} updated reminders for ${med.name} via AI.`,
                        });

                        apiResponse = {
                          success: true,
                          message: `Updated reminder for ${med.name}. ${updates.join(", ")}.`,
                        };
                      }
                    }
                  }
                }
              }
            }
          } else if (name === "add_food") {
            try {
              const newFood = await FoodItem.create({
                user: userId,
                name: args.name,
                mealType: args.mealType || "other",
                time: args.time || "",
                days: args.days || [],
                notes: args.notes || "",
              });
              apiResponse = { success: true, message: `Added ${args.name} to your food routine.`, item: newFood };
            } catch (err) {
              apiResponse = { error: "Failed to add food item." };
            }
          } else if (name === "update_food") {
            try {
              const food = await FoodItem.findOne({ user: userId, name: { $regex: new RegExp(args.oldName, "i") } });
              if (!food) {
                apiResponse = { error: `Food item '${args.oldName}' not found.` };
              } else {
                if (args.newName) food.name = args.newName;
                if (args.mealType) food.mealType = args.mealType;
                if (args.time) food.time = args.time;
                if (args.days) food.days = args.days;
                if (args.notes) food.notes = args.notes;
                await food.save();
                apiResponse = { success: true, message: `Updated ${food.name}.`, item: food };
              }
            } catch (err) {
              apiResponse = { error: "Failed to update food item." };
            }
          } else if (name === "delete_food") {
            try {
              const result = await FoodItem.deleteOne({ user: userId, name: { $regex: new RegExp(args.name, "i") } });
              if (result.deletedCount > 0) {
                apiResponse = { success: true, message: `Deleted ${args.name} from your food routine.` };
              } else {
                apiResponse = { error: `Food item '${args.name}' not found.` };
              }
            } catch (err) {
              apiResponse = { error: "Failed to delete food item." };
            }
          } else if (name === "get_food_schedule") {
            try {
              const query = { user: userId };
              if (args.day) query.days = args.day;
              const items = await FoodItem.find(query).sort({ time: 1 });
              apiResponse = { success: true, items };
            } catch (err) {
              apiResponse = { error: "Failed to fetch food schedule." };
            }
          }

          functionResponses.push({
            functionResponse: {
              name: name,
              response: apiResponse,
            },
          });
        } catch (err) {
          console.error(`Error executing tool ${name}:`, err);
          functionResponses.push({
            functionResponse: {
              name: name,
              response: { error: err.message },
            },
          });
        }
      }

    // Send tool outputs back to model
      const toolResult = await chat.sendMessage(functionResponses);
      const toolResponse = await toolResult.response;
      return res.json({ success: true, reply: toolResponse.text() });
    }

    res.json({ success: true, reply: response.text() });
  } catch (error) {
    console.error("AI Chat Error (Full Stack):", error);
    if (error.response) {
      console.error("AI Chat Error Response Data:", error.response.data);
    }
    res.status(500).json({
      success: false,
      message: "AI service error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- Health Review Endpoint ---
router.post("/health-review", auth, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ success: false, message: "AI service not configured." });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    // 1. Fetch User Data
    const medicines = await Medicine.find({ userId });
    const reminders = await Reminder.find({ targetUser: userId, active: true });
    
    // Fetch recent food logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const FoodItem = require("../models/FoodItem");
    const foodLogs = await FoodItem.find({ 
      user: userId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 });

    // 2. Prepare Data Context
    const medicineList = medicines.map(m => 
      `- ${m.name} (${m.dosage || 'N/A'}, ${m.form || 'Tablet'}): ${m.quantity} remaining. Expiry: ${m.expiryDate ? m.expiryDate.toISOString().split('T')[0] : 'Unknown'}`
    ).join("\n");

    const reminderList = reminders.map(r => 
      `- ${r.medicineName}: ${r.times.join(", ")} on ${r.daysOfWeek.length ? r.daysOfWeek.join(", ") : "Daily"}`
    ).join("\n");

    const foodContext = foodLogs.length > 0 
      ? foodLogs.map(f => `- ${f.mealType}: ${f.name} (${f.time || 'N/A'})`).join("\n")
      : "No recent food logs.";

    // 3. Construct Prompt
    const prompt = `
      Analyze the following health data for a user named ${user.name}.
      
      ### MEDICINES
      ${medicineList || "No medicines found."}

      ### REMINDERS (Routine)
      ${reminderList || "No active reminders."}

      ### RECENT FOOD LOGS
      ${foodContext}

      ### TASK
      Generate a detailed "Health Thesis" and "Medicine Review" in strict JSON format.
      The analysis should be comprehensive, professional, and data-driven.
      For "nutritionTrends", estimate daily intake values (Protein, Carbs, Fats, Vitamins score) for the last 7 days based on the food logs provided. If logs are missing, infer reasonable estimates based on a standard diet or provide a baseline.

      ### REQUIRED JSON STRUCTURE
      {
        "healthScore": <number 0-100 based on adherence and medicine management>,
        "summary": "<Short executive summary of their health status>",
        "medicineAnalysis": [
          {
            "category": "<e.g., Pain Management, Cardiovascular, Vitamin>",
            "count": <number of meds in this category>,
            "medicines": ["<med name 1>", "<med name 2>"]
          }
        ],
        "symptomsAnalysis": {
          "probableSymptoms": ["<symptom 1>", "<symptom 2>"],
          "explanation": "<Why these symptoms might occur based on medicines/side effects>"
        },
        "diseaseRisk": {
          "ongoing": ["<Likely condition treated by current meds>"],
          "prevention": ["<What they are likely preventing>"]
        },
        "dietaryAdvice": [
          "<Specific food advice based on their medicines>",
          "<Nutritional gap analysis>"
        ],
        "nutritionTrends": [
          { "day": "Mon", "protein": 50, "carbs": 200, "fats": 60, "vitamins": 80 },
          { "day": "Tue", "protein": 55, "carbs": 180, "fats": 65, "vitamins": 85 },
          { "day": "Wed", "protein": 60, "carbs": 190, "fats": 55, "vitamins": 90 },
          { "day": "Thu", "protein": 52, "carbs": 210, "fats": 70, "vitamins": 75 },
          { "day": "Fri", "protein": 58, "carbs": 185, "fats": 60, "vitamins": 88 },
          { "day": "Sat", "protein": 65, "carbs": 220, "fats": 80, "vitamins": 95 },
          { "day": "Sun", "protein": 62, "carbs": 200, "fats": 75, "vitamins": 92 }
        ],
        "monthlyReport": {
          "month": "${new Date().toLocaleString('default', { month: 'long' })}",
          "insights": ["<Key insight 1>", "<Key insight 2>"],
          "actionItems": ["<Action 1>", "<Action 2>"]
        }
      }

      IMPORTANT: Return ONLY the JSON. Do not add markdown formatting like \`\`\`json.
    `;

    // 4. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use flash for speed/cost
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Parse JSON
    let analysisData;
    try {
      // Clean potential markdown code blocks
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      analysisData = JSON.parse(cleanText);
      
      // Save to DB
      const report = new HealthReport({
        user: userId,
        healthScore: analysisData.healthScore || 0,
        summary: analysisData.summary || "No summary generated",
        data: analysisData
      });
      await report.save();

      // Return the saved report structure (including ID)
      res.json({ success: true, data: analysisData, reportId: report._id });

    } catch (e) {
      console.error("Failed to parse AI response", text);
      return res.status(500).json({ success: false, message: "Failed to generate analysis." });
    }


  } catch (error) {
    console.error("Error in health review:", error);
    res.status(500).json({ success: false, message: "Server error during health review." });
  }
});

// --- Get Health Reports History ---
router.get("/health-reports", auth, async (req, res) => {
  try {
    const reports = await HealthReport.find({ user: req.user.id })
      .select("healthScore summary createdAt")
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
});

// --- Get Specific Health Report ---
router.get("/health-reports/:id", auth, async (req, res) => {
  try {
    const report = await HealthReport.findOne({ _id: req.params.id, user: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }
    res.json({ success: true, data: report.data });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report." });
  }
});

// Delete a health report
router.delete('/health-reports/:id', auth, async (req, res) => {
  try {
    const report = await HealthReport.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found or unauthorized." });
    }
    res.json({ success: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Failed to delete report." });
  }
});

module.exports = router;
