import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { EnquiryItem, StoreSettings } from '../types';
import { createBundleWhatsAppEnquiryLink } from '../utils/whatsapp';
import { resolveAssetUrl } from '../assets/images';

interface EnquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: EnquiryItem[];
  settings: StoreSettings;
  onRemoveItem: (productId: string, size: string) => void;
  onClearAll: () => void;
}

export const EnquiryDrawer: React.FC<EnquiryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onRemoveItem,
  onClearAll,
}) => {
  const [customerNote, setCustomerNote] = useState<string>('');

  const totalEstimate = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const bundleUrl = createBundleWhatsAppEnquiryLink(
    settings.whatsappNumber,
    items,
    customerNote
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line/80 bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line/80 p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-brass-soft">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    Enquiry bag
                  </h2>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    {items.length} {items.length === 1 ? 'piece' : 'pieces'} selected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="press flex h-8 w-8 items-center justify-center rounded-full border border-line bg-cream text-ink-soft transition-colors hover:text-ink"
                aria-label="Close enquiry bag"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 divide-y divide-line/60 overflow-y-auto p-4 sm:p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-cream text-ink-soft">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <p className="font-display text-lg font-semibold text-ink">
                    Your bag is empty
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-soft">
                    Add garments as you browse, then send one tidy WhatsApp enquiry for the
                    whole set.
                  </p>
                  <button
                    onClick={onClose}
                    className="press mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cream hover:bg-wine"
                  >
                    <span>Browse collection</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-line/80 bg-[#fcfaf5]">
                      <img
                        src={resolveAssetUrl(item.product.hangingImageUrl || item.product.images[0])}
                        alt={item.product.title}
                        className="h-full w-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 font-display text-sm font-semibold leading-tight text-ink">
                        {item.product.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-ink-soft">
                        <span>
                          Size <strong className="font-semibold text-ink">{item.selectedSize}</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.product.color}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-base font-semibold text-ink">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                          className="press flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-wine/10 hover:text-wine"
                          title="Remove item"
                          aria-label={`Remove ${item.product.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3.5 border-t border-line/80 bg-cream/60 p-4 sm:p-5">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold text-ink-soft">
                    Special notes (alterations, event dates)
                  </span>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g., Needed for a wedding on Sunday, do you deliver to Bandra?"
                    className="field resize-none py-2.5 text-xs"
                  />
                </label>

                <div className="flex items-center justify-between border-t border-line/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                    Estimated total
                  </span>
                  <span className="font-display text-xl font-semibold text-ink">
                    ₹{totalEstimate.toLocaleString('en-IN')}
                  </span>
                </div>

                <a
                  href={bundleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-forest-deep"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send WhatsApp enquiry ({items.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>

                <div className="flex items-center justify-between text-[10px] font-medium text-ink-soft">
                  <button
                    onClick={onClearAll}
                    className="underline decoration-line underline-offset-4 transition-colors hover:text-wine"
                  >
                    Clear all
                  </button>
                  <span>Quick reply on WhatsApp</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
