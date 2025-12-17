import React, { useMemo, useState } from "react";
import { Pill, ZoomIn, Image as ImageIcon, Loader2 } from "lucide-react";
import ImageGalleryModal from "./ImageGalleryModal";

function hashStringToHue(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

const MedicineIllustration = ({ name = "", form = "", dosage = "", imageUrl = "", images = [], isLoading = false }) => {
  const hue = useMemo(() => hashStringToHue(name || "medicine"), [name]);
  const hue2 = (hue + 40) % 360;
  const [showGallery, setShowGallery] = useState(false);

  // Combine legacy imageUrl with new images array
  const allImages = useMemo(() => {
    const imgs = [...(images || [])];
    if (imageUrl && !imgs.includes(imageUrl)) {
      imgs.unshift(imageUrl);
    }
    return imgs;
  }, [imageUrl, images]);

  const displayImage = allImages.length > 0 ? allImages[0] : null;

  if (isLoading) {
    return (
      <div className="w-full aspect-[4/3] rounded-3xl relative overflow-hidden flex items-center justify-center bg-slate-800/50 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
        <div className="flex flex-col items-center gap-3 z-10">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 animate-pulse">Finding medicine images...</p>
        </div>
      </div>
    );
  }

  if (displayImage) {
    return (
      <>
        <div 
          className="w-full aspect-[4/3] rounded-3xl relative overflow-hidden flex items-center justify-center bg-white group cursor-pointer"
          onClick={() => setShowGallery(true)}
        >
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="text-slate-800 h-8 w-8 drop-shadow-md" />
          </div>

          {/* Multiple Images Badge */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>{allImages.length}</span>
            </div>
          )}
        </div>

        {showGallery && (
          <ImageGalleryModal 
            images={allImages} 
            onClose={() => setShowGallery(false)} 
          />
        )}
      </>
    );
  }

  return (
    <div
      className="w-full aspect-[4/3] rounded-3xl relative overflow-hidden flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},75%,30%), hsl(${hue2},75%,45%))`,
      }}
    >
      {/* Glass card */}
      <div className="absolute inset-6 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-white/70 uppercase tracking-wide">
              {form || "Medicine"}
            </p>
            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
              {name}
            </p>
          </div>
        </div>
        <p className="text-xs text-white/80">
          {dosage || "Dosage info"}
        </p>

        {/* Pills representation */}
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-14 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[10px] text-slate-700">
            {dosage || "mg"}
          </div>
          <div className="h-7 w-7 rounded-full bg-white/80 shadow-md" />
          <div className="h-7 w-7 rounded-full bg-white/60 shadow-md" />
        </div>
      </div>
    </div>
  );
};

export default MedicineIllustration;
