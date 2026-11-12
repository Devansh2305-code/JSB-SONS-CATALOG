import React from 'react';
import { MessageCircle, ShieldCheck, ArrowUp } from 'lucide-react';
import { StoreSettings } from '../types';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-400 text-zinc-950 font-serif font-bold text-sm flex items-center justify-center">
                JSB
              </div>
              <span className="font-serif text-lg font-bold text-zinc-100">JSB SONS</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Quality readymade shirts, kurtas, jackets, and trousers for men. Serving customers with honest pricing and great fits since 1994.
            </p>
          </div>

          {/* Quick Categories */}
          <div className="space-y-2.5">
            <h4 className="text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
              Categories
            </h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <a href="#catalog-section" className="hover:text-amber-200 transition-colors">
                  Cotton & Linen Shirts
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-amber-200 transition-colors">
                  Festive Kurtas
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-amber-200 transition-colors">
                  Jackets & Suits
                </a>
              </li>
              <li>
                <a href="#catalog-section" className="hover:text-amber-200 transition-colors">
                  Formal Pants & Trousers
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Help */}
          <div className="space-y-2.5">
            <h4 className="text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
              Customer Support
            </h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Chat</span>
                </a>
              </li>
              <li>
                <a href="#contact-section" className="hover:text-amber-200 transition-colors">
                  Fast Delivery Across India
                </a>
              </li>
              <li>
                <a href="#contact-section" className="hover:text-amber-200 transition-colors">
                  Visit Our Store
                </a>
              </li>
            </ul>
          </div>

          {/* Admin Dashboard Area in Footer */}
          <div className="space-y-2.5 p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Shop Owner Admin</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Add new products, manage inventory prices, or upload photos with 5-6 products to separate them automatically.
            </p>
            <button
              onClick={onOpenAdmin}
              className="w-full mt-2 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Admin Dashboard</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} JSB SONS Ready Garments. All rights reserved.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
