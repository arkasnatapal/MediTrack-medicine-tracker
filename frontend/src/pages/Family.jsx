import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Mail,
  Check,
  X,
  Trash2,
  Send,
  MessageCircle,
  Sparkles,
  Pencil,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  getFamilyConnections,
  getInvitations,
  inviteFamilyMember,
  acceptInvitation,
  declineInvitation,
  removeFamilyMember,
  cancelInvitation,
  updateFamilyMember,
} from "../api/family";
import { getUnreadByUser } from "../api/chat";
import UserAvatar from "../components/UserAvatar";
import ConfirmDialog from "../components/ConfirmDialog";

const Family = () => {
  const [connections, setConnections] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    name: "",
    relationship: "",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cancelInviteConfirm, setCancelInviteConfirm] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [connectionsData, invitationsData] = await Promise.all([
        getFamilyConnections(),
        getInvitations(),
      ]);
      setConnections(connectionsData.connections);
      setInvitations(invitationsData.invitations);

      try {
        const unreadData = await getUnreadByUser();
        setUnreadCounts(unreadData.unreadCounts || {});
      } catch (unreadErr) {
        console.error("Error fetching unread counts:", unreadErr);
        setUnreadCounts({});
      }
    } catch (err) {
      console.error("Error fetching family data:", err);
      notify.error("Failed to load family data");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);

    const normalizedEmail = inviteData.email.toLowerCase().trim();

    const existingConnection = connections.find((c) => {
      const isInviter = c.inviter?._id === user?._id;
      const otherUser = isInviter ? c.invitee : c.inviter;
      return (
        otherUser?.email?.toLowerCase() === normalizedEmail &&
        c.status === "active"
      );
    });

    if (existingConnection) {
      notify.error("This person is already in your family!");
      setInviteLoading(false);
      return;
    }

    const pendingInvite = connections.find(
      (c) =>
        c.inviter?._id === user?._id &&
        c.inviteeEmail?.toLowerCase() === normalizedEmail &&
        (c.status === "invited" || c.status === "pending_acceptance")
    );

    if (pendingInvite) {
      notify.error("You have already sent an invitation to this email!");
      setInviteLoading(false);
      return;
    }

    try {
      await inviteFamilyMember(inviteData);
      notify.success("Invitation sent successfully!");
      setShowInviteModal(false);
      setInviteData({ email: "", name: "", relationship: "" });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptInvitation(id);
      notify.success("Invitation accepted!");
      fetchData();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to accept invitation"
      );
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineInvitation(id);
      notify.success("Invitation declined");
      fetchData();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to decline invitation"
      );
    }
  };

  const handleRemove = async () => {
    if (!deleteConfirm) return;

    try {
      await removeFamilyMember(deleteConfirm.connectionId);
      notify.success(`${deleteConfirm.memberName} removed from your family`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to remove family member"
      );
      setDeleteConfirm(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancelInviteConfirm) return;

    try {
      await cancelInvitation(cancelInviteConfirm.id);
      notify.success("Invitation canceled successfully");
      setCancelInviteConfirm(null);
      fetchData();
    } catch (err) {
      notify.error(
        err.response?.data?.message || "Failed to cancel invitation"
      );
      setCancelInviteConfirm(null);
    }
  };

  const handleStartEdit = (id, currentVal) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateFamilyMember(id, { relationship: editValue });
      notify.success("Relationship updated");
      setEditingId(null);
      fetchData();
    } catch (err) {
      notify.error("Failed to update relationship");
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Loading family...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeConnections = Array.isArray(connections)
    ? connections.filter((c) => c.status === "active")
    : [];
  const pendingSent = Array.isArray(connections)
    ? connections.filter(
        (c) =>
          c.inviter?._id === user._id &&
          c.status !== "active" &&
          c.status !== "removed"
      )
    : [];

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10 h-screen overflow-y-auto scrollbar-hide">
        <motion.div
          className="max-w-7xl mx-auto space-y-8 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3">
                <Users className="h-8 w-8 text-emerald-500" />
                My Family
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                Manage your family connections and invitations
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="group relative px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <UserPlus className="h-5 w-5" />
              <span>Invite Member</span>
            </button>
          </motion.div>

          {/* Stats */}
          {activeConnections.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 px-2"
            >
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {activeConnections.length} family{" "}
                {activeConnections.length === 1 ? "member" : "members"}
              </p>
            </motion.div>
          )}

          {/* Invitations For Me */}
          {invitations.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" />
                Invitations For You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((invite) => {
                  if (!invite.inviter) return null;
                  return (
                    <motion.div
                      key={invite._id}
                      whileHover={{ y: -4 }}
                      className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/20">
                            <UserAvatar
                              user={invite.inviter}
                              className="h-full w-full"
                              fallbackType="initial"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-900 dark:text-white font-semibold">
                              {invite.inviter.name || invite.inviter.email}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              invited you to join their family
                            </p>
                            {invite.relationshipFromInviter && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                                Relationship: {invite.relationshipFromInviter}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(invite._id)}
                            className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:scale-110"
                            title="Accept"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDecline(invite._id)}
                            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-110"
                            title="Decline"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Active Connections */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Family Members
            </h2>
            {activeConnections.length === 0 ? (
              <div className="text-center py-16 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700">
                <Users className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                  No family members yet
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-4 px-6 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors inline-flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Your First Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeConnections.map((connection) => {
                  const isInviter = connection.inviter?._id === user?._id;
                  const otherUser = isInviter
                    ? connection.invitee
                    : connection.inviter;

                  if (!otherUser) return null;

                  const relationship = isInviter
                    ? connection.relationshipFromInviter
                    : connection.relationshipFromInvitee;
                  const isOnline =
                    otherUser.lastActive &&
                    new Date() - new Date(otherUser.lastActive) < 5 * 60 * 1000;

                  return (
                    <motion.div
                      key={connection._id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="group relative cursor-pointer"
                      onClick={() =>
                        navigate(`/family/member/${otherUser._id}`)
                      }
                    >
                      {/* Glowing Border Effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />

                      {/* Card Container */}
                      <div className="relative h-full p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                          <Users className="w-full h-full transform rotate-12" />
                        </div>

                        
                        <div className="relative z-10 flex items-center gap-4 mb-4">
                          <div className="relative h-16 w-16 rounded-full border-4 border-emerald-500/20 shadow-lg">
                            <UserAvatar
                              user={otherUser}
                              className="h-full w-full rounded-full"
                              fallbackType="initial"
                            />
                            
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                            )}
                          
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {otherUser.name || otherUser.email}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                              {otherUser.email}
                            </p>
                            {editingId === otherUser._id ? (
                              <div
                                className="flex items-center gap-2 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="text-xs px-2 py-1 rounded-lg border border-emerald-500/30 bg-white/50 dark:bg-black/20 focus:outline-none focus:border-emerald-500 w-24 text-slate-900 dark:text-white"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveEdit(otherUser._id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveEdit(otherUser._id)}
                                  className="p-1 rounded-full hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-600 transition-colors"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 rounded-full hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group/edit mt-1">
                                {relationship ? (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    {relationship}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">
                                    No relationship set
                                  </p>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(
                                      otherUser._id,
                                      relationship || ""
                                    );
                                  }}
                                  className="opacity-0 group-hover/edit:opacity-100 transition-all duration-200 text-slate-400 hover:text-emerald-500 hover:scale-110 p-1"
                                  title="Edit Relationship"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="relative z-10 flex gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/family/chat/${otherUser._id}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-200 hover:scale-105 relative"
                            title="Chat"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">Chat</span>
                            {unreadCounts[otherUser._id] > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                                {unreadCounts[otherUser._id] > 9
                                  ? "9+"
                                  : unreadCounts[otherUser._id]}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                connectionId: connection._id,
                                memberName: otherUser.name || otherUser.email,
                              });
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-all duration-200 hover:scale-105"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Pending Sent Invitations */}
          {pendingSent.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-500" />
                Pending Sent Invitations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingSent.map((invite) => (
                  <motion.div
                    key={invite._id}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
                          <Mail className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {invite.inviteeEmail}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            Status:{" "}
                            {invite.status?.replace("_", " ") || "Pending"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setCancelInviteConfirm({
                            id: invite._id,
                            email: invite.inviteeEmail,
                          })
                        }
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-110"
                        title="Cancel Invitation"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Invite Family Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="their.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteData.name}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. Mom"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={inviteData.relationship}
                  onChange={(e) =>
                    setInviteData({
                      ...inviteData,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. Mother"
                />
              </div>
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Family Member Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleRemove}
        title="Remove Family Member?"
        message={`Are you sure you want to remove ${deleteConfirm?.memberName} from your family? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Cancel Invitation Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelInviteConfirm}
        onClose={() => setCancelInviteConfirm(null)}
        onConfirm={handleCancelInvitation}
        title="Cancel Invitation?"
        message={`Are you sure you want to cancel the invitation sent to ${cancelInviteConfirm?.email}?`}
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        variant="warning"
      />
    </div>
  );
};

export default Family;
