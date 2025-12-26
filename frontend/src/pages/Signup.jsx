import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Loader2, Eye, EyeOff, Sparkles, Check, X } from 'lucide-react';

import AuthLayout from '../components/AuthLayout';
import InfoDialog from "../components/InfoDialog";
import api from "../api/api";
import SEO from "../components/SEO";

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState(''); // New State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = window.location;

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleAccountNotFound = params.get("googleAccountNotFound");
    
    if (googleAccountNotFound) {
      setDialogConfig({
        isOpen: true,
        title: "Account Not Found",
        message: "We couldn't find an account with that Google email. Please create a new account to continue.",
        variant: "info"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, "/signup");
    }
  }, [location]);

  // Password strength checker
  const getPasswordStrength = (pass) => {
    if (!pass) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500'];
    return { strength, label: labels[strength - 1] || '', color: colors[strength - 1] || '' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setDialogConfig({
        isOpen: true,
        title: "Password Mismatch",
        message: "Passwords don't match. Please try again.",
        variant: "error"
      });
      return;
    }
    setIsSubmitting(true);
    const result = await signup(name, email, password, gender); // Pass gender
    if (result.success) {
      if (result.requireVerification) {
        navigate('/verify-email', { state: { email } });
      } else {
        navigate('/dashboard');
      }
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await api.get("/auth/google/url?mode=signup");
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
      title="Sign Up"
      description="Create a free MediTrack account today. Start managing your health, family, and prescriptions with our AI-powered platform."
    />
    <AuthLayout 
      title="Create your account" 
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
            Sign in
           </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Full Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-black dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
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
              className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-black dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Gender Field */}
        <div>
          <label htmlFor="gender" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Gender
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <select
              id="gender"
              name="gender"
              required
              className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-black dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10 appearance-none"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" disabled className="text-slate-500 bg-slate-800">Select Gender</option>
              <option value="male" className="bg-white dark:bg-slate-800 text-black dark:text-white">Male</option>
              <option value="female" className="bg-white dark:bg-slate-800 text-black dark:text-white">Female</option>
              <option value="other" className="bg-white dark:bg-slate-800 text-black dark:text-white">Other</option>
            </select>
            {/* Custom arrow icon since appearance-none hides default */}
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
               <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                 <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
               </svg>
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
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
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      level <= passwordStrength.strength
                        ? level === 1 ? 'bg-red-500' : level === 2 ? 'bg-orange-500' : level === 3 ? 'bg-yellow-500' : 'bg-emerald-500'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-semibold ${passwordStrength.color}`}>
                {passwordStrength.label} password
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              className="block w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-black dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all hover:bg-white/10"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-emerald-400 transition-colors z-10"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="mt-2 flex items-center gap-2">
              {passwordsMatch ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-500">Passwords match</p>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <p className="text-xs font-semibold text-red-500">Passwords don't match</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !passwordsMatch}
          className="relative w-full group overflow-hidden mt-6 rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-center py-3.5 px-4 text-white font-bold text-base shadow-lg shadow-emerald-900/20 disabled:opacity-50">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
               
              </>
            )}
          </div>
        </button>

        <div className="relative flex py-2 items-center mt-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-black dark:text-white font-bold hover:bg-white/10 transition-all duration-300 group"
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

        {/* Terms */}
        <p className="text-xs text-center text-slate-500 mt-4">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors">
            Privacy Policy
          </Link>
        </p>
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

export default Signup;
