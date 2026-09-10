# My Shop

A complete online shop: a client-facing storefront and a professional admin dashboard where
everything — products, prices, images, copy, colours, delivery fees, payment methods and the
administrator list — is editable without touching code.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4** on **Firebase** (Auth, Firestore,
Storage, Hosting).

---

## What is in the box

### Storefront (`/`)

| Page | Route | What it does |
| --- | --- | --- |
| Home | `/` | Rotating hero, trust badges, category tiles, featured / new / best-seller rows, two promo banners, testimonials, newsletter. Every block can be reordered, re-worded or switched off from the dashboard. |
| Shop | `/shop` | Search, category filter, price slider, on-sale / in-stock filters, five sort orders. |
| Product | `/product/:slug` | Gallery, variants (size, colour…), stock state, quantity picker, add-to-bag, buy-now, related products. |
| Categories | `/categories` | Every category with a live product count. |
| Bag & checkout | `/cart`, `/checkout` | Persistent cart, free-delivery progress bar, discount codes, delivery + tax maths, guest checkout. |
| Order confirmation | `/order/:id` | Printable receipt with the order reference. |
| About / Contact | `/about`, `/contact` | Contact form writing straight into the dashboard inbox, plus an optional embedded map. |

### Dashboard (`/admin`)

| Screen | What an administrator can do |
| --- | --- |
| **Dashboard** | Revenue, orders, products and customers at a glance, a 14-day sales chart, low-stock and unread-message alerts. |
| **Products** | Create, edit, duplicate, publish, archive and delete. Images by drag-and-drop upload or URL, variants, tags, cost/margin, stock, home-page placement. Bulk publish / feature / delete. |
| **Categories** | Create, edit, reorder, feature, delete. Renaming a category updates every product that uses it. |
| **Inventory** | Spreadsheet-style stock editing across the whole catalogue, saved in one batch. |
| **Orders** | Live order feed, full detail drawer, status and payment changes, internal notes, CSV export. Confirming an order subtracts its items from stock. |
| **Customers** | Everyone who ever ordered, with lifetime spend, VIP flag and CSV export. Newsletter list included. |
| **Discounts** | Percentage or fixed-amount codes with minimum spend, usage limit and expiry. |
| **Inbox** | Messages from the contact form, read state, one-click reply. |
| **Home builder** | Reorder or hide any home-page section; edit every headline, image and button on the page. |
| **Store settings** | Name, logo, currency, brand colours, corner radius, typeface, announcement bar, delivery fees, tax, payment methods, contact details, social links, footer columns, SEO and maintenance mode. |
| **Team & access** | Add any Google account as an administrator, set their role, suspend or remove them, and read the audit trail. |

---

## Access model

* Sign-in is **Google only** — no passwords are ever stored or shared.
* The bootstrap owner is **`techubwenge@gmail.com`**. On its first sign-in the account is created
  automatically, so the dashboard works against a completely empty database.
* The owner can grant access to any other Google account from **Dashboard → Team & access**. That
  person then just clicks *Continue with Google* and they are in.
* Roles: `owner` (everything, including managing the team), `admin` (everything except the team),
  `staff` (day-to-day work). The bootstrap owner can never be suspended or deleted, so the shop
  cannot be locked out.
* The same rules are enforced server-side in `firestore.rules` and `storage.rules`, not just in the
  UI.

---

## Running it locally

```bash
npm install
cp .env.example .env      # already filled in with the my-shop-84749 project
npm run dev               # http://localhost:3000
```

Other scripts:

```bash
npm run lint              # TypeScript type-check
npm run build             # production build into dist/
npm run preview           # serve the production build
```

Starting from an empty catalogue? Open **Dashboard → Products** and press
**Load demo catalogue** for eight sample products across four categories, then edit or delete them.

---

## Firebase setup (one time)

1. **Authentication → Sign-in method** → enable **Google**.
2. **Authentication → Settings → Authorised domains** → add the domain you deploy to
   (`localhost` is allowed by default).
