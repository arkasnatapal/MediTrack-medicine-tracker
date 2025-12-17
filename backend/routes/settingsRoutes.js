const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const auth = require("../middleware/authMiddleware"); // Assuming this is the correct path, verifying next

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

// Cloudinary storage config for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "meditrack/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${req.user._id}-${Date.now()}`, // unique per upload
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    };
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// GET /api/settings - Get current user profile + settings
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/settings - Update profile + settings
router.put("/", auth, async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      gender,
      dateOfBirth,
      address,
      timezone,
      settings,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update profile fields
    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address;
    if (timezone) user.timezone = timezone;

    // Ensure settings objects exist
    if (!user.settings) user.settings = {};
    if (!user.settings.notifications) user.settings.notifications = {};
    if (!user.settings.appearance) user.settings.appearance = {};
    if (!user.settings.privacy) user.settings.privacy = {};
    if (!user.settings.security) user.settings.security = {};

    // Update settings fields (deep merge)
    if (settings) {
      if (settings.notifications) {
        user.settings.notifications = { ...user.settings.notifications, ...settings.notifications };
      }
      if (settings.appearance) {
        user.settings.appearance = { ...user.settings.appearance, ...settings.appearance };
      }
      if (settings.privacy) {
        user.settings.privacy = { ...user.settings.privacy, ...settings.privacy };
      }
      if (settings.security) {
        // Only update non-sensitive security settings here (like 2FA toggle)
        if (settings.security.twoFactorEnabled !== undefined) {
            user.settings.security.twoFactorEnabled = settings.security.twoFactorEnabled;
        }
      }
    }

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/settings/password - Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide both current and new password" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/settings/avatar - Upload profile picture
router.post("/avatar", auth, (req, res) => {
  const upload = avatarUpload.single("avatar");

  upload(req, res, async (err) => {
    if (err) {
      console.error("Avatar upload error:", err);
      // Check for Cloudinary specific errors or missing config
      if (err.message && err.message.includes("Cloudinary")) {
        return res.status(500).json({ success: false, message: "Cloudinary configuration error. Please check server logs." });
      }
      return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    }

    try {
      if (!req.file || !req.file.path) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePictureUrl: imageUrl },
        { new: true }
      ).select("name email profilePictureUrl");

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: "Profile picture updated",
        profilePictureUrl: user.profilePictureUrl,
        user,
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ success: false, message: "Failed to update profile picture" });
    }
  });
});

// DELETE /api/settings/account - Delete account
router.delete("/account", auth, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (!confirm) {
      return res.status(400).json({ success: false, message: "Please confirm account deletion" });
    }

    // Delete user
    const userId = req.user._id;

    // 1. Delete Reminders & Calendar Events
    const Reminder = require("../models/Reminder");
    const { deleteCalendarEvent } = require("../utils/googleCalendar");
    
    const reminders = await Reminder.find({
      $or: [{ createdBy: userId }, { targetUser: userId }]
    });

    for (const reminder of reminders) {
      if (reminder.googleEventId) {
        try {
          await deleteCalendarEvent(userId, reminder.googleEventId);
        } catch (calErr) {
          console.error(`Failed to delete calendar event for reminder ${reminder._id}:`, calErr);
        }
      }
    }
    await Reminder.deleteMany({ $or: [{ createdBy: userId }, { targetUser: userId }] });

    // 2. Delete Medicines
    const Medicine = require("../models/Medicine");
    await Medicine.deleteMany({ userId: userId });

    // 3. Delete Family Connections
    const FamilyConnection = require("../models/FamilyConnection");
    await FamilyConnection.deleteMany({
      $or: [{ inviter: userId }, { invitee: userId }]
    });

    // 4. Delete Notifications
    const Notification = require("../models/Notification");
    await Notification.deleteMany({ user: userId });

    // 5. Delete Chat Sessions & Messages
    try {
      const ChatSession = require("../models/ChatSession");
      const Message = require("../models/Message");
      
      // Find sessions where user is a participant (assuming userId field or similar)
      // Based on typical schema, sessions usually have a userId field
      await ChatSession.deleteMany({ userId: userId });
      // Messages might be linked to sessions or user directly. 
      // If messages are linked to sessions, they are orphaned if we don't delete them, 
      // but usually deleting the session is enough if the app queries by session.
      // However, let's try to be thorough if possible.
      // Assuming Message has userId (sender)
      await Message.deleteMany({ sender: userId });
    } catch (chatErr) {
      console.warn("Chat cleanup failed (models might be missing or different):", chatErr.message);
    }

    // 6. Delete Pending Reminders (Offline sync)
    try {
      const PendingReminder = require("../models/PendingReminder");
      await PendingReminder.deleteMany({ userId: userId });
    } catch (pendingErr) {
        // Ignore if model doesn't exist
    }

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Account and all associated data deleted successfully" });

  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/settings/ai-food-access - Toggle AI access to food chart
router.post("/ai-food-access", auth, async (req, res) => {
  try {
    const { allow } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    // Ensure settings object exists
    if (!user.settings) user.settings = {};
    
    user.settings.allowAIAccessToFoodChart = !!allow;
    await user.save();
    
    res.json({ success: true, allow: user.settings.allowAIAccessToFoodChart });
  } catch(err) {
    console.error("Error updating AI access setting:", err);
    res.status(500).json({ success: false, message: "Failed to update setting" });
  }
});

module.exports = router;
