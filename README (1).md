# WORTHSY Python personalisation API

This service adds stateless catalogue search, recommendations, gift matching and product comparison.

## Privacy and data use

- The service reads only the public WORTHSY affiliate catalogue and sneaker catalogue.
- It does not save customer preferences, browsing events, names, email addresses or other personal data.
- The browser stores a customer's preferences, wishlist, recent activity and comparison selections locally on that device.
- The API accepts only the preference fields needed for a single request and returns recommendations; it does not persist the request.
- Outbound product destinations are restricted to valid WORTHSY Amazon India (worthsy0d-21) and Awin (a=3110404) affiliate URLs.

## Run locally

1. Create a Python virtual environment.
2. Install dependencies with: pip install -r personalization_api/requirements.txt
3. Run: uvicorn personalization_api.main:app --reload
4. Open http://127.0.0.1:8000/docs or http://127.0.0.1:8000/health

## Deploy on Render

The repository includes a Render Blueprint at render.yaml. In Render, choose New + → Blueprint, connect connect-worthsy/connect.worthsy, and deploy the worthsy-personalization-api service. After deployment, copy its HTTPS service URL into worthsy-personalization-config.js as apiBase and redeploy GitHub Pages.

No API key is needed. The WORTHSY site keeps a browser-side recommendation fallback until the API URL is configured.