3. **Firestore Database** → create the database in production mode.
4. **Storage** → create the default bucket (needed for image uploads).
5. Deploy the rules that ship with this repo:

   ```bash
   npx firebase-tools deploy --only firestore:rules,storage --project my-shop-84749
   ```

6. Sign in at `/admin` with `techubwenge@gmail.com` — the owner record is created for you.

> The Firebase web keys in `.env.example` are public client identifiers, not secrets. Access is
> controlled entirely by the security rules in this repository.

---

## GitHub environment configuration

`.github/workflows/deploy.yml` builds on every push to `main` and reads its configuration from the
**`production`** GitHub Environment.

Create it under **Settings → Environments → New environment → `production`**, then add these
**environment secrets**:

| Secret | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyCRD4Lni_kp2ndrcjxQA_vPbhAFPvA2J-c` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `my-shop-84749.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `my-shop-84749` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `my-shop-84749.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `627398185087` |
| `VITE_FIREBASE_APP_ID` | `1:627398185087:web:182804c7a7ee2aaee16f4a` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-2HHKEENZ84` |
| `VITE_OWNER_EMAIL` | `techubwenge@gmail.com` |
| `FIREBASE_SERVICE_ACCOUNT` | *(optional)* the JSON key of a service account with the **Firebase Hosting Admin** role — deployment is skipped until this exists |

---

## Troubleshooting

**`Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key)`**

The build was handed a *blank* `VITE_FIREBASE_API_KEY`. This happens when a CI job references a
secret that has not been created yet — GitHub substitutes an empty string, not nothing at all.

The app now treats a blank value as "not set" and falls back to the committed project config, so
this should no longer break the site. If you still see it, the key itself is wrong: check
**Firebase console → Project settings → General → Your apps → SDK setup and configuration**, and
make sure the value starts with `AIza`.

**Still seeing `auth/invalid-api-key` after a fix?** You are almost certainly looking at an old
bundle. Check which build is live before debugging anything else:

```js
// in the browser console, on the deployed site
window.myShopBuild        // → "7ffe625 · 2026-09-10 09:21Z"
```

The same string is printed to the console on load and shown in small type at the bottom of
`/admin`. If the commit does not match what you deployed, the site was not rebuilt — or the browser
is holding a cached `index.html`. Force a clean reload with **Ctrl/Cmd + Shift + R**, or open the
site in a private window.

Asset filenames are content-hashed (`index-Dba53Z7g.js`), so identical filenames across two page
loads means identical code. Different code can never produce the same filename.

**`Uncaught (in promise) Error: Could not establish connection` / `localhost/getjson.php`**

Not your site — that is a browser extension talking to itself. Confirm by opening the shop in an
incognito window with extensions disabled.

**`auth/unauthorized-domain` when signing in**

Add the domain you are serving from under **Firebase console → Authentication → Settings →
Authorised domains**.

---

## Data model

| Collection | Purpose | Who can read | Who can write |
| --- | --- | --- | --- |
| `products` | The catalogue | everyone | admins |
| `categories` | Product groups | everyone | admins |
| `settings/store` | The entire storefront configuration | everyone | admins |
| `coupons` | Discount codes | everyone | admins |
| `orders` | Placed orders | admins, and the buyer if signed in | anyone may create; admins may change |
| `customers` | Contact details captured at checkout | admins | upserted at checkout |
| `messages` | Contact-form inbox | admins | anyone may create |
| `subscribers` | Newsletter e-mails | admins | anyone may create |
| `admins/{email}` | The administrator roster | admins (and your own record) | owners only |
| `activity` | Audit trail | admins | admins |

---

## Project layout

```
src/
  components/     Navbar, Footer, ProductCard, CartDrawer, HomeSections, ImageInput, ui primitives
  context/        Auth, Store (settings + catalogue), Cart, Toast
  hooks/          useAdminData (one set of dashboard listeners), useSettingsDraft
  lib/            firebase, types, defaults, utils, upload, activity
  pages/          Storefront pages
  pages/admin/    Dashboard screens
  data/seed.ts    Optional demo catalogue
```

The dashboard is code-split — a shopper never downloads it.
