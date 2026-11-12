import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Eye, Tag, Check, Share2 } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { createWhatsAppEnquiryLink } from '../utils/whatsapp';
import { shareProduct } from '../utils/share';

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
    Boolean(product.hangingImageUrl || product.displayMode === 'hanging')
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

  const displayImage = viewHanging && product.hangingImageUrl
    ? product.hangingImageUrl
    : product.images[0] || '/src/assets/images/jsb_hero_garments_1793439533100.jpg';

  const hasBothViews = Boolean(product.hangingImageUrl && product.images.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-lg overflow-hidden transition-all duration-300"
    >
      {/* Product Image Stage */}
      <div
        onClick={() => onQuickView(product)}
        className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950 flex items-center justify-center cursor-pointer"
      >
        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              '/src/assets/images/jsb_hero_garments_1793439533100.jpg';
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Tags top left & right */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.hangingImageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewHanging(!viewHanging);
              }}
              className="text-[9px] sm:text-[10px] font-semibold text-amber-300 bg-zinc-950/90 border border-amber-500/40 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 hover:bg-zinc-900 transition-colors cursor-pointer shadow"
              title="Click to toggle hanging form / photo view"
            >
              <span>{viewHanging ? '🪝 Hanging Form' : '📷 Photo View'}</span>
            </button>
          )}
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {product.sourceType === 'ai-sliced' && (
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
              Extracted Piece
            </span>
          )}

          {/* Direct Share Button on Image */}
          <button
            type="button"
            onClick={handleShare}
            className={`w-7 h-7 rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-150 shadow-md active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-400 text-zinc-950 border-emerald-400 font-bold scale-105'
                : 'bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-700/80'
            }`}
            title={copied ? 'Link Copied to clipboard!' : 'Share product link'}
            aria-label="Share product"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Desktop Quick Actions (hidden on phone, click card on phone directly) */}
        <div className="hidden sm:flex absolute bottom-3 left-3 right-3 items-center gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-1.5 px-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 text-xs font-medium rounded border border-zinc-700 flex items-center justify-center gap-1 backdrop-blur-md transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-300" />
            <span>Quick View</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToEnquiryBag(product);
            }}
            className={`py-1.5 px-2 text-xs font-medium rounded border backdrop-blur-md transition-colors flex items-center justify-center cursor-pointer ${
              isBagged
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}
            title="Add to enquiry bag"
          >
            {isBagged ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Tag className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          {/* Metadata: Category and Color */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400 mb-1">
            <span className="uppercase tracking-wider text-[10px] font-semibold text-amber-400 truncate max-w-[65%]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-zinc-600 inline-block"
                style={{ backgroundColor: product.colorHex || '#555' }}
                title={product.color}
              />
              <span className="text-[10px] text-zinc-400 truncate max-w-[60px] hidden xs:inline">{product.color}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-medium text-zinc-100 text-xs sm:text-sm leading-snug hover:text-amber-200 transition-colors cursor-pointer line-clamp-1"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Fabric Subtitle */}
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-1 font-normal">
            {product.fabric}
          </p>
        </div>

        {/* Price & Primary WhatsApp Enquiry Button */}
        <div className="pt-2 sm:pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-zinc-100 text-sm sm:text-base tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Row: Primary WhatsApp + Social Share Button */}
          <div className="flex items-center gap-1.5 relative">
            {copied && (
              <div className="absolute -top-7 right-0 text-[10px] font-semibold text-emerald-300 bg-zinc-950/95 border border-emerald-500/50 px-2 py-0.5 rounded shadow-lg flex items-center gap-1 pointer-events-none z-20">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Link Copied!</span>
              </div>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-2 text-[11px] sm:text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.97]"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-950/20 shrink-0" />
              <span className="truncate">Enquire on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className={`p-2 rounded border transition-all duration-150 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-sm'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
              }`}
              title={copied ? 'Link Copied to clipboard!' : 'Share product link'}
              aria-label="Share product link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
