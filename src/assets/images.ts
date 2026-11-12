import heroStorefront from './images/jsb_hero_garments_1793439533100.jpg';
import royalBandhgala from './images/product_royal_bandhgala_1793439535395.jpg';
import artisanKurta from './images/product_artisan_kurta_1793439536709.jpg';
import rawShirts from './images/raw_composite_shirts_1793439532041.jpg';
import rawJackets from './images/raw_composite_jackets_1793439535254.jpg';
import {
  NAVY_SHIRT_IMAGE,
  WHITE_SHIRT_IMAGE,
  TERRACOTTA_SHIRT_IMAGE,
  NAVY_VELVET_IMAGE,
} from './productCrops';

export const IMAGES = {
  heroStorefront,
  royalBandhgala,
  artisanKurta,
  rawShirts,
  rawJackets,
  navyShirt: NAVY_SHIRT_IMAGE,
  whiteShirt: WHITE_SHIRT_IMAGE,
  terracottaShirt: TERRACOTTA_SHIRT_IMAGE,
  navyVelvetKurta: NAVY_VELVET_IMAGE,
};

const LEGACY_IMAGE_MAP: Record<string, string> = {
  'jsb_hero_garments_1793439533100.jpg': heroStorefront,
  'product_royal_bandhgala_1793439535395.jpg': royalBandhgala,
  'product_artisan_kurta_1793439536709.jpg': artisanKurta,
  'raw_composite_shirts_1793439532041.jpg': rawShirts,
  'raw_composite_jackets_1793439535254.jpg': rawJackets,
};

/**
 * Resolves legacy `/src/assets/images/...` paths (stored in old Supabase rows
 * or browser caches) to hashed Vite asset URLs so images work in production.
 */
export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  const fileName = url.split('/').pop()?.split('?')[0] || '';
  return LEGACY_IMAGE_MAP[fileName] || url;
}
