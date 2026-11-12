import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Scissors,
  Shirt,
  Building2,
  MapPin,
  X,
} from 'lucide-react';
import { Product, StoreSettings, EnquiryItem } from './types';
import { INITIAL_PRODUCTS, DEFAULT_STORE_SETTINGS, DEFAULT_CATEGORIES } from './data/initialProducts';
import { resolveAssetUrl } from './assets/images';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { EnquiryDrawer } from './components/EnquiryDrawer';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminPasswordModal } from './components/Admin/AdminPasswordModal';
import { renderHangingGarment } from './services/hangingGarmentRenderer';
import {
  fetchProductsFromSupabase,
  fetchStoreSettingsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  updateProductStockInSupabase,
  setFeaturedProductInSupabase,
  saveStoreSettingsToSupabase,
  bulkSyncProductsToSupabase,
  isSupabaseConfigured,
  initSupabaseConfig,
  subscribeToProductChanges,
  subscribeToStoreSettingsChanges,
  seedInitialProductsIfEmpty,
} from './services/supabase';

const normalizeProduct = (product: Product): Product => ({
  ...product,
  images: (product.images || []).map(resolveAssetUrl),
  hangingImageUrl: resolveAssetUrl(product.hangingImageUrl) || undefined,
  modelTryOnUrl: resolveAssetUrl(product.modelTryOnUrl) || undefined,
});

const normalizeSettings = (value?: Partial<StoreSettings> | null): StoreSettings => ({
  ...DEFAULT_STORE_SETTINGS,
  ...(value || {}),
  announcementEnabled: value?.announcementEnabled !== false,
  announcementSpeed: value?.announcementSpeed || 'normal',
  categories:
    value?.categories && value.categories.length > 0
      ? value.categories
      : DEFAULT_CATEGORIES,
});

const normalizeProducts = (list: Product[]): Product[] => list.map(normalizeProduct);

