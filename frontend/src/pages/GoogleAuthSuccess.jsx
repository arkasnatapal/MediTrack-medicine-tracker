import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import GenderSelectionModal from "../components/GenderSelectionModal";
import EmergencyContactModal from "../components/EmergencyContactModal";

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const [showStatus, setShowStatus] = useState('loading'); // loading, gender, emergency, done
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const token = params.get("token");

      if (token) {
        localStorage.setItem("token", token);
        
        try {
          const res = await api.get("/auth/me");
          const user = res.data.user;
          setCurrentUser(user);

          if (!user.gender || user.gender === '') {
            setShowStatus('gender');
          } else if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
            setShowStatus('emergency');
          } else {
            window.location.href = "/dashboard";
          }
        } catch (err) {
          console.error("Error fetching user in GoogleAuthSuccess:", err);
          window.location.href = "/dashboard";
        }

      } else {
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  const handleGenderSuccess = (updatedUser) => {
    // Update local user state if needed or just fetch again? 
    // Usually the modal might update backend. 
    // Let's assume we proceed to next step.
    // If we have updatedUser, use it.
    if (updatedUser) setCurrentUser(updatedUser);
    
    // Check emergency contact on the *updated* user relative to the flow
    // Since we just saved gender, check if emergency contacts exist.
    // Usually they won't for new users.
    setShowStatus('emergency');
  };

  const handleEmergencySuccess = () => {
    window.location.href = "/dashboard";
  };

  if (showStatus === 'gender') {
    return (
      <GenderSelectionModal 
        isOpen={true} 
        user={currentUser}
        onClose={() => {}} 
        onSuccess={handleGenderSuccess} 
      />
    );
  }

  if (showStatus === 'emergency') {
    return (
      <EmergencyContactModal
        isOpen={true}
        onSuccess={handleEmergencySuccess}
        onClose={() => {}} // Mandatory step
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
