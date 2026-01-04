import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';

const IdentityCard = ({ user }) => {
  const { notify } = useNotification();
  const cardRef = useRef(null);

  // Generate a unique member ID based on user ID or random string if check fails
  // Generate a unique member ID based on user ID or random string if check fails
  const memberId = user?.memberId || (user?._id 
    ? `MT-${user._id.slice(-6).toUpperCase()}` 
    : `MT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

  // QR Code Data - Redirects to user profile or app download
  // Hardcoded production URL as requested
  const appUrl = 'https://meditrack-ultimate.vercel.app';
  const qrData = `${appUrl}/identify/${memberId}`;

  const generateImage = async () => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        filter: (node) => {
            // Exclude elements with the ignore class or data attribute
            if (node.classList && node.classList.contains('download-ignore')) return false;
            if (node.getAttribute && node.getAttribute('data-ignore-download')) return false;
            return true;
        }
      });
      return dataUrl;
    } catch (err) {
      console.error('Error generating image', err);
      notify.error('Failed to generate image');
      return null;
    }
  };

  const handleShare = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'meditrack-identity.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'My MediTrack Identity',
          text: `Check out my MediTrack Identity Card! Member ID: ${memberId}`,
          files: [file]
        });
        notify.success('Shared successfully!');
      } else {
        downloadCard(dataUrl);
      }
    } catch (error) {
      console.error('Share failed:', error);
      if (error.name !== 'AbortError') {
         downloadCard(dataUrl);
      }
    }
  };

  const downloadCard = (dataUrl) => {
    const link = document.createElement('a');
    link.download = `meditrack-id-${memberId}.png`;
    link.href = dataUrl;
    link.click();
    notify.success('Identity card downloaded');
  };

  const copyId = () => {
    navigator.clipboard.writeText(memberId);
    notify.success('Member ID copied to clipboard');
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-10 px-4 w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative group perspective-1000"
      >
        {/* Card Container - Fixed Large Size for Clarity */}
        <div 
          ref={cardRef}
          className="relative w-[500px] h-[315px] rounded-[32px] overflow-hidden shadow-2xl transition-transform duration-300 md:group-hover:scale-[1.02] flex flex-col transform-gpu"
          style={{
             background: 'linear-gradient(135deg, #022c22 0%, #065f46 40%, #10b981 100%)',
             boxShadow: '0 25px 50px -12px rgba(6, 95, 70, 0.5)'
          }}
        >
          {/* Glass Overlay & Pattern */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          <div className="absolute inset-0 opacity-30" 
            style={{ 
                backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.4) 0%, transparent 50%)'
            }} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
          
          {/* Decorative Circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-900/20 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative h-full p-7 flex flex-col justify-between text-white z-10">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <img src="/logo.png" className='h-10' alt="MediTrack Logo" />
                  <div>
                    <span className="font-bold tracking-wide text-lg block text-white leading-none">MediTrack</span>
                    <span className="text-[10px] opacity-80 tracking-[0.2em] text-gray-400 font-medium">HEALTH IDENTITY</span>
                  </div>
              </div>
              <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                 <p className="text-[10px] font-bold tracking-widest text-white">OFFICIAL ID</p>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex items-center gap-6 mt-2">
               <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                 <div className="w-20 h-20 rounded-full border-[3px] border-white/40 shadow-xl overflow-hidden bg-white/10 backdrop-blur-md">
                    <UserAvatar user={user} className="w-full h-full text-2xl" />
                 </div>
                 <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-400 border-[3px] border-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-3.5 h-3.5 text-emerald-900 stroke-[3]" />
                 </div>
               </div>
               
               <div className="flex-1 min-w-0 pt-3 flex flex-col justify-center">
                 <h2 className="text-2xl font-bold truncate tracking-wide mb-1 text-white drop-shadow-md leading-normal py-0.5">{user.name || 'User Name'}</h2>
                 <p className="text-emerald-50 text-sm truncate opacity-90 font-medium leading-relaxed pb-0.5">{user.email || 'user@example.com'}</p>
                 
                 <div className="flex items-center gap-3 mt-3">
                    <div className="bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center">
                        <code className="text-xs font-mono tracking-wider font-semibold text-white/90">{user.memberId || memberId}</code>
                    </div>
                    
                    <div 
                        onClick={copyId}
                        data-ignore-download="true"
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer border border-white/5"
                    >
                        <Copy className="w-3 h-3 text-white" />
                    </div>
                 </div>
               </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-2">
              <div className="space-y-1 mb-1">
                 <p className="text-[9px] uppercase opacity-70 tracking-widest text-white font-semibold">MEMBER SINCE</p>
                 <p className="text-sm font-bold text-white tracking-wide">{user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}</p>
              </div>

              <div className="bg-white p-1.5 rounded-xl shadow-xl flex-shrink-0 transform translate-y-2">
                <div className="h-16 w-16">
                    <QRCode
                    value={qrData}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                    />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Side Action Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col gap-4 text-center md:text-left min-w-[200px]"
      >
        <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Identity</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Share this card with healthcare providers for quick access to your medical history.
            </p>
        </div>

        <div className="space-y-3">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-emerald-500/20 font-semibold transition-all"
            >
                <Share2 className="w-5 h-5" />
                <span>Share Card</span>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                    const dataUrl = await generateImage();
                    if (dataUrl) downloadCard(dataUrl);
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300"
            >
                <Download className="w-5 h-5" />
                <span>Download PNG</span>
            </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default IdentityCard;
