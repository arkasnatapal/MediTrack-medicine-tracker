import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash; // e.g. "#token=...."
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const token = params.get("token");

    if (token) {
      // Save token like normal login
      localStorage.setItem("token", token);
      // Optionally clear hash
      window.location.hash = "";
      // Redirect to main app with full reload to ensure AuthContext updates
      window.location.href = "/dashboard";
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

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
