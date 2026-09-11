require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel() {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    console.log(`Testing model (${modelName})...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_CHAT_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Hello, are you operational?");
        console.log("Success! Response:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-2.5-flash:");
        console.error(error.message);
        
        console.log("\nTesting fallback to gemini-1.5-flash...");
        const modelFallback = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const result2 = await modelFallback.generateContent("Hello?");
            console.log("Success with gemini-1.5-flash!");
        } catch (err2) {
            console.error("Error with gemini-1.5-flash:", err2.message);
        }
    }
}

testModel();
