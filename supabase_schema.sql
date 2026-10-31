-- ====================================================================
-- JSB SONS READY GARMENTS - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Create 'products' table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  color TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#333333',
  fabric TEXT NOT NULL,
  fit TEXT NOT NULL DEFAULT 'Regular Fit',
  sizes JSONB NOT NULL DEFAULT '["M", "L", "XL"]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  hanging_image_url TEXT,
  display_mode TEXT DEFAULT 'hanging',
  collar_style TEXT,
  sleeve_style TEXT,
  description TEXT DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  source_type TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on category, sku, and stock for ultra-fast query and search
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products (in_stock);

-- 2. Create 'store_settings' table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 4. Set Policies for Storefront and Admin
-- Allow anonymous public read access to active products
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Allow write/update/delete for products
DROP POLICY IF EXISTS "Allow product management" ON public.products;
CREATE POLICY "Allow product management"
  ON public.products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read of store settings
DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON public.store_settings;
CREATE POLICY "Store settings are viewable by everyone"
  ON public.store_settings
  FOR SELECT
  USING (true);

-- Allow updating store settings
DROP POLICY IF EXISTS "Allow store settings management" ON public.store_settings;
CREATE POLICY "Allow store settings management"
  ON public.store_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Create Storage Bucket for garment photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('garment-images', 'garment-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read of garment images
DROP POLICY IF EXISTS "Garment images public read" ON storage.objects;
CREATE POLICY "Garment images public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'garment-images');

-- Allow image upload to garment-images bucket
DROP POLICY IF EXISTS "Garment images upload" ON storage.objects;
CREATE POLICY "Garment images upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'garment-images');
