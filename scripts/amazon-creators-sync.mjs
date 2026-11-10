#!/usr/bin/env node
/**
 * WORTHSY Amazon India Creators API importer.
 * Runs in GitHub Actions; credentials are read only from environment secrets.
 * Existing products are preserved. New items are deduplicated by ASIN.
 */
import fs from "node:fs/promises";

const required = ["AMAZON_CREATORS_CLIENT_ID", "AMAZON_CREATORS_CLIENT_SECRET", "AMAZON_PARTNER_TAG"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required GitHub Actions secret: ${key}`);
    process.exit(1);
  }
}

const CLIENT_ID = process.env.AMAZON_CREATORS_CLIENT_ID;
const CLIENT_SECRET = process.env.AMAZON_CREATORS_CLIENT_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const MARKETPLACE = "www.amazon.in";
const TOKEN_URL = "https://api.amazon.co.uk/auth/o2/token";
const API_URL = "https://creatorsapi.amazon/catalog/v1/searchItems";
const PRODUCTS_FILE = new URL("../products.json", import.meta.url);
const WAIT_MS = 1100;

const searches = [
  ["wireless earbuds", "TWS Earbuds"],
  ["bluetooth speaker", "Bluetooth Speaker"],
  ["smartwatch", "Smartwatch"],
  ["fitness band", "Fitness Band"],
  ["power bank", "Power Bank"],
  ["wireless mouse", "Mouse"],
  ["mechanical keyboard", "Keyboard"],
  ["webcam", "Webcam"],
  ["computer monitor", "Monitor"],
  ["laptop", "Laptop"],
  ["laptop stand", "Laptop Stand"],
  ["USB C hub", "USB Hub"],
  ["external SSD", "External SSD"],
  ["internal SSD", "Internal SSD"],
  ["external hard drive", "External Hard Drive"],
  ["WiFi router", "WiFi Router"],
  ["mesh WiFi", "Mesh WiFi"],
  ["Bluetooth adapter", "Bluetooth Adapter"],
  ["WiFi USB adapter", "WiFi Adapter"],
  ["USB flash drive", "Pen Drive"],
  ["microSD card", "Memory Card"],
  ["phone charger", "Charger"],
  ["USB C cable", "Charging Cable"],
  ["phone case", "Phone Case"],
  ["tablet", "Tablet"],
  ["portable projector", "Projector"],
  ["smart home plug", "Smart Home"],
  ["security camera", "Security Camera"],
  ["air purifier", "Air Purifier"],
  ["robot vacuum", "Robot Vacuum"],
  ["desk lamp", "Desk Lamp"],
  ["surge protector", "Power Strip"],
  ["gaming headset", "Gaming Headset"],
  ["gaming mouse", "Gaming Mouse"],
  ["graphics card", "Graphics Card"],
  ["computer RAM", "RAM"],
  ["computer cooling fan", "PC Cooling"],
  ["printer", "Printer"],
  ["ink tank printer", "Printer"],
  ["electric kettle", "Kitchen Appliance"],
  ["mixer grinder", "Kitchen Appliance"],
  ["induction cooktop", "Kitchen Appliance"],
  ["LED monitor light bar", "Desk Accessories"],
  ["portable SSD enclosure", "Storage Accessories"]
];

const blocked = /\b(women'?s?|ladies|girl'?s?|maternity|lingerie|bra|panties|dress|saree|kurti|lehenga|skirt|heels|high heels|makeup|lipstick|perfume for her|adult|erotic|sex toy|lingerie)\b/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAccessToken() {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "creatorsapi::default"
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`Amazon OAuth failed (${response.status}): ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data.access_token;
}

async function searchItems(token, keywords) {
  const body = {
    keywords,
    partnerTag: PARTNER_TAG,
    marketplace: MARKETPLACE,
    searchIndex: "All",
    itemCount: 10,
    itemPage: 1,
    minReviewsRating: 4,
    availability: "Available",
    condition: "New",
    sortBy: "AvgCustomerReviews",
    resources: [
      "images.primary.large",
      "images.primary.medium",
      "itemInfo.title",
      "itemInfo.byLineInfo",
      "itemInfo.features",
      "offersV2.listings.price",
      "offersV2.listings.availability"
    ]
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-marketplace": MARKETPLACE
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data?.searchResult?.items || [];
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await sleep(1500 * (2 ** attempt));
      continue;
    }
    throw new Error(`SearchItems failed for "${keywords}" (${response.status}): ${JSON.stringify(data).slice(0, 500)}`);
  }
  return [];
}

function firstOffer(item) {
  return item?.offersV2?.listings?.[0] || null;
}

function getPrice(item) {
  const price = firstOffer(item)?.price?.money?.displayAmount;
  return typeof price === "string" ? price : "";
}

function getImage(item) {
  return item?.images?.primary?.large?.url ||
    item?.images?.primary?.medium?.url || "";
}

function getTitle(item) {
  return item?.itemInfo?.title?.displayValue || "";
}

function getBrand(item) {
  return item?.itemInfo?.byLineInfo?.brand?.displayValue || "";
}

function getDescription(item) {
  const features = item?.itemInfo?.features?.displayValues;
  if (Array.isArray(features) && features.length) {
    return features.slice(0, 3).join(" ");
  }
  return getTitle(item);
}

function getAsinFromUrl(link) {
  const match = String(link || "").match(/\/dp\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : "";
}

function validAffiliateUrl(link) {
  try {
    const parsed = new URL(link);
    return parsed.hostname === "www.amazon.in" &&
      parsed.pathname.match(/^\/dp\/[A-Z0-9]{10}/i) &&
      parsed.searchParams.get("tag") === PARTNER_TAG;
  } catch {
    return false;
  }
}

function mapItem(item, category) {
  const title = getTitle(item);
  const link = item?.detailPageURL || "";
  const asin = String(item?.asin || getAsinFromUrl(link)).toUpperCase();
  const image = getImage(item);
  if (!asin || !title || !image || !validAffiliateUrl(link)) return null;
  if (blocked.test([title, category, getBrand(item)].join(" "))) return null;

  return {
    platform: "amazon",
    merchant: "Amazon India",
    category,
    brand: getBrand(item),
    name: title,
    description: getDescription(item),
    price: getPrice(item),
    link,
    images: [image],
    asin,
    source: "Amazon Creators API"
  };
}

async function main() {
  const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
  const products = JSON.parse(raw);
  if (!Array.isArray(products)) throw new Error("products.json must contain a JSON array.");

  const known = new Set(
    products.filter((p) => p?.platform === "amazon")
      .map((p) => String(p.asin || getAsinFromUrl(p.link)).toUpperCase())
      .filter(Boolean)
  );

  const token = await getAccessToken();
  const additions = [];
  let apiItems = 0;
  let rejected = 0;

  for (const [keywords, category] of searches) {
    const items = await searchItems(token, keywords);
    apiItems += items.length;
    for (const item of items) {
      const product = mapItem(item, category);
      if (!product || known.has(product.asin)) {
        rejected++;
        continue;
      }
      known.add(product.asin);
      additions.push(product);
    }
    console.log(`Search "${keywords}": ${items.length} items returned`);
    await sleep(WAIT_MS);
  }

  if (additions.length) {
    products.push(...additions);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2) + "\n");
  }

  console.log(JSON.stringify({
    searches: searches.length,
    apiItems,
    imported: additions.length,
    skippedDuplicatesOrInvalid: rejected,
    amazonTotal: products.filter((p) => p?.platform === "amazon").length,
    totalProducts: products.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
