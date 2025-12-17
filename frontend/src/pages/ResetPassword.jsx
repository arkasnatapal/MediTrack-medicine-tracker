import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import InfoDialog from '../components/InfoDialog';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  useEffect(() => {
    if (!resetToken) {
      navigate('/login');
    }
  }, [resetToken, navigate]);

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
    const success = await resetPassword(resetToken, password);
    if (success) {
      navigate('/login');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <AuthLayout 
        title="Reset password" 
        subtitle="Choose a new password for your account."
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                Resetting...
              </>
            ) : (
              <>
                Reset Password
                <CheckCircle className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
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

export default ResetPassword;
