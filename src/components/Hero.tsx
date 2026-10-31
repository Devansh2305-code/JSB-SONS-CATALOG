import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
  onOpenSlicerModal?: () => void;
}

interface ShowcaseItem {
  id: string;
  title: string;
  category: string;
  fabric: string;
  tag: string;
  price: number;
  originalPrice: number;
  colorHex: string;
  accentGlow: string;
  image: string;
  badge: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'sc-1',
    title: 'Royal Navy Blue Bandhgala',
    category: 'Jackets & Blazers',
    fabric: 'Wool & Silk Blend',
    tag: 'Brass Crest Buttons',
    price: 8490,
    originalPrice: 10990,
    colorHex: '#1e3a8a',
    accentGlow: 'rgba(30, 58, 138, 0.35)',
    image: '/src/assets/images/product_royal_bandhgala_1793439535395.jpg',
    badge: '👑 Royal Lookbook',
  },
  {
    id: 'sc-2',
    title: 'Sage Green Artisan Kurta',
    category: 'Kurtas & Ethnic',
    fabric: '100% Pure Linen',
    tag: 'Threadwork Collar',
    price: 3890,
    originalPrice: 4590,
    colorHex: '#4d6b53',
    accentGlow: 'rgba(77, 107, 83, 0.35)',
    image: '/src/assets/images/product_artisan_kurta_1793439536709.jpg',
    badge: '🌿 Summer Linen',
  },
  {
    id: 'sc-3',
    title: 'Indigo Pure Cotton Shirt',
    category: 'Shirts',
    fabric: 'Long-Staple Cotton',
    tag: 'Mother-of-Pearl Buttons',
    price: 2490,
    originalPrice: 2990,
    colorHex: '#1e293b',
    accentGlow: 'rgba(51, 65, 85, 0.35)',
    image: '/src/assets/images/raw_composite_shirts_1793439532041.jpg',
    badge: '👔 Everyday Luxury',
  },
  {
    id: 'sc-4',
    title: 'Emerald Silk Festive Suit',
    category: 'Festive & Wedding',
    fabric: 'Raw Silk & Gold Zari',
    tag: 'Zari Embroidery',
    price: 7990,
    originalPrice: 9990,
    colorHex: '#047857',
    accentGlow: 'rgba(4, 120, 87, 0.35)',
    image: '/src/assets/images/raw_composite_jackets_1793439535254.jpg',
    badge: '✨ Wedding Edition',
  },
];

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through luxury showcase garments every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeItem = SHOWCASE_ITEMS[activeIndex];

  return (
    <section className="relative overflow-hidden border-b border-zinc-800/80 bg-zinc-950 pt-5 pb-8 sm:py-16">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 right-1/4 -z-10 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: activeItem.accentGlow }}
      />
      <div className="absolute top-0 right-1/3 -z-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          {/* Left Column: Editorial Brand Headline */}
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

            {/* CTAs */}
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

            {/* Trust markers */}
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

          {/* Right Column: Creative Interactive 3D Wardrobe Stage */}
          <div
            className="lg:col-span-5 relative mt-2 sm:mt-0"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Rotating subtle gold ring in background */}
            <div className="absolute -inset-4 sm:-inset-6 pointer-events-none flex items-center justify-center">
              <div className="w-full h-full rounded-3xl border border-amber-500/10 opacity-70 animate-[spin_50s_linear_infinite]" />
            </div>

            {/* Layered 3D Card Deck */}
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              {/* Backing Depth Card 2 (Far back rack) */}
              <div className="absolute inset-0 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl transform rotate-6 scale-95 blur-[1px] pointer-events-none transition-transform duration-700" />

              {/* Backing Depth Card 1 (Mid rack) */}
              <div className="absolute inset-0 bg-zinc-900/70 border border-amber-500/20 rounded-2xl transform -rotate-3 scale-[0.98] pointer-events-none transition-transform duration-700 shadow-xl" />

              {/* Main Active Floating Showcase Stage */}
              <motion.div
                layout
                className="relative bg-zinc-900/95 border border-zinc-800/90 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300"
              >
                {/* Luxury Wooden Hanger Bar with Pendulum Brass Hook */}
                <div className="relative pt-3 pb-2 px-6 bg-gradient-to-b from-zinc-800/70 via-zinc-900/60 to-transparent border-b border-zinc-800/60 flex flex-col items-center">
                  {/* Brass Hook Animation */}
                  <motion.div
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: 'easeInOut',
                    }}
                    className="origin-bottom -mt-1 mb-0.5 flex flex-col items-center"
                  >
                    {/* Hook loop */}
                    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="text-amber-300 drop-shadow-md">
                      <path
                        d="M14 23V11C14 7.686 16.686 5 20 5C22.209 5 24 6.791 24 9C24 10.5 23 11.5 21.5 11.5"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </motion.div>

                  {/* Polished Walnut Wooden Hanger Silhouette */}
                  <div className="w-48 sm:w-56 h-3.5 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 rounded-full shadow-inner border-t border-amber-600/40 relative flex items-center justify-center">
                    <span className="text-[7px] tracking-widest text-amber-200/60 uppercase font-sans font-semibold">
                      JSB SONS · ATELIER
                    </span>
                  </div>
                </div>

                {/* Animated Garment Visual Transition */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-zinc-950 group cursor-pointer" onClick={onExploreClick}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeItem.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.03, y: -10 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <img
                        src={activeItem.image}
                        alt={activeItem.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Floating Luxury Spec Badge */}
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-amber-400/30 text-[10px] sm:text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow-lg"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{activeItem.badge}</span>
                  </motion.div>

                  {/* Live Ready-to-Wear Tag */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-medium text-emerald-300 flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ready To Wear</span>
                  </div>

                  {/* Interactive Peek Hint */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-amber-400 text-zinc-950 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>

                  {/* Garment Title & Price Overlay */}
                  <div className="absolute bottom-3 left-3.5 right-14 text-left pointer-events-none">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                      {activeItem.category} · {activeItem.fabric}
                    </span>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-zinc-100 truncate">
                      {activeItem.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-amber-300">
                        ₹{activeItem.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-500 line-through">
                        ₹{activeItem.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">
                        {activeItem.tag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Garment Switcher Tabs */}
                <div className="p-2 sm:p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-1 sm:gap-1.5">
                  {SHOWCASE_ITEMS.map((item, idx) => {
                    const isSelected = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all text-center truncate cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-zinc-950 font-bold shadow-md'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 bg-zinc-950/40 border border-zinc-800/60'
                        }`}
                      >
                        {item.category.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Animated Auto-Progress Bar */}
                <div className="h-0.5 w-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    key={activeIndex}
                    initial={{ width: '0%' }}
                    animate={{ width: isPaused ? '100%' : '100%' }}
                    transition={{
                      duration: isPaused ? 0 : 4.5,
                      ease: 'linear',
                    }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
