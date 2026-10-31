import React from 'react';
import { MessageCircle, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  enquiryCount: number;
  onOpenEnquiryDrawer: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  enquiryCount,
  onOpenEnquiryDrawer,
  onSelectCategory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md">
      {/* Top Announcement Bar - Compact single line on phone */}
      <div className="bg-zinc-900 px-3 py-1 text-center text-[11px] sm:text-xs text-zinc-300 border-b border-zinc-800/60 truncate">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="truncate">{settings.announcement}</span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Main Top Bar - Responsive height and compact mobile spacing */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#"
            className="flex items-center gap-2 text-left group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 font-serif font-bold text-sm sm:text-base shadow-sm">
              JSB
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-zinc-100 group-hover:text-amber-200 transition-colors whitespace-nowrap">
                JSB SONS
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 -mt-1 font-medium whitespace-nowrap">
                Ready Garments
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Desktop navigation links (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <button
            onClick={() => {
              onSelectCategory('All');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            All Clothes
          </button>
          <button
            onClick={() => {
              onSelectCategory('Shirts');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Shirts
          </button>
          <button
            onClick={() => {
              onSelectCategory('Kurtas & Ethnic');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kurtas
          </button>
          <button
            onClick={() => {
              onSelectCategory('Jackets & Blazers');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Jackets & Suits
          </button>
          <a
            href="#contact-section"
            className="hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
          >
            Contact Shop
          </a>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick WhatsApp icon on mobile */}
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 rounded transition-colors"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
          </a>

          {/* Enquiry Bag Button */}
          <button
            onClick={onOpenEnquiryDrawer}
            className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-zinc-100 bg-zinc-900 border border-zinc-700/80 rounded hover:bg-zinc-800 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span className="text-[11px] sm:text-xs">Bag</span>
            {enquiryCount > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 text-zinc-950 text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center">
                {enquiryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
