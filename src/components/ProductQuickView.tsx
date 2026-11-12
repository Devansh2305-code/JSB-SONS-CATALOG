import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MessageCircle,
  ShoppingBag,
  Check,
  Shield,
  Truck,
  Share2,
  ArrowRight,
} from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { createWhatsAppEnquiryLink } from '../utils/whatsapp';
import { shareProduct } from '../utils/share';
import { resolveAssetUrl } from '../assets/images';

interface ProductQuickViewProps {
  product: Product | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddToBag: (product: Product, size: string) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onAddToBag,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [addedAnim, setAddedAnim] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const handleShare = async () => {
    if (!product) return;
    const result = await shareProduct(product);
    if (result.copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    const list: { url: string; label: string; isHanging?: boolean }[] = [];
    if (product.hangingImageUrl) {
      list.push({ url: product.hangingImageUrl, label: 'Hanger form', isHanging: true });
    }
    product.images.forEach((img, idx) => {
      if (img !== product.hangingImageUrl) {
        list.push({
          url: img,
          label: idx === 0 && !product.hangingImageUrl ? 'Studio photo' : 'Photo detail',
        });
      }
    });
    return list;
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'M');
      setCustomNote('');
      setAddedAnim(false);
      setActiveImageIndex(product.displayMode === 'studio' ? Math.max(0, galleryImages.findIndex((g) => !g.isHanging)) : 0);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!product) return null;

  const currentImage = galleryImages[activeImageIndex];
  const currentDisplayImage = resolveAssetUrl(currentImage?.url) || resolveAssetUrl(product.images[0]);
  const isCurrentHanging = currentImage?.isHanging;
  const useContain =
    Boolean(isCurrentHanging) ||
    product.displayMode === 'studio' ||
    galleryImages.length === 1;

  const whatsappUrl = createWhatsAppEnquiryLink(
    settings.whatsappNumber,
    product,
    selectedSize,
    customNote
  );

  const handleBagClick = () => {
    onAddToBag(product, selectedSize);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-line/80 bg-paper shadow-2xl sm:max-w-5xl sm:rounded-[1.75rem]"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" />

            <div className="absolute right-3 top-3 z-30 flex items-center gap-2 sm:right-4 sm:top-4">
              <button
                type="button"
                onClick={handleShare}
                className={`press flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
                  copied
                    ? 'border-forest bg-forest text-cream'
                    : 'border-line/80 bg-cream/90 text-ink hover:bg-cream'
                }`}
                title={copied ? 'Link copied!' : 'Share product link'}
                aria-label="Share product"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </button>

              <button
                onClick={onClose}
                className="press flex h-9 w-9 items-center justify-center rounded-full border border-line/80 bg-cream/90 text-ink transition-colors hover:bg-cream"
                aria-label="Close product view"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
                {/* Gallery */}
                <div className="flex flex-col justify-center border-b border-line/70 bg-cream/60 p-4 sm:p-6 md:border-b-0 md:border-r">
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[340px] overflow-hidden rounded-[1.4rem] border border-line/80 bg-[#fcfaf5] shadow-[0_20px_45px_-34px_rgba(48,36,20,0.6)]">
                    <img
                      src={currentDisplayImage}
                      alt={product.title}
                      className={`h-full w-full ${
                        useContain ? 'object-contain p-3' : 'object-cover'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                      {isCurrentHanging && (
                        <span className="rounded-full border border-brass/40 bg-cream/95 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-wine">
                          Hanger form
                        </span>
                      )}
                      {product.displayMode === 'studio' && !isCurrentHanging && (
                        <span className="rounded-full border border-brass/40 bg-cream/95 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-wine">
                          Studio white
                        </span>
                      )}
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      {galleryImages.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`press rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                            activeImageIndex === idx
                              ? 'border-ink bg-ink text-cream'
                              : 'border-line bg-cream text-ink-soft hover:border-ink/40 hover:text-ink'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-medium text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-brass" />
                      <span>Checked in store</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-forest" />
                      <span>Ready for pickup</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between p-5 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-brass">
                        {product.category}
                      </span>
                      <span className="font-mono text-[10px] text-ink-soft/80">
                        {product.sku}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-2xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-3xl">
                      {product.title}
                    </h2>

                    {product.subtitle && (
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                        {product.subtitle}
                      </p>
                    )}

                    <div className="mt-4 flex items-baseline gap-2.5 border-b border-line/70 pb-4">
                      <span className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-ink-soft/70 line-through">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span
                        className={`ml-auto rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
                          product.inStock
                            ? 'bg-forest/10 text-forest'
                            : 'bg-wine/10 text-wine'
                        }`}
                      >
                        {product.inStock ? 'In stock' : 'Sold out'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                          Colour
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-ink/15"
                            style={{ backgroundColor: product.colorHex }}
                          />
                          <span className="text-xs font-semibold text-ink">{product.color}</span>
                        </div>
                      </div>

                      <div>
                        <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                          Select size
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              className={`press min-h-9 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
                                selectedSize === sz
                                  ? 'border-ink bg-ink text-cream'
                                  : 'border-line bg-cream text-ink-soft hover:border-ink/40 hover:text-ink'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/80 bg-line/60 text-[11px]">
                        <div className="bg-cream/80 p-3">
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft/70">
                            Fabric
                          </span>
                          <span className="mt-0.5 block font-medium text-ink">{product.fabric}</span>
                        </div>
                        <div className="bg-cream/80 p-3">
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft/70">
                            Fit
                          </span>
                          <span className="mt-0.5 block font-medium text-ink">
                            {product.fit || 'Regular fit'}
                          </span>
                        </div>
                        {product.collarStyle && (
                          <div className="bg-cream/80 p-3">
                            <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft/70">
                              Collar
                            </span>
                            <span className="mt-0.5 block font-medium text-ink">
                              {product.collarStyle}
                            </span>
                          </div>
                        )}
                        <div className="bg-cream/80 p-3">
                          <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft/70">
                            Availability
                          </span>
                          <span className="mt-0.5 block font-medium text-ink">
                            {product.inStock ? 'Ready in shop' : 'Ask for restock'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-ink-soft">{product.description}</p>

                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold text-ink-soft">
                          Add a note for WhatsApp (optional)
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Can you deliver by Friday?"
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          className="field py-2.5 text-xs"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky actions */}
            <div className="shrink-0 space-y-2 border-t border-line/80 bg-paper/95 p-3 backdrop-blur-md sm:p-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="press flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-forest-deep"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enquire on WhatsApp · Size {selectedSize}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleBagClick}
                  className="press flex items-center justify-center gap-1.5 rounded-full border border-line bg-cream px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink/40"
                >
                  {addedAnim ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-forest" />
                      <span>Added to bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5 text-ink-soft" />
                      <span>Add to enquiry bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={`press flex items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                    copied
                      ? 'border-forest/40 bg-forest/10 text-forest'
                      : 'border-line bg-cream text-ink hover:border-ink/40'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Link copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-ink-soft" />
                      <span>Share piece</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
