import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, ShoppingBag, Check, Shield, Truck, Sparkles, Share2 } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { createWhatsAppEnquiryLink } from '../utils/whatsapp';
import { shareProduct } from '../utils/share';

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

  // Build gallery: place hanging form first if available
  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    const list: { url: string; label: string; isHanging?: boolean }[] = [];
    if (product.hangingImageUrl) {
      list.push({ url: product.hangingImageUrl, label: '🪝 Hanging Form', isHanging: true });
    }
    product.images.forEach((img, idx) => {
      if (img !== product.hangingImageUrl) {
        list.push({ url: img, label: idx === 0 && !product.hangingImageUrl ? '📷 Front View' : '📷 Photo Detail' });
      }
    });
    return list;
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'M');
      setCustomNote('');
      setAddedAnim(false);
      setActiveImageIndex(0);
    }
  }, [product]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!product) return null;

  const currentDisplayImage = galleryImages[activeImageIndex]?.url || product.images[0];
  const isCurrentHanging = galleryImages[activeImageIndex]?.isHanging;

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal / Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-4xl bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl z-10 max-h-[92vh] flex flex-col"
          >
            {/* Mobile Drag Indicator Handle */}
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Top action controls: Share + Close */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className={`p-2 rounded-full border backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
                  copied
                    ? 'bg-emerald-400 text-zinc-950 border-emerald-400 font-bold scale-105'
                    : 'bg-zinc-850/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/80'
                }`}
                title={copied ? 'Link Copied to clipboard!' : 'Share product link'}
                aria-label="Share product"
              >
                {copied ? <Check className="w-4 h-4 text-zinc-950 stroke-[2.5]" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-850/90 hover:bg-zinc-800 rounded-full border border-zinc-700/80 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Product Gallery Stage */}
                <div className="bg-zinc-950 p-4 sm:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800">
                  <div className="relative w-full max-w-[280px] sm:max-w-sm aspect-[4/5] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 mx-auto">
                    <img
                      src={currentDisplayImage}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {isCurrentHanging ? (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-zinc-950/90 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shadow">
                        <span>🪝 Full Hanging Form</span>
                      </div>
                    ) : product.sourceType === 'ai-sliced' ? (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">
                        Extracted Piece
                      </div>
                    ) : null}
                  </div>

                  {/* Gallery Thumbnails (Hanging vs Photo) */}
                  {galleryImages.length > 1 && (
                    <div className="mt-3 flex items-center gap-2">
                      {galleryImages.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeImageIndex === idx
                              ? 'bg-amber-400 text-zinc-950 border-amber-400 font-semibold shadow'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-[11px] sm:text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>Luxury Wooden Hanger</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-emerald-400" />
                      <span>Ready in Shop</span>
                    </span>
                  </div>
                </div>

                {/* Purchase & Enquiry Module */}
                <div className="p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="uppercase tracking-widest text-[11px] font-semibold text-amber-400">
                        {product.category}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400">Code: {product.sku}</span>
                    </div>

                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-zinc-100 leading-snug mb-1">
                      {product.title}
                    </h2>

                    {product.subtitle && (
                      <p className="text-xs sm:text-sm text-zinc-400 mb-3">{product.subtitle}</p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2.5 mb-4 pb-4 border-b border-zinc-800">
                      <span className="font-bold text-xl sm:text-2xl text-zinc-100 tabular-nums">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through tabular-nums">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-400 font-medium">
                        In Stock
                      </span>
                    </div>

                    {/* Color & Sizes */}
                    <div className="space-y-3.5 mb-4">
                      <div>
                        <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-zinc-700 shadow-sm"
                            style={{ backgroundColor: product.colorHex }}
                          />
                          <span className="text-xs sm:text-sm text-zinc-200 font-medium">
                            {product.color}
                          </span>
                        </div>
                      </div>

                      {/* Size Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Select Size
                          </label>
                          <span className="text-[10px] text-zinc-400">Free Alteration Available</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {product.sizes.map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer min-h-[38px] ${
                                selectedSize === sz
                                  ? 'bg-amber-400 text-zinc-950 border-amber-400 font-bold shadow-sm'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Garment Details Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-950/60 rounded border border-zinc-800 text-[11px] sm:text-xs">
                        <div>
                          <span className="text-zinc-500 block">Fabric</span>
                          <span className="text-zinc-200 font-medium">{product.fabric}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Fit</span>
                          <span className="text-zinc-200 font-medium">{product.fit || 'Regular Fit'}</span>
                        </div>
                        {product.collarStyle && (
                          <div>
                            <span className="text-zinc-500 block">Collar Style</span>
                            <span className="text-zinc-200 font-medium">{product.collarStyle}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-500 block">Display Mode</span>
                          <span className="text-amber-300 font-medium">🪝 Full Hanging Form</span>
                        </div>
                      </div>

                      <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Custom Note for WhatsApp */}
                      <div>
                        <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                          Question or note for WhatsApp (Optional):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Can you deliver by Friday?"
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned / Sticky Bottom Actions - Always reachable in thumb zone */}
            <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md space-y-2 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-950/20" />
                <span>Send WhatsApp Enquiry for Size {selectedSize}</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleBagClick}
                  className="py-2.5 px-3 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  {addedAnim ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={`py-2.5 px-3 text-xs font-medium rounded border transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                    copied
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 font-semibold shadow-sm'
                      : 'text-zinc-300 bg-zinc-900 hover:bg-zinc-850 border-zinc-700/80'
                  }`}
                  title={copied ? 'Direct link copied!' : 'Share product link'}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Share Link</span>
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
