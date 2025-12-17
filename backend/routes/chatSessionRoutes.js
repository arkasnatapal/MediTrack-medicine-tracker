const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const ChatSession = require("../models/ChatSession");

// Get all sessions for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .select("_id title createdAt updatedAt");
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get full chat session
router.get("/:id", auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Rename chat session
router.put("/:id", auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title },
      { new: true }
    );

    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error renaming session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new empty chat session
router.post("/", auth, async (req, res) => {
  try {
    const session = await ChatSession.create({
      user: req.user.id,
      title: "New Chat",
      messages: [],
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Append message + auto-generate title on first user msg
router.post("/:id/message", auth, async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!role || !content) return res.status(400).json({ success: false });

    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });

    if (!session) return res.status(404).json({ success: false });

    session.messages.push({ role, content });

    // Update title if it's the first user message and title is still default
    if (session.messages.filter(m => m.role === 'user').length === 1 && role === "user") {
      try {
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
          
          // Retry logic for title generation
          let retries = 0;
          let success = false;
          while (retries < 3 && !success) {
            try {
              const result = await model.generateContent(`Summarize this chat message into a very short, concise title (max 5 words) for a chat history sidebar. Do not use quotes. Message: "${content}"`);
              const response = await result.response;
              session.title = response.text().trim();
              success = true;
            } catch (err) {
              if (err.status === 429 || (err.message && err.message.includes('429'))) {
                retries++;
                console.log(`Rate limit hit for title generation. Retrying (${retries}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * retries)); // Exponential backoff: 2s, 4s, 6s
              } else {
                throw err; // Re-throw other errors
              }
            }
          }
          
          if (!success) {
             console.warn("Failed to generate title after retries due to rate limit. Using fallback.");
             session.title = content.slice(0, 40);
          }

        } else {
          session.title = content.slice(0, 40);
        }
      } catch (err) {
        console.error("Error generating title:", err);
        session.title = content.slice(0, 40);
      }
    }

    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a chat session
router.delete("/:id", auth, async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });

    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
