import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { Loader2 } from 'lucide-react';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const token = params.get("token");

      if (token) {
        localStorage.setItem("token", token);
        
        try {
          // Verify token and cache user if needed, or just redirect
          // The Dashboard will handle profile completion check
          await api.get("/auth/me");
          window.location.href = "/dashboard";
        } catch (err) {
          console.error("Error fetching user in GoogleAuthSuccess:", err);
          navigate("/login", { replace: true });
        }

      } else {
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Signing you in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
