import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  MapPin,
  Clock,
  Phone,
  Mail,
  Calendar,
  Pill,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
} from "lucide-react";
import { getFamilyMemberDetails } from "../api/family";
import Loader from "../components/Loader";
import UserAvatar from "../components/UserAvatar";
import { useNotification } from "../context/NotificationContext";

const FamilyMemberProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { notify } = useNotification();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getFamilyMemberDetails(userId);
        setMember(data.member);
        setMedicines(data.medicines);
        setStats(data.stats);
      } catch (err) {
        console.error("Error fetching member details:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  const formatLastActive = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 5 * 60 * 1000) return "Active now";
    return `Last seen ${date.toLocaleDateString()} ${date.toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    )}`;
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
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <p className="text-red-500 text-lg font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Member not found
          </p>
        </div>
      </div>
    );
  }

  const isOnline =
    member.lastActive &&
    new Date() - new Date(member.lastActive) < 5 * 60 * 1000;

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
          {/* Back Button */}
          <motion.button
            variants={itemVariants}
            onClick={() => navigate("/family")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Family</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile Card */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-1 space-y-6"
            >
              <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-8 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-lg">
                    <UserAvatar
                      user={member}
                      className="h-full w-full text-5xl"
                      fallbackType="initial"
                    />
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {member.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  {member.email}
                </p>

                <button
                  onClick={() => navigate(`/family/chat/${userId}`)}
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-6"
                >
                  <MessageCircle className="h-5 w-5" />
                  Message
                </button>

                <div className="w-full space-y-4 text-left border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Last Active
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatLastActive(member.lastActive)}
                      </p>
                    </div>
                  </div>

                  {member.location && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Location
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {member.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {member.phoneNumber && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Phone
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {member.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Member Since
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Consent Toggle */}
                <div className="w-full border-t border-slate-200/50 dark:border-slate-700/50 pt-6 mt-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Allow AI Actions
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Let family use AI to set reminders for you
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={member.allowAiActions || false}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          // Optimistic update
                          setMember((prev) => ({
                            ...prev,
                            allowAiActions: newValue,
                          }));
                          try {
                            const { updateFamilyMember } = await import(
                              "../api/family"
                            );
                            await updateFamilyMember(member._id, {
                              allowAiActions: newValue,
                            });
                            notify.success(
                              newValue
                                ? "AI actions enabled"
                                : "AI actions disabled"
                            );
                          } catch (err) {
                            console.error("Failed to update consent:", err);
                            setMember((prev) => ({
                              ...prev,
                              allowAiActions: !newValue,
                            })); // Revert
                            notify.error("Failed to update consent");
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Medicine Inventory & Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-4"
              >
                <StatCard
                  title="Total Medicines"
                  value={stats?.totalMedicines || 0}
                  icon={Pill}
                  color="blue"
                />
                <StatCard
                  title="Low Stock"
                  value={stats?.lowStock || 0}
                  icon={AlertTriangle}
                  color="yellow"
                  alert={stats?.lowStock > 0}
                />
                <StatCard
                  title="Expired"
                  value={stats?.expired || 0}
                  icon={AlertTriangle}
                  color="red"
                  alert={stats?.expired > 0}
                />
              </motion.div>

              {/* Medicine List */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Medicine Inventory
                  </h2>
                </div>

                <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                  {medicines.length === 0 ? (
                    <div className="p-12 text-center">
                      <Pill className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                        No medicines found for this user
                      </p>
                    </div>
                  ) : (
                    medicines.map((med, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <Pill className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-white">
                                {med.name}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {med.dosage} • {med.frequency}
                              </p>
                              {med.reminders && med.reminders.length > 0 && (
                                <div className="mt-3 grid gap-2">
                                  {med.reminders.map((rem, idx) => {
                                    const isDaily =
                                      !rem.daysOfWeek ||
                                      rem.daysOfWeek.length === 0 ||
                                      rem.daysOfWeek.length === 7;

                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 rounded-xl "
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              isDaily
                                                ? "bg-emerald-500"
                                                : "bg-blue-500"
                                            }`}
                                          />
                                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {isDaily
                                              ? "Every Day"
                                              : rem.daysOfWeek.join(", ")}
                                          </span>
                                           <div className="flex gap-1.5 mr-2 flex-wrap justify-end">
                                          {rem.times.map((time, t) => (
                                            <span
                                              key={t}
                                              className="text-xs font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            >
                                              {time}
                                            </span>
                                          ))}
                                        </div>
                                        </div>
                                       
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                                Stock
                              </p>
                              <p
                                className={`font-bold ${
                                  med.currentStock <= 5
                                    ? "text-red-500"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {med.currentStock} / {med.totalStock}
                              </p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                                Expiry
                              </p>
                              <p
                                className={`font-bold ${
                                  new Date(med.expiryDate) < new Date()
                                    ? "text-red-500"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {new Date(med.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Stylish Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, alert }) => {
  const colorStyles = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20",
    yellow:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20",
    red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20",
  };

  const activeStyle = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className={`h-24 w-24 ${activeStyle.split(" ")[0]}`} />
      </div>

      <div className="relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activeStyle} shadow-sm`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </h3>
          {alert && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FamilyMemberProfile;
