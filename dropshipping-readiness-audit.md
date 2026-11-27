# WORTHSY Dropshipping Readiness Audit

Audit date: 2026-10-31

## Current storefront observations
- The storefront is a custom HTML/JavaScript application, not a Shopify or WooCommerce store.
- Product catalogue is loaded from `products.json`.
- Checkout creates an order object in the browser and submits it to a Google Apps Script endpoint.
- Online checkout calls a separate payment API for order creation and payment signature verification.
- The checkout uses `mode: "no-cors"` when submitting order details to Apps Script. A resolved fetch promise does not prove that Apps Script saved the order; the browser cannot inspect the response.
- Customer order history is also saved in local browser storage, which is not a central, reliable order database.
- Order tracking asks the Apps Script endpoint for the order, but falls back to browser-local order data.
- Store checkout and shipping copy are India-specific: INR pricing, Indian mobile validation, Indian pin-code validation, INR payment order creation, and India-only shipping text.
- A ₹1 payment test product is explicitly kept visible in the public product listing and should be removed/hidden before a production launch.
- Supplier fulfilment is not connected in the inspected storefront code. No supplier API, fulfilment credential, or webhook integration is present in the inspected checkout flow.

## Production blockers
1. **Server-side order persistence and acknowledgement:** The backend must confirm that an order was saved before the storefront displays a confirmed order. Use an authenticated backend or a correctly configured Apps Script response flow; do not rely on `no-cors`.
2. **Payment truth:** Mark an order paid only after server-side verification and/or a verified payment-provider webhook. Never trust the browser alone for payment state.
3. **Supplier selection and credentials:** Automatic fulfilment cannot be implemented generically. We need the selected supplier, API/integration method, shipping destinations, and authorized credentials stored server-side (never in public HTML).
4. **International checkout:** Current checkout validates Indian phone numbers and pin codes, prices in INR, and creates INR payment orders. Add destination-aware address validation, currency/price rules, shipping rates, delivery estimates, tax/customs disclosures, and a payment provider that supports the business and destination countries.
5. **Tracking and notifications:** Connect supplier/carrier tracking events to the order record and notify customers from a trusted backend.
6. **Admin dashboard security:** The operations dashboard must require authenticated staff access and must never expose customer PII, supplier credentials, or payment secrets publicly.
7. **Operational safeguards:** Idempotency/deduplication, inventory checks, fraud/failed-payment holds, retry queues, refund/cancellation handling, audit logs, and failure alerts are required before unattended fulfilment.

## Recommended implementation sequence
1. Stabilize and verify the order/payment pipeline on the existing website.
2. Add a private server-side order store and staff-only dashboard.
3. Connect one chosen supplier using its documented API or supported integration.
4. Add automatic fulfilment only for paid, in-stock, eligible orders; hold exceptions for review.
5. Add tracking synchronization, customer notifications, and reporting.
6. Complete international market configuration and compliance review before advertising internationally.
7. Run end-to-end tests in sandbox/staging, then launch gradually.

## Important limitation
This file is an audit/specification, not a claim that the listed integrations have been implemented. The website repository alone does not grant access to the private Apps Script project, spreadsheet, payment dashboard, hosting configuration, or supplier account. Secrets must not be committed to the repository.
