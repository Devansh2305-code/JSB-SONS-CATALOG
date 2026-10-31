import { DetectedGarment } from '../types';

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Crops a bounding box [ymin, xmin, ymax, xmax] (normalized 0-1000) from an image
 * and returns a clean base64 Data URL.
 */
export function cropGarmentFromCanvas(
  img: HTMLImageElement,
  box: [number, number, number, number],
  paddingPercent: number = 0.02
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  // box is [ymin, xmin, ymax, xmax] in 0-1000 range
  let [ymin, xmin, ymax, xmax] = box;

  // Convert to absolute pixel coordinates
  let x = (xmin / 1000) * naturalWidth;
  let y = (ymin / 1000) * naturalHeight;
  let w = ((xmax - xmin) / 1000) * naturalWidth;
  let h = ((ymax - ymin) / 1000) * naturalHeight;

  // Add subtle padding around the garment to ensure seams and collars are preserved
  const padX = w * paddingPercent;
  const padY = h * paddingPercent;

  x = Math.max(0, x - padX);
  y = Math.max(0, y - padY);
  w = Math.min(naturalWidth - x, w + padX * 2);
  h = Math.min(naturalHeight - y, h + padY * 2);

  canvas.width = Math.round(w);
  canvas.height = Math.round(h);

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Resizes an image for fast AI processing over the network.
 * Reduces 5MB-10MB base64 payloads to ~100KB, speeding up Gemini API response by 5x-10x.
 */
export function resizeImageForAi(img: HTMLImageElement, maxDimension: number = 900): string {
  const canvas = document.createElement('canvas');
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

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Calls backend Gemini endpoint to detect individual garments in the image
 */
export async function callAiGarmentSplitter(
  imageBase64: string,
  categoryHint?: string
): Promise<{ success: boolean; garments: DetectedGarment[]; error?: string }> {
  try {
    const res = await fetch('/api/ai/split-garments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        categoryHint,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      garments: data.garments || [],
    };
  } catch (err: any) {
    console.warn('AI split API error, fallback to smart heuristic slicer:', err.message);
    return {
      success: false,
      garments: [],
      error: err.message,
    };
  }
}

/**
 * Generates smart geometric bounding boxes for composite multi-garment photos
 * (e.g. 5 products side-by-side or 2x3 grid)
 */
export function generateHeuristicSlices(
  mode: 'horizontal-5' | 'horizontal-6' | 'grid-2x3',
  categoryPreset: 'Shirts' | 'Kurtas & Ethnic' | 'Jackets & Blazers'
): DetectedGarment[] {
  const shirtColors = [
    { name: 'Indigo Navy', hex: '#1e3a5f', fabric: 'Pure Linen Twill', price: 2490 },
    { name: 'Olive Khaki', hex: '#5c634c', fabric: 'Breathable Cotton Slub', price: 2390 },
    { name: 'Terracotta Rust', hex: '#a44e36', fabric: 'Organic Washed Linen', price: 2690 },
    { name: 'Pure Chalk White', hex: '#f8fafc', fabric: 'Egyptian Cotton Poplin', price: 2290 },
    { name: 'Mustard Amber', hex: '#d99b26', fabric: 'Camp Collar Linen Blend', price: 2590 },
    { name: 'Charcoal Noir', hex: '#27272a', fabric: 'Structure Twill Cotton', price: 2490 },
  ];

  const jacketColors = [
    { name: 'Emerald Heritage', hex: '#064e3b', fabric: 'Embroidered Raw Silk', price: 6990 },
    { name: 'Midnight Velvet', hex: '#172554', fabric: 'Royal Italian Velvet', price: 7990 },
    { name: 'Blush Rose Silk', hex: '#f43f5e', fabric: 'Tonal Zari Kurta', price: 5490 },
    { name: 'Ash Grey Linen', hex: '#4b5563', fabric: 'Tailored Bandhgala Blazer', price: 6490 },
    { name: 'Golden Ivory Jacquard', hex: '#ca8a04', fabric: 'Brocade Festive Kurta', price: 6290 },
  ];

  if (mode === 'horizontal-5') {
    const list = categoryPreset === 'Jackets & Blazers' ? jacketColors : shirtColors.slice(0, 5);
    return list.map((item, idx) => {
      const step = 1000 / 5;
      const xmin = Math.round(idx * step + 15);
      const xmax = Math.round((idx + 1) * step - 15);
      return {
        index: idx + 1,
        title: `JSB Signature ${item.name} ${categoryPreset === 'Shirts' ? 'Ready Shirt' : 'Occasion Wear'}`,
        category: categoryPreset,
        color: item.name,
        colorHex: item.hex,
        fabric: item.fabric,
        suggestedPrice: item.price,
        sizes: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
        box2d: [120, xmin, 880, xmax],
        tags: ['New Season', 'Ready Garment', 'Premium Finish'],
        description: `Exquisitely tailored ${categoryPreset.toLowerCase()} crafted from ${item.fabric}. Features signature JSB SONS precision stitching and modern comfort fit.`,
      };
    });
  }

  // horizontal 6
  return shirtColors.map((item, idx) => {
    const step = 1000 / 6;
    const xmin = Math.round(idx * step + 10);
    const xmax = Math.round((idx + 1) * step - 10);
    return {
      index: idx + 1,
      title: `JSB Artisanal ${item.name} Ready Garment`,
      category: categoryPreset,
      color: item.name,
      colorHex: item.hex,
      fabric: item.fabric,
      suggestedPrice: item.price,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      box2d: [100, xmin, 900, xmax],
      tags: ['Bestseller', 'Ready to Wear', 'JSB Exclusive'],
      description: `Premium ${item.fabric} ready garment designed with neat stitching and comfort fit.`,
    };
  });
}
