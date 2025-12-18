import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ user, className = "", fallbackType = "initial" }) => {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (user?.profilePictureUrl) {
      setImgSrc(user.profilePictureUrl.startsWith('http') 
        ? user.profilePictureUrl 
        : `${import.meta.env.VITE_BACKEND_URL}${user.profilePictureUrl}`);
      setImgError(false);
    } else {
      setImgSrc(null);
      setImgError(false);
    }
  }, [user?.profilePictureUrl]);

  if (user?.profilePictureUrl && !imgError && imgSrc) {
    return (
      <img 
        src={imgSrc} 
        alt={user.name || "User"} 
        className={`object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback UI
  return (
    <div className={`flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold ${className}`}>
      {fallbackType === 'icon' ? (
        <User className="h-1/2 w-1/2" />
      ) : (
        <span className="text-[50%]">
          {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
