import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

import AuthLayout from "../components/AuthLayout";
import InfoDialog from "../components/InfoDialog";
import api from "../api/api";
import SEO from "../components/SEO";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleSignupSuccess = params.get("googleSignupSuccess");
    const googleAlreadyExists = params.get("googleAlreadyExists");
    const googleError = params.get("googleError");

    if (googleSignupSuccess) {
      setDialogConfig({
        isOpen: true,
        title: "Account Created",
        message: "Your account has been created successfully! Please sign in to continue.",
        variant: "success"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, "/login");
    }
    if (googleAlreadyExists) {
      setDialogConfig({
        isOpen: true,
        title: "Account Exists",
        message: "An account with this email already exists. Please sign in.",
        variant: "info"
      });
      window.history.replaceState({}, document.title, "/login");
    }
    if (googleError) {
      setDialogConfig({
        isOpen: true,
        title: "Authentication Error",
        message: decodeURIComponent(googleError),
        variant: "error"
      });
      window.history.replaceState({}, document.title, "/login");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success) {
      navigate("/dashboard");
    } else if (result.requireVerification) {
      navigate("/verify-email", { state: { email: result.email } });
    } else if (result.requireTwoFactor) {
      navigate("/verify-login", { state: { email: result.email } });
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await api.get("/auth/google/url?mode=login");
      const data = res.data;
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to get Google auth URL:", data.message);
      }
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  return (
    <>
    <SEO 
      title="Login"
      description="Sign in to your MediTrack account to access your medicines, reminders, and health reports."
    />
    <AuthLayout
      title="Welcome back"
      subtitle={
        <div className="mt-2">
          New to MediTrack?{" "}
          <Link
            to="/signup"
            className="text-emerald-600 hover:underline decoration-emerald-200 underline-offset-4 transition-all"
          >
            Create an account
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
          >
            Email address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
              <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-14 pr-5 py-4 text-slate-900 bg-slate-50/50 border border-slate-100 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-emerald-500 transition-all hover:bg-slate-50"
              placeholder="jane.doe@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              state={{ email }}
              className="text-xs font-bold text-emerald-600 hover:underline decoration-emerald-200 underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
              <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full pl-14 pr-12 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-emerald-500 transition-all hover:bg-slate-50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-emerald-500 transition-colors z-10"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-emerald-600 focus:ring-0 border-slate-200 bg-slate-50 rounded cursor-pointer accent-emerald-600"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-xs text-slate-500 cursor-pointer font-bold uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Remember for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-base hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        {/* Divider */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="px-4 bg-white/50 text-slate-400 font-bold uppercase tracking-widest rounded-full border border-slate-100">
              Secure login powered by <span className="text-slate-900">MediTrack</span>
            </span>
          </div>
        </div>
      </form>
    </AuthLayout>

    {dialogConfig && (
      <InfoDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig(null)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
      />
    )}
    </>
  );
};

export default Login;
