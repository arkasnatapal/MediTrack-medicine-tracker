import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from "../components/ChatSidebar";
import { Bot, Send, Loader2, Info, Edit2, X, Check, Sparkles, Menu, Utensils } from "lucide-react";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AIChatOnboarding from "../components/AIChatOnboarding";

const AIHealthChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const [includeFood, setIncludeFood] = useState(false);

  // Handle location state for prefill and food context
  useEffect(() => {
    if (location.state?.prefill) {
      setInput(location.state.prefill);
    }
    if (location.state?.includeFood) {
      setIncludeFood(true);
    }
  }, [location.state]);

  // Fetch most recent session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:5000/api/chat-sessions", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.sessions.length > 0) {
          handleSelectSession(data.sessions[0]._id);
        } else {
          // Don't create on server yet, just reset local state
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };
    
    initSession();
  }, []);

  const createSessionOnServer = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5000/api/chat-sessions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event('chat-session-updated'));
        return data.session._id;
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
    return null;
  };

  const createNewSession = () => {
    // Just reset local state for a "new" UI experience
    setActiveSessionId(null);
    setMessages([]);
    setShowMobileSidebar(false);
    setIncludeFood(false); // Reset food context on new chat
  };

  const handleSelectSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/chat-sessions/${sessionId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessionId(data.session._id);
        setMessages(data.session.messages);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    // Optimistically add user message
    const userMessage = { 
      role: "user", 
      content: trimmed,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      let currentSessionId = activeSessionId;
      
      // If no active session, create one now (Lazy Creation)
      if (!currentSessionId) {
        currentSessionId = await createSessionOnServer();
        if (currentSessionId) {
          setActiveSessionId(currentSessionId);
        } else {
          throw new Error("Failed to create chat session");
        }
      }

      const token = localStorage.getItem('token'); 
      
      // Save user message
      await fetch(`http://localhost:5000/api/chat-sessions/${currentSessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: "user", content: trimmed })
      });

      // Get AI response
      const res = await fetch("http://localhost:5000/api/ai/health-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          includeFood: includeFood // Pass the flag
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "AI request failed");
      }

      const botContent = data.reply || "I couldn't generate a response. Please try again.";
      const botMessage = {
        role: "assistant",
        content: botContent,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save bot message
      await fetch(`http://localhost:5000/api/chat-sessions/${currentSessionId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: "assistant", content: botContent })
      });

    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong while contacting the health assistant. Please try again later.",
          createdAt: new Date().toISOString()
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteSession = (deletedSessionId) => {
    if (activeSessionId === deletedSessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleRenameSession = async (e) => {
    e.preventDefault();
    if (!newChatName.trim() || !activeSessionId) return;

    setIsRenaming(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/chat-sessions/${activeSessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: newChatName.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setShowRenameModal(false);
        window.dispatchEvent(new Event('chat-session-updated'));
      }
    } catch (error) {
      console.error("Error renaming session:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-200 overflow-hidden flex font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      <AIChatOnboarding />
      
      {/* Enhanced Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-teal-500/5 dark:bg-teal-500/5 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-20">
        <ChatSidebar 
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={createNewSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <ChatSidebar 
                activeSessionId={activeSessionId}
                onSelectSession={(sessionId) => {
                  handleSelectSession(sessionId);
                  setShowMobileSidebar(false);
                }}
                onNewChat={() => {
                  createNewSession();
                  setShowMobileSidebar(false);
                }}
                onDeleteSession={handleDeleteSession}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex-none px-4 py-4 md:px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-slate-900 dark:text-slate-200 tracking-tight">MediTrack AI</span>
              <div className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                Beta
              </div>
              {includeFood && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                  <Utensils className="w-3 h-3" />
                  Food Context
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (activeSessionId) {
                setNewChatName("");
                setShowRenameModal(true);
              }
            }}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Rename Chat"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide">
          <div className="max-w-3xl mx-auto px-4 pb-32 pt-10 min-h-full flex flex-col justify-end">
            
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 pb-20 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                  <div className="relative w-20 h-20 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl">
                    <Bot className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-3 max-w-lg">
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-slate-100 dark:via-slate-300 dark:to-slate-500 pb-2">
                    Hello, {user?.name?.split(' ')[0] || 'Friend'}
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    I'm your personal health assistant. How can I help you today?
                  </p>
                </div>
                
                {/* Quick Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                  {[
                    "What are the side effects of Ibuprofen?",
                    "Remind me to take my vitamins at 9 AM",
                    "How do I manage high blood pressure?",
                    "Explain my recent prescription"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-4 text-left rounded-xl bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-500/30 transition-all group shadow-sm dark:shadow-none"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            <div className="space-y-8">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                        
                        {/* Avatar */}
                        <div className="flex-shrink-0 mt-1">
                          {isUser ? (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">YO</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div className={`text-sm mb-1 opacity-50 ${isUser ? 'mr-1' : 'ml-1'} text-slate-500 dark:text-slate-400`}>
                            {isUser ? 'You' : 'MediTrack AI'}
                          </div>
                          <div
                            className={`px-6 py-4 rounded-2xl text-[15px] leading-7 shadow-sm ${
                              isUser
                                ? 'dark:bg-[#1e2330] bg-[#7eff94] text-slate-200 border border-slate-700/50 rounded-tr-sm'
                                : 'bg-white dark:bg-transparent text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 -ml-4'
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <div className="prose prose-slate dark:prose-invert prose-p:leading-7 prose-li:marker:text-emerald-500 max-w-none">
                                <MarkdownRenderer content={msg.content} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Loading Indicator */}
              {isSending && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mt-1">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 h-10 px-4">
                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0B0F17] dark:via-[#0B0F17] dark:to-transparent z-40">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500" />
              <form 
                onSubmit={handleSend}
                className="relative flex items-center gap-2 bg-white dark:bg-[#131823] rounded-full p-2 pl-6 border border-slate-200 dark:border-slate-700/50 shadow-xl dark:shadow-black/50"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-base py-2"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 ml-0.5" />
                  )}
                </button>
              </form>
            </div>
            <p className="text-center text-[10px] text-slate-500 dark:text-slate-600 mt-3">
              MediTrack AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>

        {/* Rename Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#131823] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200">Rename Chat</h3>
                <button 
                  onClick={() => setShowRenameModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleRenameSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Chat Name
                  </label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Enter new chat name..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRenaming || !newChatName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                  >
                    {isRenaming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIHealthChat;
