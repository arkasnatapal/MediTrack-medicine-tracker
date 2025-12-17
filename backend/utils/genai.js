const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_FAMILY_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_FAMILY_KEY)
  : null;

const MODEL_NAME = "gemini-2.0-flash";

async function parseInstruction(instruction) {
  if (!genAI) {
    return { error: "AI not configured" };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: `
You are MediTrack AI parser. Parse the user's instruction into strict JSON with these fields:
- action: one of ["create_reminder","cancel_reminder","query"]
- targetRelation: e.g. "dad","mom","wife","son"
- targetName: optional
- medicineName: e.g. "PAN40"
- datetimeISO: ISO 8601 or null (use current year if not specified, assume future date)
- recurrenceRule: optional RRULE string or null
- confirmable: boolean (if further confirmation needed)
Return only JSON object without any extra text. If you cannot parse, return {"error":"reason"}.
`,
  });

  const prompt = `Instruction: ${instruction}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up markdown code blocks if present
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error parsing instruction:", error);
    return { error: "Failed to parse instruction" };
  }
}

module.exports = {
  parseInstruction,
};
