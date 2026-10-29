# БудЕксперт

React + Vite, Express 4, MongoDB. Node.js **22.12+** (22 LTS recommended).

## Local setup

```sh
npm ci
npm ci --prefix server
npm ci --prefix client
```

For a new installation, copy `server/.env.example` to `server/.env` and fill the required settings. Do not overwrite an existing `.env`. Use a local/development MongoDB database; never run development or test tools with production credentials. Generate a JWT secret with `openssl rand -hex 32` and set a unique admin password of at least 12 characters. Missing or weak admin credentials stop startup in every environment.

```sh
npm run dev
```

Frontend: http://localhost:5173; API: http://localhost:5001/api. The Vite development server proxies `/api` and `/uploads`. Production HTML and SEO routes are served by Express, not by Vite preview.

## Checks

Start a dedicated MongoDB instance, then use the explicitly isolated test database:

```sh
MONGO_URI=mongodb://127.0.0.1:27018/budexpert_test npm run check
```

`check` runs unit checks, builds the client, runs browser checks and then API checks. Install the browser once with `npx playwright install chromium`. Test and seed scripts refuse remote databases or database names other than `budexpert_test`. Playwright always starts a fresh server, uses test-only admin credentials and disables Cloudinary/Nova Poshta credentials. Root package scripts no longer overwrite a caller's MongoDB port when seeding.

```sh
npm audit
npm audit --prefix server
npm audit --prefix client
```

## Deployment of this branch

**Production has not been changed.** Review this branch and validate it on staging first. The checked-in `render.yaml` is an optional full-stack blueprint with automatic deployment disabled.

1. Rotate the MongoDB credential that appeared in the repository's Git history. Deleting a literal from the latest commit does not revoke it. Set the new URI in the hosting secret store, review MongoDB access logs/network allowlists and invalidate the old credential. This requires access to the database/hosting account and cannot be completed by a source-code change. Do not rewrite shared Git history or force-push as part of this branch.
2. Configure `MONGO_URI`, `ADMIN_USER`, `ADMIN_PASS`, a new `ADMIN_JWT_SECRET`, `PUBLIC_BASE_URL=https://budexpert-if.pp.ua`, Cloudinary and optional Nova Poshta credentials in the hosting secret store. Check that `TEST_ENV` is unset and `NODE_ENV=production`. JWTs from the previous version are intentionally invalid; administrators must log in again. Keep all secrets out of Git.
3. Install both packages and run `npm run client:build`; run `npm run server:start` from the repository root. Express reads `client/dist` and serves HTML, static assets, API, robots, sitemap and merchant feed together.
4. The public domain must send **all page requests to Express**. A static-host rewrite to `index.html` would bypass server HTML, redirects and real 404 responses, so the old `_redirects` fallback was removed. If the current frontend host stays separate, configure it as a reverse proxy to the full-stack server, including page paths, `/api`, assets, robots and sitemap. Do not deploy only `client/dist` as a static SPA.
5. Set `TRUST_PROXY_HOPS` to the actual number of trusted proxy hops (Render normally uses one); leave it unset for direct local access. Configure `CORS_ORIGIN` and `CSP_CONNECT_ORIGINS` only if the browser uses a separate API origin. The production default is same-origin `/api`; remove any old `VITE_API_URL` build setting when using the full-stack setup.
6. The previous automatic deletion of a legacy category index at every server boot was removed. If an old database still has the unique `categories.name_1` index, use `node server/scripts/migrate-category-index.js` to inspect it, and `--apply` for the explicit migration after taking a backup. New databases get the compound `(parent, name)` index from the schema.
7. Smoke-test a product and a category with JavaScript disabled, a legacy product redirect, an unknown URL, admin login, Cloudinary upload and order creation. A product with `stock=0` must remain orderable. Check the final HTML's canonical URL and CSP headers on the public domain.
8. Submit `/sitemap.xml` to Google Search Console and inspect representative product/category URLs. Validate Product structured data in Google's Rich Results Test. Submit `/google-shopping.xml` to Merchant Center and review diagnostics. Search Console, Merchant Center, Google Business Profile and real-user Core Web Vitals require account access and are not configured by this branch.

## Behaviour and architecture

- Ordering with `stock=0` is deliberate. There is no stock rejection, reservation or automatic decrement.
- Order validation rejects empty/unknown items and invalid quantities, merges duplicate products, calculates discounts in integer kopiykas and saves item name/SKU/unit-price snapshots. The admin view uses these historical snapshots and never substitutes current catalog prices. For legacy orders with missing item prices, a single unknown unit price is recovered for display only when the saved subtotal determines it exactly to a kopiyka. Ambiguous prices are shown as unknown, inconsistent totals are flagged, and stored orders are never rewritten by this display logic.
- `shared/pricing.mjs` defines unit-price rounding for API, feed, product pages and carts. `server/services` holds order resolution, media cleanup and SEO; routers forward asynchronous errors through shared middleware.
- Product/category public pages contain server-generated content, canonical URLs, social metadata and structured data. React takes over the interactive UI; a common SEO component updates the head on navigation. `/p/:id` is canonical; `/products/:id` and legacy category paths redirect permanently. Unknown pages have HTTP 404 and noindex. Cart, checkout and admin are noindex but crawlable so crawlers can see that directive.
- Public rendering APIs remain crawlable and send `X-Robots-Tag: noindex`; robots rules do not block the catalog data needed by Google’s JavaScript renderer. Sitemap files are generated from current database records in batches of 1000 products. Merchant XML streams records and keeps original price separate from sale price. Canonical/feed URLs come from `PUBLIC_BASE_URL`, never request Host headers.
- Public catalog calls request bounded pages (maximum 100 products per request); legacy callers without page parameters receive at most 100 products as an array. The public catalog pages through the server; the admin loads its catalog in bounded batches. Admin and other routes are separate JavaScript chunks.
- Uploads decode actual raster data and re-encode WebP in memory; untrusted SVG/HTML is rejected and no temporary files remain on disk. GIF uploads become a static first frame. Historical local JPEG/PNG/WebP/GIF URLs remain available with restrictive headers; historical SVG uploads are blocked and should be replaced with raster images before release.
- Public Nominatim autocomplete was removed. Street names can be supplied with `STREET_SUGGESTIONS_FILE` (JSON string array); without it, users enter street addresses manually. No address fragments are sent to a geocoding provider.
- The large admin screen still contains its existing UI. CSV parsing and catalog fetching are separate modules; backend business logic and lazy route boundaries have been extracted without redesigning the admin workflow.

Backups should be stored with restricted access, outside the repository; periodically verify a restore into an isolated database. Production dumps and `.env` files are ignored. The source changes do not verify production database permissions, rotate hosted secrets or guarantee search rankings.
