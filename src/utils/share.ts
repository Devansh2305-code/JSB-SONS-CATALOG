import { Product } from '../types';

export interface ShareResult {
  shared: boolean;
  copied: boolean;
}

/**
 * Shares a product using native navigator.share if available,
 * or copies the direct URL to the clipboard with query parameter ?item=SKU
 */
export async function shareProduct(product: Product): Promise<ShareResult> {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const shareParam = encodeURIComponent(product.sku || product.id);
  const url = `${origin}${pathname}?item=${shareParam}`;
  
  const title = `${product.title} | JSB SONS`;
  const text = `Check out this ${product.category}: ${product.title} (₹${product.price.toLocaleString('en-IN')}) at JSB SONS:`;

  // 1. Try native Web Share API (mobile devices, Safari, Chrome Android)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      // If user dismissed the share modal, don't fallback to clipboard
      if (err?.name === 'AbortError') {
        return { shared: false, copied: false };
      }
      // Other errors (e.g. iframe permission constraints): fall through to clipboard
    }
  }

  // 2. Fallback to copying direct link to clipboard
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    return { shared: false, copied: true };
  } catch (err) {
    console.error('Failed to copy share URL:', err);
    return { shared: false, copied: false };
  }
}
