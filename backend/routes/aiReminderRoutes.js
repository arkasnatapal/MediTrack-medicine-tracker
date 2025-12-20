const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const FamilyConnection = require("../models/FamilyConnection");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai-reminders/parse
router.post("/parse", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Fetch user's family connections
    const familyConnections = await FamilyConnection.find({
      $or: [{ user: userId }, { connectedUser: userId }],
      status: "accepted",
    })
      .populate("user", "name email")
      .populate("connectedUser", "name email")
      .lean();

    // Build family context
    const familyMembers = familyConnections.map((conn) => {
      const isUser = conn.user._id.toString() === userId;
      const member = isUser ? conn.connectedUser : conn.user;
      const relationship = isUser ? conn.relationship : conn.reverseRelationship || conn.relationship;
      
      return {
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        relationship: relationship || "family member",
      };
    });

    // Build system prompt
    const systemPrompt = `You are an AI assistant for a medication reminder app called MediTrack.
Your task is to parse natural language requests to set medication reminders.

The user can set reminders for themselves or for family members.

Family members available:
${familyMembers.length > 0 ? familyMembers.map(m => `- ${m.name} (${m.relationship}), ID: ${m.id}`).join('\n') : '(No family members)'}

When the user mentions a family member (e.g., "my dad", "mom", "brother"), try to match it to the relationship field (case-insensitive).

If exactly one match is found, return that family member's ID.
If multiple matches are found, return all candidates so the user can choose.
If no match is found, return an error.

Your response must be valid JSON with this structure:
{
  "action": "propose_reminder",
  "targetType": "self" | "family",
  "targetUserId": "<user_id>",
  "candidates": [{ "id": "<id>", "name": "<name>", "relationship": "<rel>" }],
  "needsDisambiguation": true | false,
  "parsedSchedule": {
    "times": ["HH:MM", ...],
    "daysOfWeek": ["Mon", "Tue", ...],
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD" or null
  },
  "naturalLanguage": "A human-readable summary of the reminder (Friendly and reassuring tone)"
}

Example user input: "Set a reminder for my dad to take his heart medicine at 9 PM every day."
Example response:
{
  "action": "propose_reminder",
  "targetType": "family",
  "targetUserId": "abc123",
  "candidates": [],
  "needsDisambiguation": false,
  "parsedSchedule": {
    "times": ["21:00"],
    "daysOfWeek": [],
    "startDate": "${new Date().toISOString().split('T')[0]}",
    "endDate": null
  },
  "naturalLanguage": "I've set a reminder for your dad to take his heart medicine at 9 PM every day. I'll make sure he remembers!"
}

IMPORTANT: Only return valid JSON. Do not include any other text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User request: ${message}` },
    ]);

    const responseText = result.response.text();
    
    // Try to parse JSON from response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseErr) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    res.json({ success: true, data: parsedResponse });
  } catch (err) {
    console.error("Error in AI reminder parsing:", err);
    res.status(500).json({ success: false, message: "Failed to parse reminder request" });
  }
});

module.exports = router;
