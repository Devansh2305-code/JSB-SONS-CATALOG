/**
 * Color Extraction & Auto-Detection Utilities for JSB SONS Garments Catalog
 * Samples pixels from garment photographs, clusters dominant hues,
 * and matches them to luxury garment colorway names.
 */

export interface ExtractedColor {
  hex: string;
  name: string;
}

// Curated reference palette for ready garments & ethnic couture
const REFERENCE_COLORS: { name: string; hex: string; r: number; g: number; b: number }[] = [
  // Blues & Indigos
  { name: 'Royal Navy Blue', hex: '#1e3a8a', r: 30, g: 58, b: 138 },
  { name: 'Midnight Blue', hex: '#0f172a', r: 15, g: 23, b: 42 },
  { name: 'Indigo Navy', hex: '#1e293b', r: 30, g: 41, b: 59 },
  { name: 'Classic Blue', hex: '#2563eb', r: 37, g: 99, b: 235 },
  { name: 'Sky Blue', hex: '#38bdf8', r: 56, g: 189, b: 248 },
  { name: 'Powder Blue', hex: '#bae6fd', r: 186, g: 230, b: 253 },
  { name: 'Steel Teal', hex: '#0f766e', r: 15, g: 118, b: 110 },
  { name: 'Deep Cyan', hex: '#0891b2', r: 8, g: 145, b: 178 },

  // Greens & Olives
  { name: 'Emerald Green', hex: '#047857', r: 4, g: 120, b: 87 },
  { name: 'Forest Green', hex: '#064e3b', r: 6, g: 78, b: 59 },
  { name: 'Olive Green', hex: '#4d7c0f', r: 77, g: 124, b: 15 },
  { name: 'Sage Olive Green', hex: '#65a30d', r: 101, g: 163, b: 13 },
  { name: 'Mint Green', hex: '#6ee7b7', r: 110, g: 231, b: 183 },
  { name: 'Pistachio Green', hex: '#a7f3d0', r: 167, g: 243, b: 208 },
  { name: 'Bottle Green', hex: '#14532d', r: 20, g: 83, b: 45 },

  // Reds, Maroons & Rusts
  { name: 'Deep Wine Maroon', hex: '#881337', r: 136, g: 19, b: 55 },
  { name: 'Ruby Crimson Red', hex: '#be123c', r: 190, g: 18, b: 60 },
  { name: 'Terracotta Rust', hex: '#c2410c', r: 194, g: 65, b: 12 },
  { name: 'Burnt Orange', hex: '#ea580c', r: 234, g: 88, b: 12 },
  { name: 'Warm Brick Red', hex: '#991b1b', r: 153, g: 27, b: 27 },
  { name: 'Coral Rose', hex: '#f43f5e', r: 244, g: 63, b: 94 },
  { name: 'Dusty Rose Pink', hex: '#fb7185', r: 251, g: 113, b: 133 },
  { name: 'Blush Pink', hex: '#fbcfe8', r: 251, g: 207, b: 232 },

  // Earth, Tans & Browns
  { name: 'Warm Camel Tan', hex: '#d97706', r: 217, g: 119, b: 6 },
  { name: 'Mustard Gold', hex: '#ca8a04', r: 202, g: 138, b: 4 },
  { name: 'Antique Gold', hex: '#eab308', r: 234, g: 179, b: 8 },
  { name: 'Chocolate Brown', hex: '#451a03', r: 69, g: 26, b: 3 },
  { name: 'Coffee Brown', hex: '#78350f', r: 120, g: 53, b: 15 },
  { name: 'Beige Khaki', hex: '#d4b996', r: 212, g: 185, b: 150 },
  { name: 'Desert Sand', hex: '#fde68a', r: 253, g: 230, b: 138 },

  // Purples & Violets
  { name: 'Imperial Royal Purple', hex: '#581c87', r: 88, g: 28, b: 135 },
  { name: 'Deep Plum', hex: '#701a75', r: 112, g: 26, b: 117 },
  { name: 'Lavender Violet', hex: '#c084fc', r: 192, g: 132, b: 252 },

  // Monochromes & Neutrals
  { name: 'Pure White', hex: '#f8fafc', r: 248, g: 250, b: 252 },
  { name: 'Ivory Cream', hex: '#fef3c7', r: 254, g: 243, b: 199 },
  { name: 'Light Silver Grey', hex: '#cbd5e1', r: 203, g: 213, b: 225 },
  { name: 'Slate Grey', hex: '#64748b', r: 100, g: 116, b: 139 },
  { name: 'Charcoal Grey', hex: '#334155', r: 51, g: 65, b: 85 },
  { name: 'Midnight Jet Black', hex: '#09090b', r: 9, g: 9, b: 11 },
];

