import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
  Shield,
  Zap
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
      <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-slate-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">
              Connecting...
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
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500 font-sans">
      {/* Subtle Ambient Background - Reduced Color */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-slate-200/40 dark:bg-slate-800/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-slate-200/40 dark:bg-slate-800/20 blur-[120px]" />
      </div> */}

      <div className="relative z-10 p-6 md:p-10 h-screen overflow-y-auto custom-scrollbar">
        <motion.div
          className="max-w-7xl mx-auto space-y-12 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Minimalist Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200/50 dark:border-slate-800/50 pb-8"
          >
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-4"
              >
                <Shield className="w-3 h-3" />
                Family Circle
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
                Connected<span className="text-emerald-500 dark:text-emerald-600">.</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg font-medium leading-relaxed">
                Your health network. Manage permissions, share updates, and care for your loved ones in one secure space.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInviteModal(true)}
              className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <UserPlus className="h-5 w-5 relative z-10" />
              <span className="relative z-10 text-white dark:text-black">Invite Member</span>
            </motion.button>
          </motion.div>

          {/* Invitations Section - Clean Ticket Style */}
          {invitations.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Invites</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invitations.map((invite) => {
                  if (!invite.inviter) return null;
                  return (
                    <motion.div
                      key={invite._id}
                      whileHover={{ y: -4 }}
                      className="relative group overflow-hidden"
                    >
                      <div className="relative p-1 rounded-3xl bg-slate-200 dark:bg-slate-800 transition-colors group-hover:bg-slate-300 dark:group-hover:bg-slate-700">
                        <div className="bg-white dark:bg-slate-950 rounded-[1.3rem] p-6 relative overflow-hidden">
                          {/* Ticket Perforation Effect */}
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8FAFC] dark:bg-[#0B0F17] rounded-full" />
                          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8FAFC] dark:bg-[#0B0F17] rounded-full" />
                          
                          <div className="flex items-center justify-between pl-4">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-slate-900 shadow-lg">
                                  <UserAvatar user={invite.inviter} className="h-full w-full" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-md">
                                  <Mail className="w-3 h-3" />
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                  {invite.inviter.name || invite.inviter.email}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                  wants to add you as <span className="text-slate-900 dark:text-white font-bold">{invite.relationshipFromInviter || "Family"}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 pr-4">
                              <button
                                onClick={() => handleAccept(invite._id)}
                                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-emerald-500 dark:bg-slate-800 text-slate-600 hover:text-white dark:text-slate-400 flex items-center justify-center transition-all duration-300"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDecline(invite._id)}
                                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-red-500 dark:bg-slate-800 text-slate-600 hover:text-white dark:text-slate-400 flex items-center justify-center transition-all duration-300"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Main Grid */}
          <motion.div variants={itemVariants} className="space-y-8">
            {activeConnections.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your circle is empty</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                  Start building your health network by inviting family members to join.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-8 py-3 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                >
                  Send First Invite
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeConnections.map((connection) => {
                  const isInviter = connection.inviter?._id === user?._id;
                  const otherUser = isInviter ? connection.invitee : connection.inviter;
                  if (!otherUser) return null;

                  const relationship = isInviter ? connection.relationshipFromInviter : connection.relationshipFromInvitee;
                  const isOnline = otherUser.lastActive && new Date() - new Date(otherUser.lastActive) < 5 * 60 * 1000;

                  return (
                    <motion.div
                      key={connection._id}
                      whileHover={{ y: -10 }}
                      className="group relative"
                      onClick={() => navigate(`/family/member/${otherUser._id}`)}
                    >
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 rounded-[2.5rem] backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-xl transition-all duration-500 group-hover:shadow-2xl" />
                      
                      <div className="relative p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-lg ring-4 ring-white/50 dark:ring-slate-800/50 group-hover:scale-105 transition-transform duration-500">
                              <UserAvatar user={otherUser} className="h-full w-full" />
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/family/chat/${otherUser._id}`);
                              }}
                              className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative"
                            >
                              <MessageCircle className="w-4 h-4" />
                              {unreadCounts[otherUser._id] > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ connectionId: connection._id, memberName: otherUser.name || otherUser.email });
                              }}
                              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-red-500 flex items-center justify-center shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-auto">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {otherUser.name || "Family Member"}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 truncate">
                            {otherUser.email}
                          </p>
                          
                          {editingId === otherUser._id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(otherUser._id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <button onClick={() => handleSaveEdit(otherUser._id)} className="text-emerald-500"><Check className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider group/edit">
                              {relationship || "No Label"}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(otherUser._id, relationship || "");
                                }}
                                className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-emerald-500 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Activity
                          </span>
                          <span>View Profile →</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Pending Sent */}
          {pendingSent.length > 0 && (
            <motion.div variants={itemVariants} className="pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Pending Outgoing Invites</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingSent.map((invite) => (
                  <div key={invite._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{invite.inviteeEmail}</p>
                        <p className="text-xs text-slate-500">Waiting for response...</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCancelInviteConfirm({ id: invite._id, email: invite.inviteeEmail })}
                      className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl overflow-hidden"
            >
              {/* Subtle Header Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Invite Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none font-medium"
                    placeholder="name@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name (Opt)</label>
                    <input
                      type="text"
                      value={inviteData.name}
                      onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none font-medium"
                      placeholder="e.g. Mom"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relation</label>
                    <input
                      type="text"
                      required
                      value={inviteData.relationship}
                      onChange={(e) => setInviteData({ ...inviteData, relationship: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none font-medium"
                      placeholder="e.g. Mother"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? "Sending..." : "Send Invitation"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${deleteConfirm?.memberName}?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!cancelInviteConfirm}
        onClose={() => setCancelInviteConfirm(null)}
        onConfirm={handleCancelInvitation}
        title="Cancel Invite"
        message={`Cancel invitation to ${cancelInviteConfirm?.email}?`}
        confirmText="Yes, Cancel"
        cancelText="No"
        variant="warning"
      />
    </div>
  );
};

export default Family;
