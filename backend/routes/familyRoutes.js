const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const FamilyConnection = require("../models/FamilyConnection");
const Message = require("../models/Message");
const PendingReminder = require("../models/PendingReminder");
const { sendFamilyInviteEmail } = require("../utils/email");
const { generateHealthIntelligence } = require("../controllers/intelligenceController");


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

// GET /api/family/quick-overview - Get quick overview of family members
router.get("/quick-overview", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching family overview for user: ${userId}`);

    // 1. Fetch active and pending connections
    const connections = await FamilyConnection.find({
      $or: [{ inviter: userId }, { invitee: userId }],
      status: { $in: ["active", "invited", "pending_acceptance"] },
    })
      .populate("inviter", "name email profilePictureUrl lastActive")
      .populate("invitee", "name email profilePictureUrl lastActive");

    console.log(`Found ${connections.length} connections`);

    // 2. Process each connection to get member details
    const members = await Promise.all(
      connections.map(async (conn) => {
        const isInviter = conn.inviter._id.toString() === userId;
        // If I am inviter, member is invitee. If I am invitee, member is inviter.
        let member = isInviter ? conn.invitee : conn.inviter;
        
        // Handle case where member is null (populated user not found or invited by email)
        if (!member) {
            // If I am the inviter, I can use the inviteeEmail from the connection
            if (isInviter && conn.inviteeEmail) {
                return {
                    id: conn._id, // Use connection ID as temporary ID
                    name: conn.inviteeEmail.split('@')[0], // Guess name from email
                    email: conn.inviteeEmail,
                    avatar: null,
                    lastActive: null,
                    unreadMessages: 0,
                    nextReminder: null,
                    relationship: conn.relationshipFromInviter,
                    status: conn.status // Pass status to frontend
                };
            }
            // If I am the invitee, and inviter is missing, that's a bigger issue (orphan connection)
            // But we can try to handle it if needed. For now, let's log it.
            console.log("Member (inviter/invitee) not found for connection:", conn._id);
            return null;
        }

        // 3. Get unread messages count
        const unreadCount = await Message.countDocuments({
          from: member._id,
          to: userId,
          read: false,
        });

        // 4. Get next upcoming reminder
        const Reminder = require("../models/Reminder");
        const nextReminder = await Reminder.findOne({
          targetUser: member._id,
          active: true,
        }).select("medicineName times daysOfWeek");

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          avatar: member.profilePictureUrl,
          lastActive: member.lastActive,
          unreadMessages: unreadCount,
          nextReminder: nextReminder,
          relationship: isInviter ? conn.relationshipFromInviter : conn.relationshipFromInvitee,
          status: conn.status
        };
      })
    );

    // Filter out nulls
    const validMembers = members.filter(m => m !== null);
    console.log(`Returning ${validMembers.length} valid members`);

    res.json({ success: true, members: validMembers });
  } catch (err) {
    console.error("Error fetching family overview:", err);
    res.status(500).json({ success: false, message: "Failed to load family overview" });
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
      "name dosage frequency quantity expiryDate description"
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

    // Fetch today's medication status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const medicationStatus = await PendingReminder.find({
      user: memberId,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    }).select("medicineName scheduledTime status confirmedAt dismissedAt")
      .sort({ scheduledTime: 1 })
      .lean();

    res.json({ success: true, member: memberObj, medicines, stats, medicationStatus });
  } catch (err) {
    console.error("Error fetching family member profile:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// GET /api/family/:id/health-review - Get health intelligence for a family member
router.get("/:id/health-review", auth, async (req, res) => {
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

    // Reuse the intelligence generator logic
    // This will fetch or generate the snapshot for the MEMBER ID
    const result = await generateHealthIntelligence(memberId, false);
    
    // If no snapshot exists (and none could be generated), return empty
    if (!result || !result.snapshot) {
       return res.status(200).json({ success: true, exists: false, message: "No intelligence data available" });
    }

    res.json({ success: true, exists: true, data: result.snapshot });
  } catch (err) {
    console.error("Error fetching family health review:", err);
    res.status(500).json({ success: false, message: "Failed to load health review" });
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
