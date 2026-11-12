import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ArrowRight, ArrowUpRight, Sparkles, Scissors } from 'lucide-react';
import { StoreSettings } from '../types';
import { IMAGES } from '../assets/images';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
  onSelectCategory?: (category: string) => void;
}

interface ShowcaseItem {
  id: string;
  category: string;
  label: string;
  title: string;
  fabric: string;
  tag: string;
  price: number;
  image: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'sc-1',
    category: 'Wedding',
    label: 'Wedding',
    title: 'Royal Navy Bandhgala',
    fabric: 'Wool–silk blend · brass crest buttons',
    tag: 'Hand-finished',
    price: 8490,
    image: IMAGES.royalBandhgala,
  },
  {
    id: 'sc-2',
    category: 'Ethnic Collection',
    label: 'Ethnic',
    title: 'Sage Linen Artisan Kurta',
    fabric: '100% washed linen · mandarin collar',
    tag: 'Festive ready',
    price: 2890,
    image: IMAGES.artisanKurta,
  },
  {
    id: 'sc-3',
    category: 'Formals',
    label: 'Everyday',
    title: 'Ready shirting, every day',
    fabric: 'Giza cotton · linen · easy-care blends',
    tag: 'New arrivals',
    price: 1990,
    image: IMAGES.rawShirts,
  },
  {
    id: 'sc-4',
    category: 'Wedding',
    label: 'Festive',
    title: 'Occasion kurtas & bandhgalas',
    fabric: 'Silk, velvet & brocade finishes',
    tag: 'Wedding season',
    price: 6990,
    image: IMAGES.rawJackets,
  },
];

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick, onSelectCategory }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeItem = SHOWCASE_ITEMS[activeIndex];
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(
    /[^0-9]/g,
    ''
  )}?text=${encodeURIComponent(
    'Hello JSB SONS, I am viewing your ready garments collection and would like some assistance.'
  )}`;

  const handleShowcaseCta = () => {
    if (onSelectCategory) {
      onSelectCategory(activeItem.category);
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    onExploreClick();
  };

  return (
    <section className="relative overflow-hidden bg-paper">
      {/* Ambient washes */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-brass/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-[30rem] w-[30rem] rounded-full bg-wine/[0.07] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(92, 72, 44, 0.16) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-20 lg:pt-20">
        {/* Editorial copy */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
          }}
          className="relative z-10 lg:col-span-6 xl:col-span-5"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="eyebrow"
          >
            Ready garments · Since 1994
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-display text-[2.85rem] font-medium leading-[0.96] tracking-[-0.035em] text-ink text-balance sm:text-[4rem] xl:text-[4.9rem]"
          >
            The right fit
            <br />
            for <span className="italic text-wine">every chapter.</span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-6 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-[15px]"
          >
            From government and KV school uniforms to corporate bulk tees, winter wear,
            wedding bandhgalas and lab coats — cut, finished and ready to wear at JSB SONS.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button
              onClick={onExploreClick}
              className="press group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-ink px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-cream shadow-[0_18px_30px_-20px_rgba(26,23,19,0.8)] transition-colors hover:bg-wine"
            >
              <span>Shop the collection</span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass-soft text-ink transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-forest/30 bg-forest/[0.04] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-forest transition-colors hover:bg-forest hover:text-cream"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Order on WhatsApp</span>
            </a>
          </motion.div>

          <motion.button
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            transition={{ duration: 0.7 }}
            onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-wine"
          >
            <Scissors className="h-3.5 w-3.5 text-brass" />
            <span>Bulk orders, custom printing & embroidery</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </motion.button>

          {/* Trust markers */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-line/80 pt-6"
          >
            {[
              { value: '32+', label: 'Years in business' },
              { value: '8', label: 'Ready categories' },
              { value: '1:1', label: 'WhatsApp support' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-ink-soft sm:text-[11px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Editorial showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative lg:col-span-6 xl:col-span-7"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="absolute -inset-3 rotate-2 rounded-[2.4rem] border border-brass/25" aria-hidden="true" />
          <div className="absolute -inset-3 -rotate-1 rounded-[2.4rem] border border-wine/10" aria-hidden="true" />

          <div className="relative overflow-hidden rounded-[2rem] border border-line/80 bg-cream shadow-[0_35px_80px_-45px_rgba(48,36,20,0.6)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-paper-soft sm:aspect-[5/4] xl:aspect-[4/3]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeItem.id}
                  src={activeItem.image}
                  alt={activeItem.title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

              {/* Floating labels */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-cream/20 bg-ink/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cream backdrop-blur-md sm:left-5 sm:top-5">
                <Sparkles className="h-3 w-3 text-brass-soft" />
                <span>The JSB Atelier</span>
              </div>

              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-cream/20 bg-cream/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink backdrop-blur-md sm:right-5 sm:top-5">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                <span>Ready to wear</span>
              </div>

              {/* Caption */}
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeItem.id}-caption`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brass-soft">
                        <span>{activeItem.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeItem.tag}</span>
                      </div>
                      <h2 className="mt-1.5 font-display text-xl font-medium leading-tight text-cream sm:text-2xl">
                        {activeItem.title}
                      </h2>
                      <p className="mt-1 text-[11px] text-cream/70 sm:text-xs">{activeItem.fabric}</p>
                    </div>

                    <button
                      onClick={handleShowcaseCta}
                      className="press inline-flex w-fit items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brass-soft"
                    >
                      <span>View from ₹{activeItem.price.toLocaleString('en-IN')}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Showcase switcher */}
            <div className="grid grid-cols-4 border-t border-line/70 bg-cream">
              {SHOWCASE_ITEMS.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`press group relative px-2 py-3.5 text-left transition-colors sm:px-4 ${
                      isSelected ? 'bg-paper-soft/60' : 'hover:bg-paper-soft/40'
                    }`}
                    aria-label={`Show ${item.label} collection`}
                    aria-pressed={isSelected}
                  >
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-brass">
                      0{idx + 1}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors sm:text-[11px] ${
                        isSelected ? 'text-wine' : 'text-ink-soft group-hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`absolute inset-x-2 top-0 h-0.5 origin-left transition-transform duration-500 sm:inset-x-4 ${
                        isSelected ? 'scale-x-100 bg-wine' : 'scale-x-0 bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rotating seal */}
          <div className="absolute -left-3 -top-7 hidden h-20 w-20 items-center justify-center sm:flex lg:-left-6">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-brass/50 bg-paper/70" />
            <div className="absolute inset-2 rounded-full bg-paper shadow-[0_10px_30px_-18px_rgba(48,36,20,0.6)]" />
            <div className="relative text-center">
              <span className="block font-display text-lg font-semibold leading-none text-wine">32</span>
              <span className="mt-0.5 block text-[6px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                Years
                <br />
                of fit
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
