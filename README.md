# 🧠 The Mind Upgrade (`themindupgrade.in`)

> **"Level Up Your Mind, One Idea at a Time"**

A modern, responsive, and ultra-sleek blog application built with Next.js 14+ (App Router), Tailwind CSS, TypeScript, and TipTap Rich Text Editor. Built specifically for high-leverage knowledge sharing, cognitive growth, and personal development.

---

## ✨ Features

- 🎨 **Modern Dark/Light Mode Theme:** Tailored HSL colors, deep indigo gradients, cyan accents, and glassmorphism.
- 📱 **Fully Responsive:** Mobile-first layout with smooth micro-animations.
- 🚀 **6 Pre-Populated Sample Articles:** Across Productivity, Mindset, Technology, Health, Finance, and Self-Growth.
- 📂 **Categories & Taxonomy Page:** Large interactive cards with post count badges.
- 📅 **Chronological Archive Page:** Grouped accordions by month & year.
- 📖 **Rich Article Detail Page:** 
  - Auto-generated Table of Contents (TOC) with jump links
  - Reading time calculator & view counters
  - Interactive Like counter & Bookmark manager (persisted in `localStorage`)
  - One-click social share buttons (WhatsApp, Twitter/X, LinkedIn, Copy Link)
  - Related posts recommendations
  - Interactive discussion & comments system
- 🛡️ **Protected Admin Panel (`/admin`):**
  - Passcode protection (Default: `admin123`)
  - Metrics Dashboard (Total Posts, Published, Drafts, Total Reads)
  - Post Table with search, category filtering, status toggle, delete modal
- ✏️ **TipTap Rich Text Editor (`/admin/new` & `/admin/edit/[id]`):**
  - Formatting toolbar (Bold, Italic, Underline, Strikethrough, H1-H3, Lists, Blockquotes, Code blocks, Alignment)
  - Image upload handler (saves to `/public/uploads/`) with preview
  - Auto-slug generator, tag manager, featured article pin toggle
- 🔍 **Fuzzy Client-Side Search:** Powered by Fuse.js modal.
- 🎯 **SEO Ready:** OpenGraph tags, Twitter Cards, `sitemap.xml`, `robots.txt`, and JSON-LD `BlogPosting` schema.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS v4 + Vanilla CSS Variables
- **Icons:** Lucide React (`lucide-react`)
- **Editor:** TipTap (`@tiptap/react`, `@tiptap/starter-kit`)
- **Search:** Fuse.js (`fuse.js`)
- **Types:** TypeScript

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js 18+ installed on your system.

### 2. Installation
```bash
git clone https://github.com/your-repo/themindupgrade.git
cd themindupgrade
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Optional: Change your admin password in `.env.local`:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to `themindupgrade.in`

### Option 1: Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set Environment Variables (`NEXT_PUBLIC_ADMIN_PASSWORD`).
5. Click **Deploy**.
6. Go to **Project Settings -> Domains**, and add `themindupgrade.in` & `www.themindupgrade.in`.
7. Configure your domain DNS at your registrar (Hostinger / GoDaddy / Namecheap):
   - `A` Record: `@` pointing to `76.76.21.21`
   - `CNAME` Record: `www` pointing to `cname.vercel-dns.com`

---

### Option 2: Netlify
1. Connect your repository on [Netlify](https://netlify.com).
2. Set build command: `npm run build` and publish directory: `.next`.
3. Add custom domain `themindupgrade.in` in Netlify Domain Management.

---

### Option 3: Hostinger or cPanel Hosting (Node.js App)
1. In cPanel/Hostinger, create a new **Node.js Web App** pointing to Node 18 or 20.
2. Upload project files (or clone via Git).
3. Run `npm install` and `npm run build`.
4. Set Application Startup File to `node_modules/next/dist/bin/next` with argument `start`.
5. Point `themindupgrade.in` document root to the Node application.

---

### Option 4: Static Export (For Shared Hosting without Node.js)
If hosting on basic cPanel shared hosting without Node server support:
1. Update `next.config.ts`:
   ```ts
   const nextConfig = {
     output: 'export',
   };
   export default nextConfig;
   ```
2. Run `npm run build`. This generates an `out/` directory with static HTML, CSS, and JS files.
3. Upload the contents of `out/` directly to your `public_html/` folder in cPanel.

---

## 🔑 Admin Credentials

- **Admin Login Route:** `/admin`
- **Default Password:** `admin123`

---

## 📄 License

MIT License © 2026 [The Mind Upgrade](https://themindupgrade.in).
