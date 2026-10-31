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
   - **Password-Protected Gate**: Access requires admin password (default: `jsb2025`, customizable anytime in Store Settings).
   - **Direct Photo Upload**: Upload photos directly from phone camera or computer files (no image URLs needed).
   - **Multi-Garment AI Slicer**: Upload a single photo containing 5–6 garments, and Gemini AI will automatically detect, crop, categorize, and render each garment piece on a wooden hanger.
   - **Inventory Management**: Instant stock toggling (In Stock / Sold Out), real-time pricing updates, and product deletion.
   - **Supabase Cloud Sync**: Live connection to Supabase PostgreSQL database for persistent storage and image CDN across devices.

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

| Variable Name | Description | Example / Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for AI Garment Separation & Hanger Generation | *(Your Gemini API Key from Google AI Studio)* |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJhbGciOi...` |
| `VITE_ADMIN_PASSWORD` | Admin Dashboard Security Password | `jsb2025` |

4. Click **Deploy**. Vercel will build the Vite SPA and deploy it globally on high-speed CDN.

---

## 🔑 Admin Dashboard Access

- Scroll to the bottom of the homepage (footer) and click **Open Admin Dashboard**.
- Enter the default security password: **`jsb2025`**.
- In the **Store & Password** tab, you can change the admin password at any time.
- In the **Supabase Cloud Storage** tab, you can test your database connection and click **Sync Catalog to Cloud** to push all initial garments into Supabase!
