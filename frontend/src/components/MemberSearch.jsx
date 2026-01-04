import React, { useState } from 'react';
import { Search, UserPlus, Check, X, Loader2, Shield, Users, Info } from 'lucide-react';
import api from '../api/api';
import { inviteFamilyMember } from '../api/family';
import { useNotification } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

const MemberSearch = ({ onInviteSuccess }) => {
    const [searchId, setSearchId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const { notify } = useNotification();
    const [showInfo, setShowInfo] = useState(false);

    const [showRelationModal, setShowRelationModal] = useState(false);
    const [selectedRelation, setSelectedRelation] = useState('Family');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setLoading(true);
        setResult(null);
        try {
            const response = await api.get(`/auth/public/${searchId.trim()}`);
            if (response.data.success) {
                setResult(response.data.user);
            }
        } catch (error) {
            console.error('Search error:', error);
            notify.error('Member not found. Please check the ID.');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteClick = () => {
        if (!result) return;
        setShowRelationModal(true);
    };

    const sendInvitation = async () => {
        if (!result) return;
        setInviting(true);
        try {
            await inviteFamilyMember({ email: result.email, relationship: selectedRelation }); 
            notify.success(`Invitation sent to ${result.name}`);
            setSearchId('');
            setResult(null);
            setShowRelationModal(false);
            if (onInviteSuccess) onInviteSuccess();
        } catch (error) {
            console.error('Invite error:', error);
            notify.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-slate-700 p-6 md:p-8 shadow-2xl relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
             <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                <div className="absolute top-0 right-0 sm:right-0 -right-2 z-20">
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                        className="p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full backdrop-blur-md transition-all shadow-sm text-slate-500 hover:text-emerald-500 dark:text-slate-400"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                        {showInfo && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 mt-2 w-64 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-left z-30"
                            >
                                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white dark:bg-slate-800 border-l border-t border-slate-100 dark:border-slate-700 transform rotate-45" />
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Where is my ID?</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Go to <span className="font-bold text-slate-700 dark:text-slate-200">Settings &gt; Identity Card</span> to find your unique Member ID.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Connect with Family</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                        Search for family members by their unique Member ID (e.g., MT-ABC123) to start sharing health insights.
                    </p>
                </div>
                
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-lg mx-auto">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100">
                            <span className="text-slate-400 font-mono text-sm font-semibold group-focus-within:text-emerald-500">MT-</span>
                        </div>
                        <input
                            type="text"
                            value={searchId.replace('MT-', '')}
                            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                            placeholder="VK1CYV"
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 font-mono text-lg uppercase tracking-wider transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchId}
                        className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-slate-900 dark:disabled:hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 sm:w-auto w-full"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        <span className='text-white'>Search</span>
                    </button>
                </form>

                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="max-w-md mx-auto"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
                                
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">
                                             <UserAvatar user={result} className="w-full h-full text-xl" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                            {result.name}
                                        </h4>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg mt-1">
                                            <Shield className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 tracking-wide">{result.memberId}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleInviteClick}
                                        className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-sm hover:shadow-md group-hover:scale-105"
                                        title="Send Invitation"
                                    >
                                        <UserPlus className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Relationship Selection Modal */}
            <AnimatePresence>
                {showRelationModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Connection</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Define your relationship with <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result?.name?.split(' ')[0]}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowRelationModal(false)} 
                                        className="p-2 -mr-2 text-slate-400 hover:text-slate-500 bg-slate-100 dark:bg-slate-700/50 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    {['Parent', 'Child', 'Spouse', 'Sibling', 'Friend', 'Other'].map((rel) => (
                                        <button
                                            key={rel}
                                            onClick={() => setSelectedRelation(rel)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                                                selectedRelation === rel
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                                            }`}
                                        >
                                            {rel}
                                            {selectedRelation === rel && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={sendInvitation}
                                    disabled={inviting}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                    Send Invitation
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberSearch;
