import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MapPin, Clock, Info, MessageCircle } from 'lucide-react';
import { getMessages, sendMessage } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import UserAvatar from '../components/UserAvatar';
import InfoDialog from '../components/InfoDialog';

const FamilyChat = () => {
  const { otherUserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [infoDialog, setInfoDialog] = useState({ isOpen: false, title: "", message: "", variant: "info" });
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFirstLoad = useRef(true);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [otherUserId]);

  useLayoutEffect(() => {
    if (messages.length > 0) {
      if (isFirstLoad.current) {
        scrollToBottom(false);
        isFirstLoad.current = false;
      } else {
        scrollToBottom(true);
      }
    }
  }, [messages]);

  const fetchMessages = async (isInitial = false) => {
    try {
      const data = await getMessages(otherUserId);
      setMessages(data.messages);
      if (data.otherUser) {
        setOtherUser(data.otherUser);
      }
      if (isInitial) {
        setLoading(false);
        isFirstLoad.current = true;
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (isInitial) setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendMessage(otherUserId, { body: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      setInfoDialog({
        isOpen: true,
        title: "Error",
        message: "Failed to send message. Please try again.",
        variant: "error"
      });
    } finally {
      setSending(false);
    }
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 5 * 60 * 1000) return 'Active now';
    if (diff < 60 * 60 * 1000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = otherUser?.lastActive && (new Date() - new Date(otherUser.lastActive) < 5 * 60 * 1000);

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto overflow-hidden">
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-none px-4 md:px-6 pt-3 pb-2"
          >
            <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => navigate('/family')}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:scale-110"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                
                {otherUser && (
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-2xl transition-all flex-1"
                    onClick={() => navigate(`/family/member/${otherUser._id}`)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/20">
                        <UserAvatar 
                          user={otherUser} 
                          className="h-full w-full" 
                          fallbackType="initial"
                        />
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {otherUser.name || otherUser.email}
                      </h1>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastActive(otherUser.lastActive)}
                        </span>
                        {otherUser.location && (
                          <span className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-600 pl-2">
                            <MapPin className="h-3 w-3" />
                            {otherUser.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {otherUser && (
                <button
                  onClick={() => navigate(`/family/member/${otherUser._id}`)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all hover:scale-110"
                  title="View Profile"
                >
                  <Info className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Disclaimer Banner */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex-none px-4 md:px-6 pt-1"
          >
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-full mx-auto w-fit backdrop-blur-sm shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Messages are automatically deleted after 24 hours
              </span>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div className="flex-1 px-4 md:px-6 py-2 overflow-hidden">
            <div 
              className="h-full overflow-y-auto px-4 py-4 space-y-3 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/20 dark:border-slate-800 scroll-smooth scrollbar-hide"
              ref={scrollContainerRef}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const isMe = msg.from.toString() === (user.id || user._id).toString();
                    const showAvatar = !isMe && (index === 0 || messages[index - 1].from.toString() !== msg.from.toString());
                    
                    return (
                      <motion.div 
                        key={msg._id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          
                          {/* Avatar for other user */}
                          {!isMe && (
                            <div className="w-8 flex-shrink-0">
                              {showAvatar ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500/20">
                                  <UserAvatar 
                                    user={otherUser} 
                                    className="h-full w-full" 
                                    fallbackType="initial"
                                  />
                                </div>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`px-5 py-3 shadow-lg relative backdrop-blur-sm ${
                              isMe
                                ? 'bg-gradient-to-br bg-green-400 dark:bg-blue-600 dark:text-white text-black font-semibold rounded-3xl rounded-tr-md'
                                : 'bg-white/80 dark:bg-slate-800/80 text-black font-semibold dark:text-white border border-white/20 dark:border-slate-700 rounded-3xl rounded-tl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                            <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-none px-4 md:px-6 pt-2 pb-3"
          >
            <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-3">
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95 hover:scale-105"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
      <InfoDialog
        isOpen={infoDialog.isOpen}
        onClose={() => setInfoDialog({ ...infoDialog, isOpen: false })}
        title={infoDialog.title}
        message={infoDialog.message}
        variant={infoDialog.variant}
      />
    </div>
  );
};

export default FamilyChat;
