const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const FamilyConnection = require("../models/FamilyConnection");
const User = require("../models/User");

// GET /api/chat/unread/count - get total unread messages count
router.get("/unread/count", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Message.countDocuments({
      to: userId,
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
});

// GET /api/chat/unread/by-user - get unread messages count grouped by sender
router.get("/unread/by-user", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Fetching unread counts for user:', userId);
    
    // Aggregate unread messages by sender
    const unreadByUser = await Message.aggregate([
      {
        $match: {
          to: userId,
          read: false
        }
      },
      {
        $group: {
          _id: "$from",
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Unread messages aggregation result:', unreadByUser);
    
    // Convert to object with userId as key
    const unreadCounts = {};
    unreadByUser.forEach(item => {
      unreadCounts[item._id.toString()] = item.count;
    });
    
    console.log('Unread counts object:', unreadCounts);
    
    res.json({ success: true, unreadCounts });
  } catch (err) {
    console.error("Error fetching unread by user:", err);
    res.status(500).json({ success: false, message: "Failed to fetch unread counts" });
  }
});

// GET /api/chat/:otherUserId - messages between me and other user
router.get("/:otherUserId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;

    // Mark messages from other user as read
    await Message.updateMany(
      { from: otherUserId, to: userId, read: false },
      { $set: { read: true } }
    );

    const [messages, otherUser] = await Promise.all([
      Message.find({
        $or: [
          { from: userId, to: otherUserId },
          { from: otherUserId, to: userId },
        ],
      })
        .sort({ createdAt: 1 })
        .lean(),
      User.findById(otherUserId).select('name email profilePictureUrl lastActive location')
    ]);

    res.json({ success: true, messages, otherUser });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
});

// POST /api/chat/:otherUserId - send a message
router.post("/:otherUserId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;
    const { body, familyConnectionId } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }

    const message = await Message.create({
      from: userId,
      to: otherUserId,
      body: body.trim(),
      familyConnection: familyConnectionId || null,
      read: false,
    });

    // In a real app with Socket.io, we would emit a 'new_message' event here
    // For now, the polling on the frontend will pick it up

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

module.exports = router;
