import React, { useEffect, useCallback } from 'react';
import { X, CaretLeft, CaretRight, Play } from 'phosphor-react';
import { extractYouTubeId } from '../../lib/slugify';

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumb?: string;
  alt?: string;
}

interface GalleryLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const currentItem = items[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, items.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || !currentItem) return null;

  const youtubeId = currentItem.type === 'video' ? extractYouTubeId(currentItem.src) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <p className="text-white/70 text-sm">
          {currentIndex + 1} / {items.length}
        </p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Previous button */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-colors"
          >
            <CaretLeft size={24} />
          </button>
        )}

        {/* Content area */}
        <div className="w-full h-full flex items-center justify-center px-12 py-4">
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.src}
              alt={currentItem.alt || ''}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          ) : youtubeId ? (
            <div className="w-full max-w-4xl aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={currentItem.alt || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              />
            </div>
          ) : (
            <video
              src={currentItem.src}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* Next button */}
        {currentIndex < items.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 md:right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-colors"
          >
            <CaretRight size={24} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="bg-black/50 px-4 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onNavigate(index)}
                className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Play size={16} fill="white" className="text-white" />
                  </div>
                ) : (
                  <img
                    src={item.thumb || item.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryLightbox;
