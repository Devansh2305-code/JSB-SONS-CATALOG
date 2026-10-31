import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Package,
  Settings,
  LogOut,
  Sparkles,
  ShoppingBag,
  Trash2,
  Check,
  Save,
  MessageCircle,
  ShieldCheck,
  Search,
  Database,
  Lock,
  KeyRound,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Product, StoreSettings } from '../../types';
import { RawGarmentSlicer } from './RawGarmentSlicer';
import { ProductImageUploader } from './ProductImageUploader';
import { getStoredAdminPassword, setStoredAdminPassword } from './AdminPasswordModal';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  bulkSyncProductsToSupabase,
  isSupabaseConfigured,
} from '../../services/supabase';

interface AdminDashboardProps {
  products: Product[];
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleStock: (id: string) => void;
  onBulkAddProducts: (newProducts: Product[]) => void;
  onExitToStore: () => void;
  onLogoutAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  settings,
  onUpdateSettings,
  onAddProduct,
  onDeleteProduct,
  onToggleStock,
  onBulkAddProducts,
  onExitToStore,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'slicer' | 'add-product' | 'inventory' | 'settings' | 'supabase'
  >('slicer');

  // New Single Product Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Product['category']>('Shirts');
  const [price, setPrice] = useState<number>(2490);
  const [originalPrice, setOriginalPrice] = useState<number>(2990);
  const [color, setColor] = useState('Navy Blue');
  const [colorHex, setColorHex] = useState('#1e3a8a');
  const [fabric, setFabric] = useState('100% Pure Linen');
  const [fit, setFit] = useState('Modern Slim Fit');
  const [sizes, setSizes] = useState<string>('38 (S), 40 (M), 42 (L), 44 (XL)');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedHangingUrl, setUploadedHangingUrl] = useState<string>('');
  const [description, setDescription] = useState(
    'Ready garment from JSB SONS made with quality fabric and neat stitching.'
  );
  const [productSavedAlert, setProductSavedAlert] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Settings Form State
  const [tempSettings, setTempSettings] = useState<StoreSettings>(settings);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  // Admin Password Customization State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    count?: number;
  }>({ tested: false });

  // Inventory search
  const [searchQuery, setSearchQuery] = useState('');

  // Load existing credentials on mount
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseAnonKey(creds.key);
  }, []);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);

    if (!title.trim()) {
      setProductFormError('Please enter a product title.');
      return;
    }

    if (uploadedImages.length === 0) {
      setProductFormError('Please upload at least one garment photo from your phone or device.');
      return;
    }

    const skuCode = `JSB-${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const parsedSizes = sizes.split(',').map((s) => s.trim()).filter(Boolean);

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: skuCode,
      title: title.trim(),
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      color: color.trim(),
      colorHex,
      fabric: fabric.trim(),
      fit: fit.trim(),
      sizes: parsedSizes.length > 0 ? parsedSizes : ['38 (S)', '40 (M)', '42 (L)', '44 (XL)'],
      images: uploadedImages,
      hangingImageUrl: uploadedHangingUrl || undefined,
      displayMode: uploadedHangingUrl ? 'hanging' : 'photo',
      description: description.trim(),
      inStock: true,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      sourceType: 'manual',
    };

    onAddProduct(newProd);
    setProductSavedAlert(true);
    setTimeout(() => setProductSavedAlert(false), 3500);

    // Reset form fields for next garment
    setTitle('');
    setUploadedImages([]);
    setUploadedHangingUrl('');
    setPrice(2490);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    const activeStoredPassword = getStoredAdminPassword();

    if (currentPasswordInput.trim() !== activeStoredPassword.trim()) {
      setPasswordNotice({
        type: 'error',
        msg: 'Current password did not match. Please verify your current password.',
      });
      return;
    }

    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
      setPasswordNotice({
        type: 'error',
        msg: 'New password must be at least 4 characters long.',
      });
      return;
    }

    setStoredAdminPassword(newPasswordInput.trim());
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setPasswordNotice({
      type: 'success',
      msg: 'Admin security password changed successfully!',
    });
    setTimeout(() => setPasswordNotice(null), 4000);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setTestingSupabase(true);
    setSupabaseStatus({ tested: false });

    const result = await testSupabaseConnection();
    setTestingSupabase(false);
    setSupabaseStatus({
      tested: true,
      success: result.success,
      message: result.message,
      count: result.count,
    });
  };

  const handleTestSupabaseOnly = async () => {
    setTestingSupabase(true);
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    const result = await testSupabaseConnection();
    setTestingSupabase(false);
    setSupabaseStatus({
      tested: true,
      success: result.success,
      message: result.message,
      count: result.count,
    });
  };

  const handleSyncToSupabase = async () => {
    setSyncingSupabase(true);
    const res = await bulkSyncProductsToSupabase(products);
    setSyncingSupabase(false);
    if (res.error) {
      setSupabaseStatus({
        tested: true,
        success: false,
        message: `Sync failed: ${res.error}`,
      });
    } else {
      setSupabaseStatus({
        tested: true,
        success: true,
        message: `Successfully synchronized all ${res.count} products to your Supabase database!`,
        count: res.count,
      });
    }
  };

  const filteredInventory = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Medusa-Style Admin Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/90 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-serif font-bold text-base flex items-center justify-center shadow">
            JSB
          </div>
          <div>
            <h1 className="font-serif text-base sm:text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <span>JSB SONS</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-sans font-medium uppercase tracking-wider">
                Store Admin
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden xs:block">
              Products, Photos, Stock, & Cloud Database
            </p>
          </div>
        </div>

        {/* Exit & Lock Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExitToStore}
            className="px-3 sm:px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Storefront</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-3 sm:px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Lock admin session and require password"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Admin</span>
          </button>
        </div>
      </header>

      {/* Admin Nav Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('slicer')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'slicer'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Multi-Garment AI Separator</span>
          </button>

          <button
            onClick={() => setActiveTab('add-product')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'add-product'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Product</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & Stock ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'supabase'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Cloud Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store & Password</span>
          </button>
        </div>
      </div>

      {/* Main Admin Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* Tab 1: AI Garment Slicer */}
        {activeTab === 'slicer' && (
          <RawGarmentSlicer
            onPublishProducts={(newProds) => {
              onBulkAddProducts(newProds);
            }}
            onExitToStore={onExitToStore}
          />
        )}

        {/* Tab 2: Add Single Product (Direct Photo Upload, No link required) */}
        {activeTab === 'add-product' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="font-serif text-2xl font-semibold text-zinc-100">
                Add New Ready Garment
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Upload garment photos straight from your camera or files. No image URLs needed.
              </p>
            </div>

            {productSavedAlert && (
              <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Garment created successfully and published to live catalog!</span>
              </div>
            )}

            {productFormError && (
              <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{productFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-6">
              {/* Direct Image Dropzone / Upload (Single & Multi-angle) */}
              <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-zinc-800">
                <ProductImageUploader
                  images={uploadedImages}
                  onChangeImages={setUploadedImages}
                  hangingImageUrl={uploadedHangingUrl}
                  onChangeHangingImage={setUploadedHangingUrl}
                  category={category}
                  color={color}
                  colorHex={colorHex}
                  fabric={fabric}
                />
              </div>

              {/* Garment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Garment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Oxford Pure Cotton Shirt"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Shirts">Shirts</option>
                    <option value="Kurtas & Ethnic">Kurtas & Ethnic</option>
                    <option value="Jackets & Blazers">Jackets & Blazers</option>
                    <option value="Trousers & Pants">Trousers & Pants</option>
                    <option value="Festive & Wedding">Festive & Wedding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Original Price (Optional strikethrough)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Fabric Composition
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. 100% Pure Linen, Silk Blend"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Color Name & Color Swatch
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Navy Blue, Mint Green"
                      className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Fit Specification
                  </label>
                  <input
                    type="text"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    placeholder="e.g. Modern Slim Fit, Relaxed Fit"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Available Sizes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="38 (S), 40 (M), 42 (L), 44 (XL)"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Product to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-zinc-100">
                  Garments Catalog & Stock
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage availability, inspect photos, and remove discontinued pieces.
                </p>
              </div>

              {/* Quick Search in Inventory */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter stock..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Inventory Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex gap-4 items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.hangingImageUrl || product.images[0]}
                      alt={product.title}
                      className="w-16 h-20 object-cover rounded-lg bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                        {product.category} · {product.sku}
                      </span>
                      <h4 className="font-medium text-xs sm:text-sm text-zinc-100 truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs text-zinc-400 font-bold mt-0.5">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            product.inStock
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        {product.hangingImageUrl && (
                          <span className="text-[10px] text-zinc-400">🪝 Hanger</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onToggleStock(product.id)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                    >
                      {product.inStock ? 'Mark Sold Out' : 'Mark In Stock'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${product.title}" from catalog?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 rounded transition-colors cursor-pointer"
                      title="Delete garment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Supabase Cloud Database */}
        {activeTab === 'supabase' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="font-serif text-2xl font-semibold text-zinc-100">
                  Supabase Cloud Storage & Database
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Connect your free Supabase PostgreSQL database to store products, stock, and garment photos persistently across all devices and on Vercel.
              </p>
            </div>

            {/* Connection Status Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    {isSupabaseConfigured() ? 'Supabase Credentials Configured' : 'Local Storage Mode'}
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {isSupabaseConfigured()
                    ? 'Your app will automatically synchronize products and images with Supabase.'
                    : 'Currently using local browser storage. Add your Supabase project keys below to enable cloud persistence.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseOnly}
                  disabled={testingSupabase || !supabaseUrl || !supabaseAnonKey}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={syncingSupabase || !isSupabaseConfigured()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {syncingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  <span>Sync Catalog to Cloud</span>
                </button>
              </div>
            </div>

            {/* Test Status feedback message */}
            {supabaseStatus.tested && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                  supabaseStatus.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                }`}
              >
                {supabaseStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{supabaseStatus.message}</p>
                  {supabaseStatus.count !== undefined && (
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Current products in Supabase table: {supabaseStatus.count}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Configuration Form */}
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 bg-zinc-900/60 p-5 rounded-xl border border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Found in your Supabase dashboard under: Project Settings → API → Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1">
                  Supabase Anon (Public) Key *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Found in your Supabase dashboard under: Project Settings → API → Project API Keys → `anon public`
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  disabled={testingSupabase}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Test Credentials</span>
                </button>
              </div>
            </form>

            {/* SQL Migration Script Helper */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>SQL Setup Schema (Ready for 1-Click Run)</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                We have generated a complete, pre-tested database schema in your project root at <code className="text-amber-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">supabase_schema.sql</code>. Copy and paste it in your Supabase SQL Editor to automatically create:
              </p>
              <ul className="text-xs text-zinc-400 list-disc list-inside space-y-1">
                <li><strong className="text-zinc-200">products</strong> table with pricing, colors, sizes, and images</li>
                <li><strong className="text-zinc-200">store_settings</strong> table for store telephone and announcements</li>
                <li><strong className="text-zinc-200">garment-images</strong> storage bucket for instant high-speed photo CDN</li>
                <li>Secure Row Level Security (RLS) policies for instant public reading and admin writing</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 5: Store & Password Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="font-serif text-2xl font-semibold text-zinc-100">
                Storefront & Security Settings
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure your WhatsApp contact number and manage your Admin Security Password.
              </p>
            </div>

            {/* Admin Security Password Card */}
            <div className="p-5 rounded-xl bg-zinc-900/80 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Admin Password Protection</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Protect your catalog admin area from unauthorized customer access. Default password is <code className="text-amber-300 font-mono">jsb2025</code>.
              </p>

              {passwordNotice && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    passwordNotice.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {passwordNotice.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordNotice.msg}</span>
                </div>
              )}

              <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Current Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password..."
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 4 characters..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Storefront Details Form */}
            {settingsSavedAlert && (
              <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Store settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  WhatsApp Business Number (With Country Code, No spaces or symbols) *
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.whatsappNumber}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, whatsappNumber: e.target.value })
                  }
                  placeholder="e.g. 919876543210"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Every product card's "Enquire on WhatsApp" button will instantly open a chat to this number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Display Phone Number (Formatted for visitors)
                </label>
                <input
                  type="text"
                  value={tempSettings.displayPhone}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, displayPhone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Shop Address
                </label>
                <input
                  type="text"
                  value={tempSettings.address}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  City & Pin Code
                </label>
                <input
                  type="text"
                  value={tempSettings.city}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, city: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Announcement Bar Notice
                </label>
                <input
                  type="text"
                  value={tempSettings.announcement}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, announcement: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Storefront Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
