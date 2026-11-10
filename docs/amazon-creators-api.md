# WORTHSY Amazon Creators API automation

This workflow searches Amazon India using the official Creators API and adds new eligible products to the existing `products.json` catalogue.

## What it does

- Runs daily at 02:23 UTC (07:53 IST) and can also be started manually from GitHub Actions.
- Searches curated electronics, computing, accessories and home-tech keywords.
- Requests up to 10 highly rated, available, new items per keyword.
- Imports Amazon-returned product titles, brand, image, current offer price and the API-returned affiliate detail URL.
- Deduplicates by ASIN and preserves all existing catalogue entries.
- Rejects items whose affiliate URL does not contain the configured partner tag.
- Does not scrape Amazon pages or invent ASINs, images, prices or affiliate URLs.

SearchItems returns at most 10 products per request. This is a curated, scheduled discovery system, not a complete mirror of every Amazon listing.

## Prerequisites

Your Amazon India Associates account must have Creators API access and active credentials. Amazon's India documentation states that Creators API access requires at least 10 qualifying sales in the preceding 30 days; access can be lost after a consecutive 30-day period without qualified referring sales. Check the live account's eligibility and API rate limits in Associates Central.

Create these repository Actions secrets under **Settings → Secrets and variables → Actions**:

- `AMAZON_CREATORS_CLIENT_ID`: Creators API Credential ID / Client ID
- `AMAZON_CREATORS_CLIENT_SECRET`: Creators API Credential Secret / Client Secret
- `AMAZON_PARTNER_TAG`: the exact active Amazon.in tracking ID to use (currently intended: `worthsy0d-21`)

Never place the Client Secret in source code, issues, commits, or browser JavaScript.

## Enable

1. Merge this feature branch into `main`.
2. Add the three Actions secrets above.
3. Open **Actions → Amazon Creators API product sync → Run workflow**.
4. Inspect the run log and confirm imported/skipped counts.
5. Review the catalogue diff before relying on the new products.

The workflow uses the EU Login with Amazon token endpoint (`api.amazon.co.uk`) for India credentials and calls `https://creatorsapi.amazon/catalog/v1/searchItems` with `x-marketplace: www.amazon.in`.

## Important Amazon data rules

- Keep the full `detailPageURL` returned by the Creators API; do not rewrite or strip its query parameters.
- Product images and offer prices are returned by Amazon and may be subject to Amazon's display, refresh and deletion requirements. Do not treat a stored price as permanently current.
- Respect API quotas and the Associates Program Operating Agreement.
