/**
 * Cloudinary Upload Service
 * 
 * Provides direct, fast uploads to Cloudinary without backend servers
 * using unsigned upload presets.
 * 
 * If no cloud name is configured yet, the service prompts the user or allows
 * entering their Cloudinary Cloud Name and Upload Preset in a clean UI modal,
 * while seamlessly caching configurations in localStorage or environment variables.
 */

const CLOUDINARY_STORAGE_KEY = 'danielle_cloudinary_config';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// Default configured Cloudinary credentials provided by user
export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'diphueztd';
export const DEFAULT_CLOUDINARY_UPLOAD_PRESET = 'tmtbxfvv';

export function getSavedCloudinaryConfig(): CloudinaryConfig {
  try {
    const raw = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.cloudName && parsed.uploadPreset) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Fallback to Vite env variables if provided, otherwise default to configured credentials
  const envCloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUDINARY_CLOUD_NAME;
  const envUploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || DEFAULT_CLOUDINARY_UPLOAD_PRESET;

  return {
    cloudName: envCloudName,
    uploadPreset: envUploadPreset,
  };
}

export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  try {
    localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function isCloudinaryConfigured(): boolean {
  const config = getSavedCloudinaryConfig();
  return Boolean(config.cloudName?.trim() && config.uploadPreset?.trim());
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: 'image' | 'video' | 'raw';
}

/**
 * Uploads an image or video file directly to Cloudinary via unsigned upload
 */
function parseCloudinaryResponse(text: string, status: number): CloudinaryUploadResult {
  try {
    const res = JSON.parse(text);
    if (status < 200 || status >= 300 || res?.error) {
      throw new Error(res?.error?.message || `Upload failed with status ${status}`);
    }
    return {
      secureUrl: res.secure_url || res.url,
      publicId: res.public_id,
      format: res.format,
      width: res.width,
      height: res.height,
      duration: res.duration,
      resourceType: res.resource_type || 'video',
    };
  } catch (err) {
    if (err instanceof Error && err.message !== 'Failed to parse Cloudinary response') throw err;
    throw new Error(`Upload failed with status ${status}`);
  }
}

function uploadChunk(
  endpoint: string,
  uploadPreset: string,
  chunk: Blob,
  start: number,
  end: number,
  total: number,
  uploadId: string,
  onProgress?: (percent: number) => void
): Promise<{ response: CloudinaryUploadResult | null; done: boolean }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.timeout = 120000;
    xhr.setRequestHeader('X-Unique-Upload-Id', uploadId);
    xhr.setRequestHeader('Content-Range', `bytes ${start}-${end}/${total}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const chunkPercent = event.total ? event.loaded / event.total : 0;
        const overall = ((start + event.loaded) / total) * 100;
        onProgress(Math.min(99, Math.max(1, Math.round(overall))));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const done = res.done === true || end >= total - 1;
          if (done) {
            resolve({ response: parseCloudinaryResponse(xhr.responseText, xhr.status), done: true });
          } else {
            resolve({ response: null, done: false });
          }
        } catch {
          reject(new Error('Cloudinary returned an invalid chunk response.'));
        }
      } else {
        const cloudinaryError = xhr.getResponseHeader('X-Cld-Error');
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(cloudinaryError || body?.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(cloudinaryError || `Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during video upload. Please check your connection and try again.'));
    xhr.ontimeout = () => reject(new Error('Video upload timed out. Please try again on a stronger connection.'));
    xhr.onabort = () => reject(new Error('Video upload was interrupted. Please try again.'));

    const formData = new FormData();
    formData.append('file', chunk, 'video-upload-chunk');
    formData.append('upload_preset', uploadPreset);
    xhr.send(formData);
  });
}

async function uploadVideoInChunks(
  file: File | Blob,
  endpoint: string,
  uploadPreset: string,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  // 6 MB chunks are recommended by Cloudinary and are much more tolerant of
  // unstable mobile connections than sending the entire video in one request.
  const chunkSize = 6 * 1024 * 1024;
  const total = file.size;
  const uploadId = `danielle-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  onProgress?.(1);

  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize, total) - 1;
    const chunk = file.slice(start, end + 1);
    let lastError: unknown;

    // A short retry is especially useful on mobile networks when a single
    // chunk is interrupted while the phone changes network conditions.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await uploadChunk(
          endpoint,
          uploadPreset,
          chunk,
          start,
          end,
          total,
          uploadId,
          onProgress
        );
        if (result.response) {
          onProgress?.(100);
          return result.response;
        }
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        }
      }
    }

    if (lastError) throw lastError;
  }

  throw new Error('Cloudinary did not return a completed video upload response.');
}

export async function uploadToCloudinary(
  file: File | Blob,
  resourceType: 'image' | 'video' = 'image',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const config = getSavedCloudinaryConfig();

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Cloudinary is not configured. Please enter your Cloud Name and Upload Preset.');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName.trim())}/${resourceType}/upload`;

  // Videos are uploaded in chunks so mobile browsers do not have to keep one
  // long multipart request alive. Images continue using the simple upload path.
  if (resourceType === 'video' && file.size > 6 * 1024 * 1024) {
    return uploadVideoInChunks(file, endpoint, config.uploadPreset.trim(), onProgress);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset.trim());

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.timeout = 120000;
    onProgress?.(1);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.max(1, Math.round((event.loaded / event.total) * 100))));
      }
    };

    xhr.onload = () => {
      try {
        const result = parseCloudinaryResponse(xhr.responseText, xhr.status);
        onProgress?.(100);
        resolve(result);
      } catch (err) {
        const cloudinaryError = xhr.getResponseHeader('X-Cld-Error');
        reject(cloudinaryError ? new Error(cloudinaryError) : err);
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload. Please check your connection.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again on a stronger connection.'));
    xhr.onabort = () => reject(new Error('Upload was interrupted. Please try again.'));

    xhr.send(formData);
  });
}
