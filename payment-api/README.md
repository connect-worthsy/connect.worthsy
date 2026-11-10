# WORTHSY Razorpay API

This service replaces the Vercel serverless payment endpoints with a small Node.js HTTP API.

## Deploy on Render

- Create a **Web Service** connected to `connect-worthsy/connect.worthsy`.
- Set **Root Directory** to `payment-api`.
- Runtime: Node.
- Build command: `npm install`.
- Start command: `npm start`.
- Use a paid always-on instance for live checkout. Render's free instances sleep after 15 minutes and can take about a minute to wake up.
- Add these environment variables in the host dashboard (never commit them):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`

After deployment, verify `https://YOUR-SERVICE.onrender.com/health` returns `{"ok":true,"service":"worthsy-payment-api"}`.

## Frontend connection

Set the storefront's `STORE.paymentApiBase` to the deployed service origin (for example, `https://YOUR-SERVICE.onrender.com`). The frontend calls:

- `POST /create-order`
- `POST /verify-payment`

Allowed browser origins are restricted to `https://worthsy.in` and `https://www.worthsy.in`.

Do not delete the existing Vercel deployment until the new service has passed a real Razorpay test payment and verification.
