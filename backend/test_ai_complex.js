require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Mocking the backend logic to see what it returns
async function testBackendLogic() {
  console.log("Starting Complex AI Test...");
  const key = process.env.GEMINI_API_CHAT_KEY;
  if (!key) {
    console.error("❌ GEMINI_API_CHAT_KEY is missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage("Hello");
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Raw Response:", text);

    // Simulate what the backend sends
    const backendResponse = { success: true, reply: text };
    console.log("Backend sends:", JSON.stringify(backendResponse));

    // Simulate what frontend expects
    if (!backendResponse.success) {
        console.error("❌ Frontend check failed: data.success is missing/false");
    } else {
        console.log("✅ Frontend check passed: data.success is true");
    }
    if (!backendResponse.reply) {
        console.error("❌ Frontend check failed: data.reply is missing");
    } else {
        console.log("✅ Frontend check passed: data.reply is present");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testBackendLogic();
