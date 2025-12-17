import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await forgotPassword(email);
    if (success) {
      navigate('/verify-reset-otp', { state: { email } });
    }
    setIsSubmitting(false);
  };

  return (
    <AuthLayout 
      title="Forgot password?" 
      subtitle="No worries, we'll send you reset instructions."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/20 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Sending OTP...
            </>
          ) : (
            <>
              Send OTP
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
