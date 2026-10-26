# WORTHSY Dropshipping Foundation

## Safety boundary
This feature is being developed separately from the existing affiliate site. The existing `index.html`, affiliate product data, affiliate tracking links, filters, sorting, Careers/About/Blog pages, and Apps Script workflows must remain unchanged.

## Current state
- `shop.html` is a standalone, responsive storefront preview using a restrained white/black/red visual style to fit WORTHSY.
- It links back to the existing WORTHSY site and affiliate section.
- It intentionally does not accept orders or payments.
- `dropshipping-products.json` starts empty: do not publish invented products, prices, inventory, images, or supplier promises.
- The cart is a non-commerce preview only. No checkout is simulated.

## Required before launch
1. Confirm target market and business details.
2. Select suitable hosting for a server-side API (GitHub Pages alone cannot securely run a backend).
3. Implement database tables for products, stock, orders, order items, customers, payment events, and fulfilment status.
4. Add authenticated admin access and server-side input validation.
5. Choose a payment provider and configure secrets as hosting environment variables; never expose private keys in frontend files.
6. Select suppliers who explicitly support dropshipping and confirm shipping, returns, tracking, and stock-sync workflows.
7. Implement signed payment webhooks, idempotent order creation, refund handling, privacy/retention rules, and order notifications.
8. Test sandbox payments and end-to-end fulfilment before enabling production checkout.

## Proposed architecture
- Static storefront: `shop.html` and `dropshipping-products.json`
- API/backend: separate server-side service, deployed to suitable hosting
- Database: managed relational database
- Payments: approved payment gateway, with webhook verification on the backend
- Fulfilment: supplier or shipping API, only after credentials and service terms are confirmed

## Integration rule
Only add a link to the live main-site navigation after the owner reviews this preview and the store hosting plan is ready. Do not replace or refactor existing affiliate code as part of this feature.
