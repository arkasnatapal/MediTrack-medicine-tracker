import React, { useState, useEffect } from 'react';
import { fetchNearbyHospitals, getAIRecommendation } from './emergency.service';
import EmergencyMap from './EmergencyMap';
// import EmergencyDialog from './EmergencyDialog'; // Removed
// import './emergency.css'; // Removed
import { AlertTriangle, MapPin, Activity, ShieldAlert, Bot, Stethoscope, ChevronRight, Navigation, Clock, Info, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EmergencyPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [problemDescription, setProblemDescription] = useState('');
    const [selectedHospital, setSelectedHospital] = useState(null);

    // AI State
    const [aiRecommendation, setAiRecommendation] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [bestHospital, setBestHospital] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const getLocation = (retryLowAccuracy = false) => {
        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is not supported by your browser");
            return;
        }

        setErrorMsg(retryLowAccuracy ? "Retrying with lower accuracy..." : "Locating...");
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                setUserLocation(loc);
                loadHospitals(loc.latitude, loc.longitude);
                setErrorMsg(null);
            },
            (error) => {
                console.error("Error getting location", error);
                if (!retryLowAccuracy && error.code === error.TIMEOUT) {
                    // Retry with lower accuracy
                    console.warn("High accuracy timed out, retrying with low accuracy");
                    getLocation(true);
                    return;
                }

                let msg = "Unable to retrieve location.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "Location permission denied. Please enable it in browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "Location request timed out. Please check your connection.";
                        break;
                    default:
                        msg = "An unknown error occurred.";
                }
                setErrorMsg(msg);
            },
            { 
                enableHighAccuracy: !retryLowAccuracy, 
                timeout: retryLowAccuracy ? 15000 : 10000, 
                maximumAge: 0 
            }
        );
    };

    // Initial Location Fetch
    useEffect(() => {
        getLocation();
    }, []);

    const loadHospitals = async (lat, lon) => {
        const nearHospitals = await fetchNearbyHospitals(lat, lon);
        setHospitals(nearHospitals);
    };

    const handleHospitalClick = (hospital) => {
        if (!hospital) return;
        navigate(`/hospital-details/${hospital.id}`, { 
            state: { 
                name: hospital.name,
                lat: hospital.latitude, 
                lon: hospital.longitude 
            } 
        });
    };

    const handleAIRecommendationClick = (hospitalName) => {
        if (!hospitalName) return;
        const hospital = hospitals.find(h => 
            h.name.toLowerCase().includes(hospitalName.toLowerCase()) || 
            hospitalName.toLowerCase().includes(h.name.toLowerCase())
        );
        if (hospital) {
            handleHospitalClick(hospital);
        } else {
             alert("Hospital details not available for this location.");
        }
    };

    const handleAskAI = async (problemDescription) => {
        if (!userLocation) {
            alert("Location is required for AI advice.");
            return;
        }
        if (hospitals.length === 0) {
            alert("No nearby hospitals found to analyze.");
            return;
        }

        setLoadingAI(true);
        setAiRecommendation(null);
        setSelectedHospital(null);

        try {
            const data = await getAIRecommendation({
                problemDescription,
                userLocation,
                nearbyHospitals: hospitals
            });

            console.log("AI Data Recieved:", data);
            setAiRecommendation(data);
            
            // Highlight the BEST hospital on the map
            if (data.best && data.best.name) {
                const recommended = hospitals.find(h => 
                    h.name.toLowerCase().includes(data.best.name.toLowerCase()) || 
                    data.best.name.toLowerCase().includes(h.name.toLowerCase())
                );
                if (recommended) {
                    setSelectedHospital(recommended);
                }
            }

        } catch (error) {
            console.error(error);
            alert("AI Service Unavailable: " + error);
        } finally {
            setLoadingAI(false);
        }
    };

    const handleDirectionClick = (hospitalName, e) => {
        e.stopPropagation();
        if (!hospitalName) return;
        const hospital = hospitals.find(h => 
            h.name.toLowerCase().includes(hospitalName.toLowerCase()) || 
            hospitalName.toLowerCase().includes(h.name.toLowerCase())
        );
        if (hospital) {
            setSelectedHospital(hospital);
            // Scroll to map on mobile/desktop to ensure user sees the route
            document.querySelector('.leaflet-container')?.scrollIntoView({ behavior: 'smooth' });
        } else {
             alert("Location data not available for directions.");
        }
    };

    // Card Component for Recommendation Types
    const RecommendationCard = ({ type, data, colorClass, icon: Icon }) => {
        if (!data) return null;
        return (
            <div 
                onClick={() => handleAIRecommendationClick(data.name)}
                className={`cursor-pointer group relative overflow-hidden rounded-2xl p-4 border ${colorClass} bg-white dark:bg-slate-800 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-95`}
            >
                 <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 text-current group-hover:bg-opacity-20 transition-all`}>
                            <Icon size={18} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wider opacity-70">{type}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => handleDirectionClick(data.name, e)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors z-10"
                            title="Show Directions on Map"
                        >
                            <Navigation size={14} className="fill-current" />
                        </button>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                            {data.distance}
                        </span>
                    </div>
                 </div>
                 <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-current transition-colors">{data.name}</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {data.reason}
                 </p>
                 <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Icon size={64} />
                 </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-20 pb-8 relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50 to-gray-50 dark:from-[#1e1b4b] dark:to-slate-900 pointer-events-none transition-colors duration-300" />
            
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 flex justify-center items-center gap-3 drop-shadow-xl mb-3">
                        <Bot size={42} className="text-blue-600 dark:text-blue-400" /> 
                        <span>AI EMERGENCY ADVISOR</span>
                    </h1>

                    <div className="flex items-center justify-center gap-4 mb-3">
                         <p className="text-slate-600 dark:text-slate-400 text-lg">
                            Instant, AI-powered guidance for medical emergencies.
                        </p>
                        <button 
                            onClick={() => navigate('/emergency/history')}
                            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                            <Clock size={16} /> History
                        </button>
                    </div>
                    <div className="text-center">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest border border-red-500/20 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/10">
                            Not a medical diagnosis • Call Ambulance for critical cases
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Input & AI Response (4/12 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Control Panel - INLINE INPUT */}
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all">
                             
                            <div className="text-left mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-red-500" />
                                    Describe Emergency
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    AI will analyze text & location to find the best hospital.
                                </p>
                            </div>

                            {/* Inline Form */}
                            <div className="space-y-4">
                                <textarea
                                    value={problemDescription}
                                    onChange={(e) => setProblemDescription(e.target.value)}
                                    placeholder="e.g. Severe chest pain, breathing difficulty..."
                                    className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm shadow-inner"
                                    disabled={loadingAI}
                                />

                                <button 
                                    onClick={() => handleAskAI(problemDescription)}
                                    disabled={loadingAI || !userLocation || !problemDescription.trim()}
                                    className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95
                                        ${loadingAI || !userLocation || !problemDescription.trim()
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25'
                                        }
                                    `}
                                >
                                    {loadingAI ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Find Best Hospital
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {!userLocation && (
                                <p className="text-center text-xs text-red-500 mt-3 flex items-center justify-center gap-1">
                                    <AlertTriangle size={12} /> Location signal lost. Retrying...
                                </p>
                            )}
                        </div>
                        
                        {/* AI Response Cards */}
                        <AnimatePresence>
                        {aiRecommendation && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Best Option */}
                                <RecommendationCard 
                                    type="Best Choice" 
                                    data={aiRecommendation.best} 
                                    colorClass="border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                                    icon={Activity}
                                />

                                {/* Closest Option */}
                                <RecommendationCard 
                                    type="Closest" 
                                    data={aiRecommendation.closest} 
                                    colorClass="border-blue-500/50 text-blue-600 dark:text-blue-400"
                                    icon={Navigation}
                                />

                                {/* Alternative Option */}
                                <RecommendationCard 
                                    type="Alternative" 
                                    data={aiRecommendation.alternative} 
                                    colorClass="border-purple-500/50 text-purple-600 dark:text-purple-400"
                                    icon={Clock}
                                />
                                
                                <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <ShieldAlert size={14} className="mt-0.5 text-slate-400 shrink-0" />
                                    <p>
                                        AI analysis based on hospital types and distance. 
                                        <strong> Always verify with emergency services.</strong>
                                    </p>
                                </div>

                                {/* First Aid Section */}
                                {aiRecommendation.first_aid && (
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 mt-4">
                                        <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
                                            <ShieldAlert size={20} />
                                            <h4 className="font-bold text-base uppercase tracking-wider">Immediate First Aid</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {aiRecommendation.first_aid.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                    <span className="bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold w-5 h-5 flex items-center justify-center rounded-full text-[10px] shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Map (8/12 columns) */}
                    <div className="lg:col-span-8">
                         <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-2 shadow-xl h-[600px] flex flex-col relative transition-colors duration-300">
                             <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 relative z-0">
                                 {userLocation ? (
                                     <EmergencyMap 
                                        userLocation={userLocation} 
                                        hospitals={hospitals}
                                        selectedHospital={selectedHospital} 
                                        onHospitalClick={handleHospitalClick}
                                     />
                                 ) : (
                                     <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-500 dark:text-slate-400 gap-6">
                                         <div className="relative">
                                             <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                                             <MapPin size={48} className="relative z-10 text-blue-500 animate-bounce" />
                                         </div>
                                         <p className="text-lg font-medium">{errorMsg || "Locating your position..."}</p>
                                         <button 
                                            onClick={getLocation}
                                            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50"
                                         >
                                            Retry Location
                                         </button>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyPage;
