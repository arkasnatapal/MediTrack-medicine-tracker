const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const FamilyConnection = require("../models/FamilyConnection");
const Message = require("../models/Message");
const { sendFamilyInviteEmail } = require("../utils/email");

// GET /api/family - my connections (as inviter or invitee)
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await FamilyConnection.find({
      $or: [{ inviter: userId }, { invitee: userId }, { inviteeEmail: req.user.email }],
      status: { $ne: "removed" },
    })
      .populate("inviter", "name email profilePictureUrl lastActive")
      .populate("invitee", "name email profilePictureUrl lastActive")
      .sort({ createdAt: -1 });

    res.json({ success: true, connections });
  } catch (err) {
    console.error("Error loading family connections:", err);
    res.status(500).json({ success: false, message: "Failed to load family connections" });
  }
});

// POST /api/family/invite
router.post("/invite", auth, async (req, res) => {
  try {
    const { email, name, relationship } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!relationship || relationship.trim() === "") {
      return res.status(400).json({ success: false, message: "Relationship is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: "You cannot invite yourself" });
    }

    const inviterUser = await User.findById(req.user.id);
    if (!inviterUser) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    const existingConn = await FamilyConnection.findOne({
      inviter: req.user.id,
      inviteeEmail: normalizedEmail,
      status: { $in: ["invited", "pending_acceptance", "active"] },
    });

    if (existingConn) {
      return res.status(400).json({ success: false, message: "Invitation already sent or active" });
    }

    const connection = await FamilyConnection.create({
      inviter: req.user.id,
      invitee: existingUser ? existingUser._id : null,
      inviteeEmail: normalizedEmail,
      relationshipFromInviter: relationship || "",
      status: existingUser ? "pending_acceptance" : "invited",
      invitedAt: new Date(),
    });

    await sendFamilyInviteEmail({
      to: normalizedEmail,
      inviterName: inviterUser.name || inviterUser.email,
      familyConnectionId: connection._id.toString(),
    });

    // Create in-app notification if user exists
    if (existingUser) {
      const Notification = require("../models/Notification");
      await Notification.create({
        user: existingUser._id,
        type: "family_invitation",
        title: "Family Invitation",
        message: `${inviterUser.name || inviterUser.email} has invited you to join their family.`,
        severity: "info",
        meta: {
          invitationId: connection._id,
          inviterId: inviterUser._id,
          inviterName: inviterUser.name || inviterUser.email
        }
      });
    }

    res.status(201).json({ success: true, connection });
  } catch (err) {
    console.error("Error inviting family member:", err);
    res.status(500).json({ success: false, message: "Failed to invite family member" });
  }
});

// GET /api/family/invitations - invitations for me (invitee)
router.get("/invitations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const invites = await FamilyConnection.find({
      $or: [
        { inviteeEmail: user.email.toLowerCase(), status: { $in: ["invited", "pending_acceptance"] } },
        { invitee: user._id, status: { $in: ["invited", "pending_acceptance"] } },
      ],
    })
      .populate("inviter", "name email profilePictureUrl lastActive")
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations: invites });
  } catch (err) {
    console.error("Error fetching invitations:", err);
    res.status(500).json({ success: false, message: "Failed to load invitations" });
  }
});

// POST /api/family/invitations/:id/accept
router.post("/invitations/:id/accept", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const connection = await FamilyConnection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    const emailMatch = connection.inviteeEmail === user.email.toLowerCase();
    const userMatch = connection.invitee && connection.invitee.toString() === user._id.toString();

    if (!emailMatch && !userMatch) {
      return res.status(403).json({ success: false, message: "Not authorized for this invitation" });
    }

    connection.invitee = user._id;
    connection.status = "active";
    connection.acceptedAt = new Date();
    await connection.save();

    res.json({ success: true, connection });
  } catch (err) {
    console.error("Error accepting invitation:", err);
    res.status(500).json({ success: false, message: "Failed to accept invitation" });
  }
});

// POST /api/family/invitations/:id/decline
router.post("/invitations/:id/decline", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const connection = await FamilyConnection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    const emailMatch = connection.inviteeEmail === user.email.toLowerCase();
    const userMatch = connection.invitee && connection.invitee.toString() === user._id.toString();

    if (!emailMatch && !userMatch) {
      return res.status(403).json({ success: false, message: "Not authorized for this invitation" });
    }

    connection.status = "declined";
    await connection.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Error declining invitation:", err);
    res.status(500).json({ success: false, message: "Failed to decline invitation" });
  }
});