/**
 * Matches any RGB hex code to the closest high-fashion garment color name
 */
export function getColorNameFromHex(hex: string): string {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6) return 'Custom Shade';

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 'Custom Shade';

  let minDistance = Infinity;
  let bestMatch = 'Custom Shade';

  for (const ref of REFERENCE_COLORS) {
    // Weighted Euclidean distance (human eye is more sensitive to green, then red, then blue)
    const dr = r - ref.r;
    const dg = g - ref.g;
    const db = b - ref.b;
    const distance = 0.3 * (dr * dr) + 0.59 * (dg * dg) + 0.11 * (db * db);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = ref.name;
    }
  }

  return bestMatch;
}

function componentToHex(c: number): string {
  const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Automatically extracts the top dominant garment colors from an image URL or Base64 string.
 * Samples the central region of the photograph to isolate fabric from backdrop edges.
 */
export async function extractColorsFromImage(
  imageSrc: string,
  maxColors = 5
): Promise<ExtractedColor[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }

        // Downscale for instant processing (160x160 sample)
        const size = 160;
        canvas.width = size;
        canvas.height = size;

        // Draw centered sample (focusing on garment body, skipping outer 15% margins)
        const startX = img.width * 0.15;
        const startY = img.height * 0.15;
        const sampleW = img.width * 0.7;
        const sampleH = img.height * 0.7;

        ctx.drawImage(img, startX, startY, sampleW, sampleH, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>();

        // Step through pixels (sampling every 3rd pixel for speed)
        for (let i = 0; i < imgData.length; i += 12) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 180) continue; // Skip transparency

          // Filter out blown-out pure white backgrounds (>245 on all channels)
          if (r > 245 && g > 245 && b > 245) continue;

          // Filter out pitch black shadows (<15 on all channels)
          if (r < 15 && g < 15 && b < 15) continue;

          // Quantize into 24-step color buckets to cluster similar shades
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          const existing = colorBuckets.get(key);
          if (existing) {
            existing.count += 1;
            existing.r = Math.round((existing.r + r) / 2);
            existing.g = Math.round((existing.g + g) / 2);
            existing.b = Math.round((existing.b + b) / 2);
          } else {
            colorBuckets.set(key, { r, g, b, count: 1 });
          }
        }

        // Sort by frequency
        const sorted = Array.from(colorBuckets.values()).sort((a, b) => b.count - a.count);

        const results: ExtractedColor[] = [];
        for (const bucket of sorted) {
          const hex = rgbToHex(bucket.r, bucket.g, bucket.b);
          const name = getColorNameFromHex(hex);

          // Avoid near-duplicate colors in the returned palette
          const isTooClose = results.some((res) => {
            const hexClean = res.hex.replace('#', '');
            const cr = parseInt(hexClean.substring(0, 2), 16);
            const cg = parseInt(hexClean.substring(2, 4), 16);
            const cb = parseInt(hexClean.substring(4, 6), 16);
            const dist = Math.abs(cr - bucket.r) + Math.abs(cg - bucket.g) + Math.abs(cb - bucket.b);
            return dist < 45;
          });

          if (!isTooClose) {
            results.push({ hex, name });
          }

          if (results.length >= maxColors) break;
        }

        resolve(results);
      } catch (err) {
        console.warn('Auto color extraction failed:', err);
        resolve([]);
      }
    };

    img.onerror = () => {
      resolve([]);
    };

    img.src = imageSrc;
  });
}

/**
 * Browser EyeDropper API wrapper
 * Allows clicking anywhere on the screen or image to pick the exact pixel color.
 */
export async function openEyeDropper(): Promise<{ hex: string; name: string } | null> {
  if (typeof window === 'undefined' || !(window as any).EyeDropper) {
    return null;
  }

  try {
    const eyeDropper = new (window as any).EyeDropper();
    const result = await eyeDropper.open();
    if (result && result.sRGBHex) {
      const hex = result.sRGBHex.toLowerCase();
      const name = getColorNameFromHex(hex);
      return { hex, name };
    }
  } catch {
    // User cancelled eyedropper
  }

  return null;
}

