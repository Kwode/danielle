import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Plus,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Trash2,
  Upload,
  CheckCircle2,
  Cloud,
  Link as LinkIcon,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { subscribeToTable, handleSupabaseError, OperationType, safeSetDoc, safeDeleteDoc } from '../supabase';
import { MusicTrack } from '../types';
import { DEFAULT_TRACK } from '../data/defaultContent';
import { triggerHeartConfetti } from '../utils/confetti';
import {
  saveAudioToStorage,
  getAudioFromStorage,
  deleteAudioFromStorage,
} from '../utils/audioStorage';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface MusicPlayerWidgetProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export const MusicPlayerWidget: React.FC<MusicPlayerWidgetProps> = ({
  isPlaying,
  onTogglePlay,
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    try {
      const saved = localStorage.getItem('danielle_music_tracks_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [DEFAULT_TRACK];
  });
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [hasUploadedMp3, setHasUploadedMp3] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add song modal state
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'youtube' | 'audio-url' | 'local'>('youtube');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [isSavingSong, setIsSavingSong] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dedicatedFileInputRef = useRef<HTMLInputElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const currentTrack = tracks[currentIndex] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 1. Check IndexedDB on mount to see if user uploaded a local MP3 for Older
  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadSavedAudio() {
      const saved = await getAudioFromStorage('older-sasha-sloan-mp3');
      if (saved?.blob) {
        objectUrl = URL.createObjectURL(saved.blob);
        setHasUploadedMp3(true);
        setTracks((prev) =>
          prev.map((t) =>
            t.id === 'older-sasha-sloan'
              ? {
                  ...t,
                  url: objectUrl!,
                  type: 'custom',
                }
              : t
          )
        );
      }
    }

    loadSavedAudio();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  // 2. Listen to deleted items tombstones in Supabase so deleted songs never return
  useEffect(() => {
    const unsubDeleted = subscribeToTable<{ id: string }>(
      'deleted_items',
      (rows) => setDeletedIds(new Set(rows.map((row) => row.id))),
      (err) => console.warn('deleted_items listener notice for music:', err)
    );
    return unsubDeleted;
  }, []);

  // 3. Real-time synchronization of shared music tracks from Supabase
  useEffect(() => {
    const unsub = subscribeToTable<any>(
      'music_tracks',
      (rows) => {
        const cloudTracks: MusicTrack[] = rows.map((data) => ({
          id: data.id, title: data.title, artist: data.artist, type: data.type,
          url: data.url, youtubeId: data.youtube_id || data.youtubeId, duration: data.duration || 'Track',
        }));
        const activeCloudTracks = cloudTracks.filter((track) => !deletedIds.has(track.id));
        const cloudIds = new Set(activeCloudTracks.map((track) => track.id));
        setTracks((prev) => {
          const result: MusicTrack[] = [];
          if (!deletedIds.has('older-sasha-sloan') && !cloudIds.has('older-sasha-sloan')) {
            result.push(prev.find((track) => track.id === 'older-sasha-sloan') || DEFAULT_TRACK);
          }
          activeCloudTracks.forEach((track) => {
            if (track.id !== 'older-sasha-sloan') result.push(track);
          });
          try { localStorage.setItem('danielle_music_tracks_cache', JSON.stringify(result)); } catch {}
          return result;
        });
      },
      (error) => handleSupabaseError(error, OperationType.LIST, 'music_tracks')
    );
    return unsub;
  }, [deletedIds]);

  // 4. Initialize YouTube IFrame API for background playback
  useEffect(() => {
    const handleInitYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('yt-audio-embed', {
          height: '1',
          width: '1',
          videoId: DEFAULT_TRACK.youtubeId || 'r1Fx0tqK5Z4',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              setYtReady(true);
              if (isPlaying) {
                try {
                  event.target.playVideo();
                } catch (e) {
                  console.warn('Initial autoplay onReady caught:', e);
                }
              }
            },
            onStateChange: (event: any) => {
              // 0 = YT.PlayerState.ENDED
              if (event.data === 0) {
                handleNextTrack();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube audio player init:', err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        handleInitYT();
      };
    } else {
      handleInitYT();
    }
  }, []);

  // 5. Playback control (HTML5 audio vs YouTube audio)
  useEffect(() => {
    if (!currentTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      return;
    }

    const effectiveVol = isMuted ? 0 : volume;

    if (!isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Direct audio URL playback (MP3, custom audio, streaming link)
    if (currentTrack.url) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }

      if (audioRef.current) {
        if (audioRef.current.src !== currentTrack.url) {
          audioRef.current.src = currentTrack.url;
        }
        audioRef.current.volume = effectiveVol;
        audioRef.current.play().catch((err) => {
          console.warn('Audio play prevented:', err);
        });
      }
    } else if (currentTrack.youtubeId) {
      // YouTube stream playback
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (ytPlayerRef.current && ytReady) {
        try {
          const currentLoaded = ytPlayerRef.current.getVideoData?.()?.video_id;
          if (currentLoaded !== currentTrack.youtubeId && typeof ytPlayerRef.current.loadVideoById === 'function') {
            ytPlayerRef.current.loadVideoById(currentTrack.youtubeId);
          }
          ytPlayerRef.current.setVolume(effectiveVol * 100);
          if (typeof ytPlayerRef.current.playVideo === 'function') {
            ytPlayerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('YouTube play video error:', e);
        }
      }
    }
  }, [isPlaying, currentTrack, isMuted, volume, ytReady]);

  // 6. User gesture fallback for browser autoplay policies
  useEffect(() => {
    if (!isPlaying) return;

    const triggerPlay = () => {
      if (currentTrack?.url && audioRef.current) {
        audioRef.current.play().catch(() => {});
      } else if (currentTrack?.youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          ytPlayerRef.current.playVideo();
        } catch {}
      }
    };

    window.addEventListener('click', triggerPlay, { once: true });
    window.addEventListener('touchstart', triggerPlay, { once: true });
    window.addEventListener('pointerdown', triggerPlay, { once: true });

    return () => {
      window.removeEventListener('click', triggerPlay);
      window.removeEventListener('touchstart', triggerPlay);
      window.removeEventListener('pointerdown', triggerPlay);
    };
  }, [isPlaying, currentTrack, ytReady]);

  // Volume control
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(effectiveVol * 100);
      } catch {
        // ignore
      }
    }
  }, [volume, isMuted]);

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    if (tracks.length === 1) {
      if (currentTrack?.url && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.warn);
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        try {
          ytPlayerRef.current.seekTo(0);
          ytPlayerRef.current.playVideo();
        } catch {
          // ignore
        }
      }
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrevTrack = () => {
    if (tracks.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  // Upload MP3 specifically for "Older by Sasha Sloan" and save to IndexedDB
  const handleUploadOlderMp3 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveAudioToStorage('older-sasha-sloan-mp3', file, {
        title: 'Older',
        artist: 'Sasha Sloan 💖',
      });

      const newUrl = URL.createObjectURL(file);
      setHasUploadedMp3(true);

      setTracks((prev) =>
        prev.map((t) =>
          t.id === 'older-sasha-sloan'
            ? {
                ...t,
                url: newUrl,
                type: 'custom',
              }
            : t
        )
      );

      triggerHeartConfetti();
      showToast('High-def MP3 loaded for Older! 🎶');
      if (!isPlaying) {
        onTogglePlay();
      }
    } catch (err) {
      console.warn('Notice: audio file stored temporarily in memory:', err);
    }

    if (dedicatedFileInputRef.current) {
      dedicatedFileInputRef.current.value = '';
    }
  };

  // Add shared song to Firebase Supabase (persists across all devices)
  const handleSaveCloudSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongUrl.trim() && addMode !== 'local') return;

    setIsSavingSong(true);
    const trackId = `track-${Date.now()}`;

    try {
      if (addMode === 'youtube') {
        const ytId = extractYouTubeId(newSongUrl) || newSongUrl.trim();
        const newTrackData: MusicTrack = {
          id: trackId,
          title: newSongTitle.trim() || 'Danielle Favorite Song',
          artist: newSongArtist.trim() || 'For Danielle Sarah Festus 💖',
          type: 'youtube',
          youtubeId: ytId,
          duration: 'Streaming',
        };

        // Optimistically add to tracks and localStorage
        setTracks((prev) => {
          const updated = [...prev, newTrackData];
          try {
            localStorage.setItem('danielle_music_tracks_cache', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        await safeSetDoc('music_tracks', trackId, {
          ...newTrackData,
          createdAt: new Date().toISOString(),
        });
      } else if (addMode === 'audio-url') {
        const newTrackData: MusicTrack = {
          id: trackId,
          title: newSongTitle.trim() || 'Danielle Song',
          artist: newSongArtist.trim() || 'For Danielle Sarah Festus 💖',
          type: 'audio-url',
          url: newSongUrl.trim(),
          duration: 'Audio',
        };

        // Optimistically add to tracks and localStorage
        setTracks((prev) => {
          const updated = [...prev, newTrackData];
          try {
            localStorage.setItem('danielle_music_tracks_cache', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        await safeSetDoc('music_tracks', trackId, {
          ...newTrackData,
          createdAt: new Date().toISOString(),
        });
      }

      setNewSongTitle('');
      setNewSongArtist('');
      setNewSongUrl('');
      setIsAddSongModalOpen(false);
      triggerHeartConfetti();
      showToast('Song added to playlist! 💖');
    } catch (err) {
      handleSupabaseError(err, OperationType.CREATE, 'music_tracks');
    } finally {
      setIsSavingSong(false);
    }
  };

  // Remove ANY track from playlist (Cloud, default Older, or local)
  const handleRemoveTrack = async (trackId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const wasCurrentTrack = currentTrack?.id === trackId;

    // 1. Instant optimistic UI removal (0ms delay!)
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      try {
        localStorage.setItem('danielle_music_tracks_cache', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setDeletedIds((prev) => new Set([...prev, trackId]));

    if (wasCurrentTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      setCurrentIndex(0);
    }

    showToast('Song removed from playlist 🗑️');

    // 2. Clean up IndexedDB if removing Older
    if (trackId === 'older-sasha-sloan') {
      try {
        await deleteAudioFromStorage('older-sasha-sloan-mp3');
        setHasUploadedMp3(false);
      } catch {
        // ignore
      }
    }

    // 3. Mark tombstone in Supabase so it never re-appears on any device or reload
    try {
      await safeSetDoc('deleted_items', trackId, {
        id: trackId,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed recording deleted tombstone for song:', err);
    }

    // 4. Delete document from music_tracks in Supabase if it was a cloud track
    try {
      await safeDeleteDoc('music_tracks', trackId);
    } catch (err) {
      // ignore
    }
  };

  const isCloudTrack = (id: string) => id.startsWith('track-');

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleNextTrack}
      />

      {/* Hidden YouTube audio player embed */}
      <div
        id="yt-audio-embed"
        className="fixed -top-96 -left-96 pointer-events-none opacity-0 invisible"
        aria-hidden="true"
      />

      {/* Floating Music Widget */}
      <div className="fixed bottom-5 right-5 z-40">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-pink-300 shadow-xl shadow-pink-950/15 transition-all duration-300 w-80 sm:w-96 overflow-hidden">
          
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-pink-200/95 via-rose-200/85 to-pink-100 flex items-center justify-between border-b border-pink-300">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-pink-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin-slow' : ''}`} />
              </div>
              <span className="text-xs font-bold text-pink-950 font-serif tracking-wide truncate">
                Danielle’s Birthday Music
              </span>
              <span className="text-[10px] bg-pink-100/90 text-pink-900 px-2 py-0.5 rounded-full font-bold border border-pink-200 shrink-0">
                {tracks.length > 0 ? `${currentIndex + 1} / ${tracks.length}` : '0 songs'}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showPlaylist ? 'bg-pink-300/80 text-pink-950' : 'text-pink-800 hover:text-pink-950 hover:bg-pink-200/60'
                }`}
                title={showPlaylist ? 'Hide songs list' : 'View all songs'}
              >
                <ListMusic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-pink-800 hover:text-pink-950 p-1.5 hover:bg-pink-200/60 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expand player' : 'Minimize player'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Player Body */}
          {!isMinimized && (
            <div className="p-3.5 sm:p-4 space-y-3">
              {/* Current Track Info */}
              <div className="flex items-center justify-between gap-2">
                {currentTrack ? (
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-neutral-800 truncate" title={currentTrack.title}>
                        {currentTrack.title}
                      </p>
                      {hasUploadedMp3 && currentTrack.id === 'older-sasha-sloan' && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> MP3
                        </span>
                      )}
                      {isCloudTrack(currentTrack.id) && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-pink-100 text-pink-800 px-1.5 py-0.2 rounded-full font-semibold shrink-0">
                          <Cloud className="w-2.5 h-2.5 text-pink-600" /> Cloud
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-pink-800 font-medium flex items-center gap-1 truncate">
                      <Sparkles className="w-2.5 h-2.5 inline text-pink-700 shrink-0" />
                      <span>{currentTrack.artist}</span>
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-bold text-neutral-800 truncate">
                      No song in playlist
                    </p>
                    <p className="text-[11px] text-pink-700">Click &quot;Add Song&quot; to pick music</p>
                  </div>
                )}

                {/* Animated visualizer */}
                {isPlaying && currentTrack && (
                  <div className="flex items-end gap-1 h-5 shrink-0 px-1">
                    <span className="w-1 bg-pink-600 rounded-full animate-bounce [animation-delay:0ms] h-3"></span>
                    <span className="w-1 bg-rose-600 rounded-full animate-bounce [animation-delay:150ms] h-5"></span>
                    <span className="w-1 bg-pink-700 rounded-full animate-bounce [animation-delay:300ms] h-2"></span>
                    <span className="w-1 bg-rose-700 rounded-full animate-bounce [animation-delay:100ms] h-4"></span>
                  </div>
                )}
              </div>

              {/* Main Controls Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-pink-100">
                {/* Add Song Button - Opens Cloud Sync Modal */}
                <button
                  type="button"
                  id="music-add-song-btn"
                  onClick={() => setIsAddSongModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 border border-pink-200 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer shrink-0"
                  title="Add songs (persists across all devices)"
                >
                  <Plus className="w-3.5 h-3.5 text-pink-700" />
                  <span>Add Song</span>
                </button>

                {/* Dedicated upload input for Older MP3 */}
                <input
                  ref={dedicatedFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleUploadOlderMp3}
                  className="hidden"
                />

                {/* Local file upload input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const newTracks: MusicTrack[] = Array.from(files).map((file: File, idx: number) => ({
                      id: `local-${Date.now()}-${idx}`,
                      title: file.name.replace(/\.[^/.]+$/, ''),
                      artist: 'For Danielle Sarah Festus 💖',
                      type: 'custom',
                      url: URL.createObjectURL(file),
                      duration: 'Local',
                    }));
                    setTracks((prev) => [...prev, ...newTracks]);
                    triggerHeartConfetti();
                    showToast('Local music added!');
                  }}
                  className="hidden"
                />

                {/* Playback Buttons: Prev, Play/Pause, Next */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevTrack}
                    disabled={tracks.length <= 1}
                    className="p-1.5 rounded-full text-pink-900 hover:bg-pink-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Previous Song"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    id="music-main-play-btn"
                    onClick={onTogglePlay}
                    disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play Music'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextTrack}
                    disabled={tracks.length <= 1}
                    className="p-1.5 rounded-full text-pink-900 hover:bg-pink-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Next Song"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-pink-800 hover:text-pink-950 p-1 cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-10 sm:w-14 h-1.5 accent-pink-600 bg-pink-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Upload Your MP3 Helper Banner */}
              {!hasUploadedMp3 && tracks.some((t) => t.id === 'older-sasha-sloan') && (
                <div className="bg-pink-50/90 border border-pink-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-pink-950 truncate">
                      Have the MP3 of Older?
                    </p>
                    <p className="text-[10px] text-pink-700 truncate">
                      Upload audio file to activate direct high-def audio
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dedicatedFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload MP3</span>
                  </button>
                </div>
              )}

              {/* Expandable Playlist Drawer */}
              {showPlaylist && (
                <div className="pt-2 border-t border-pink-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-pink-900 pb-1">
                    <div className="flex items-center gap-1">
                      <span>Playlist ({tracks.length})</span>
                      <span className="text-[9px] text-emerald-700 font-normal flex items-center gap-0.5">
                        <Cloud className="w-2.5 h-2.5" /> Synced
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddSongModalOpen(true)}
                        className="text-pink-700 hover:text-pink-900 font-semibold cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Song
                      </button>
                    </div>
                  </div>

                  {tracks.length === 0 ? (
                    <div className="text-center py-4 px-2 bg-pink-50/50 rounded-xl border border-dashed border-pink-200">
                      <p className="text-xs text-neutral-600 font-medium">Playlist is empty</p>
                      <button
                        type="button"
                        onClick={() => setIsAddSongModalOpen(true)}
                        className="mt-1 text-[11px] text-pink-600 font-bold hover:underline cursor-pointer"
                      >
                        + Add a song for Danielle
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {tracks.map((t, idx) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            if (!isPlaying) onTogglePlay();
                          }}
                          className={`group px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            idx === currentIndex
                              ? 'bg-pink-600 text-white font-semibold shadow-xs'
                              : 'bg-pink-50/80 hover:bg-pink-100 text-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className={`text-[10px] w-4 text-center shrink-0 ${idx === currentIndex ? 'text-pink-100' : 'text-neutral-400'}`}>
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[170px] sm:max-w-[210px]" title={t.title}>
                              {t.title}
                            </span>
                            {t.id === 'older-sasha-sloan' && hasUploadedMp3 && (
                              <span className="text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-mono shrink-0">
                                MP3
                              </span>
                            )}
                            {isCloudTrack(t.id) && (
                              <span className="text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-mono shrink-0">
                                Cloud
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Delete button available for ALL songs (custom or default) */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveTrack(t.id, e)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                idx === currentIndex
                                  ? 'text-pink-200 hover:text-white hover:bg-pink-700'
                                  : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                              } opacity-80 sm:opacity-0 group-hover:opacity-100`}
                              title={`Remove "${t.title}" from playlist`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal (Cloud Synced Across All Devices) */}
      {isAddSongModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200 relative">
            <button
              onClick={() => setIsAddSongModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-900">
                  Add Song for Danielle
                </h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-600 inline" />
                  <span>Syncs automatically across all devices</span>
                </p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 mb-4 bg-pink-50 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAddMode('youtube')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  addMode === 'youtube'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                YouTube Link
              </button>
              <button
                type="button"
                onClick={() => setAddMode('audio-url')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  addMode === 'audio-url'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Direct Audio Link
              </button>
            </div>

            <form onSubmit={handleSaveCloudSong} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {addMode === 'youtube' ? 'YouTube Video or Music Link' : 'Direct Audio URL (MP3/M4A)'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={newSongUrl}
                    onChange={(e) => setNewSongUrl(e.target.value)}
                    placeholder={
                      addMode === 'youtube'
                        ? 'https://www.youtube.com/watch?v=... or youtu.be/...'
                        : 'https://example.com/song.mp3'
                    }
                    className="w-full px-3 py-2 pl-8 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Song Title (Optional)
                </label>
                <input
                  type="text"
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  placeholder="e.g. Older, Perfect, Golden Hour..."
                  className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Artist or Dedication (Optional)
                </label>
                <input
                  type="text"
                  value={newSongArtist}
                  onChange={(e) => setNewSongArtist(e.target.value)}
                  placeholder="e.g. Sasha Sloan 💖"
                  className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setIsAddSongModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSongUrl || isSavingSong}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingSong ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <span>Add to Playlist 💖</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-white/10 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
