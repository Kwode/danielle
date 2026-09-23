import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Cloud,
  Loader2,
  Check,
  Settings,
} from 'lucide-react';
import { subscribeToTable, handleSupabaseError, OperationType, safeSetDoc } from '../supabase';
import { MemoryPhoto } from '../types';
import { DEFAULT_PHOTOS } from '../data/defaultContent';
import { triggerHeartConfetti } from '../utils/confetti';
import { ScrollReveal, StaggerContainer, StaggerItem } from './ScrollReveal';
import { compressImageFile } from '../utils/imageOptimizer';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from '../utils/cloudinaryService';
import { CloudinaryConfigModal } from './CloudinaryConfigModal';

export const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<MemoryPhoto[]>(() => {
    try {
      const isPurged = localStorage.getItem('danielle_media_purged_v1');
      if (isPurged) {
        const saved = localStorage.getItem('danielle_gallery_photos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
    } catch (e) {
      // ignore
    }
    return [];
  });
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New photo upload state
  const [newUrl, setNewUrl] = useState('');

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 2. Real-time synchronization from Supabase across all devices
  useEffect(() => {
    const unsubPhotos = subscribeToTable<any>(
      'photos',
      (rows) => {
        const cloudPhotos: MemoryPhoto[] = rows.map((data) => ({
          id: data.id,
          url: data.url,
          caption: data.caption || '',
          likes: data.likes || 0,
          category: data.category,
          date: data.date,
          location: data.location,
        }));

        const cloudIds = new Set(cloudPhotos.map((photo) => photo.id));
        const activeDefaults = DEFAULT_PHOTOS.filter((photo) => !cloudIds.has(photo.id));
        const merged = [...cloudPhotos, ...activeDefaults];
        setPhotos(merged);
        try {
          localStorage.setItem('danielle_gallery_photos', JSON.stringify(merged));
        } catch {
          // ignore quota errors
        }
      },
      (error) => handleSupabaseError(error, OperationType.LIST, 'photos')
    );
    return unsubPhotos;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsCompressing(true);
    try {
      const optimizedUrl = await compressImageFile(file);
      setNewUrl(optimizedUrl);
    } catch (err) {
      console.warn('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() && !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    let finalImageUrl = newUrl.trim();

    // 1. If Cloudinary is configured and a file was picked, upload to Cloudinary directly!
    if (selectedFile && isCloudinaryConfigured()) {
      try {
        const cloudinaryResult = await uploadToCloudinary(
          selectedFile,
          'image',
          (percent) => setUploadProgress(percent)
        );
        finalImageUrl = cloudinaryResult.secureUrl;
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning, falling back to optimized local/direct url:', cloudErr);
      }
    }

    const photoId = `photo-${Date.now()}`;
    const newPhotoData = {
      id: photoId,
      url: finalImageUrl,
      caption: '',
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase first. localStorage is only a cache; it must never be
    // treated as the source of truth for cross-browser/device synchronization.
    try {
      const savedToCloud = await safeSetDoc('photos', photoId, newPhotoData);

      if (!savedToCloud) {
        throw new Error(
          'Supabase could not save this photo. Check VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and that supabase.sql has been run.'
        );
      }

      // Supabase is now the source of truth. The realtime listener will update
      // the gallery and local cache for this browser and every other browser.
      setPhotos((prev) => {
        const updated = [newPhotoData, ...prev.filter((photo) => photo.id !== photoId)];
        try {
          localStorage.setItem('danielle_gallery_photos', JSON.stringify(updated));
        } catch {
          // ignore cache errors
        }
        return updated;
      });

      setNewUrl('');
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      triggerHeartConfetti();
      showToast('Picture added & synced across all browsers! 💖');
    } catch (err) {
      handleSupabaseError(err, OperationType.CREATE, 'photos');
      // Do not leave a locally-only photo behind. That was the reason the
      // first browser could see an image while a second browser could not.
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      try {
        const cached = localStorage.getItem('danielle_gallery_photos');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              'danielle_gallery_photos',
              JSON.stringify(parsed.filter((photo: any) => photo.id !== photoId))
            );
          }
        }
      } catch {
        // ignore cache cleanup errors
      }
      showToast('Could not sync picture. Check your Supabase setup.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.section
      id="gallery"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 md:py-24 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Scroll Reveal */}
        <ScrollReveal className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-200 text-pink-950 text-xs font-bold uppercase tracking-wider mb-2 border border-pink-300">
              <Camera className="w-3.5 h-3.5 text-pink-700" />
              <span>Photo Gallery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-neutral-900">
              Pictures of Danielle
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="gallery-add-photo-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-pink-400/40 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Picture</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Pure Image Grid with Staggered Scroll Reveal or Empty State */}
        {photos.length === 0 ? (
          <div className="text-center py-16 px-4 bg-pink-50/50 rounded-3xl border-2 border-dashed border-pink-200 p-8">
            <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-800 mb-1">
              No pictures in the library yet
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6">
              Upload photos of Danielle to start building her personal birthday photo gallery!
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-pink-400/30 inline-flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Picture</span>
            </button>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6" staggerChildren={0.06}>
            {photos.map((photo, index) => (
              <StaggerItem key={photo.id}>
                <div
                  onClick={() => setActiveLightboxIndex(index)}
                  className="group relative aspect-[4/5] sm:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-neutral-100"
                >
                  <img
                    src={photo.url}
                    alt="Danielle"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Clean Lightbox Modal */}
        <AnimatePresence>
          {activeLightboxIndex !== null && photos[activeLightboxIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
              onClick={() => setActiveLightboxIndex(null)}
            >
              <div
                className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-30 flex items-center gap-2">
                  <button
                    onClick={() => setActiveLightboxIndex(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-lg"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Left Navigation Arrow */}
                {photos.length > 1 && (
                  <button
                    onClick={() =>
                      setActiveLightboxIndex(
                        (activeLightboxIndex - 1 + photos.length) % photos.length
                      )
                    }
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-lg"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Main Full-Size Image */}
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center max-h-[85vh] max-w-full">
                  <img
                    src={photos[activeLightboxIndex].url}
                    alt="Danielle"
                    referrerPolicy="no-referrer"
                    className="max-h-[85vh] max-w-full object-contain rounded-2xl"
                  />
                </div>

                {/* Right Navigation Arrow */}
                {photos.length > 1 && (
                  <button
                    onClick={() =>
                      setActiveLightboxIndex((activeLightboxIndex + 1) % photos.length)
                    }
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-lg"
                    title="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Photo Modal */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200 relative"
              >
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900">
                      Add a Picture
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Upload from phone/camera or paste an image link (synced live)
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Choose Image File from Phone or Computer
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-neutral-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-800 hover:file:bg-pink-200 cursor-pointer mb-2"
                    />
                    {isCompressing && (
                      <p className="text-[11px] text-pink-600 flex items-center gap-1 mb-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Optimizing image for fast sync...</span>
                      </p>
                    )}
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                  </div>

                  {newUrl && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-rose-50 border border-pink-200">
                      <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Progress indicator */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-1.5 p-3 bg-pink-50 rounded-xl border border-pink-200">
                      <div className="flex justify-between text-[11px] font-semibold text-pink-900">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-pink-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-pink-600 h-full rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={(!newUrl && !selectedFile) || isUploading}
                      className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Add Picture 💖</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cloudinary Settings Modal */}
        <CloudinaryConfigModal
          isOpen={isCloudinaryModalOpen}
          onClose={() => setIsCloudinaryModalOpen(false)}
          onConfigSaved={() => showToast('Cloudinary connected successfully! ☁️✨')}
        />

        {/* Toast Feedback Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-white/10"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.section>
  );
};
