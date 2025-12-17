import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

const ImageGalleryModal = ({ images = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images.length) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        <X className="h-6 w-6" />
      </button>

      <div 
        className="relative w-full max-w-5xl h-full max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Image Container */}
        <div 
          className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg transition-all duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={toggleZoom}
        >
          <img
            src={images[currentIndex]}
            alt={`Medicine view ${currentIndex + 1}`}
            className={`transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'} object-contain max-h-full max-w-full`}
          />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Thumbnails / Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-full bg-black/50 backdrop-blur-md">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                setIsZoomed(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        
        {/* Counter */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
