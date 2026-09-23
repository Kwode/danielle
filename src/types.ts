export interface MemoryPhoto {
  id: string;
  url: string;
  caption: string;
  date?: string;
  location?: string;
  category?: string;
  likes: number;
}

export interface MemoryVideo {
  id: string;
  title: string;
  url: string;
  poster?: string;
  duration?: string;
  description?: string;
  date?: string;
  isCustom?: boolean;
  totalChunks?: number;
  fileSize?: number;
  mimeType?: string;
  isLoadingBlob?: boolean;
}

export interface ReasonLove {
  id: number;
  title: string;
  description: string;
  reflection?: string;
  tag: string;
  iconName: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  type: 'synth-birthday' | 'synth-romance' | 'synth-lullaby' | 'audio-url' | 'custom' | 'youtube';
  url?: string;
  youtubeId?: string;
  duration: string;
}

export interface BirthdayWish {
  id: string;
  author: string;
  message: string;
  emoji: string;
  timestamp: string;
}
