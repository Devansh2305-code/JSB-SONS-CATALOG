import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { Product, StoreSettings, EnquiryItem } from './types';
import { INITIAL_PRODUCTS, DEFAULT_STORE_SETTINGS } from './data/initialProducts';
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
  saveStoreSettingsToSupabase,
  bulkSyncProductsToSupabase,
  isSupabaseConfigured,
  initSupabaseConfig,
  subscribeToProductChanges,
  subscribeToStoreSettingsChanges,
  seedInitialProductsIfEmpty,
} from './services/supabase';

export default function App() {
  // Store products in state with localStorage persistence as local offline fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('jsb_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read stored products', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Store settings in state with localStorage persistence
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('jsb_settings');
      if (saved) return JSON.parse(saved);
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
            setProducts(cloudProducts);
          } else if (cloudProducts && cloudProducts.length === 0) {
            // Empty database table -> auto-seed initial products so all users share them
            await seedInitialProductsIfEmpty(INITIAL_PRODUCTS);
            const seeded = await fetchProductsFromSupabase();
            if (seeded && seeded.length > 0 && !isCancelled) {
              setProducts(seeded);
            }
          }
        }

        const cloudSettings = await fetchStoreSettingsFromSupabase();
        if (!isCancelled && cloudSettings) {
          setSettings(cloudSettings);
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
            setProducts(fresh);
          }
        } catch (e) {
          console.warn('Realtime product update fetch error:', e);
        }
      });

      unsubscribeSettings = subscribeToStoreSettingsChanges((newSettings) => {
        if (!isCancelled && newSettings) {
          setSettings(newSettings);
        }
      });
    };

    setupDatabaseSync();

    // Re-verify on window focus (e.g. when customer returns to tab)
    const handleFocus = async () => {
      if (isSupabaseConfigured()) {
        const fresh = await fetchProductsFromSupabase();
        if (fresh && fresh.length > 0 && !isCancelled) {
          setProducts(fresh);
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

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    if (isSupabaseConfigured()) {
      saveStoreSettingsToSupabase(newSettings).catch(console.error);
    }
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

  // Derive unique categories and colors
  const categories = [
    'All',
    'Shirts',
    'Kurtas & Ethnic',
    'Jackets & Blazers',
    'Trousers & Pants',
    'Festive & Wedding',
  ];

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
        onDeleteProduct={handleDeleteProduct}
        onToggleStock={handleToggleStock}
        onBulkAddProducts={handleBulkAddProducts}
        onExitToStore={() => {
          setIsAdmin(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogoutAdmin={handleAdminLogout}
      />
    );
  }

  // Otherwise render Luxury Customer Storefront
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Header */}
      <Header
        settings={settings}
        enquiryCount={enquiryItems.length}
        onOpenEnquiryDrawer={() => setIsEnquiryDrawerOpen(true)}
        activeCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Main Campaign Hero */}
      <Hero
        settings={settings}
        onExploreClick={() => {
          const el = document.getElementById('catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Product Catalog Section */}
      <main id="catalog-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Catalog Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
              <span>READY CLOTHES COLLECTION</span>
              <span aria-hidden="true">·</span>
              <span>{sortedProducts.length} PRODUCTS</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Garments Catalog
            </h2>
          </div>

          {/* Search Input - Clean & Full width on phone */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search shirts, kurtas, jackets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 sm:py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 text-xs py-0.5 px-1.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar - Mobile horizontal scrollable tabs */}
        <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-zinc-800/80">
          {/* Category Tabs - Smooth swipe with touch padding on phone */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Filters - 2 columns on phone for perfect thumb ergonomics */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              {/* Color filter */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5">
                <span className="text-zinc-400 text-[11px] shrink-0">Color:</span>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="bg-transparent text-zinc-200 text-xs focus:outline-none w-full"
                >
                  <option value="All" className="bg-zinc-900">All</option>
                  {uniqueColors.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5">
                <span className="text-zinc-400 text-[11px] shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-zinc-200 text-xs focus:outline-none w-full"
                >
                  <option value="featured" className="bg-zinc-900">Featured</option>
                  <option value="price-asc" className="bg-zinc-900">Price: Low</option>
                  <option value="price-desc" className="bg-zinc-900">Price: High</option>
                </select>
              </div>
            </div>

            {/* Auto-Separated toggle */}
            <button
              onClick={() => setOnlyAiSliced(!onlyAiSliced)}
              className={`px-3 py-1.5 rounded border transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                onlyAiSliced
                  ? 'bg-amber-400/10 text-amber-300 border-amber-500/40 font-semibold'
                  : 'text-zinc-400 border-zinc-800 hover:text-zinc-200 bg-zinc-900/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Auto-Separated Clothes</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid - Clean 2-column grid on mobile! */}
        {sortedProducts.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-zinc-200">
              No matching clothes found
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Try resetting your category or color filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedColor('All');
                setSearchQuery('');
                setOnlyAiSliced(false);
              }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
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
      </main>

      {/* Floating 1-Tap WhatsApp Contact Button on Mobile */}
      <a
        href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          'Hello JSB SONS, I am browsing your catalog and would like to ask a question.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-4 z-40 sm:hidden w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-full flex items-center justify-center shadow-2xl border-2 border-zinc-900 active:scale-90 transition-transform"
        title="Instant WhatsApp Support"
      >
        <MessageCircle className="w-6 h-6 fill-zinc-950/20" />
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
