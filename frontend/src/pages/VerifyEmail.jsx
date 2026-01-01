import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import EmergencyContactModal from '../components/EmergencyContactModal';

const VerifyEmail = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const { verifyEmail, resendOtp, user } = useAuth(); // Access user from context
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setIsSubmitting(true);
    const success = await verifyEmail(email, otpString);
    if (success) {
      // Instead of navigating, show modal
      setShowEmergencyModal(true);
    } else {
      setIsSubmitting(false); // Only reset if failed. If success, keep loading or transitioning.
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    await resendOtp(email);
    setTimer(60);
    setIsResending(false);
  };
  
  const handleEmergencySuccess = () => {
     navigate('/dashboard');
  };

  const queryParams = new URLSearchParams(location.search);
  const via = queryParams.get("via");

  return (
    <>
      <AuthLayout 
        title="Verify your email" 
        subtitle={
          via === "google" 
            ? `We've sent an OTP to your Google email (${email}). Verify to complete signup.`
            : `We've sent a 6-digit code to ${email}`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-2 sm:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.join('').length !== 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/20 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Verifying...
              </>
            ) : (
              <>
                Verify Email
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || isResending}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto gap-2"
            >
              {isResending ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <RefreshCw className={`h-4 w-4 ${timer > 0 ? '' : 'group-hover:rotate-180 transition-transform'}`} />
              )}
              {timer > 0 ? `Resend code in ${timer}s` : "Resend verification code"}
            </button>
          </div>
        </form>
      </AuthLayout>
      
      {showEmergencyModal && (
        <EmergencyContactModal
          isOpen={true}
          onSuccess={handleEmergencySuccess}
          onClose={() => {}} // Mandatory
        />
      )}
    </>
  );
};

export default VerifyEmail;
