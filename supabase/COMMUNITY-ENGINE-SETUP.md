# WORTHSY Community Product Engine

This adds secure automatic publication of community-submitted Amazon India products while keeping the public site on GitHub Pages.

## What happens

1. The existing affiliate converter extracts the Amazon ASIN and creates the WORTHSY link with tag `worthsy0d-21`.
2. The browser calls the Supabase Edge Function with the ASIN and (when present in the pasted full product URL) a readable title.
3. The function checks duplicates, applies a basic per-IP submission limit, and updates the repository's `products.json` using a server-side GitHub token.
4. The new entry appears in the existing catalogue on the next page load.

When a short URL contains no product title, the listing uses a transparent fallback name such as `Amazon community find B0XXXXXXXX`. It does not invent a price, image, rating, or product details. Enriching those fields requires an authorised product-data source or human review.

## One-time setup

### 1. Create a Supabase project

Create a project at https://supabase.com/dashboard and choose a strong database password.

### 2. Create the database tables

Open **SQL Editor → New query**, paste the complete contents of `supabase/schema.sql`, and run it.

### 3. Create a GitHub token for publishing

Create a fine-grained GitHub personal access token restricted to:
- Repository: `connect-worthsy/connect.worthsy`
- Repository permissions: **Contents: Read and write**

Do not put this token in website JavaScript or send it to visitors.

### 4. Deploy the Edge Function

Install the Supabase CLI, then run these commands from the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GITHUB_TOKEN=YOUR_GITHUB_TOKEN GITHUB_REPOSITORY=connect-worthsy/connect.worthsy GITHUB_BRANCH=main
supabase functions deploy submit-amazon-product
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime. Do not expose the service-role key.

### 5. Connect the public website

Open `worthsy-supabase-config.js` and set:
- `url`: your Supabase Project URL, e.g. `https://YOUR_PROJECT_REF.supabase.co`
- `anonKey`: your project's publishable/anon public key.

Only the public anon/publishable key belongs here. Never put the service-role key or GitHub token in this file.

Commit that small config change to GitHub. GitHub Pages will deploy the website as usual.

## Notes

- Automatic publication is enabled after the Edge Function is configured.
- Duplicate ASINs are not added twice.
- A basic limit of 8 submissions per IP per hour is applied.
- The Edge Function only accepts Amazon India ASINs and always generates the canonical WORTHSY affiliate URL.
- This implementation intentionally does not scrape Amazon product pages or invent images, prices, or ratings. Use product data only from sources and methods authorised by Amazon's terms.
