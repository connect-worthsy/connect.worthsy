// WORTHSY: securely publish community-submitted Amazon India products.
// Required Supabase secrets: GITHUB_TOKEN, GITHUB_REPOSITORY=connect-worthsy/connect.worthsy, GITHUB_BRANCH=main
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://www.worthsy.in",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/\s/g, ""))));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const repo = Deno.env.get("GITHUB_REPOSITORY") || "connect-worthsy/connect.worthsy";
  const branch = Deno.env.get("GITHUB_BRANCH") || "main";
  if (!githubToken) return reply(503, { error: "Publishing is not configured yet." });

  const db = createClient(supabaseUrl, serviceKey);
  try {
    const body = await req.json();
    let asin = String(body.asin || "").toUpperCase().trim();
    let title = String(body.title || "").replace(/[-_]+/g, " ").trim().slice(0, 140);
    let productImage = "";
    const submittedUrl = String(body.url || "").trim();
    if (submittedUrl) {
      let inputUrl: URL;
      try { inputUrl = new URL(submittedUrl); } catch { return reply(400, { error: "Paste a valid Amazon India product link." }); }
      const host = inputUrl.hostname.toLowerCase().replace(/^www\./, "");
      if (host !== "amazon.in" && host !== "amzn.in") return reply(400, { error: "Only Amazon India product links are supported." });
      if (!/^[A-Z0-9]{10}$/.test(asin)) {
        try {
          const resolved = await fetch(inputUrl.toString(), { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; WORTHSY/1.0)", "Accept-Language": "en-IN,en;q=0.9" } });
          const finalUrl = new URL(resolved.url || inputUrl.toString());
          const parts = finalUrl.pathname.split("/").filter(Boolean);
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].toUpperCase();
            if ((part === "DP" || part === "PRODUCT" || part === "D") && parts[i + 1] && /^[A-Z0-9]{10}$/i.test(parts[i + 1])) asin = parts[i + 1].toUpperCase();
            if (part === "GP" && parts[i + 2] && /^[A-Z0-9]{10}$/i.test(parts[i + 2])) asin = parts[i + 2].toUpperCase();
            if (/^[A-Z0-9]{10}$/.test(part)) asin = part;
          }
          if (!title) {
            const marker = parts.findIndex((part) => /^(dp|product)$/i.test(part));
            if (marker > 0) title = decodeURIComponent(parts[marker - 1]).replace(/[-_]+/g, " ").trim().slice(0, 140);
          }
          if (resolved.ok) {
            const page = await resolved.text();
            const tags = page.match(/<meta[^>]*>/gi) || [];
            const og = tags.find((tag) => tag.includes('property="og:title"') || tag.includes("property='og:title'"));
            const image = tags.find((tag) => tag.includes('property="og:image"') || tag.includes("property='og:image'"));
            const getContent = (tag?: string) => tag?.match(/content=["']([^"']+)["']/i)?.[1] || "";
            const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
            if (!title) title = decode(getContent(og)).replace(/\s*:\s*Amazon\.in.*$/i, "").trim().slice(0, 140);
            productImage = decode(getContent(image));
          }
        } catch (error) {
          console.warn("Amazon short-link resolution or metadata lookup failed:", error);
        }
      }
    }
    if (!/^[A-Z0-9]{10}$/.test(asin)) return reply(422, { error: "Could not resolve the Amazon short link. Please paste the full Amazon product URL." });
    if (!title || title.length < 4) return reply(422, { error: "Could not verify the product name from this link. Please use the full Amazon product URL." });

    const existing = await db.from("community_product_submissions").select("asin").eq("asin", asin).maybeSingle();

    const forwarded = req.headers.get("x-forwarded-for") || "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(forwarded.split(",")[0].trim()));
    const ipHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await db.from("community_submit_events").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if ((recent.count || 0) >= 8) return reply(429, { error: "Too many product submissions. Please try again later." });
    await db.from("community_submit_events").insert({ ip_hash: ipHash });

    const affiliateUrl = "https://www.amazon.in/dp/" + asin + "?tag=worthsy0d-21";
    const path = "products.json";
    const api = "https://api.github.com/repos/" + repo + "/contents/" + path;
    const headers = { Authorization: "Bearer " + githubToken, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    let published = false;
    for (let attempt = 0; attempt < 3 && !published; attempt++) {
      const get = await fetch(api + "?ref=" + encodeURIComponent(branch), { headers });
      if (!get.ok) throw new Error("Could not read the WORTHSY product catalogue (GitHub " + get.status + ").");
      const file = await get.json();
      const catalogue = JSON.parse(unb64(file.content));
      if (!Array.isArray(catalogue)) throw new Error("WORTHSY product catalogue format is invalid.");
      const alreadyThere = catalogue.some((p: any) => String(p.link || "").match(/\/dp\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase() === asin);
      if (alreadyThere) {
        if (!existing.data) await db.from("community_product_submissions").insert({ asin, affiliate_url: affiliateUrl, product_name: title, status: "duplicate" });
        return reply(200, { ok: true, duplicate: true, asin, affiliateUrl, productName: title });
      }
      // Match the Amazon ASIN image URL pattern already used in WORTHSY's catalogue.
      // The second host is used by the product card if the primary image host fails.
      const primaryImage = productImage.startsWith("https://") ? productImage : "https://m.media-amazon.com/images/P/" + asin + ".01._SCLZZZZZZZ_.jpg";
      const fallbackImage = "https://images-na.ssl-images-amazon.com/images/P/" + asin + ".01._SCLZZZZZZZ_.jpg";
      const cleanTitle = title.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
      const product = {
        platform: "amazon",
        merchant: "Amazon India",
        category: "Community Finds",
        name: cleanTitle,
        description: "Community-discovered Amazon India product. Check Amazon for the latest specifications, price and availability.",
        price: "",
        link: affiliateUrl,
        images: [primaryImage],
        fallback_image: fallbackImage
      };
      catalogue.push(product);
      const put = await fetch(api, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Add community-discovered Amazon product " + asin,
          content: b64(JSON.stringify(catalogue, null, 2)),
          sha: file.sha,
          branch
        })
      });
      if (put.ok) { published = true; break; }
      if (put.status !== 409 && put.status !== 422) throw new Error("Could not publish product (GitHub " + put.status + ").");
    }
    if (!published) throw new Error("The catalogue changed during publishing. Please retry.");
    if (!existing.data) await db.from("community_product_submissions").insert({ asin, affiliate_url: affiliateUrl, product_name: title, status: "published" });
    return reply(200, { ok: true, duplicate: false, asin, affiliateUrl, productName: title });
  } catch (err) {
    console.error(err);
    return reply(500, { error: "WORTHSY could not publish this product right now. Please try again later." });
  }
});
