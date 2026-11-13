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
    const asin = String(body.asin || "").toUpperCase().trim();
    const title = String(body.title || "").trim().slice(0, 140);
    if (!/^[A-Z0-9]{10}$/.test(asin)) return reply(400, { error: "Invalid Amazon product ID." });

    const existing = await db.from("community_product_submissions").select("asin").eq("asin", asin).maybeSingle();
    if (existing.data) return reply(200, { ok: true, duplicate: true, asin });

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
        await db.from("community_product_submissions").insert({ asin, affiliate_url: affiliateUrl, product_name: title || ("Amazon community find " + asin), status: "duplicate" });
        return reply(200, { ok: true, duplicate: true, asin });
      }
      const product = {
        platform: "amazon",
        merchant: "Amazon India",
        category: "Community Finds",
        name: title || ("Amazon community find " + asin),
        description: "Discovered and submitted by the WORTHSY community. Check Amazon for current product details, images, price and availability.",
        price: "",
        link: affiliateUrl,
        images: []
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
    await db.from("community_product_submissions").insert({ asin, affiliate_url: affiliateUrl, product_name: title || ("Amazon community find " + asin), status: "published" });
    return reply(200, { ok: true, duplicate: false, asin, affiliateUrl, productName: title || ("Amazon community find " + asin) });
  } catch (err) {
    console.error(err);
    return reply(500, { error: "WORTHSY could not publish this product right now. Please try again later." });
  }
});
