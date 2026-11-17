# दैनिक बुलंदसेना वृत्तपत्रिका (`bulandsena.in`)

Independent Marathi & English local journalism platform with a multi-column newspaper layout, real-time live updates, field video reports, daily Share Market & F&O desk (with automatic Indian Trading Holiday detection), third-party ad slots, newsletter subscriptions, and a Firebase-backed Editorial CMS.

## Project Structure

- `app/layout.tsx` — Root layout with Playfair Display, Plus Jakarta Sans, and Noto Sans Devanagari fonts
- `app/globals.css` — Editorial broadsheet styling and typography tokens
- `app/page.tsx` — Main multi-column newspaper front page, live dispatches, trending desk, video reports, share market desk, and footer
- `components/CmsDashboard.tsx` — Full Editorial CMS (Google Auth restricted to `dainikbulandsena@gmail.com`)
- `components/QuickColumnEditModal.tsx` — Instant column-number & floating green `+` uploader for News, Images, Live Updates, Videos, and Share Market calls
- `components/ShareMarketDesk.tsx` — Day-wise Shares, Option Trading (CE/PE) Strike Prices, Futures calls, and NSE/BSE Indian Trading Holiday detector
- `components/ArticleReaderModal.tsx` — Full bilingual article reader with drop caps, social sharing, and article footer ad space
- `components/AdSlotCard.tsx` — Sidebar (`300×250`) and Article Footer third-party ad placements
- `components/ShareBar.tsx` — WhatsApp, X, Facebook, and Copy Link sharing
- `components/StaticPagesModal.tsx` — About Us, Contact Us, Privacy Policy, Terms & Conditions, and Editorial Policy pages
- `lib/firebase.ts` — Firebase Firestore & Auth initialization
- `lib/types.ts` & `lib/seed-data.ts` — TypeScript models and bilingual editorial seed data
- `public/images/` — Editorial photography assets
- `public/CNAME` — Custom domain record (`bulandsena.in`)
- `firestore.rules` & `firebase-blueprint.json` — Hardened Firestore security rules and schema blueprint

## Deploying to GitHub & Publishing on `bulandsena.in`

1. **Export / Push to GitHub**:
   - Use the **Save to GitHub** / **Export** option in AI Studio, or initialize git locally:
     ```bash
     git init
     git add .
     git commit -m "Initial release of Dainik Bulandsena Vrittapatrika (bulandsena.in)"
     git branch -M main
     git remote add origin https://github.com/<your-username>/bulandsena.in.git
     git push -u origin main
     ```
2. **Deploy Publicly (Recommended: Vercel or Firebase App Hosting)**:
   - Connect your GitHub repository to **Vercel** (or **Firebase App Hosting** / **Cloud Run**).
   - Build command: `npm run build`
   - Output: Next.js App Router
3. **Connect Custom Domain (`bulandsena.in`)**:
   - In your hosting provider's Domain settings, add `bulandsena.in` and `www.bulandsena.in`.
   - Update your domain registrar DNS records (`A` record for `@` and `CNAME` for `www`) as shown in your hosting provider dashboard.
   - In **Firebase Console → Authentication → Settings → Authorized domains**, add `bulandsena.in` and `www.bulandsena.in` so Editor Google Sign-In works on your live domain.
