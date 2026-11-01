# JSB SONS - Luxury Ready Garments Online Store & Catalog

A production-grade, ultra-responsive catalog website and store management platform built for **JSB SONS Ready Garments**.

---

## 🌟 Key Features

1. **Luxury Customer Storefront**:
   - Ultra-smooth responsive mobile-first UI with dark palette and gold accents.
   - 1-Tap **WhatsApp Enquiry** on every product card with pre-filled SKU, size, and pricing.
   - **Direct Social Share Button** with native mobile sharing dialog (`navigator.share`) and 1-tap clipboard copy deep linking (`?item=SKU`).
   - Interactive **Full Studio Hanging Garment Mode** displaying clothes on luxury wooden hangers.
   - **Enquiry Bag Drawer** for bundling multiple garments into a single unified WhatsApp enquiry message.
   - Responsive category filters, color filtering, and instant search.

2. **Owner Admin Dashboard**:
   - **Password-Protected Gate**: Access requires owner admin password configured securely via environment settings.
   - **Direct Photo Upload**: Upload photos directly from phone camera or computer files (no image URLs needed).
   - **Multi-Garment AI Slicer**: Upload a single photo containing 5–6 garments, and Gemini AI will automatically detect, crop, categorize, and render each garment piece on a wooden hanger.
   - **Inventory Management**: Edit product details and photos, instant stock toggling (In Stock / Sold Out), real-time pricing updates, and product deletion.
   - **Automated Cloud Database Sync**: Built-in integration with Supabase PostgreSQL and Realtime WebSockets for zero-configuration persistent storage and image CDN across all customer devices.

---

## 🚀 How to Deploy on GitHub & Vercel

### Step 1: Push Project to GitHub

Run these commands in your project terminal:

```bash
git init
git add .
git commit -m "Initial commit of JSB SONS garments store"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

---

### Step 2: Set Up Supabase Database

1. Sign up or log into [Supabase](https://supabase.com/).
2. Create a new project (e.g., `jsb-sons-store`).
3. Open the **SQL Editor** in your Supabase dashboard.
4. Copy the entire contents of `supabase_schema.sql` (found in the root directory of this project) and click **RUN**.
   - This creates the `products` table, `store_settings` table, `garment-images` storage bucket, and secure RLS policies.
5. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys → `anon public`**

---

### Step 3: Deploy to Vercel

1. Log into [Vercel](https://vercel.com/) and click **Add New → Project**.
2. Import your GitHub repository (`YOUR_REPOSITORY_NAME`).
3. In the **Environment Variables** section, add the following variables:

| Variable Name | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for AI Garment Separation & Hanger Generation | *(Your Gemini API Key from Google AI Studio)* |
| `SUPABASE_URL` | Supabase Project URL used by the shared runtime config endpoint | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Anon Key used by the shared runtime config endpoint | `******` |
| `VITE_SUPABASE_URL` | Supabase Project URL for static Vite builds | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anon Key for static Vite builds | `******` |
| `VITE_ADMIN_PASSWORD` | Admin Dashboard Security Password | *(Your secure password)* |

4. Click **Deploy**. Vercel will build the Vite SPA and deploy it globally on high-speed CDN. The `/api/config` serverless endpoint reads the shared `SUPABASE_URL` and `SUPABASE_ANON_KEY` values, so every device uses the same database.

---

## 🔑 Admin Dashboard Access

- Scroll to the bottom of the homepage (footer) and click **Open Admin Dashboard**.
- Enter your configured admin password.
- In the **Store & Password** tab, you can update your admin password at any time.
- In the **Cloud Database** tab, you can inspect live database connection status, total garment count, and realtime sync health. All catalog updates and stock changes are automatically synchronized to Supabase in real-time.
