import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface ProjectImageGalleryProps {
  images: string[];
  title: string;
}

export function ProjectImageGallery({ images, title }: ProjectImageGalleryProps) {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-200 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  // Main image (first one)
  const mainImage = images[0];
  // Remaining images (up to 4 for the grid) - always take 4 images if available
  const gridImages = images.slice(1, 5); // Always take images 1-4 (4 images total)
  const remainingCount = Math.max(0, images.length - 5);

  // Note: Debug logging removed for production

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentImageIndex, images.length]);

  return (
    <>
      {/* Gallery Layout - Main image + Grid */}
      <div className="w-full rounded-2xl overflow-hidden">
        {/* Desktop Grid (md and up) */}
        <div className="hidden md:grid grid-cols-5 gap-2" style={{ height: '360px' }}>
          {/* Main large image on left - takes 3 columns (60%) */}
          <div
            className="col-span-3 cursor-pointer relative group overflow-hidden rounded-l-2xl h-full"
            onClick={() => openLightbox(0)}
          >
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Grid of 4 smaller images on right - takes 2 columns (40%) */}
          <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full" style={{ minHeight: 0 }}>
            {/* Always render exactly 4 cells - either images or placeholders */}
            {Array.from({ length: 4 }).map((_, index) => {
              const image = gridImages[index];
              const hasImage = !!image;

              return (
                <div
                  key={`grid-cell-${index}`}
                  className={`relative cursor-pointer group overflow-hidden h-full w-full ${index === 0 ? 'rounded-tr-2xl' : ''
                    } ${index === 3 ? 'rounded-br-2xl' : ''
                    }`}
                  style={{ minHeight: 0 }}
                  onClick={() => hasImage && openLightbox(index + 1)}
                >
                  {hasImage ? (
                    <>
                      <img
                        src={image}
                        alt={`${title} ${index + 2}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Use a reliable fallback image
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
                        }}
                        onLoad={() => {
                          // Image loaded successfully
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Show "Show all photos" button only on the last image (bottom right) */}
                      {index === 3 && (
                        <div className="absolute inset-0 flex items-end justify-end p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(0);
                            }}
                            className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                          >
                            {remainingCount > 0 ? t('projectDetail.showAllXPhotos', { count: images.length }) : t('projectDetail.showAllPhotos')}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-100 flex items-center justify-center h-full w-full">
                      <span className="text-gray-400 text-sm">...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout (Carousel/Slider) */}
        <div className="md:hidden">
          <div className="relative h-[300px] w-full overflow-hidden rounded-2xl">
            <img
              src={images[currentImageIndex]}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => openLightbox(currentImageIndex)}
            />
            {/* Mobile Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-md"
                >
                  <IconChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-md"
                >
                  <IconChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            aria-label="Close"
          >
            <IconX size={32} />
          </button>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              aria-label="Previous"
            >
              <IconChevronLeft size={32} />
            </button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              aria-label="Next"
            >
              <IconChevronRight size={32} />
            </button>
          )}

          {/* Main image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentImageIndex]}
              alt={`${title} ${currentImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail strip at bottom */}
          {images.length > 1 && images.length <= 10 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
