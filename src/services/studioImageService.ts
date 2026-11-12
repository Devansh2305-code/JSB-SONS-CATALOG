import { isSupabaseConfigured, uploadImageToSupabase } from './supabase';

export interface CleanProductImageInput {
  imageBase64: string;
  title?: string;
  category?: string;
  fabric?: string;
}

export interface CleanProductImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Keeps cleaned catalogue images light before saving to Supabase / localStorage.
 * Draws on an explicit white background so transparency never turns black.
 */
function compressStudioImage(dataUrl: string, maxDimension = 1800, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Converts a stored image URL (Supabase CDN, data URL or same-origin asset)
 * into a compact base64 JPEG. Downscaling before upload keeps serverless
 * request sizes small and gives Gemini enough detail for the fabric.
 */
async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDimension = 1400;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not read this image.'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () =>
      reject(new Error('Could not load this image for AI cleanup.'));
    img.src = url;
  });
}

/**
 * One Gemini image-editing pass: removes the background, places the garment on
 * clean white and preserves fabric detail. The cleaned image is compressed and,
 * when Supabase is connected, uploaded to the garment-images CDN.
 */
export async function cleanProductImageWithGemini(
  input: CleanProductImageInput
): Promise<CleanProductImageResult> {
  try {
    const sourceDataUrl = await imageUrlToBase64(input.imageBase64);
    const mimeType =
      sourceDataUrl.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';

    const response = await fetch('/api/ai/clean-product-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: sourceDataUrl,
        mimeType,
        title: input.title || 'ready garment',
        category: input.category || 'clothing',
        fabric: input.fabric || 'premium fabric',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success || !data.imageUrl) {
      return {
        success: false,
        error:
          data.error ||
          'Gemini could not clean this photo. The original image is still available.',
      };
    }

    const compressed = await compressStudioImage(data.imageUrl);

    if (isSupabaseConfigured()) {
      try {
        const upload = await uploadImageToSupabase(
          dataUrlToBlob(compressed),
          `studio-white-${Date.now()}.jpg`
        );
        if (upload.success && upload.url) {
          return { success: true, imageUrl: upload.url };
        }
      } catch (err) {
        console.warn('Studio image CDN upload skipped:', err);
      }
    }

    return { success: true, imageUrl: compressed };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Studio cleanup failed. Please try again.',
    };
  }
}