export default function App() {
  // Store products in state with localStorage persistence as local offline fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('jsb_products');
      if (saved) return normalizeProducts(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not read stored products', e);
    }
    return normalizeProducts(INITIAL_PRODUCTS);
  });

  // Store settings in state with localStorage persistence
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('jsb_settings');
      if (saved) return normalizeSettings(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not read stored settings', e);
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // Save changes to localStorage for offline cache
  useEffect(() => {
    try {
      localStorage.setItem('jsb_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('jsb_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // View state: Customer Storefront vs Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Initialize Supabase configuration and Realtime cross-device sync
  useEffect(() => {
    let isCancelled = false;
    let unsubscribeProducts: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;

    const setupDatabaseSync = async () => {
      // 1. Fetch credentials from env or /api/config so all devices connect
      await initSupabaseConfig();

      if (!isSupabaseConfigured()) {
        console.info('Supabase running in local fallback mode.');
        return;
      }

      // 2. Fetch live products from Supabase
      try {
        let cloudProducts = await fetchProductsFromSupabase();

        if (!isCancelled) {
          if (cloudProducts && cloudProducts.length > 0) {
            setProducts(normalizeProducts(cloudProducts));
          } else if (cloudProducts && cloudProducts.length === 0) {
            // Empty database table -> auto-seed initial products so all users share them
            await seedInitialProductsIfEmpty(INITIAL_PRODUCTS);
            const seeded = await fetchProductsFromSupabase();
            if (seeded && seeded.length > 0 && !isCancelled) {
              setProducts(normalizeProducts(seeded));
            }
          }
        }

        const cloudSettings = await fetchStoreSettingsFromSupabase();
        if (!isCancelled && cloudSettings) {
          setSettings(normalizeSettings(cloudSettings));
        }
      } catch (err) {
        console.warn('Database initial load error, using local cache:', err);
      }

      // 3. Set up REALTIME subscriptions: whenever admin modifies anything on their device,
      // all other connected customer devices immediately update without refreshing!
      unsubscribeProducts = subscribeToProductChanges(async () => {
        try {
          const fresh = await fetchProductsFromSupabase();
          if (fresh && !isCancelled) {
            setProducts(normalizeProducts(fresh));
          }
        } catch (e) {
          console.warn('Realtime product update fetch error:', e);
        }
      });

      unsubscribeSettings = subscribeToStoreSettingsChanges((newSettings) => {
        if (!isCancelled && newSettings) {
          setSettings(normalizeSettings(newSettings));
        }
      });
    };

    setupDatabaseSync();

    // Re-verify on window focus (e.g. when customer returns to tab)
    const handleFocus = async () => {
      if (isSupabaseConfigured()) {
        const fresh = await fetchProductsFromSupabase();
        if (fresh && fresh.length > 0 && !isCancelled) {
          setProducts(normalizeProducts(fresh));
        }
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isCancelled = true;
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSettings) unsubscribeSettings();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Quick View and Enquiry Drawer States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isEnquiryDrawerOpen, setIsEnquiryDrawerOpen] = useState(false);
  const [enquiryItems, setEnquiryItems] = useState<EnquiryItem[]>([]);

  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyAiSliced, setOnlyAiSliced] = useState<boolean>(false);

  // Ensure all products have high-resolution full hanging form images rendered
  useEffect(() => {
    let isCancelled = false;
    const generateMissingHangingImages = async () => {
      const needsRender = products.some((p) => !p.hangingImageUrl);
      if (!needsRender) return;

      const updatedProducts = await Promise.all(
        products.map(async (prod) => {
          if (prod.hangingImageUrl) return prod;
          try {
            const hangingUrl = await renderHangingGarment({
              croppedImageUrl: prod.images[0],
              category: prod.category,
              colorHex: prod.colorHex,
              colorName: prod.color,
              fabric: prod.fabric,
              pattern: prod.pattern,
              collarStyle:
                prod.collarStyle ||
                (prod.category.includes('Kurta')
                  ? 'Mandarin Nehru Collar'
                  : prod.category.includes('Jacket')
                  ? 'Bandhgala High Neck'
                  : 'Spread Collar'),
              title: prod.title,
            });
            return {
              ...prod,
              hangingImageUrl: hangingUrl,
              displayMode: 'hanging' as const,
            };
          } catch {
            return prod;
          }
        })
      );

      if (!isCancelled) {
        setProducts(updatedProducts);
      }
    };

    generateMissingHangingImages();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Auto-open product from URL query parameter ?item=SKU or ?sku=SKU
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get('item') || params.get('sku');
    if (itemParam) {
      const found = products.find(
        (p) => p.sku.toLowerCase() === itemParam.toLowerCase() || p.id === itemParam
      );
      if (found) {
        setQuickViewProduct(found);
      }
    }
  }, [products]);

  // Add product to Enquiry Bag
  const handleAddToEnquiryBag = (product: Product, size?: string) => {
    const sz = size || product.sizes[0] || 'M';
    setEnquiryItems((prev) => {
      const existsIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === sz
      );
      if (existsIndex > -1) {
        const updated = [...prev];
        updated[existsIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, selectedSize: sz, quantity: 1 }];
    });
    setIsEnquiryDrawerOpen(true);
  };

  const handleRemoveFromBag = (productId: string, size: string) => {
    setEnquiryItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedSize === size)
      )
    );
  };

  // Admin Actions with instant UI update and Supabase cloud persistence
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    if (isSupabaseConfigured()) {
      saveProductToSupabase(newProd).catch(console.error);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
    );
    if (isSupabaseConfigured()) {
      saveProductToSupabase(updatedProduct).catch(console.error);
    }
  };

  const handleBulkAddProducts = (newProds: Product[]) => {
    setProducts((prev) => [...newProds, ...prev]);
    if (isSupabaseConfigured()) {
      bulkSyncProductsToSupabase(newProds).catch(console.error);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured()) {
      deleteProductFromSupabase(id).catch(console.error);
    }
  };

  const handleToggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedStock = !p.inStock;
          if (isSupabaseConfigured()) {
            updateProductStockInSupabase(id, updatedStock).catch(console.error);
          }
          return { ...p, inStock: updatedStock };
        }
        return p;
      })
    );
  };

  const handleSetFeaturedProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        isFeatured: product.id === id,
      }))
    );

    if (isSupabaseConfigured()) {
      setFeaturedProductInSupabase(id).catch(console.error);
    }
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    const normalized = normalizeSettings(newSettings);
    setSettings(normalized);
    if (isSupabaseConfigured()) {
      saveStoreSettingsToSupabase(normalized).catch(console.error);
    }
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    const isAuth =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('jsb_admin_authenticated') === 'true';
    if (isAuth) {
      setIsAdmin(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jsb_admin_authenticated');
    }
    setIsAdmin(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive unique categories and colors dynamically from store settings and products
  const configuredCategories =
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : DEFAULT_CATEGORIES;

  const categories = Array.from(
    new Set([
      'All',
      ...configuredCategories,
      ...products.map((p) => p.category).filter(Boolean),
    ])
  );

  const uniqueColors = Array.from(
    new Set(products.map((p) => p.color).filter(Boolean))
  );

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedColor !== 'All' && p.color !== selectedColor) return false;
    if (onlyAiSliced && p.sourceType !== 'ai-sliced') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchFabric = p.fabric.toLowerCase().includes(q);
      const matchColor = p.color.toLowerCase().includes(q);
      if (!matchTitle && !matchSku && !matchFabric && !matchColor) return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    // Featured first
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  // If in Admin mode, render AdminDashboard
  if (isAdmin) {
    return (
      <AdminDashboard
        products={products}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onToggleStock={handleToggleStock}
        onSetFeaturedProduct={handleSetFeaturedProduct}
        onBulkAddProducts={handleBulkAddProducts}
        onExitToStore={() => {
          setIsAdmin(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogoutAdmin={handleAdminLogout}
      />
    );
  }

  const whatsappBase = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`;
  const servicePromises = [
    {
      icon: Scissors,
      title: 'Cut & finished in-house',
      caption: 'Neat seams and finishes that last.',
    },
    {
      icon: Shirt,
      title: 'Every size, ready',
      caption: 'School fits to XXL, stocked now.',
    },
    {
      icon: Building2,
      title: 'Bulk & corporate',
      caption: '25+ pieces with logo printing.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp-first service',
      caption: 'One tap to our shop counter.',
    },
  ];

  // Otherwise render the atelier storefront
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper font-sans text-ink">
      <Header
        settings={settings}
        enquiryCount={enquiryItems.length}
        onOpenEnquiryDrawer={() => setIsEnquiryDrawerOpen(true)}
        activeCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        categories={categories}
      />

      <Hero
        settings={settings}
        onExploreClick={() => {
          const el = document.getElementById('catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={handleSelectCategory}
      />

      {/* Atelier promises */}
      <section className="border-y border-line/70 bg-cream/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-5 sm:px-6 lg:grid-cols-4 lg:px-8">
          {servicePromises.map((promise) => (
            <div key={promise.title} className="flex items-start gap-3 px-2 py-3 sm:px-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/30 bg-paper text-brass">
                <promise.icon className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div>
                <p className="font-serif text-[13px] font-semibold leading-tight text-ink sm:text-sm">
                  {promise.title}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-ink-soft sm:text-[11px]">
                  {promise.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Catalog Section */}
      <main
        id="catalog-section"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8"
      >
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-line/70 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">The Collection</span>
            <h2 className="mt-4 font-display text-3xl font-medium leading-[1.02] tracking-[-0.03em] text-ink text-balance sm:text-4xl lg:text-[3.1rem]">
              Readymade, <span className="italic text-wine">exceptionally</span> made.
            </h2>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-soft sm:text-sm">
              Tap any piece to inspect the fabric, fit and sizes — then send a single-tap
              enquiry to our shop on WhatsApp.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70" />
              <input
                type="text"
                placeholder="Search shirts, kurtas, jackets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field rounded-full py-3 pl-11 pr-11 text-xs sm:text-sm"
                aria-label="Search the collection"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="press absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep/60 hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <a
              href="#contact-section"
              className="press group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-wine/25 bg-wine/[0.04] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-wine transition-colors hover:bg-wine hover:text-cream"
            >
              <span>Bulk quote</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-7 flex flex-col gap-4">
          <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-all sm:text-[11px] ${
                  selectedCategory === cat
                    ? 'border-ink bg-ink text-cream shadow-sm'
                    : 'border-line/80 bg-cream/60 text-ink-soft hover:border-ink/30 hover:text-ink'
                }`}
                aria-pressed={selectedCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-line/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-full border border-line/80 bg-cream/60 px-3.5 py-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Colour
                </span>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="cursor-pointer bg-transparent text-xs font-medium text-ink focus:outline-none"
                  aria-label="Filter by colour"
                >
                  <option value="All">All colours</option>
                  {uniqueColors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-line/80 bg-cream/60 px-3.5 py-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="cursor-pointer bg-transparent text-xs font-medium text-ink focus:outline-none"
                  aria-label="Sort products"
                >
                  <option value="featured">Featured first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>

              <button
                onClick={() => setOnlyAiSliced(!onlyAiSliced)}
                className={`press inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  onlyAiSliced
                    ? 'border-brass/60 bg-brass/10 text-wine'
                    : 'border-line/80 bg-cream/60 text-ink-soft hover:border-brass/50 hover:text-ink'
                }`}
                aria-pressed={onlyAiSliced}
              >
                <Sparkles className="h-3.5 w-3.5 text-brass" />
                <span>Auto-separated</span>
              </button>

              {(selectedCategory !== 'All' ||
                selectedColor !== 'All' ||
                searchQuery ||
                onlyAiSliced) && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedColor('All');
                    setSearchQuery('');
                    setOnlyAiSliced(false);
                  }}
                  className="px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-wine"
                >
                  Reset
                </button>
              )}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft/80">
              Showing {sortedProducts.length} of {products.length} pieces
            </p>
          </div>
        </div>

        {/* Product grid */}
        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-cream text-ink-soft">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-display text-2xl font-medium text-ink">
              Nothing matching that search
            </h3>
            <p className="mt-2 max-w-sm text-xs text-ink-soft">
              Try a different colour, category or clear your filters to see the full collection.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedColor('All');
                setSearchQuery('');
                setOnlyAiSliced(false);
              }}
              className="press mt-6 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-wine"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {sortedProducts.map((product) => {
              const isBagged = enquiryItems.some(
                (item) => item.product.id === product.id
              );
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  settings={settings}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onAddToEnquiryBag={(p) => handleAddToEnquiryBag(p)}
                  isBagged={isBagged}
                />
              );
            })}
          </div>
        )}

        {/* Closing CTA */}
        <div className="relative mt-14 overflow-hidden rounded-[2rem] bg-ink text-cream">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-wine/40 blur-3xl" />
          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-soft">
                Need a size we don't have?
              </span>
              <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-cream sm:text-3xl">
                Tell us what you need. We restock fast.
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-cream/65 sm:text-sm">
                School lists, corporate uniforms, wedding parties or single pieces — message
                the shop with your size and timeline.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <a
                href={`${whatsappBase}?text=${encodeURIComponent(
                  'Hello JSB SONS, I would like to request an item / size. Details: '
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center justify-center gap-2 rounded-full bg-brass-soft px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-cream"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message the shop</span>
              </a>
              <a
                href="#contact-section"
                className="press inline-flex items-center justify-center gap-2 rounded-full border border-cream/25 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cream transition-colors hover:border-cream/60"
              >
                <MapPin className="h-4 w-4" />
                <span>Visit store</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Floating WhatsApp CTA */}
      <a
        href={`${whatsappBase}?text=${encodeURIComponent(
          'Hello JSB SONS, I am browsing your catalog and would like to ask a question.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="press animate-pulse-ring fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full border border-cream/15 bg-forest px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cream shadow-[0_18px_40px_-16px_rgba(22,58,45,0.9)] sm:hidden"
        aria-label="Chat with JSB SONS on WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Chat with us</span>
      </a>

      {/* Contact & Enquiry Section at the bottom of the page */}
      <ContactSection settings={settings} />

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Admin Password Gate Modal */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          setIsAdmin(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        settings={settings}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToBag={(prod, size) => handleAddToEnquiryBag(prod, size)}
      />

      {/* Enquiry Bag Drawer */}
      <EnquiryDrawer
        isOpen={isEnquiryDrawerOpen}
        onClose={() => setIsEnquiryDrawerOpen(false)}
        items={enquiryItems}
        settings={settings}
        onRemoveItem={handleRemoveFromBag}
        onClearAll={() => setEnquiryItems([])}
      />
    </div>
  );
}
