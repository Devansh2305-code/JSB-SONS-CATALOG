import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { EnquiryItem, StoreSettings } from '../types';
import { createBundleWhatsAppEnquiryLink } from '../utils/whatsapp';

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif text-lg font-semibold text-zinc-100">
                  Enquiry Bag ({items.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-zinc-800/80">
              {items.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <p className="text-zinc-300 font-medium text-sm">Your enquiry bag is empty</p>
                  <p className="text-zinc-400 text-xs mt-1 max-w-xs">
                    Browse the ready catalog and add garments to enquire about multiple pieces in a single WhatsApp message.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="py-4 first:pt-0 last:pb-0 flex items-start gap-3"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-16 h-20 object-cover rounded bg-zinc-950 border border-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 line-clamp-1">
                        {item.product.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>Size: <strong className="text-zinc-200">{item.selectedSize}</strong></span>
                        <span>·</span>
                        <span>{item.product.color}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold text-zinc-100 text-sm tabular-nums">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                          className="text-zinc-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Send WhatsApp */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Special notes (alterations, event dates):
                  </label>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g., Needed for a wedding on Sunday, do you deliver to Bandra?"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Estimated Total:</span>
                  <span className="font-semibold text-lg text-zinc-100 tabular-nums">
                    ₹{totalEstimate.toLocaleString('en-IN')}
                  </span>
                </div>

                <a
                  href={bundleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 fill-emerald-950/20" />
                  <span>Send WhatsApp Enquiry ({items.length} Items)</span>
                </a>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <button
                    onClick={onClearAll}
                    className="hover:text-zinc-300 underline cursor-pointer"
                  >
                    Clear All
                  </button>
                  <span>Instant Response on WhatsApp</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
