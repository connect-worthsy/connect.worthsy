# WORTHSY 2.0 Smart Shopping (feature branch)

This is an additive guest-mode feature module; it does not alter existing page source files.

## Current module
- Guest wishlist, local-storage persistence
- Compare up to four catalogue products
- Recently viewed tracking (from clicks on recognised product cards)
- Keyword/category/budget finder (budget matching uses catalogue numeric price only)
- Curated/high-click picks (local click signal; not a verified deal feed)
- Product suggestions launch a mail draft (not remotely submitted)

## Activation
Include `worthsy2-smart-shopping.js` on the homepage after the product catalogue is available. This branch deliberately does not edit the large existing homepage file or auto-deploy. Test and merge the integration separately.

## Not implemented/verified yet
- Account synchronization
- Retailer API-based real price history, verified discounts and alerts
- Email/notification backend
- Community suggestions database and moderation
- Backend analytics (current counts are local guest counters only)
- Admin product editing / audits
- Jarvis integration
- PWA installation/service-worker/manifest
- Category pages, guides, brand comparisons, new-arrival feed
- Cross-page integration, accessibility/device/browser tests, live website validation

Do not label these as complete until connected to secure services and tested.
