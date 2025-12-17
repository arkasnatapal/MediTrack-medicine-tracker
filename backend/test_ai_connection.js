require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  console.log("Starting AI Connection Test...");
  const key = process.env.GEMINI_API_CHAT_KEY;
  if (!key) {
    console.error("❌ GEMINI_API_CHAT_KEY is missing in .env");
    return;
  }
  console.log("✅ Key found (length: " + key.length + ")");

  const genAI = new GoogleGenerativeAI(key);
  
  // Test the current problematic model
  const modelName = "gemini-2.0-flash"; 
  console.log(`Testing model: ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    console.log("✅ Response received:", response.text());
  } catch (error) {
    console.error("❌ Error with " + modelName + ":", error.message);
    
    // Fallback test
    console.log("\n--- Retrying with fallback model: gemini-1.5-flash ---");
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const fallbackResult = await fallbackModel.generateContent("Hello, are you working?");
        const fallbackResponse = await fallbackResult.response;
        console.log("✅ Response received with gemini-1.5-flash:", fallbackResponse.text());
    } catch (fallbackError) {
        console.error("❌ Error with gemini-1.5-flash:", fallbackError.message);
    }
  }
}

test();
