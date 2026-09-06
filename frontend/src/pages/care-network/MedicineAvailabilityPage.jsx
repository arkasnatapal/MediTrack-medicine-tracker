import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Pill, Search, Building2, AlertCircle, ExternalLink, ChevronRight, Info, 
  CheckCircle2, ShoppingCart, ShieldCheck, Tag, Sparkles, MapPin, Truck, Store, 
  ArrowRight, BookOpen, AlertTriangle, ShieldAlert, HeartPulse, RefreshCw, Activity, Heart, HelpCircle, ShoppingBag, X
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
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('Pan 40');
  const [userLocation, setUserLocation] = useState(() => locationService.getCachedLocation() || locationService.getDefaultLocation());
  const [inventoryList, setInventoryList] = useState(() => locationService.getCachedFacilities('medicine') || []);
  const [onlineDataList, setOnlineDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'ONLINE'
  const [basketMedicines, setBasketMedicines] = useState([]);

  useEffect(() => {
    initUserLocation();
  }, []);

  useEffect(() => {
    if (location.state?.medicines && Array.isArray(location.state.medicines)) {
      const meds = location.state.medicines;
      setBasketMedicines(meds);
      const names = meds.map(m => (typeof m === 'string' ? m : m.name)).filter(Boolean);
      if (names.length > 0) {
        setSearchTerm(names.join(', '));
      }
      executeSearch(meds);
    }
  }, [location.state]);

  const handleBuyAllTata1mg = (meds) => {
    if (!meds || meds.length === 0) return;
    const medList = meds.map(m => (typeof m === 'string' ? m : m.name)).filter(Boolean);
    if (medList.length === 0) return;

    // 1. Immediately update UI search term and trigger multi-search across all items
    setSearchTerm(medList.join(', '));
    executeSearch(meds);

    // 2. Open Tata 1mg order pages for all medicines, staggered to bypass browser popup blockers
    medList.forEach((medName, idx) => {
      setTimeout(() => {
        window.open(`https://www.1mg.com/search/all?name=${encodeURIComponent(medName)}`, '_blank');
      }, idx * 300);
    });
  };

  const initUserLocation = async () => {
    const cachedLoc = locationService.getCachedLocation();
    const cachedMeds = locationService.getCachedFacilities('medicine');

    if (cachedMeds && cachedMeds.length > 0) {
      setInventoryList(cachedMeds);
    }

    let loc = userLocation || cachedLoc || locationService.getDefaultLocation();
    try {
      const currentLoc = await locationService.getCurrentLocation();
      if (currentLoc && typeof currentLoc.latitude === 'number') {
        loc = currentLoc;
      }
    } catch (err) {
      console.warn('Location detection using default:', err);
    }
    setUserLocation(loc);

    const locChanged = locationService.hasLocationChanged(loc, cachedLoc, 0.5);

    if (!location.state?.medicines) {
      if (!locChanged && cachedMeds && cachedMeds.length > 0) {
        console.log('⚡ MedicineAvailabilityPage serving cached pharmacy stock (location delta < 0.5km).');
        return;
      }
      const initialQuery = location.state?.searchQuery || 'Pan 40';
      executeSearch(initialQuery, loc);
    }
    locationService.saveCachedLocation(loc);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const items = searchTerm.split(',').map(s => s.trim()).filter(Boolean);
      executeSearch(items.length > 1 ? items : items[0], userLocation);
    }
  };

  const executeSearch = async (queryOrList, loc = userLocation) => {
    if (!queryOrList) return;
    setLoading(true);

    try {
      const lat = loc ? loc.latitude : '';
      const lng = loc ? loc.longitude : '';
      const city = loc ? (loc.city || 'Jalpaiguri') : 'Jalpaiguri';

      const queries = Array.isArray(queryOrList)
        ? queryOrList.map(m => (typeof m === 'string' ? m : m.name)).filter(Boolean)
        : (typeof queryOrList === 'string' ? queryOrList.split(',').map(s => s.trim()).filter(Boolean) : [queryOrList.name]);

      if (queries.length === 0) return;

      // 1. Fetch Location-Aware Public Facility Inventory for queries
      const invPromises = queries.map(q =>
        axios.get(`${API_BASE}/care-network/inventory?name=${encodeURIComponent(q)}&lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`)
          .catch(() => ({ data: { inventory: [] } }))
      );
      const invResults = await Promise.all(invPromises);

      let combinedInventory = [];
      invResults.forEach(res => {
        if (res.data && Array.isArray(res.data.inventory)) {
          combinedInventory.push(...res.data.inventory);
        }
      });
      setInventoryList(combinedInventory);

      // 2. Fetch Real Medicine Packaging Photos & Online Pharmacy Deep Links for ALL queries in parallel
      const onlinePromises = queries.map(q => onlineMedicineService.fetchReal1mgMedicineDetails(q));
      const onlineResults = await Promise.all(onlinePromises);
      setOnlineDataList(onlineResults);

    } catch (err) {
      console.error('Error fetching medicine details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* HEADER CARD & SEARCH BAR */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/90 to-cyan-50/90 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border border-teal-200/80 dark:border-slate-700 shadow-md p-6 sm:p-8 rounded-3xl space-y-5 text-slate-900 dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-transparent text-xs font-black uppercase">
              <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Public Stock Tracker + Live Tata 1mg Aggregator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              MEDICINE AVAILABILITY & ONLINE ORDER HUB
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
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

      {/* PRESCRIBED MEDICINES BUY BASKET BANNER */}
      {basketMedicines.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 border border-emerald-500/40 rounded-3xl p-6 shadow-xl text-white space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Prescribed Medicines Buy Basket ({basketMedicines.length} Items)
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Direct online order & public stock verification from your Doctor Prescription
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const names = basketMedicines.map(m => typeof m === 'string' ? m : m.name).filter(Boolean);
                  setSearchTerm(names.join(', '));
                  executeSearch(basketMedicines);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-extrabold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                title="Show all basket medicines in stock & online order panels"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Show All ({basketMedicines.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBuyAllTata1mg(basketMedicines)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer ring-2 ring-emerald-400/50 animate-pulse"
                title="Open online order search links on Tata 1mg for all prescribed medicines"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buy All ({basketMedicines.length}) Online via Tata 1mg</span>
              </button>

              <button
                type="button"
                onClick={() => setBasketMedicines([])}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Dismiss Basket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {basketMedicines.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-extrabold text-white text-xs truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{m.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dosage: <strong className="text-slate-200">{m.dosage || '500mg'}</strong> • <span className="text-emerald-400 font-bold">{m.frequency || '1-0-1'}</span> ({m.duration || '5 days'})
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm(m.name);
                      executeSearch(m.name);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                    title={`Check live public hospital stock for ${m.name}`}
                  >
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`, '_blank')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 flex items-center gap-1 transition cursor-pointer"
                    title={`Order ${m.name} on Tata 1mg`}
                  >
                    <ShoppingCart className="w-3 h-3 text-emerald-400" />
                    <span>Buy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

          {/* BRANCH 2: ONLINE ORDER OPTIONS (REAL TATA 1MG PHOTO + INTEGRATED USAGE & SAFETY DETAILS FOR ALL MEDICINES) */}
          {(activeView === 'ALL' || activeView === 'ONLINE') && onlineDataList.length > 0 && (
            <div className={`${activeView === 'ONLINE' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
              
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Online Order Options & Medicine Guide ({onlineDataList.length} Medicines)</span>
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Live Tata 1mg Product Photos
                </span>
              </div>

              {/* RENDER PRODUCT CARDS FOR ALL MEDICINES IN onlineDataList */}
              {onlineDataList.map((item, itemIdx) => {
                const clinical = item.clinicalDetails || {};
                return (
                  <div key={itemIdx} className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
                    
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      
                      {/* REAL PRODUCT PACKAGING PHOTO WITH ONERROR AUTO-FALLBACK */}
                      <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-white p-2 shrink-0 border border-slate-200 dark:border-slate-700 relative shadow-md flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://onemg.gumlet.io/a_ignore,w_380,h_380,c_fit,q_auto,f_auto/rhqxp1hutcnkcdjbeapd.jpg';
                          }}
                          className="max-h-full max-w-full object-contain rounded-xl"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] font-black px-2.5 py-0.5 rounded bg-rose-600 text-white backdrop-blur-md shadow">
                          {item.discount}
                        </span>
                      </div>

                      {/* MEDICINE INFO & PRICE */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase">
                            {item.category}
                          </span>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.prescriptionRequired ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}>
                            {item.prescriptionRequired ? '🔴 Prescription Required' : '🟢 OTC Medicine'}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {item.name}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium">
                          {item.genericName} • <strong className="text-slate-700 dark:text-slate-300">{item.manufacturer}</strong>
                        </p>

                        <p className="text-xs text-slate-400 font-medium">
                          Packaging: {item.packSize}
                        </p>

                        <div className="flex items-baseline gap-2.5 pt-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ₹{item.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            MRP ₹{item.mrp.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Save {item.discount}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* PLATFORM DIRECT ORDER BUTTONS GRID */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-indigo-500" />
                          <span>Order <strong className="text-indigo-600 dark:text-indigo-400">{item.name}</strong> Online from Authorized Platforms:</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Live Merchant Links</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.platforms.map(platform => (
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

                    {/* CLINICAL SAFETY & USAGE GUIDE FOR THIS MEDICINE */}
                    {clinical.indications && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {item.name} — Clinical Safety & Usage Guide
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                            Verified Medical Data
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-900/20 border border-teal-200/80 dark:border-teal-800/60 space-y-1">
                            <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase flex items-center gap-1">
                              <HeartPulse className="w-3 h-3" /> What it is used for
                            </span>
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                              {clinical.indications}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1">
                            <span className="text-[10px] font-black text-indigo-800 dark:text-indigo-300 uppercase flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> How to Use & Dosage
                            </span>
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                              {clinical.howToUse}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
                            <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Precautions & Warnings
                            </span>
                            <p className="text-[11px] font-medium text-amber-900 dark:text-amber-200 leading-snug">
                              {clinical.precautions}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-500" /> Mechanism of Action
                            </span>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                              {clinical.mechanismOfAction}
                            </p>
                          </div>
                        </div>

                        {clinical.pregnancySafety && (
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase">🤰 Pregnancy & Breastfeeding Safety</span>
                            <p className="text-xs text-slate-700 dark:text-slate-300">{clinical.pregnancySafety}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MedicineAvailabilityPage;
