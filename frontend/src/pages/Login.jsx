import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import AuthLayout from "../components/AuthLayout";
import InfoDialog from "../components/InfoDialog";
import api from "../api/api";

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
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
          >
            Sign up for free
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2"
          >
            Email address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-12 pr-4 py-3.5 text-black dark:text-white bg-white/5 border border-white/10 rounded-2xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
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
              className="block text-sm font-bold text-slate-600 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              state={{ email }}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-black dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-emerald-400 transition-colors z-10"
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
            className="h-4 w-4 text-emerald-500 focus:ring-emerald-500/50 border-white/10 bg-white/5 rounded cursor-pointer accent-emerald-500"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm dark:text-slate-300 text-slate-700 cursor-pointer font-medium hover:text-slate-600 transition-colors"
          >
            Remember me for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full group overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center py-3.5 px-4 text-white font-bold text-base shadow-lg shadow-emerald-900/20">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
              </>
            )}
          </div>
        </motion.button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 dark:text-white font-bold hover:bg-white/10 transition-all duration-300 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5 "></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 dark:bg-[#0f172a] text-slate-500 font-light rounded-full border border-white/5">
              Secure login powered by <span className="font-bold">Medi<span className="text-emerald-500 dark:text-emerald-500">Track</span></span>
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
