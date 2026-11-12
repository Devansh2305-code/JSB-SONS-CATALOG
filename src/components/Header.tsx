import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  ShoppingBag,
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  MapPin,
  Clock,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { DEFAULT_CATEGORIES } from '../data/initialProducts';
import { AnnouncementMarquee } from './AnnouncementMarquee';

interface HeaderProps {
  settings: StoreSettings;
  enquiryCount: number;
  onOpenEnquiryDrawer: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categories?: string[];
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  enquiryCount,
  onOpenEnquiryDrawer,
  activeCategory,
  onSelectCategory,
  categories,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allCats =
    categories && categories.length > 0
      ? categories.filter((c) => c !== 'All')
      : (settings.categories || DEFAULT_CATEGORIES).filter((c) => c !== 'All');

  const visibleCategories = allCats.slice(0, 2);
  const overflowCategories = allCats.slice(2);
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;

  const jumpToCatalog = (cat: string) => {
    onSelectCategory(cat);
    setIsMenuOpen(false);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <AnnouncementMarquee settings={settings} />

      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex shrink-0 items-center gap-2.5 text-left sm:gap-3"
            aria-label="JSB SONS home"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream shadow-sm transition-transform duration-300 group-hover:-rotate-6 sm:h-10 sm:w-10">
              <span className="font-serif text-sm font-semibold tracking-tight sm:text-[15px]">
                J
              </span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-paper bg-brass-soft" />
            </span>
            <span className="flex flex-col">
              <span className="font-serif text-base font-semibold leading-none tracking-[0.07em] text-ink transition-colors group-hover:text-wine sm:text-xl">
                JSB SONS
              </span>
              <span className="mt-1 text-[7px] font-bold uppercase tracking-[0.22em] text-brass sm:text-[9px] sm:tracking-[0.28em]">
                Ready Garments · Est. 1994
              </span>
            </span>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-4 xl:flex" aria-label="Primary">
            <button
              onClick={() => jumpToCatalog('All')}
              className={`press relative whitespace-nowrap py-2 text-[10px] font-bold uppercase tracking-[0.13em] transition-colors 2xl:text-[11px] 2xl:tracking-[0.16em] ${
                activeCategory === 'All' ? 'text-wine' : 'text-ink-soft hover:text-ink'
              }`}
            >
              All Garments
              {activeCategory === 'All' && (
                <span className="absolute inset-x-0 -bottom-0.5 h-px bg-wine" />
              )}
            </button>

            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => jumpToCatalog(cat)}
                className={`press relative whitespace-nowrap py-2 text-[10px] font-bold uppercase tracking-[0.13em] transition-colors 2xl:text-[11px] 2xl:tracking-[0.16em] ${
                  activeCategory === cat ? 'text-wine' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-px bg-wine" />
                )}
              </button>
            ))}

            {overflowCategories.length > 0 && (
              <div className="group relative">
                <button className="press flex items-center gap-1 whitespace-nowrap py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-soft transition-colors hover:text-ink 2xl:text-[11px]">
                  <span>More</span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 translate-y-2 rounded-2xl border border-line/80 bg-cream p-2 opacity-0 shadow-[0_24px_60px_-28px_rgba(48,36,20,0.45)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {overflowCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => jumpToCatalog(cat)}
                      className={`press flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                        activeCategory === cat
                          ? 'bg-paper-deep/60 text-wine'
                          : 'text-ink-soft hover:bg-paper-soft hover:text-ink'
                      }`}
                    >
                      <span>{cat}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <a
              href="#contact-section"
              className="link-underline whitespace-nowrap border-l border-line/80 pl-4 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-soft transition-colors hover:text-wine 2xl:text-[11px]"
            >
              Visit Store
            </a>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press hidden items-center gap-2 rounded-full border border-forest/25 bg-forest/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-forest transition-colors hover:border-forest/50 hover:bg-forest hover:text-cream sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press hidden h-10 w-10 items-center justify-center rounded-full border border-forest/25 bg-forest/5 text-forest min-[420px]:flex sm:hidden"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>

            <button
              onClick={onOpenEnquiryDrawer}
              className="press relative flex items-center gap-2 rounded-full bg-ink px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cream shadow-sm transition-colors hover:bg-wine sm:px-4 sm:text-[11px] sm:tracking-[0.12em]"
              aria-label={`Open enquiry bag with ${enquiryCount} items`}
            >
              <ShoppingBag className="h-4 w-4 text-brass-soft" />
              <span className="hidden sm:inline">Enquiry Bag</span>
              {enquiryCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-soft px-1 text-[10px] font-extrabold text-ink">
                  {enquiryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="press flex h-10 w-10 items-center justify-center rounded-full border border-line/80 bg-cream text-ink transition-colors hover:border-ink/30 xl:hidden"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="relative ml-auto flex h-full w-[min(21rem,88vw)] flex-col border-l border-line/80 bg-paper shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line/80 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream">
                    <span className="font-serif text-sm font-semibold">J</span>
                  </span>
                  <div>
                    <p className="font-serif text-sm font-semibold tracking-[0.08em] text-ink">
                      JSB SONS
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-brass">
                      Ready Garments
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="press flex h-8 w-8 items-center justify-center rounded-full border border-line bg-cream text-ink-soft hover:text-ink"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-brass">
                  Shop by category
                </p>
                <button
                  onClick={() => jumpToCatalog('All')}
                  className={`press mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs font-semibold transition-colors ${
                    activeCategory === 'All'
                      ? 'bg-ink text-cream'
                      : 'text-ink-soft hover:bg-cream hover:text-ink'
                  }`}
                >
                  <span>All Garments</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </button>

                {allCats.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => jumpToCatalog(cat)}
                    className={`press mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-ink text-cream'
                        : 'text-ink-soft hover:bg-cream hover:text-ink'
                    }`}
                  >
                    <span>{cat}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))}

                <div className="mt-5 space-y-2 border-t border-line/70 pt-4">
                  <a
                    href="#contact-section"
                    onClick={() => setIsMenuOpen(false)}
                    className="press flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink-soft hover:bg-cream hover:text-ink"
                  >
                    <MapPin className="h-4 w-4 text-brass" />
                    <span>Visit the store</span>
                  </a>
                  <div className="flex items-start gap-2.5 px-3 py-2 text-[11px] text-ink-soft">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                    <span className="space-y-0.5">
                      {settings.workingHours
                        .split('|')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                    </span>
                  </div>
                </div>
              </nav>

              <div className="border-t border-line/80 p-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex w-full items-center justify-center gap-2 rounded-full bg-forest px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-forest-deep"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
