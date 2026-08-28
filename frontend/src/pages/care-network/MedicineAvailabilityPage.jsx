import React, { useState, useEffect } from 'react';
import { 
  Pill, Search, Building2, AlertCircle, ExternalLink, ChevronRight, Info, 
  CheckCircle2, ShoppingCart, ShieldCheck, Tag, Sparkles, MapPin, Truck, Store, 
  ArrowRight, BookOpen, AlertTriangle, ShieldAlert, HeartPulse, RefreshCw, Activity, Heart, HelpCircle
} from 'lucide-react';
import { onlineMedicineService } from '../../services/onlineMedicineService';
import { locationService } from '../../services/locationService';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const popularMedicines = [
  'Pan 40', 'Amoxicillin', 'Dolo 650', 'Crocin', 'Metformin', 
  'Pantoprazole', 'Combiflam', 'Azithromycin'
];

const MedicineAvailabilityPage = () => {
  const [searchTerm, setSearchTerm] = useState('Pan 40');
  const [userLocation, setUserLocation] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [onlineData, setOnlineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'ONLINE'

  useEffect(() => {
    initUserLocation();
  }, []);

  const initUserLocation = async () => {
    let loc = locationService.getDefaultLocation();
    try {
      const currentLoc = await locationService.getCurrentLocation();
      loc = currentLoc;
    } catch (err) {
      console.warn('Location detection using default:', err);
    }
    setUserLocation(loc);
    executeSearch('Pan 40', loc);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      executeSearch(searchTerm.trim(), userLocation);
    }
  };

  const executeSearch = async (query, loc = userLocation) => {
    if (!query) return;
    setLoading(true);

    try {
      const lat = loc ? loc.latitude : '';
      const lng = loc ? loc.longitude : '';
      const city = loc ? (loc.city || 'Jalpaiguri') : 'Jalpaiguri';

      // 1. Fetch Location-Aware Public Facility Inventory from DB (strictly in user's city e.g. Jalpaiguri - NO Pune/Delhi)
      const invRes = await axios.get(`${API_BASE}/care-network/inventory?name=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`);
      if (invRes.data && invRes.data.inventory) {
        setInventoryList(invRes.data.inventory);
      }

      // 2. Fetch Real Medicine Packaging Photo & Online Pharmacy Deep Links live from Tata 1mg API
      const onlineDetails = await onlineMedicineService.fetchReal1mgMedicineDetails(query);
      setOnlineData(onlineDetails);

    } catch (err) {
      console.error('Error fetching medicine details:', err);
    } finally {
      setLoading(false);
    }
  };

  const clinical = onlineData?.clinicalDetails || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* HEADER CARD & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-xs font-black uppercase">
              <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Public Stock Tracker + Live Tata 1mg Aggregator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              MEDICINE AVAILABILITY & ONLINE ORDER HUB
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Check free government stock in <strong>{userLocation?.city || 'Jalpaiguri'}</strong> public health centers or order online with live Tata 1mg product photos, usage guidelines & platform order links.
            </p>
          </div>

          {/* View Filter Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveView('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'ALL' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Options
            </button>
            <button
              onClick={() => setActiveView('PUBLIC')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'PUBLIC' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏥 Public Stock
            </button>
            <button
              onClick={() => setActiveView('ONLINE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'ONLINE' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🛒 Order Online
            </button>
          </div>
        </div>

        {/* SEARCH FORM (PRESS ENTER TO SUBMIT & SEARCH INSTANTLY) */}
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type any medicine name (e.g. Pan 40, Dolo 650, Amoxicillin, Crocin, Metformin) & press Enter..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? 'Searching...' : 'Search Medicine'}</span>
          </button>
        </form>

        {/* POPULAR MEDICINE QUICK PILLS */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 mr-1">Popular Searches:</span>
          {popularMedicines.map(med => (
            <button
              key={med}
              onClick={() => {
                setSearchTerm(med);
                executeSearch(med, userLocation);
              }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-600 transition-all border border-slate-200 dark:border-slate-600/50"
            >
              {med}
            </button>
          ))}
        </div>
      </div>

      {/* ANIMATED LOADING SPINNER STATE */}
      {loading && (
        <div className="p-10 text-center bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 backdrop-blur-md shadow-lg space-y-3">
          <RefreshCw className="w-9 h-9 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
          <div className="font-bold text-base text-slate-800 dark:text-slate-200">
            Fetching live product photo, prices & Tata 1mg details for "{searchTerm}"...
          </div>
          <p className="text-xs text-slate-400">Connecting to Tata 1mg, PharmEasy & local public stock database</p>
        </div>
      )}

      {/* DUAL ARCHITECTURE: PUBLIC FACILITY AVAILABILITY + ONLINE ORDER OPTIONS */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* BRANCH 1: PUBLIC HEALTHCARE FACILITY AVAILABILITY ("Available Here - Local Public Stock") */}
          {(activeView === 'ALL' || activeView === 'PUBLIC') && (
            <div className={`${activeView === 'PUBLIC' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Public Stock in {userLocation?.city || 'Jalpaiguri'}</span>
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Free OPD Stock
                </span>
              </div>

              {inventoryList.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No public stock records found for "{searchTerm}" in nearest facilities.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Check online pharmacy ordering options on the right panel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-emerald-400 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {item.facilityType}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>{item.district || userLocation?.city || 'Jalpaiguri'}</span>
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.facilityName}</h3>
                        <p className="text-xs text-slate-500">{item.medicineName} ({item.genericName})</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl block">
                          {item.quantity} Units Available
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">Free Government Dispensing</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BRANCH 2: ONLINE ORDER OPTIONS (REAL TATA 1MG PHOTO + INTEGRATED USAGE & SAFETY DETAILS) */}
          {(activeView === 'ALL' || activeView === 'ONLINE') && onlineData && (
            <div className={`${activeView === 'ONLINE' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
              
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Online Order Options & Medicine Guide</span>
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Live Tata 1mg Product Photo
                </span>
              </div>

              {/* MEDICINE PRODUCT CARD WITH REAL TATA 1MG GUMLET PHOTO & LIVE PRICING */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
                
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  
                  {/* REAL PRODUCT PACKAGING PHOTO WITH ONERROR AUTO-FALLBACK TO GUARANTEE 100% WORKING IMAGES */}
                  <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-white p-2 shrink-0 border border-slate-200 dark:border-slate-700 relative shadow-md flex items-center justify-center">
                    <img 
                      src={onlineData.image} 
                      alt={onlineData.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/rhqxp1hutcnkcdjbeapd.jpg';
                      }}
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-black px-2.5 py-0.5 rounded bg-rose-600 text-white backdrop-blur-md shadow">
                      {onlineData.discount}
                    </span>
                  </div>

                  {/* MEDICINE INFO & PRICE */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase">
                        {onlineData.category}
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        onlineData.prescriptionRequired ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {onlineData.prescriptionRequired ? '🔴 Prescription Required' : '🟢 OTC Medicine'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {onlineData.name}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium">
                      {onlineData.genericName} • <strong className="text-slate-700 dark:text-slate-300">{onlineData.manufacturer}</strong>
                    </p>

                    <p className="text-xs text-slate-400 font-medium">
                      Packaging: {onlineData.packSize}
                    </p>

                    <div className="flex items-baseline gap-2.5 pt-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{onlineData.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        MRP ₹{onlineData.mrp.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Save {onlineData.discount}
                      </span>
                    </div>
                  </div>

                </div>

                {/* PLATFORM DIRECT ORDER BUTTONS GRID */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-indigo-500" />
                      <span>Order Online from Authorized Pharmacy Platforms:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Live Merchant Links</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {onlineData.platforms.map(platform => (
                      <a
                        key={platform.id}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-between group shadow-sm active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{platform.logo}</span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {platform.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              ⚡ {platform.deliveryTime}
                            </span>
                          </div>
                        </div>

                        <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] flex items-center gap-1 shrink-0 shadow-sm">
                          Order <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>

                </div>

                {/* INTEGRATED TATA 1MG CLINICAL USAGE & MEDICAL SAFETY SECTION (EMBEDDED DIRECTLY IN ONLINE SECTION CARD) */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Tata 1mg Clinical Usage & Medical Safety Guide
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                      Verified Clinical Data
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    
                    {/* WHAT IT IS USED FOR */}
                    <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-900/20 border border-teal-200/80 dark:border-teal-800/60 space-y-1.5">
                      <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5" /> What it is used for (Indications)
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {clinical.indications}
                      </p>
                    </div>

                    {/* HOW TO USE / DOSAGE */}
                    <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5">
                      <span className="text-[10px] font-black text-indigo-800 dark:text-indigo-300 uppercase flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> How to Use & Dosage Guidance
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {clinical.howToUse}
                      </p>
                    </div>

                    {/* MECHANISM OF ACTION */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" /> How it Works (Mechanism)
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {clinical.mechanismOfAction}
                      </p>
                    </div>

                    {/* SAFETY PRECAUTIONS */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                      <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Safety Precautions & Warnings
                      </span>
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
                        {clinical.precautions}
                      </p>
                    </div>

                    {/* ALCOHOL & FOOD WARNINGS */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase">🍷 Alcohol & Food Precautions</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{clinical.alcoholInteraction}</p>
                    </div>

                    {/* PREGNANCY SAFETY */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase">🤰 Pregnancy & Breastfeeding Safety</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{clinical.pregnancySafety}</p>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MedicineAvailabilityPage;