// GET /api/family/:id - get detailed profile of a family member
router.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const memberId = req.params.id;

    // Verify connection exists
    const connection = await FamilyConnection.findOne({
      $or: [
        { inviter: userId, invitee: memberId },
        { inviter: memberId, invitee: userId },
      ],
      status: "active",
    });

    if (!connection) {
      return res.status(403).json({ success: false, message: "Not connected to this user" });
    }

    const member = await User.findById(memberId).select(
      "name email profilePictureUrl phoneNumber location lastActive createdAt"
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch medicines for this user (simplified for now, can be expanded)
    const Medicine = require("../models/Medicine");
    const Reminder = require("../models/Reminder");
    
    const medicinesRaw = await Medicine.find({ userId: memberId }).select(
      "name dosage frequency quantity expiryDate"
    );

    const medicines = await Promise.all(medicinesRaw.map(async (m) => {
      const reminders = await Reminder.find({ 
        medicine: m._id, 
        targetUser: memberId,
        active: true 
      }).select("times daysOfWeek");

      return {
        ...m.toObject(),
        currentStock: m.quantity,
        totalStock: m.quantity, // Since we don't track total separately yet
        reminders: reminders
      };
    }));

    // Calculate basic stats
    const stats = {
      totalMedicines: medicines.length,
      lowStock: medicines.filter(m => m.currentStock <= 5).length,
      expired: medicines.filter(m => new Date(m.expiryDate) < new Date()).length,
    };

    // Merge connection details into member object
    const memberObj = member.toObject();
    memberObj.allowAiActions = connection.allowAiActions;

    res.json({ success: true, member: memberObj, medicines, stats });
  } catch (err) {
    console.error("Error fetching family member profile:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// PUT /api/family/:id - update family connection details (e.g. allowAiActions)
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const memberId = req.params.id;
    const { allowAiActions, relationship } = req.body;

    // Find the active connection
    const connection = await FamilyConnection.findOne({
      $or: [
        { inviter: userId, invitee: memberId },
        { inviter: memberId, invitee: userId },
      ],
      status: "active",
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    // Update fields
    if (allowAiActions !== undefined) {
      connection.allowAiActions = allowAiActions;
    }

    if (relationship !== undefined) {
      if (connection.inviter.toString() === userId) {
        connection.relationshipFromInviter = relationship;
      } else if (connection.invitee.toString() === userId) {
        connection.relationshipFromInvitee = relationship;
      }
    }

    await connection.save();

    res.json({ success: true, connection });
  } catch (err) {
    console.error("Error updating family connection:", err);
    res.status(500).json({ success: false, message: "Failed to update connection" });
  }
});

// DELETE /api/family/:connectionId - remove a family connection
router.delete("/:connectionId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const connectionId = req.params.connectionId;

    const connection = await FamilyConnection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }

    // Verify the user is part of this connection
    const isInviter = connection.inviter.toString() === userId;
    const isInvitee = connection.invitee && connection.invitee.toString() === userId;

    if (!isInviter && !isInvitee) {
      return res.status(403).json({ success: false, message: "Not authorized to remove this connection" });
    }

    // Soft delete - set status to removed
    connection.status = "removed";
    connection.removedAt = new Date();
    connection.removedBy = userId;
    await connection.save();

    // Delete chat history between these two users
    const otherUserId = isInviter ? connection.invitee : connection.inviter;
    if (otherUserId) {
      await Message.deleteMany({
        $or: [
          { from: userId, to: otherUserId },
          { from: otherUserId, to: userId }
        ]
      });
    }

    res.json({ success: true, message: "Family member removed successfully" });
  } catch (err) {
    console.error("Error removing family connection:", err);
    res.status(500).json({ success: false, message: "Failed to remove family member" });
  }
});

// DELETE /api/family/invitations/:id - cancel a sent invitation
router.delete("/invitations/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const invitationId = req.params.id;

    const connection = await FamilyConnection.findById(invitationId);

    if (!connection) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    // Only the inviter can cancel their sent invitation
    if (connection.inviter.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this invitation" });
    }

    // Can only cancel if status is invited or pending_acceptance
    if (connection.status !== "invited" && connection.status !== "pending_acceptance") {
      return res.status(400).json({ success: false, message: "Cannot cancel this invitation" });
    }

    // Soft delete - set status to removed
    connection.status = "removed";
    connection.removedAt = new Date();
    connection.removedBy = userId;
    await connection.save();

    res.json({ success: true, message: "Invitation canceled successfully" });
  } catch (err) {
    console.error("Error canceling invitation:", err);
    res.status(500).json({ success: false, message: "Failed to cancel invitation" });
  }
});

module.exports = router;
