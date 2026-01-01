import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmergencyHistory, deleteEmergency } from './emergency.service';
import { ArrowLeft, Clock, MapPin, Activity, Hospital, Calendar, Trash2 } from 'lucide-react';

const EmergencyHistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await getEmergencyHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await deleteEmergency(id);
                setHistory(history.filter(item => item._id !== id));
            } catch (error) {
                alert("Failed to delete record");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 px-6 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-12">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <ArrowLeft size={22} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Clock className="text-blue-500" size={32} /> Emergency History
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Your past emergency searches and AI recommendations
                        </p>
                    </div>
                </div>

                {loading ? (
                     <div className="flex justify-center p-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Clock size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No History Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">You haven't triggered any emergency searches yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {history.map((record) => (
                            <div key={record._id} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group relative">
                                <button 
                                    onClick={(e) => handleDelete(record._id, e)}
                                    className="absolute top-5 right-5 p-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110"
                                    title="Delete Record"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/50 w-fit px-3 py-1 rounded-full">
                                            <Calendar size={14} />
                                            {new Date(record.createdAt).toLocaleString(undefined, {
                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                            <Activity size={24} className="text-red-500 shrink-0" />
                                            <span className="line-clamp-1">{record.description || "Unspecified Emergency"}</span>
                                        </h3>

                                        {record.assignedHospital && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                                                    <Hospital size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Recommended Hospital</div>
                                                    <div className="text-xl text-slate-900 dark:text-white font-bold">{record.assignedHospital.name}</div>
                                                    <div className="text-slate-500 dark:text-slate-400 
                                                    text-sm mt-1">{record.assignedHospital.reason}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action to view details again if needed, or see map location */}
                                    <div className="flex flex-col gap-3 pt-2">
                                         <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <MapPin size={14} className="text-slate-400" />
                                            <div>
                                                <span className="opacity-50">LAT</span> {record.latitude.toFixed(4)}
                                                <span className="mx-2 opacity-30">|</span>
                                                <span className="opacity-50">LON</span> {record.longitude.toFixed(4)}
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyHistoryPage;
