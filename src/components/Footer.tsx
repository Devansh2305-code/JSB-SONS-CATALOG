import React from 'react';
import { MessageCircle, ShieldCheck, ArrowUp, MapPin, Clock, Phone, ArrowUpRight } from 'lucide-react';
import { StoreSettings } from '../types';
import { DEFAULT_CATEGORIES } from '../data/initialProducts';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
  const categories = (settings.categories?.length ? settings.categories : DEFAULT_CATEGORIES).slice(0, 4);

  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brass/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-wine/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass/40 bg-cream/5 font-serif text-lg text-brass-soft">
                J
              </span>
              <div>
                <p className="font-serif text-2xl font-semibold tracking-[0.08em]">JSB SONS</p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.28em] text-brass-soft">
                  Ready Garments · Est. 1994
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-xs leading-relaxed text-cream/55">
              Honest fabrics, neat finishing and ready-to-wear fits for school, work, winter,
              festivity and the biggest days.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press mt-5 inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cream/85 transition-colors hover:border-brass-soft/60 hover:text-brass-soft"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Chat with the shop</span>
            </a>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-brass-soft">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-cream/60">
              <li>
                <a href="#catalog-section" className="link-underline transition-colors hover:text-cream">
                  Full collection
                </a>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <a href="#catalog-section" className="link-underline transition-colors hover:text-cream">
                    {cat}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contact-section" className="link-underline transition-colors hover:text-cream">
                  Bulk & corporate orders
                </a>
              </li>
            </ul>
          </div>

          {/* Visit */}
          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-brass-soft">
              Visit the store
            </h4>
            <ul className="mt-4 space-y-3 text-xs text-cream/60">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-soft" />
                <span>
                  {settings.address}
                  <br />
                  {settings.city}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-soft" />
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
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-soft" />
                <a
                  href={`tel:${settings.displayPhone.replace(/[^0-9+]/g, '')}`}
                  className="transition-colors hover:text-cream"
                >
                  {settings.displayPhone}
                </a>
              </li>
            </ul>
          </div>

          {/* Admin */}
          <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-brass-soft">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Shop owner</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-cream/50">
              Add garments, clean product photos on white, update the moving strip and shop
              timings.
            </p>
            <button
              onClick={onOpenAdmin}
              className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brass-soft px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cream"
            >
              <span>Open admin</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 text-[10px] text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} JSB SONS Ready Garments. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="press flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] transition-colors hover:text-cream"
          >
            <span>Back to top</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cream/15">
              <ArrowUp className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};
