import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import GenderSelectionModal from "../components/GenderSelectionModal";

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store user data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash; // e.g. "#token=...."
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const token = params.get("token");

      if (token) {
        // Save token like normal login
        localStorage.setItem("token", token);
        
        try {
          // Fetch user to check for gender
          // We must clear header or ensure it uses the new token. 
          // Default api instance might rely on localStorage which is just set.
          // Let's force proper header just in case or rely on api interceptor reading localStorage.
          
          const res = await api.get("/auth/me");
          const user = res.data.user;

          if (!user.gender) {
            // Gender missing -> Show Modal
            setCurrentUser(user);
            setShowGenderModal(true);
            setLoading(false);
          } else {
            // Gender present -> Redirect
            window.location.href = "/dashboard";
          }
        } catch (err) {
          console.error("Error fetching user in GoogleAuthSuccess:", err);
          // Fallback simple redirect if anything fails
          window.location.href = "/dashboard";
        }

      } else {
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  const handleGenderSuccess = () => {
    // Gender saved -> Redirect
    window.location.href = "/dashboard";
  };

  if (showGenderModal) {
    return (
      <GenderSelectionModal 
        isOpen={true} 
        user={currentUser}
        onClose={() => {}} // Can't close without selecting
        onSuccess={handleGenderSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
