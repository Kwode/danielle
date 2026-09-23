import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Upload,
  Loader2,
  Check,
  Smartphone,
  Globe,
  Sparkles,
  Tag,
  FileText,
  Cloud,
  Settings,
} from 'lucide-react';
import { subscribeToTable, handleSupabaseError, OperationType, safeSetDoc } from '../supabase';
import { MemoryVideo } from '../types';
import { DEFAULT_VIDEOS } from '../data/defaultContent';
import { triggerCelebration } from '../utils/confetti';
import { ScrollReveal } from './ScrollReveal';
import { generateVideoThumbnail } from '../utils/videoStorage';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from '../utils/cloudinaryService';
import { CloudinaryConfigModal } from './CloudinaryConfigModal';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export const VideoMemories: React.FC = () => {
  const [videos, setVideos] = useState<MemoryVideo[]>(() => {
    try {
      const isPurged = localStorage.getItem('danielle_media_purged_v1');
      if (isPurged) {
        const saved = localStorage.getItem('danielle_videos_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
        return [];
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);

  // Local file upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string>('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Map to hold active Blob URLs for proper memory cleanup
  const activeBlobUrlsRef = useRef<Map<string, string>>(new Map());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 2. Real-time synchronization for videos. Supabase stores metadata;
  // Cloudinary remains the actual media/file host.
  useEffect(() => {
    const unsubVideos = subscribeToTable<any>(
      'videos',
      (rows) => {
        const cloudVideos: MemoryVideo[] = rows.map((data) => ({
          id: data.id,
          title: data.title || 'Danielle Moment ✨',
          url: data.url || '',
          poster: data.poster || '',
          description: data.description || '',
          date: data.date || '',
          isCustom: data.is_custom ?? data.isCustom ?? true,
          duration: data.duration,
          fileSize: data.file_size ?? data.fileSize,
          mimeType: data.mime_type ?? data.mimeType,
          isLoadingBlob: false,
        }));

        const cloudIds = new Set(cloudVideos.map((video) => video.id));
        const activeDefaults = DEFAULT_VIDEOS.filter((video) => !cloudIds.has(video.id));
        const mergedVideos = [...cloudVideos, ...activeDefaults];
        setVideos(mergedVideos);
        try { localStorage.setItem('danielle_videos_cache', JSON.stringify(mergedVideos)); } catch {}
      },
      (error) => handleSupabaseError(error, OperationType.LIST, 'videos')
    );
    return unsubVideos;
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      activeBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      activeBlobUrlsRef.current.clear();
      if (previewVideoUrl) {
        URL.revokeObjectURL(previewVideoUrl);
      }
    };
  }, []);

  // Autoplay active video and pause others
  useEffect(() => {
    videoRefs.current.forEach((el, idx) => {
      if (!el) return;
      el.muted = isMuted;
      if (idx === activeIndex) {
        el.play().catch((err) => {
          console.warn('Autoplay handled:', err);
        });
      } else {
        el.pause();
      }
    });
  }, [activeIndex, isMuted, videos]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const cardWidth = container.firstElementChild
      ? (container.firstElementChild as HTMLElement).offsetWidth + 20
      : 280;

    const index = Math.round(scrollLeft / cardWidth);
    if (index >= 0 && index < videos.length) {
      setActiveIndex(index);
    }
  };

  const scrollToVideo = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const clamped = Math.max(0, Math.min(index, videos.length - 1));
    const cards = container.children;
    if (cards[clamped]) {
      (cards[clamped] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
    setActiveIndex(clamped);
  };

  // Handle local video file selection from phone or computer
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a valid video file
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|m4v|ogg|3gp)$/i)) {
      alert('Please select a valid video file (MP4, MOV, WebM, etc.)');
      return;
    }

    // Size limit check for fast cloud sync
    if (file.size > 30 * 1024 * 1024) {
      alert('To ensure fast synchronization across all phones and devices, please choose a video clip under 30MB.');
      return;
    }

    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedVideoFile(file);
    setPreviewVideoUrl(objectUrl);
    if (!newVideoTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewVideoTitle(cleanName);
    }

    // Generate poster thumbnail in background
    setIsProcessingVideo(true);
    setUploadStatusText('Creating preview thumbnail...');
    try {
      const poster = await generateVideoThumbnail(file);
      if (poster) {
        setGeneratedPoster(poster);
      }
    } catch (err) {
      console.warn('Poster generation error:', err);
    } finally {
      setIsProcessingVideo(false);
      setUploadStatusText('');
    }
  };

  // Upload local video to cloud Supabase so anyone anywhere can see it
  const handleSaveLocalVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoFile || !previewVideoUrl) return;

    setIsProcessingVideo(true);
    setUploadProgress(5);
    setUploadStatusText('Starting cloud upload...');

    const videoId = `video-${Date.now()}`;
    const title = newVideoTitle.trim() || 'Danielle Moment ✨';
    const description = newVideoDescription.trim();
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    try {
      // 1. Keep the preview object URL locally for instant playback.
      activeBlobUrlsRef.current.set(videoId, previewVideoUrl);

      if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured. Please configure Cloudinary before uploading videos.');
      }

      let videoFinalUrl = previewVideoUrl;

      // 2. Upload the actual video to Cloudinary. Supabase stores only its metadata/URL.
      setUploadStatusText('Uploading high-definition video to Cloudinary...');
      const result = await uploadToCloudinary(
        selectedVideoFile,
        'video',
        (percent) => {
          setUploadProgress(percent);
          setUploadStatusText(`Uploading to Cloudinary: ${percent}%`);
        }
      );

      videoFinalUrl = result.secureUrl;
      const savedToCloud = await safeSetDoc('videos', videoId, {
        id: videoId,
        title,
        poster: generatedPoster || '',
        date: dateFormatted,
        description,
        url: result.secureUrl,
        cloudinary_public_id: result.publicId || null,
        duration: result.duration ? String(result.duration) : null,
        file_size: selectedVideoFile.size,
        mime_type: selectedVideoFile.type || 'video/mp4',
        is_custom: true,
        created_at: new Date().toISOString(),
      });

      if (!savedToCloud) {
        throw new Error('Supabase could not save the video metadata. The video was uploaded to Cloudinary but was not synced to the gallery.');
      }

      // 3. Add the confirmed cloud-synced video to the UI new video to state
      const newVideoItem: MemoryVideo = {
        id: videoId,
        title,
        description,
        url: videoFinalUrl,
        poster: generatedPoster,
        isCustom: true,
        date: 'Just now',
        fileSize: selectedVideoFile.size,
        isLoadingBlob: false,
      };

      setVideos((prev) => {
        const updated = [newVideoItem, ...prev];
        try {
          localStorage.setItem('danielle_videos_cache', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // Reset modal state
      setSelectedVideoFile(null);
      setPreviewVideoUrl(null);
      setGeneratedPoster('');
      setNewVideoTitle('');
      setNewVideoDescription('');
      setIsAddModalOpen(false);

      triggerCelebration();
      showToast(
        'Video uploaded! 🎬✨'
      );

      // Scroll to new video at start
      setTimeout(() => {
        scrollToVideo(0);
      }, 150);
    } catch (err) {
      console.error('Video upload/sync failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      showToast(`Video upload failed: ${message}`);
      // Do not keep a local-only video. Supabase is the source of truth so the
      // gallery cannot falsely claim that a video was saved when other devices
      // cannot see it.
        } finally {
      setIsProcessingVideo(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  const handleCloseModal = () => {
    if (isProcessingVideo) return;
    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
    }
    setSelectedVideoFile(null);
    setPreviewVideoUrl(null);
    setGeneratedPoster('');
    setNewVideoTitle('');
    setNewVideoDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <motion.section
      id="videos"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Scroll Reveal */}
        <ScrollReveal className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-200 text-pink-950 text-xs font-bold uppercase tracking-wider mb-2 border border-pink-300">
              <Film className="w-3.5 h-3.5 text-pink-700" />
              <span>Video Gallery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-neutral-900">
              Videos of Danielle
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-pink-400/40 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video from Device</span>
            </button>

            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => scrollToVideo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-pink-100 text-pink-950 disabled:opacity-30 disabled:pointer-events-none shadow-xs border border-pink-300 flex items-center justify-center transition-all cursor-pointer"
                title="Previous Video"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToVideo(activeIndex + 1)}
                disabled={activeIndex === videos.length - 1}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-pink-100 text-pink-950 disabled:opacity-30 disabled:pointer-events-none shadow-xs border border-pink-300 flex items-center justify-center transition-all cursor-pointer"
                title="Next Video"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Scrollable Standalone Videos Carousel */}
        <ScrollReveal delay={0.1} distance={20}>
          {videos.length === 0 ? (
            <div className="text-center py-12 bg-pink-50/60 rounded-3xl border border-dashed border-pink-200 p-8">
              <Film className="w-10 h-10 text-pink-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-pink-950">No videos yet</p>
              <p className="text-xs text-neutral-500 mb-4">Choose a video from your phone or computer to add!</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-full bg-pink-600 text-white text-xs font-semibold flex items-center gap-1.5 mx-auto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device 🎬</span>
              </button>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 scrollbar-none px-1 sm:px-0 -mx-4 sm:mx-0 px-4 sm:px-0"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {videos.map((vid, idx) => {
                const ytId = vid.url ? extractYouTubeId(vid.url) : null;

                return (
                  <div
                    key={vid.id}
                    className="w-[72vw] max-w-[320px] sm:w-[280px] md:w-[310px] aspect-[9/16] shrink-0 snap-center rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-neutral-950 relative group"
                  >
                    {ytId ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
                        title={vid.title}
                        className="w-full h-full object-cover"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : vid.isLoadingBlob ? (
                      /* Background loading state while chunks stream */
                      <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
                        {vid.poster && (
                          <img
                            src={vid.poster}
                            alt={vid.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 blur-xs"
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
                          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                          <p className="text-xs font-semibold text-white">Loading shared video...</p>
                          <span className="text-[10px] text-pink-200 bg-pink-900/60 px-2 py-0.5 rounded-full">
                            -
                          </span>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                        }}
                        src={vid.url}
                        poster={vid.poster}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        preload="auto"
                        controls
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support HTML5 video.
                      </video>
                    )}

                    {/* Sound Mute/Unmute Overlay for HTML5 video */}
                    {!ytId && !vid.isLoadingBlob && (
                      <button
                        type="button"
                        onClick={() => setIsMuted((prev) => !prev)}
                        className="absolute top-3 right-3 z-30 pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-md hover:scale-110 active:scale-95"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-pink-300" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-pink-300" />
                        )}
                      </button>
                    )}

                    {/* Video Label & Information Scrim */}
                    <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none p-3 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Tag className="w-3 h-3 text-pink-400 shrink-0" />
                        <span className="text-white font-bold text-xs sm:text-sm drop-shadow-sm truncate">
                          {vid.title}
                        </span>
                      </div>
                      {vid.description && (
                        <p className="text-[10px] text-pink-100/90 line-clamp-2 leading-relaxed">
                          {vid.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[9px] text-pink-300/80 font-medium mt-1">
                        <span>{vid.date || 'Danielle Moment'}</span>
                        {vid.isCustom && (
                          <span className="flex items-center gap-1 bg-pink-900/60 text-pink-200 px-1.5 py-0.5 rounded-full border border-pink-500/20">
                            <Globe className="w-2.5 h-2.5" />
                            .
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Dots Indicator & Swipe Hint */}
          {videos.length > 0 && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                {videos.map((vid, idx) => (
                  <button
                    key={vid.id}
                    onClick={() => scrollToVideo(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'w-7 bg-pink-600'
                        : 'w-2 bg-pink-300 hover:bg-pink-400'
                    }`}
                    title={`Go to video ${idx + 1}`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 font-medium sm:hidden">
                Swipe left / right to browse videos
              </p>
            </div>
          )}
        </ScrollReveal>

        {/* Add Video Modal - EXCLUSIVELY Local Device Upload with Global Sync */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200 relative max-h-[90vh] overflow-y-auto"
              >
                {!isProcessingVideo && (
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-neutral-900">
                      Upload Video from Device
                    </h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-pink-600 inline" />
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveLocalVideo} className="space-y-4">
                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    disabled={isProcessingVideo}
                    onChange={handleLocalFileSelect}
                    className="hidden"
                  />

                  {/* Dropzone / Upload Trigger */}
                  {!previewVideoUrl ? (
                    <div
                      onClick={() => !isProcessingVideo && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-pink-300 hover:border-pink-500 rounded-2xl p-6 text-center bg-pink-50/50 hover:bg-pink-100/50 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-pink-200 group-hover:bg-pink-300 text-pink-700 mx-auto flex items-center justify-center mb-3 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-pink-950 mb-1">
                        Tap or Click to Select Video
                      </p>
                      <p className="text-xs text-neutral-500 mb-2">
                        Upload directly from your camera roll or photo library
                      </p>
                      <span className="inline-block text-[11px] bg-white px-2.5 py-1 rounded-full text-pink-700 border border-pink-200 font-semibold shadow-2xs">
                        Supports MP4, MOV, WebM (under 30MB)
                      </span>
                    </div>
                  ) : (
                    /* Video Preview Container */
                    <div className="space-y-3">
                      <div className="aspect-[9/16] max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-neutral-950 shadow-md relative border border-pink-200">
                        <video
                          src={previewVideoUrl}
                          poster={generatedPoster}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* File Details Bar */}
                      {selectedVideoFile && (
                        <div className="bg-pink-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-pink-200">
                          <div className="overflow-hidden">
                            <p className="font-semibold text-pink-950 truncate max-w-[180px]">
                              {selectedVideoFile.name}
                            </p>
                            <p className="text-[10px] text-pink-700">
                              {formatFileSize(selectedVideoFile.size)} • Ready to sync
                            </p>
                          </div>
                          {!isProcessingVideo && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-pink-200 hover:bg-pink-300 text-pink-900 font-semibold text-[11px] cursor-pointer"
                            >
                              Change
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Label Input Field */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-bold text-neutral-800">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-pink-600" />
                        <span>Video Label</span>
                        <span className="text-pink-600 font-bold">*</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {newVideoTitle.length}/80
                      </span>
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      disabled={isProcessingVideo}
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="e.g. Birthday dance, laughing together, beach day ✨"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none disabled:bg-neutral-100 placeholder:text-neutral-400 font-medium"
                    />
                    <p className="text-[10px] text-neutral-500">
                      This label will be displayed directly on the video card for Danielle and all visitors.
                    </p>
  
                  </div>

                  {/* Optional Memory Note / Caption */}
                  <div className="space-y-1 pt-1">
                    <label className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-pink-500" />
                        <span>Personal Note or Caption (Optional)</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {newVideoDescription.length}/250
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={250}
                      disabled={isProcessingVideo}
                      value={newVideoDescription}
                      onChange={(e) => setNewVideoDescription(e.target.value)}
                      placeholder="Add a sweet memory detail, location, or dedication note..."
                      className="w-full px-3.5 py-2 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none disabled:bg-neutral-100 placeholder:text-neutral-400 resize-none"
                    />
                  </div>

                  {/* Real-time Cloud Upload Progress Bar */}
                  {isProcessingVideo && (
                    <div className="p-3 bg-pink-50/80 rounded-2xl border border-pink-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-pink-950 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 text-pink-600 animate-spin" />
                          <span>{uploadStatusText || 'Syncing to cloud...'}</span>
                        </span>
                        <span className="font-bold text-pink-700">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-pink-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 text-center">
                        Uploading to secure cloud storage so everyone can view it
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-pink-100">
                    <button
                      type="button"
                      disabled={isProcessingVideo}
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedVideoFile || isProcessingVideo}
                      className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isProcessingVideo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Syncing... {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5" />
                          <span>Upload✨</span>
                        </>
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
          onConfigSaved={() => showToast('Cloudinary connected for fast video streaming! ☁️🎬')}
        />

        {/* Toast Notification */}
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
