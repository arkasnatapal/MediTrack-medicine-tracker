import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, RefreshCw, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const HealthIntelligencePanel = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/dashboard/intelligence`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.exists) {
        setData(res.data.snapshot);
      } else {
        setData(null); // No intelligence yet
      }
    } catch (err) {
      console.error("Error fetching intelligence", err);
      setError("Could not load health intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage('');
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/dashboard/intelligence/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.updated) {
        setData(res.data.snapshot);
        setMessage("Insights refreshed successfully.");
      } else {
        setMessage(res.data.message || "Insights are already up to date.");
      }
    } catch (err) {
      console.error("Error refreshing intelligence", err);
      setError("Failed to refresh insights.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIntelligence();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="text-red-500" />;
    return <Minus className="text-gray-500" />;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black bg-opacity-50 backdrop-blur-sm p-8 pt-24 pb-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-full overflow-y-auto border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Intelligence</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Health Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500">Analyzing health data...</p>
            </div>
          ) : data ? (
            <>
              {/* Score & Trend */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Health Score</span>
                  <div className={`text-5xl font-bold ${getScoreColor(data.healthScore)} mb-2`}>
                    {data.healthScore}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
                    {getTrendIcon(data.trend)}
                    <span className="capitalize">{data.trend} Trend</span>
                  </div>
                </div>

                <div className="flex-[2] space-y-4">
                  {data.progressionNote && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Progression Insight</h3>
                      <p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
                        {data.progressionNote}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {data.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {data.highlights && data.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Key Highlights</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Meta */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                <span>Last Updated: {getRelativeTime(data.generatedAt)}</span>
                <span>Version: {data.version}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Insights Yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Generate your first health intelligence snapshot to get personalized insights and trend analysis.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
             {message && (
                <div className={`p-3 rounded-lg text-sm text-center ${message.includes('already') ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
                  {message}
                </div>
             )}
             
             <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing Health Data...' : data ? 'Refresh Insights' : 'Generate First Insight'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HealthIntelligencePanel;
