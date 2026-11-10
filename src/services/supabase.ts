import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, StoreSettings } from '../types';

// In-memory credentials fetched from server or environment
let runtimeUrl = '';
let runtimeKey = '';

/**
 * Returns current Supabase URL and Anon Key from env vars or runtime server config
 */
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = (runtimeUrl || envUrl || '').trim();
  const key = (runtimeKey || envKey || '').trim();

  return { url, key };
}

/**
 * Automatically fetch public Supabase credentials from backend /api/config
 * so all connected devices (phones, laptops, customers) connect to the shared database
 */
export async function initSupabaseConfig(): Promise<boolean> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (
        typeof data.supabaseUrl === 'string' &&
        typeof data.supabaseAnonKey === 'string' &&
        data.supabaseUrl.trim() &&
        data.supabaseAnonKey.trim()
      ) {
        runtimeUrl = data.supabaseUrl.trim();
        runtimeKey = data.supabaseAnonKey.trim();
        cachedClient = null;
        lastUsedUrl = '';
        lastUsedKey = '';
        return isSupabaseConfigured();
      }
    }
  } catch {
    // Static hosts may not provide the optional runtime endpoint.
  }

  return isSupabaseConfigured();
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key || !url.startsWith('http') || url.includes('your-project-id')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project-id'));
}

/**
 * Tests connection to the Supabase instance
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; count?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing in the system environment (.env).',
    };
  }

  try {
    const { data, error, count } = await client
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but the "products" table was not found. Please run the supabase_schema.sql script in your SQL Editor.',
        };
      }
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase PostgreSQL database!',
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unable to connect to Supabase server.',
    };
  }
}

/**
 * Real-time subscription to products table changes.
 * Whenever admin adds, edits stock, or deletes any garment,
 * this triggers an instant update across ALL customer devices and screens.
 */
export function subscribeToProductChanges(onUpdate: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime:products-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Real-time subscription to store settings (WhatsApp number, announcement notice).
 */
export function subscribeToStoreSettingsChanges(onUpdate: (settings: StoreSettings) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime:settings-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings' },
      (payload) => {
        if (payload.new && (payload.new as any).config) {
          onUpdate((payload.new as any).config);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Fetch all active garments from Supabase products table
 */
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): Product => ({
      id: row.id,
      sku: row.sku || `JSB-${row.id.slice(0, 6)}`,
      title: row.title,
      subtitle: row.subtitle,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      color: row.color || 'Standard',
      colorHex: row.color_hex || '#333333',
      fabric: row.fabric || 'Premium Blend',
      fit: row.fit || 'Regular Fit',
      sizes: Array.isArray(row.sizes) ? row.sizes : (typeof row.sizes === 'string' ? JSON.parse(row.sizes) : ['M', 'L', 'XL']),
      images: Array.isArray(row.images) ? row.images : (typeof row.images === 'string' ? JSON.parse(row.images) : [row.image_url || '']),
      hangingImageUrl: row.hanging_image_url || undefined,
      displayMode: row.display_mode || 'hanging',
      collarStyle: row.collar_style || undefined,
      sleeveStyle: row.sleeve_style || undefined,
      description: row.description || '',
      inStock: row.in_stock !== false,
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at || new Date().toISOString(),
      sourceType: row.source_type || 'manual',
    }));
  } catch (err) {
    console.error('Failed to load products from Supabase:', err);
    return null;
  }
}

/**
 * If Supabase is connected but products table is completely empty,
 * automatically seed the catalog so all users immediately share the initial products.
 */
export async function seedInitialProductsIfEmpty(initialProducts: Product[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { count, error } = await client
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error || (count !== null && count > 0)) {
      return false; // Table not empty or error
    }

    const res = await bulkSyncProductsToSupabase(initialProducts);
    return res.count > 0;
  } catch {
    return false;
  }
}

/**
 * Insert or update a product in Supabase
 */
export async function saveProductToSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not initialized' };

  try {
    const row = {
      id: product.id,
      sku: product.sku,
      title: product.title,
      subtitle: product.subtitle || null,
      category: product.category,
      price: product.price,
      original_price: product.originalPrice || null,
      color: product.color,
      color_hex: product.colorHex,
      fabric: product.fabric,
      fit: product.fit,
      sizes: product.sizes,
      images: product.images,
      hanging_image_url: product.hangingImageUrl || null,
      display_mode: product.displayMode || 'hanging',
      collar_style: product.collarStyle || null,
      sleeve_style: product.sleeveStyle || null,
      description: product.description,
      in_stock: product.inStock,
      is_featured: product.isFeatured || false,
      created_at: product.createdAt,
      source_type: product.sourceType || 'manual',
    };

    const { error } = await client.from('products').upsert(row, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save product in Supabase' };
  }
}

/**
 * Delete a product by ID from Supabase
 */
export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('products').delete().eq('id', id);
    if (error) {
      console.warn('Failed to delete product from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete product error:', err);
    return false;
  }
}

/**
 * Toggle or update stock status in Supabase
 */
export async function updateProductStockInSupabase(id: string, inStock: boolean): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('products')
      .update({ in_stock: inStock })
      .eq('id', id);

    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Make one product the featured product shown first in the storefront.
 */
export async function setFeaturedProductInSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error: clearError } = await client
      .from('products')
      .update({ is_featured: false })
      .eq('is_featured', true);

    if (clearError) {
      console.error('Failed to clear the existing featured product:', clearError.message);
      return false;
    }

    const { error: featureError } = await client
      .from('products')
      .update({ is_featured: true })
      .eq('id', id);

    if (featureError) {
      console.error('Failed to set the featured product:', featureError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Featured product update error:', err);
    return false;
  }
}

/**
 * Upload an image file or blob to Supabase storage bucket 'garment-images'
 */
export async function uploadImageToSupabase(
  fileOrBlob: Blob | File,
  suggestedName = `garment-${Date.now()}.jpg`
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const fileName = `${Date.now()}-${suggestedName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('garment-images')
      .upload(filePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = client.storage.from('garment-images').getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Image upload failed' };
  }
}

/**
 * Bulk sync list of products to Supabase (e.g. from AI Garment Slicer)
 */
export async function bulkSyncProductsToSupabase(products: Product[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: 'Supabase client not configured' };

  try {
    const rows = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      title: p.title,
      subtitle: p.subtitle || null,
      category: p.category,
      price: p.price,
      original_price: p.originalPrice || null,
      color: p.color,
      color_hex: p.colorHex,
      fabric: p.fabric,
      fit: p.fit,
      sizes: p.sizes,
      images: p.images,
      hanging_image_url: p.hangingImageUrl || null,
      display_mode: p.displayMode || 'hanging',
      collar_style: p.collarStyle || null,
      sleeve_style: p.sleeveStyle || null,
      description: p.description,
      in_stock: p.inStock,
      is_featured: p.isFeatured || false,
      created_at: p.createdAt,
      source_type: p.sourceType || 'manual',
    }));

    const { error } = await client.from('products').upsert(rows, { onConflict: 'id' });

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: rows.length };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Sync failed' };
  }
}

/**
 * Store settings persistence
 */
export async function fetchStoreSettingsFromSupabase(): Promise<StoreSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('store_settings')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return null;
    return data.config as StoreSettings;
  } catch {
    return null;
  }
}

export async function saveStoreSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('store_settings').upsert(
      {
        id: 'default',
        config: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}
