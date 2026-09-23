// IndexedDB storage utility for persistent local video memories
const DB_NAME = 'danielle_birthday_videos_db';
const STORE_NAME = 'local_videos';
const DB_VERSION = 1;

export interface StoredVideoRecord {
  id: string;
  blob: Blob;
  title: string;
  poster?: string;
  date?: string;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoToStorage(
  id: string,
  file: Blob,
  metadata: { title: string; poster?: string; date?: string }
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: StoredVideoRecord = {
      id,
      blob: file,
      title: metadata.title,
      poster: metadata.poster,
      date: metadata.date,
      savedAt: Date.now(),
    };
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllVideosFromStorage(): Promise<StoredVideoRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: StoredVideoRecord[] = req.result || [];
        // Sort newest first
        results.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read from video storage:', err);
    return [];
  }
}

export async function getVideoFromStorage(id: string): Promise<StoredVideoRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read video from storage:', err);
    return null;
  }
}

export async function deleteVideoFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from video storage:', err);
  }
}

/**
 * Automatically captures a clean frame from a local video file to use as its poster preview
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = video.videoWidth || 480;
          const height = video.videoHeight || 640;
          // Scale to max width 540 for lightweight storage
          const scale = Math.min(1, 540 / width);
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const posterData = canvas.toDataURL('image/jpeg', 0.82);
            URL.revokeObjectURL(url);
            resolve(posterData);
            return;
          }
        } catch (e) {
          console.warn('Thumbnail generation error:', e);
        }
        URL.revokeObjectURL(url);
        resolve('');
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
    } catch {
      resolve('');
    }
  });
}
