import { Plus, MessageCircle, ChevronLeft, Menu, Trash2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "./ConfirmDialog";

const API_URL = import.meta.env.VITE_API_URL;


// For local development use this 
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ChatSidebar = ({ activeSessionId, onSelectSession, onNewChat, onDeleteSession }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/chat-sessions`, { 
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    const handleUpdate = () => fetchSessions();
    window.addEventListener('chat-session-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('chat-session-updated', handleUpdate);
    };
  }, [activeSessionId]);

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    setDeleteId(sessionId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/chat-sessions/${deleteId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSessions(prev => prev.filter(s => s._id !== deleteId));
        if (onDeleteSession) onDeleteSession(deleteId);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`relative h-full transition-all duration-300 flex-shrink-0 z-30 ${
        collapsed ? "w-20" : "w-80"
      }`}
    >
      <div className="h-full flex flex-col bg-white dark:bg-[#0B0F17] border-r border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
        
        {/* Header / Toggle */}
        <div className={`p-4 flex ${collapsed ? "justify-center" : "justify-between items-center"} mb-2`}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-200 tracking-tight">History</span>
            </div>
          )}
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Show History" : "Collapse Sidebar"}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-6">
          <button
            onClick={onNewChat}
            className={`group relative w-full flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 overflow-hidden ${
              collapsed ? "justify-center p-3" : "px-4 py-3.5"
            }`}
            title="New Chat"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="h-5 w-5 relative z-10 text-emerald-500" />
            {!collapsed && <span className="font-medium relative z-10 text-sm">New Chat</span>}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide">
          {!collapsed ? (
            <AnimatePresence>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">No chat history yet</p>
                </div>
              ) : (
                sessions.map((s, index) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelectSession(s._id)}
                    className={`group relative w-full text-left px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer border border-transparent ${
                      activeSessionId === s._id 
                        ? "bg-emerald-50 dark:bg-[#1e2330] text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-slate-700/50 shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <MessageCircle className={`h-4 w-4 flex-shrink-0 ${activeSessionId === s._id ? "text-emerald-500" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-500"}`} />
                      <span className="truncate text-sm font-medium">{s.title}</span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteClick(e, s._id)}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                        activeSessionId === s._id 
                          ? "hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400" 
                          : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                      }`}
                      title="Delete Chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              {sessions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => onSelectSession(s._id)}
                  className={`p-3 rounded-xl transition-all relative group ${
                    activeSessionId === s._id
                      ? "bg-emerald-50 dark:bg-[#1e2330] text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-slate-700/50"
                      : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title={s.title}
                >
                  <MessageCircle className="h-5 w-5" />
                  {activeSessionId === s._id && (
                    <div className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50">
           {/* Placeholder for future footer content if needed */}
        </div>

      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </motion.div>
  );
};

export default ChatSidebar;
