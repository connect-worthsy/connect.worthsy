# WORTHSY

Static shop-guide site. No build step, no dependencies.

## Pages
| File | Purpose |
|---|---|
| `index.html` | Home |
| `shop.html` | Shop picks (PS5, GTA VI, trending, categories) |
| `deals.html` | Live price drops |
| `reviews.html` | Product reviews |
| `compare.html` | Comparison table |
| `about.html` | About + how we make money |
| `contact.html` | Contact form |
| `privacy.html` | Privacy & affiliate disclosure |

## Shared assets
- `assets/app.css` — app shell (sidebar + dual scroll areas) and all components
- `assets/app.js` — theme toggle, sidebar collapse, mobile drawer, auto nav highlight

## Editing a page
Every page shares the same `<aside class="sidebar">` block. To add a nav link,
edit the sidebar in **all** HTML files (or move it to a small JS include).
The active item is set automatically by `app.js` from the current filename,
and the breadcrumb comes from `<body data-page="...">`.

## Deploying to GitHub Pages
1. Create a repo and push these files to the default branch (`main`).
2. Repo → **Settings → Pages**.
3. Source: **Deploy from a branch** → `main` → `/ (root)` → **Save**.
4. Wait ~1 minute, then visit `https://<username>.github.io/<repo>/`.
5. For `worthsy.in`, add a `CNAME` file containing `worthsy.in`,
   then point an `A` record at GitHub Pages' IPs and a `CNAME` for `www`.

## Before going live
- [ ] Replace the red **W** mark with your real logo
- [ ] Swap placeholder copy on index/deals/reviews/compare/about/privacy
- [ ] Wire the contact form to a real endpoint (Formspree, Netlify, etc.)
- [ ] Replace `href="#"` affiliate links with real tracking URLs