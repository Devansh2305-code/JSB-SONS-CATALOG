import React from 'react';
import { MessageCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
  onOpenSlicerModal?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick }) => {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800/80 bg-zinc-950 pt-5 pb-8 sm:py-16">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 -z-10 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          {/* Editorial Brand Headline */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Kicker */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-widest text-amber-300/90 font-medium mb-2.5 sm:mb-4">
              <span>JSB SONS</span>
              <span aria-hidden="true">·</span>
              <span>READY GARMENTS</span>
              <span aria-hidden="true">·</span>
              <span>EST. 1994</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-100 leading-snug sm:leading-[1.15] mb-3 sm:mb-5 text-balance">
              Quality Readymade Clothes for Every Occasion.
            </h1>

            <p className="text-zinc-400 text-xs sm:text-base leading-relaxed mb-5 sm:mb-8">
              Explore pure cotton shirts, linen kurtas, blazers, and festive sets. Designed for easy fit and all-day comfort. Instant WhatsApp orders and size help.
            </p>

            {/* CTAs - 2 Columns on mobile for easy thumb tapping */}
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap active:scale-[0.98]"
              >
                <span>View Clothes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Hello JSB SONS, I am viewing your online ready garments catalog and would like some assistance.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-700/50 hover:bg-emerald-900/50 rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm active:scale-[0.98]"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-500/20" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Simple trust markers */}
            <div className="pt-4 sm:pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-2 sm:gap-4 text-left">
              <div>
                <p className="font-serif text-lg sm:text-2xl font-bold text-zinc-100 tabular-nums">32+</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Years Experience</p>
              </div>
              <div>
                <p className="font-serif text-lg sm:text-2xl font-bold text-zinc-100 tabular-nums">100%</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Readymade Stock</p>
              </div>
              <div>
                <p className="font-serif text-lg sm:text-2xl font-bold text-zinc-100 tabular-nums">Instant</p>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">WhatsApp Help</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative mt-2 sm:mt-0">
            <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl group">
              <img
                src="/src/assets/images/jsb_hero_garments_1793439533100.jpg"
                alt="JSB SONS Ready Garments Shop"
                className="w-full aspect-[16/10] sm:aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
