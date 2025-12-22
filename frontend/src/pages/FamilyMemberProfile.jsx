import React, { useState, useEffect, useCallback } from "react";
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
  Shield,
  Zap,
  Heart,
  Syringe,
  Droplets,
  Tablets,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getFamilyMemberDetails } from "../api/family";
import Loader from "../components/Loader";
import UserAvatar from "../components/UserAvatar";
import { useNotification } from "../context/NotificationContext";


const getMedicineIcon = (category) => {
  const cat = category?.toLowerCase() || "";
  if (cat.includes("injection") || cat.includes("syringe")) return <Syringe className="w-6 h-6" />;
  if (cat.includes("syrup") || cat.includes("liquid") || cat.includes("drop")) return <Droplets className="w-6 h-6" />;
  if (cat.includes("tablet") || cat.includes("capsule") || cat.includes("pill")) return <Tablets className="w-6 h-6" />;
  return <Pill className="w-6 h-6" />;
};

const MedicineItem = React.memo(({ med, isExpanded, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
      onClick={() => onToggle(index)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            {getMedicineIcon(med.form || med.category)}
            {med.reminders && med.reminders.length > 0 && (
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-2">{med.name}</h3>
            <p className={`text-sm text-slate-500 dark:text-slate-400 font-medium ${isExpanded ? "" : "truncate"}`}>
              {med.dosage} • {med.frequency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock</p>
            <p className={`font-bold ${med.currentStock <= 5 ? "text-amber-500" : "text-slate-900 dark:text-white"}`}>
              {med.currentStock} / {med.totalStock}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry</p>
            <p className={`font-bold ${new Date(med.expiryDate) < new Date() ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
              {new Date(med.expiryDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description & Instructions</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {med.description || "No specific instructions provided."}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Schedule</h4>
                {med.reminders && med.reminders.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {med.reminders.map((rem, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                        <Clock className="w-3 h-3" />
                        <span>{(!rem.daysOfWeek || rem.daysOfWeek.length === 0 || rem.daysOfWeek.length === 7) ? "Daily" : rem.daysOfWeek.join(", ")}</span>
                        <span className="text-indigo-300 dark:text-indigo-700">|</span>
                        <span>{rem.times.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No reminders set</p>
                )}
              </div>
              
              <div className="sm:hidden">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expiry Date</h4>
                <p className={`text-sm font-bold ${new Date(med.expiryDate) < new Date() ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
                  {new Date(med.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

const FamilyMemberProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [medicationStatus, setMedicationStatus] = useState([]);
  const [showAllStatus, setShowAllStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMedIndex, setExpandedMedIndex] = useState(null);

  const { notify } = useNotification();

  const handleToggle = useCallback((index) => {
    setExpandedMedIndex((prev) => (prev === index ? null : index));
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getFamilyMemberDetails(userId);
        setMember(data.member);
        setMedicines(data.medicines);
        setStats(data.stats);
        setMedicationStatus(data.medicationStatus || []);
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
      <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <p className="text-slate-900 dark:text-white text-xl font-bold">{error || "Member not found"}</p>
          <button onClick={() => navigate('/family')} className="mt-4 text-indigo-500 font-bold hover:underline">Return to Family</button>
        </div>
      </div>
    );
  }

  const isOnline = member.lastActive && new Date() - new Date(member.lastActive) < 5 * 60 * 1000;

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500 font-sans">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="relative z-10 p-6 md:p-10 h-screen overflow-y-auto custom-scrollbar">
        <motion.div
          className="max-w-7xl mx-auto space-y-8 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header & Nav */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <button
              onClick={() => navigate("/family")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              Family Profile
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Profile Card (4 cols) */}
            <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                {/* Cover Gradient */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600" />
                
                <div className="px-8 pb-8 -mt-16 flex flex-col items-center text-center relative z-10">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-8 border-white dark:border-slate-900 shadow-xl">
                      <UserAvatar user={member} className="h-full w-full text-5xl" />
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-2 -right-2 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full border-4 border-white dark:border-slate-900">
                        Online
                      </div>
                    )}
                  </div>

                  <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {member.name}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                    {member.email}
                  </p>

                  <button
                    onClick={() => navigate(`/family/chat/${userId}`)}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Send Message
                  </button>

                  <div className="w-full mt-8 space-y-4">
                    <InfoRow icon={Clock} label="Last Active" value={formatLastActive(member.lastActive)} />
                    {member.location && <InfoRow icon={MapPin} label="Location" value={member.location} />}
                    {member.phoneNumber && <InfoRow icon={Phone} label="Phone" value={member.phoneNumber} />}
                    <InfoRow icon={Calendar} label="Member Since" value={new Date(member.createdAt).toLocaleDateString()} />
                  </div>

                  {/* AI Consent Toggle */}
                  <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">AI Actions</p>
                          <p className="text-xs text-slate-500">Allow reminders</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={member.allowAiActions || false}
                          onChange={async (e) => {
                            const newValue = e.target.checked;
                            setMember((prev) => ({ ...prev, allowAiActions: newValue }));
                            try {
                              const { updateFamilyMember } = await import("../api/family");
                              await updateFamilyMember(member._id, { allowAiActions: newValue });
                              notify.success(newValue ? "AI actions enabled" : "AI actions disabled");
                            } catch (err) {
                              setMember((prev) => ({ ...prev, allowAiActions: !newValue }));
                              notify.error("Failed to update consent");
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Stats & Inventory (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stats Grid */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Medicines" value={stats?.totalMedicines || 0} icon={Pill} color="indigo" />
                <StatCard title="Low Stock" value={stats?.lowStock || 0} icon={AlertTriangle} color="amber" alert={stats?.lowStock > 0} />
                <StatCard title="Expired" value={stats?.expired || 0} icon={Activity} color="rose" alert={stats?.expired > 0} />
              </motion.div>

              {/* Medication Status Section */}
              {medicationStatus && medicationStatus.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Status</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time medication tracking</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(showAllStatus ? medicationStatus : medicationStatus.slice(0, 4)).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 group"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                            item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                            item.status === 'dismissed' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' :
                            'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                          }`}>
                            {item.status === 'confirmed' ? <CheckCircle className="w-6 h-6" /> :
                             item.status === 'dismissed' ? <AlertTriangle className="w-6 h-6" /> :
                             <Clock className="w-6 h-6" />}
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              {new Date(item.scheduledTime).toLocaleTimeString("en-US", { 
                                hour: "2-digit", 
                                minute: "2-digit", 
                                timeZone: "Asia/Kolkata" 
                              })}
                            </p>
                            <h4 className="font-bold text-slate-900 dark:text-white truncate transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {item.medicineName}
                            </h4>
                            <div className="flex flex-col mt-1">
                              {(() => {
                                let statusText = 'Pending';
                                let statusColor = 'text-amber-500';
                                
                                if (item.status === 'confirmed') {
                                  // Check if late (more than 60 mins)
                                  const diff = new Date(item.confirmedAt) - new Date(item.scheduledTime);
                                  const isLate = diff > 60 * 60 * 1000;
                                  
                                  statusText = isLate ? 'Taken Late' : 'Taken';
                                  statusColor = isLate ? 'text-amber-600' : 'text-emerald-500';
                                } else if (item.status === 'dismissed') {
                                  statusText = 'Skipped';
                                  statusColor = 'text-rose-500';
                                }

                                return (
                                  <>
                                    <span className={`text-xs font-bold ${statusColor}`}>
                                      {statusText}
                                    </span>
                                    {(item.status === 'confirmed' || item.status === 'dismissed') && (
                                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                                        at {new Date(item.status === 'confirmed' ? item.confirmedAt : item.dismissedAt).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          timeZone: "Asia/Kolkata"
                                        })}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {medicationStatus.length > 4 && (
                      <button
                        onClick={() => setShowAllStatus(!showAllStatus)}
                        className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300"
                      >
                        <span>{showAllStatus ? "Show Less" : `Show ${medicationStatus.length - 4} More`}</span>
                        {showAllStatus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Medicine Inventory */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Medicine Inventory</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track adherence and stock levels</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {medicines.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Pill className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No medicines found for this user</p>
                    </div>
                  ) : (
                    medicines.map((med, index) => (
                      <MedicineItem 
                        key={index}
                        med={med}
                        index={index}
                        isExpanded={expandedMedIndex === index}
                        onToggle={handleToggle}
                      />
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

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, alert }) => {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
  };
  
  const activeColor = colors[color] || colors.indigo;

  return (
    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="w-24 h-24" />
      </div>
      
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activeColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <div className="flex items-center gap-2 mt-1">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
        {alert && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
      </div>
    </div>
  );
};

export default FamilyMemberProfile;
