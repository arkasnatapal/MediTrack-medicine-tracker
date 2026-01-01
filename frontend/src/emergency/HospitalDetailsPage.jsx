import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getHospitalDetails, refreshHospitalDetails } from './emergency.service';
import { MapPin, Phone, Globe, Star, Shield, Stethoscope, RefreshCw, ArrowLeft, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const HospitalDetailsPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Get initial data from location state if available (passed from EmergencyPage)
    const initialName = location.state?.name;
    const initialLat = location.state?.lat;
    const initialLon = location.state?.lon;

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const data = await getHospitalDetails(id, initialName, initialLat, initialLon);
            setHospital(data);
            setError(null);
        } catch (err) {
            setError("Failed to load hospital details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const data = await refreshHospitalDetails(id, hospital?.name || initialName, initialLat, initialLon);
            setHospital(data);
        } catch (err) {
            alert("Failed to refresh details");
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center pt-20">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-white">Gathering Hospital Intelligence...</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">AI is analyzing services, doctors, and specialties.</p>
            </div>
        );
    }

    if (error || !hospital) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center pt-20">
                <p className="text-red-500 mb-4">{error || "Hospital not found"}</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-200 rounded-lg">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-10 px-4 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Emergency
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Title Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{hospital.name}</h1>
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <Star size={14} fill="currentColor" /> {hospital.rating}
                                    </div>
                                </div>
                                
                                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                    {hospital.description}
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                                        <MapPin size={16} className="text-red-500" /> {hospital.address}
                                    </span>
                                    <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                                        <Phone size={16} className="text-blue-500" /> {hospital.contactNumber || "N/A"}
                                    </span>
                                    {hospital.website && (
                                        <a href={`http://${hospital.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors">
                                            <Globe size={16} /> Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Doctors List */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Stethoscope size={24} className="text-blue-500" /> Available Doctors & Specialists
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hospital.doctors?.map((doc, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</h4>
                                                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">{doc.specialty}</p>
                                            </div>
                                            <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                                                {doc.experience}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                            <Clock size={12} /> Available: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{doc.availability}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        
                        {/* Emergency Services */}
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                                <Shield size={20} /> Emergency Services
                            </h3>
                            <ul className="space-y-2">
                                {hospital.emergencyServices?.map((service, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        {service}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Specialties Tags */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Award size={20} className="text-amber-500" /> Key Specialties
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {hospital.specialties?.map((spec, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Refresh Action */}
                        <div className="text-center">
                            <p className="text-xs text-slate-400 mb-2">
                                Last Updated: {new Date(hospital.lastUpdated).toLocaleString()}
                            </p>
                            <button 
                                onClick={handleRefresh} 
                                disabled={refreshing}
                                className="w-full py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                                {refreshing ? "Updating Intelligence..." : "Refresh Details"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HospitalDetailsPage;
