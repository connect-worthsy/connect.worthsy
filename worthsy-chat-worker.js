/**
 * Optional: real AI answers for the WORTHSY chat button (Cloudflare Worker).
 * The chat already works without this using the store's own policies and products.
 * To switch on AI:
 *   1. Create a free Cloudflare Worker, paste this file, and add a secret named ANTHROPIC_API_KEY.
 *   2. Put the Worker's URL in `chatEndpoint` near the top of the store script in index.html.
 *   3. Add a Cloudflare rate-limiting rule on the Worker so nobody can run up your bill.
 * Never put the API key in index.html: anyone could read it.
 */
const ALLOWED = ['https://www.worthsy.in', 'https://worthsy.in']; // add your github.io address while testing

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ALLOWED.includes(origin)) return new Response('Forbidden', { status: 403, headers: cors });

    let body; try { body = await req.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    let msgs = (body.messages || []).slice(-8)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 500) }))
      .filter(m => m.content);
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length) return new Response('Bad request', { status: 400, headers: cors });

    const system =
      'You are the shopping assistant for WORTHSY, an Indian online store. Answer only from the store facts below. ' +
      'Be friendly and brief (under 80 words). Never invent prices, stock, delivery promises, warranty terms or order status. ' +
      'You cannot look up orders: send people to the Track order page (#track). If you do not know, say so and point to support (#support or the support email). ' +
      'Reply in the language the customer uses.\n\nSTORE FACTS:\n' + JSON.stringify(body.site || {}).slice(0, 12000);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 400, system, messages: msgs })
    });
    const d = await r.json().catch(() => ({}));
    const reply = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'content-type': 'application/json' } });
  }
};
