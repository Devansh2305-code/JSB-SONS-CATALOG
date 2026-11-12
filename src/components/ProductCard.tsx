import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Eye, Check, Share2, Plus, Sparkles } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { createWhatsAppEnquiryLink } from '../utils/whatsapp';
import { shareProduct } from '../utils/share';
import { resolveAssetUrl, IMAGES } from '../assets/images';

interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  onQuickView: (product: Product) => void;
  onAddToEnquiryBag: (product: Product) => void;
  isBagged?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onQuickView,
  onAddToEnquiryBag,
  isBagged,
}) => {
  const whatsappUrl = createWhatsAppEnquiryLink(settings.whatsappNumber, product);
  const [copied, setCopied] = useState(false);

  const [viewHanging, setViewHanging] = useState<boolean>(
    Boolean(product.hangingImageUrl && product.displayMode !== 'studio')
  );

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const result = await shareProduct(product);
    if (result.copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const hangingUrl = resolveAssetUrl(product.hangingImageUrl);
  const primaryUrl = resolveAssetUrl(product.images[0]) || IMAGES.heroStorefront;
  const displayImage = viewHanging && hangingUrl ? hangingUrl : primaryUrl;
  const hasBothViews = Boolean(hangingUrl && product.images.length > 0);
  const useContain = Boolean(
    (viewHanging && hangingUrl) ||
      product.displayMode === 'studio' ||
      product.sourceType === 'ai-sliced'
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-line/70 bg-cream/80 shadow-[0_12px_30px_-26px_rgba(48,36,20,0.45)] transition-shadow duration-500 hover:shadow-[0_28px_55px_-32px_rgba(48,36,20,0.55)]"
    >
      {/* Image stage */}
      <div
        onClick={() => onQuickView(product)}
        className={`relative aspect-[4/5] w-full cursor-pointer overflow-hidden ${
          useContain ? 'bg-[#fcfaf5]' : 'bg-paper-soft'
        }`}
      >
        <img
          src={displayImage}
          alt={product.title}
          className={`h-full w-full transition-transform duration-700 ease-out ${
            useContain
              ? 'object-contain p-2.5 group-hover:scale-[1.035] sm:p-4'
              : 'object-cover object-top group-hover:scale-105'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = IMAGES.heroStorefront;
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {product.isFeatured && (
            <span className="rounded-full bg-ink/90 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-brass-soft backdrop-blur-sm">
              Best seller
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-wine px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-cream">
              Sold out
            </span>
          )}
          {product.sourceType === 'ai-sliced' && (
            <span className="flex items-center gap-1 rounded-full border border-brass/40 bg-cream/90 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-wine backdrop-blur-sm">
              <Sparkles className="h-2.5 w-2.5 text-brass" />
              Studio extract
            </span>
          )}
        </div>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className={`press absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md ${
            copied
              ? 'border-forest bg-forest text-cream'
              : 'border-cream/50 bg-cream/85 text-ink hover:bg-cream'
          }`}
          title={copied ? 'Link copied!' : 'Share this piece'}
          aria-label={copied ? 'Link copied' : 'Share product'}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>

        {/* Hanging toggle */}
        {hasBothViews && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewHanging((prev) => !prev);
            }}
            className="press absolute bottom-2.5 left-2.5 z-10 rounded-full border border-cream/40 bg-cream/90 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-ink backdrop-blur-sm hover:bg-cream"
            title="Toggle hanger / photo view"
          >
            {viewHanging ? 'Photo view' : 'Hanger view'}
          </button>
        )}

        {/* Desktop hover quick actions */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="press flex flex-1 items-center justify-center gap-1.5 rounded-full bg-cream/95 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur-md hover:bg-cream"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quick view</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToEnquiryBag(product);
            }}
            className={`press flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md ${
              isBagged
                ? 'bg-forest text-cream'
                : 'bg-cream/95 text-ink hover:bg-cream'
            }`}
            title={isBagged ? 'Already in your enquiry bag' : 'Add to enquiry bag'}
            aria-label={isBagged ? 'Already in enquiry bag' : 'Add to enquiry bag'}
          >
            {isBagged ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-[8px] font-bold uppercase tracking-[0.16em] text-brass sm:text-[9px]">
              {product.category}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full border border-ink/15"
                style={{ backgroundColor: product.colorHex || '#888' }}
                title={product.color}
              />
              <span className="hidden text-[9px] font-medium text-ink-soft sm:inline">
                {product.color}
              </span>
            </span>
          </div>

          <h3
            onClick={() => onQuickView(product)}
            className="cursor-pointer font-display text-[15px] font-semibold leading-tight text-ink transition-colors hover:text-wine sm:text-[17px]"
            title={product.title}
          >
            <span className="line-clamp-2">{product.title}</span>
          </h3>

          <p className="mt-1 line-clamp-1 text-[10px] text-ink-soft sm:text-[11px]">
            {product.fabric}
          </p>
        </div>

        <div>
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] font-medium text-ink-soft/70 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-cream transition-colors hover:bg-forest-deep sm:text-[10px] sm:tracking-[0.1em]"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Enquire<span className="hidden xl:inline"> on WhatsApp</span>
              </span>
            </a>

            <button
              type="button"
              onClick={() => onAddToEnquiryBag(product)}
              className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isBagged
                  ? 'border-wine bg-wine/10 text-wine'
                  : 'border-line text-ink-soft hover:border-ink/40 hover:text-ink'
              }`}
              title={isBagged ? 'Already in your enquiry bag' : 'Add to enquiry bag'}
              aria-label={isBagged ? 'Already in your enquiry bag' : 'Add to enquiry bag'}
            >
              {isBagged ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
