(function(){
'use strict';
if(window.WORTHSY_UNIVERSAL_SEARCH)return;window.WORTHSY_UNIVERSAL_SEARCH=true;
const TAG='worthsy0d-21',N=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,' ').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim(),E=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=[],ready=false;
const css=[
'#wsy-search-layer{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.62);backdrop-filter:blur(9px);display:none;overflow:auto;padding:clamp(12px,3vw,32px)}',
'#wsy-search-layer.open{display:block}#wsy-search-panel{max-width:980px;margin:3vh auto;background:#fff;color:#111;border:1px solid #ddd;border-radius:18px;box-shadow:0 24px 90px #0005;overflow:hidden}',
'#wsy-search-top{padding:20px 22px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee}#wsy-search-brand{font-weight:950;letter-spacing:-.05em;font-size:20px}#wsy-search-brand span{color:#ed1c24}',
'#wsy-search-close{border:1px solid #ddd;background:#fff;border-radius:50%;width:38px;height:38px;font-size:22px;cursor:pointer}#wsy-search-input-wrap{margin:18px 22px 10px;border:1px solid #bbb;border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 14px}',
'#wsy-search-input{width:100%;border:0!important;outline:0!important;box-shadow:none!important;padding:16px 0!important;background:transparent!important;color:#111!important;font:500 16px/1.4 Arial,sans-serif}',
'#wsy-search-voice{flex:0 0 38px;width:38px;height:38px;border:1px solid #ddd;border-radius:50%;background:#fff;color:#111;font-size:17px;cursor:pointer}#wsy-search-voice[aria-pressed=true]{background:#111;color:#fff;border-color:#111}#wsy-search-voice:disabled{opacity:.45;cursor:not-allowed}',
'#wsy-search-meta{padding:5px 22px 12px;color:#777;font-size:12px}#wsy-search-chips{display:flex;gap:8px;flex-wrap:wrap;padding:0 22px 14px}',
'.wsy-chip{border:1px solid #ddd;border-radius:12px;padding:10px 13px;background:#fff;font-size:13px;cursor:pointer;text-align:left;transition:background .12s,border-color .12s}.wsy-chip:hover{border-color:#d71920;background:#fafafa;color:#111}',
'#wsy-search-results{display:none!important}',
'.wsy-result{border:1px solid #e7e7e7;border-radius:12px;padding:11px;display:grid;grid-template-columns:76px 1fr;gap:11px;min-width:0;color:#111;text-decoration:none;transition:.15s}.wsy-result:hover{border-color:#111;transform:translateY(-2px)}','.wsy-result-pending{cursor:default;background:#fafafa}.wsy-result-pending:hover{transform:none;border-color:#e7e7e7}',
'.wsy-result img{width:76px;height:82px;object-fit:contain;background:#f7f7f7;border-radius:8px}.wsy-result-name{font-size:13px;font-weight:800;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.wsy-result-meta{font-size:10px;color:#777;margin-top:5px;text-transform:uppercase;letter-spacing:.06em}.wsy-result-price{font-size:12px;font-weight:800;margin-top:6px}',
'#wsy-search-empty{grid-column:1/-1;padding:24px;border:1px dashed #ccc;border-radius:12px;text-align:center}#wsy-request{grid-column:1/-1;margin-top:3px;padding:18px;border-radius:12px;background:#f7f7f7;border:1px solid #e5e5e5}',
'#wsy-request h3{font-size:16px;font-weight:900;margin:0 0 5px}#wsy-request p{font-size:12px;color:#666;margin:0 0 12px}#wsy-request-row{display:flex;gap:8px;flex-wrap:wrap}',
'#wsy-request-url{flex:1;min-width:190px;border:1px solid #ccc;border-radius:9px;padding:12px;background:#fff;color:#111}#wsy-request-action{border:0;border-radius:9px;background:#111;color:#fff;font-weight:800;padding:12px 16px;cursor:pointer}#wsy-request-note{font-size:11px;color:#666;margin-top:9px}',
'#searchModal{display:none!important}#wsy-converter{margin:0 22px 22px;padding:18px;border:1px solid #e5e5e5;border-radius:13px;background:#f8f8f8}#wsy-converter h3{font-size:16px;font-weight:900;margin:0 0 5px}#wsy-converter p{font-size:12px;color:#666;margin:0 0 12px}#wsy-convert-row{display:flex;gap:8px;flex-wrap:wrap}#wsy-convert-url,#wsy-convert-result{flex:1;min-width:220px;border:1px solid #ccc;border-radius:9px;padding:12px;background:#fff;color:#111;font-size:13px}#wsy-convert-btn,#wsy-copy-btn{border:0;border-radius:9px;background:#111;color:#fff;font-weight:800;padding:12px 16px;cursor:pointer}#wsy-convert-feedback{font-size:11px;color:#666;margin-top:9px;overflow-wrap:anywhere}#wsy-convert-output{display:none;margin-top:10px;gap:8px;flex-wrap:wrap}#wsy-convert-output.show{display:flex}@media(max-width:560px){#wsy-converter{margin:0 14px 16px}}',
'@media(max-width:560px){#wsy-search-results{grid-template-columns:1fr;padding:0 14px 16px}#wsy-search-top{padding:14px}#wsy-search-input-wrap{margin:14px 14px 8px}#wsy-search-meta,#wsy-search-chips{padding-left:14px;padding-right:14px}#wsy-search-launch{right:14px;bottom:14px}}'
].join('');
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const layer=document.createElement('div');layer.id='wsy-search-layer';layer.innerHTML='<div id="wsy-search-panel" role="dialog" aria-modal="true" aria-label="Search WORTHSY products"><div id="wsy-search-top"><div id="wsy-search-brand">WORTH<span>SY</span> <small style="font-size:10px;letter-spacing:.12em;color:#888">UNIVERSAL SEARCH</small></div><button id="wsy-search-close" aria-label="Close search">×</button></div><div id="wsy-search-input-wrap"><span aria-hidden="true">⌕</span><input id="wsy-search-input" type="search" autocomplete="off" placeholder="Search products, brands, categories or platforms…" aria-label="Search all WORTHSY products"></div><div id="wsy-search-meta">Loading the WORTHSY catalogue…</div><div id="wsy-search-chips"></div><div id="wsy-search-results"></div><section id="wsy-converter"><h3>Amazon link converter</h3><p>Paste an Amazon India product-page link to create a WORTHSY affiliate link. Copy it and use it when you share or shop.</p><div id="wsy-convert-row"><input id="wsy-convert-url" type="url" placeholder="Paste your Amazon.in product link here" aria-label="Amazon product link"><button id="wsy-convert-btn" type="button">Convert link</button></div><div id="wsy-convert-output"><input id="wsy-convert-result" type="text" readonly aria-label="WORTHSY affiliate link"><button id="wsy-copy-btn" type="button">Copy link</button></div><div id="wsy-convert-feedback" aria-live="polite">Supports full Amazon.in product links and amzn.in short links. Short links are resolved before the affiliate tag is added.</div></section></div>';document.body.appendChild(layer);
const input=layer.querySelector('#wsy-search-input'),results=layer.querySelector('#wsy-search-results'),meta=layer.querySelector('#wsy-search-meta'),chips=layer.querySelector('#wsy-search-chips');
const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
const voiceButton=document.createElement('button');voiceButton.id='wsy-search-voice';voiceButton.type='button';voiceButton.textContent='🎙';voiceButton.setAttribute('aria-label','Search by voice');voiceButton.title=SpeechAPI?'Search by voice':'Voice search is not supported in this browser';voiceButton.disabled=!SpeechAPI;voiceButton.setAttribute('aria-pressed','false');input.parentElement.appendChild(voiceButton);
let voiceRecognition=null;
if(SpeechAPI){voiceRecognition=new SpeechAPI();voiceRecognition.lang=(navigator.language||'en-IN');voiceRecognition.interimResults=false;voiceRecognition.maxAlternatives=1;voiceRecognition.onstart=function(){voiceButton.setAttribute('aria-pressed','true');meta.textContent='Listening… speak your product search.'};voiceRecognition.onresult=function(event){const phrase=event.results&&event.results[0]&&event.results[0][0]?event.results[0][0].transcript:'';if(phrase){input.value=phrase;render(phrase);meta.textContent='Voice search: '+phrase}};voiceRecognition.onerror=function(event){meta.textContent=event.error==='not-allowed'?'Microphone permission was denied. You can type your search instead.':'Voice search could not start. Please type your search.'};voiceRecognition.onend=function(){voiceButton.setAttribute('aria-pressed','false')};voiceButton.addEventListener('click',function(){try{voiceRecognition.start()}catch(e){meta.textContent='Voice search is already listening.'}});}

function imgOf(p){return(Array.isArray(p.images)&&p.images[0])||p.fallback_image||p.image||''}
function plat(p){return p.merchant||({amazon:'Amazon',flipkart:'Flipkart',awin:'Awin',coursera:'Coursera',clickbank:'ClickBank',shopify:'Shopify',dailyobjects:'DailyObjects'}[p.platform])||p.platform||'Partner'}
function open(q){layer.classList.add('open');document.body.style.overflow='hidden';input.value=q||'';render(input.value);setTimeout(()=>input.focus(),30)}
function close(){layer.classList.remove('open');document.body.style.overflow='';input.value='';render('');['wx-hero-q','modalSearch','productSearch'].forEach(function(id){const el=document.getElementById(id);if(el)el.value=''});const cu=layer.querySelector('#wsy-convert-url'),cr=layer.querySelector('#wsy-convert-result'),co=layer.querySelector('#wsy-convert-output'),cf=layer.querySelector('#wsy-convert-feedback');if(cu)cu.value='';if(cr)cr.value='';if(co)co.classList.remove('show');if(cf)cf.textContent='Supports full Amazon.in product links and amzn.in short links. Short links are resolved before the affiliate tag is added.'}
layer.querySelector('#wsy-search-close').addEventListener('click',close);layer.addEventListener('click',e=>{if(e.target===layer)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layer.classList.contains('open'))close();if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();open('')}});
function score(p,q){const synonyms={sneaker:['sneakers','shoe','shoes','footwear','trainer','trainers'],sneakers:['sneaker','shoe','shoes','footwear','trainer','trainers'],shoe:['shoes','sneaker','sneakers','footwear'],shoes:['shoe','sneaker','sneakers','footwear'],footwear:['shoe','shoes','sneaker','sneakers'],mobile:['phone','smartphone'],phone:['mobile','smartphone'],laptop:['notebook','computer'],earbuds:['earphones','tws','headphones'],headphones:['headset','earbuds'],watch:['smartwatch','wearable'],smartwatch:['watch','wearable'],keyboard:['keyboards'],mouse:['mice']};const ts=N(q).split(' ').filter(Boolean);if(!ts.length)return 0;const name=N(p.name),brand=N(p.brand),cat=N(p.category),desc=N(p.description),merchant=N(p.merchant),platform=N(p.platform),all=[name,brand,cat,desc,merchant,platform,N(p.searchTerms)].join(' ');let n=0;ts.forEach(t=>{const group=[t].concat(synonyms[t]||[]);if(group.some(x=>name.includes(x)))n+=9;else if(group.some(x=>brand.includes(x)))n+=7;else if(group.some(x=>cat.includes(x)))n+=6;else if(group.some(x=>platform.includes(x)||merchant.includes(x)))n+=5;else if(group.some(x=>all.includes(x)))n+=2});if(ts.length>1&&all.includes(ts.join(' ')))n+=10;if(p.isSneaker&&ts.some(t=>['sneaker','sneakers','shoe','shoes','footwear','trainer','trainers'].includes(t)))n+=8;return n}
function render(q){
 const query=N(q),matches=[];
 products.forEach(function(p){const n=score(p,query);if(!query||n>0)matches.push({p:p,s:n})});
 matches.sort(function(x,y){return y.s-x.s});if(matches.length>24)matches.splice(24);
 meta.textContent=ready?(query?matches.length+' matching products':'Search across '+products.length+' curated affiliate products'):'Loading the WORTHSY catalogue…';
 chips.innerHTML='';results.innerHTML='';
 if(ready){const suggestions=[];function addSuggestion(label,value){if(!value||suggestions.some(x=>x.value===value))return;suggestions.push({label:label,value:value})}if(!query){['Sneakers','Nike','adidas','New Balance','Puma','Headphones','Laptops','Smartwatches','Amazon','Awin'].forEach(x=>addSuggestion('Popular · '+x,x));}else{const q= N(query);products.forEach(function(p){if(N(p.name).startsWith(q))addSuggestion('Product · '+p.name,p.name);if(p.brand&&N(p.brand).startsWith(q))addSuggestion('Brand · '+p.brand,p.brand);if(p.category&&N(p.category).startsWith(q))addSuggestion('Category · '+p.category,p.category)});matches.slice(0,5).forEach(function(x){addSuggestion('Product · '+x.p.name,x.p.name)})}suggestions.slice(0,8).forEach(function(x){const btn=document.createElement('button');btn.type='button';btn.className='wsy-chip';btn.textContent=x.label;btn.onclick=function(){input.value=x.value;render(x.value);input.focus()};chips.appendChild(btn)})}
 if(query&&matches.length){matches.slice(0,8).forEach(function(item){const p=item.p;const btn=document.createElement('button');btn.type='button';btn.className='wsy-chip';btn.textContent='Product suggestion · '+p.name+(p.brand?' — '+p.brand:'');btn.onclick=function(){input.value=p.name;render(p.name);input.focus()};chips.appendChild(btn)})}
 if(query&&!matches.length){const empty=document.createElement('div');empty.id='wsy-search-empty';empty.textContent='No exact match for “'+q+'”. Try another brand, category or product name.';results.appendChild(empty)}

}
input.addEventListener('input',()=>render(input.value));
const convertUrl=layer.querySelector('#wsy-convert-url'),convertBtn=layer.querySelector('#wsy-convert-btn'),convertResult=layer.querySelector('#wsy-convert-result'),convertOutput=layer.querySelector('#wsy-convert-output'),convertFeedback=layer.querySelector('#wsy-convert-feedback'),copyBtn=layer.querySelector('#wsy-copy-btn');
function extractAsin(raw){
 let u;try{u=new URL(raw)}catch(e){throw new Error('The Amazon link could not be read.')}
 const host=u.hostname.toLowerCase();
 if(host!=='amazon.in'&&!host.endsWith('.amazon.in'))throw new Error('This converter supports Amazon India links only.');
 const parts=decodeURIComponent(u.pathname).split('/').filter(Boolean);
 for(let i=0;i<parts.length;i++){
  const part=parts[i].toLowerCase();
  if((part==='dp'||part==='product'||part==='asin')&&parts[i+1]&&parts[i+1].length===10)return parts[i+1].toUpperCase();
  if(part==='gp'&&parts[i+1]&&['product','aw'].includes(parts[i+1].toLowerCase())&&parts[i+2]&&parts[i+2].length===10)return parts[i+2].toUpperCase();
 }
 throw new Error('The destination is not an Amazon India product page. No product ID was found.');
}
async function resolveAmazonLink(raw){
 let u;try{u=new URL(raw.indexOf('://')<0?'https://'+raw:raw)}catch(e){throw new Error('Paste a valid Amazon product URL.')}
 const host=u.hostname.toLowerCase(),isAmazon=host==='amazon.in'||host.endsWith('.amazon.in'),isShort=host==='amzn.in'||host.endsWith('.amzn.in');
 if(!isAmazon&&!isShort)throw new Error('Please paste an Amazon India link (amazon.in or amzn.in).');
 if(isAmazon)return extractAsin(u.href);
 const shortUrl=u.href,problems=[];
 const attempts=[
  async function(){
   const r=await fetch('https://proxy.cors.dev/raw?url='+encodeURIComponent(shortUrl),{credentials:'omit'});
   if(!r.ok)throw new Error('Redirect proxy HTTP '+r.status);
   const html=await r.text();
   const m=html.match(/\/(?:dp|product|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
   if(m)return m[1].toUpperCase();
   const c=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
   if(c)return extractAsin(new URL(c[1],'https://www.amazon.in').href);
   throw new Error('Redirect page did not expose product ID.');
  },
  async function(){
   const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(shortUrl),{credentials:'omit'});
   if(!r.ok)throw new Error('Link resolver HTTP '+r.status);
   const data=await r.json(),html=String(data.contents||'');
   const m=html.match(/\/(?:dp|product|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
   if(m)return m[1].toUpperCase();
   throw new Error('No product ID returned.');
  },
  async function(){
   const r=await fetch('https://unshorten.umaneti.net/c?url='+encodeURIComponent(shortUrl),{credentials:'omit'});
   if(!r.ok)throw new Error('Short-link resolver HTTP '+r.status);
   const body=(await r.text()).trim();let data;
   try{data=JSON.parse(body)}catch(e){data={url:body}}
   const candidates=[data.url,data.finalUrl,data.final_url,data.destination,data.expanded_url,data.unshortened_url,body].filter(Boolean);
   for(let i=0;i<candidates.length;i++){try{return extractAsin(String(candidates[i]).trim())}catch(e){}}
   throw new Error('No product URL returned.');
  }
 ];
 convertFeedback.textContent='Resolving Amazon short link…';
 for(let i=0;i<attempts.length;i++){try{return await attempts[i]()}catch(e){problems.push(e.message)}}
 throw new Error('Could not resolve this short link. Please paste the full Amazon product-page URL. '+problems.join(' | '));
}
convertBtn.addEventListener('click',async function(){
 const raw=convertUrl.value.trim();if(!raw){convertFeedback.textContent='Paste an Amazon India product link first.';return}
 convertBtn.disabled=true;convertBtn.textContent='Converting…';convertOutput.classList.remove('show');convertFeedback.textContent='Checking the Amazon product link…';
 try{
  const asin=await resolveAmazonLink(raw),link='https://www.amazon.in/dp/'+asin+'?tag='+TAG;
  convertResult.value=link;convertOutput.classList.add('show');copyBtn.textContent='Copy link';
  const cfg=window.WORTHSY_SUPABASE_CONFIG||{};
  if(cfg.url&&cfg.anonKey){
   convertFeedback.textContent='Affiliate link ready. Adding this product to WORTHSY…';
   let title='';
   try{const path=new URL(raw.indexOf('://')<0?'https://'+raw:raw).pathname.split('/').filter(Boolean);const dp=path.findIndex(x=>x.toLowerCase()==='dp');if(dp>0)title=decodeURIComponent(path[dp-1]).replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().slice(0,140)}catch(e){}
   const response=await fetch(cfg.url.replace(/\/$/, '')+'/functions/v1/submit-amazon-product',{
    method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.anonKey,'Authorization':'Bearer '+cfg.anonKey},
    body:JSON.stringify({asin,title,url:raw})
   });
   const result=await response.json();
   if(!response.ok||!result.ok)throw new Error(result.error||'Product submission failed.');
   // Refresh the live in-memory search catalogue after the server confirms publication.
   const fresh=await fetch(feed+'?v='+Date.now(),{cache:'no-store'});
   if(fresh.ok){
    const list=await fresh.json();
    if(Array.isArray(list)){const sneakers=products.filter(p=>p.isSneaker);products=list.map(normalizeMain).filter(Boolean).concat(sneakers)}
   }
   // The GitHub Pages feed can take a moment to update; keep this session searchable too.
   if(!products.some(p=>String(p.link||p.url||'').includes('/dp/'+asin))){
    products.unshift({platform:'amazon',merchant:'Amazon India',category:'Community Finds',name:result.productName||title||('Amazon product '+asin),description:'Community-discovered Amazon India product.',price:'',link:result.affiliateUrl||link,images:['https://m.media-amazon.com/images/P/'+asin+'.01._SCLZZZZZZZ_.jpg'],fallback_image:'https://images-na.ssl-images-amazon.com/images/P/'+asin+'.01._SCLZZZZZZZ_.jpg'});
   }
   window.WORTHSY_PRODUCTS=products;
   render(input.value);
   document.dispatchEvent(new CustomEvent('worthsy:catalogue-updated',{detail:{products:products}}));
   convertFeedback.textContent=result.duplicate?'Affiliate link ready. This product is already listed on WORTHSY.':'Affiliate link ready — this product has been added to WORTHSY!';
   if(!result.duplicate)setTimeout(function(){window.location.reload()},5000);
  }else{
   convertFeedback.textContent='Affiliate link ready. Product auto-listing will start once WORTHSY connects its Supabase project.';
  }
 }
 catch(e){convertFeedback.textContent='Affiliate link is ready, but product auto-listing failed: '+e.message}
 finally{convertBtn.disabled=false;convertBtn.textContent='Convert link'}
});

copyBtn.addEventListener('click',function(){if(!convertResult.value)return;const fallback=function(){convertResult.focus();convertResult.select();convertFeedback.textContent='Select and copy the highlighted affiliate link.'};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(convertResult.value).then(function(){convertFeedback.textContent='Copied! Share this link so eligible purchases can be attributed to WORTHSY.';copyBtn.textContent='Copied'}).catch(fallback)}else fallback()});
const legacyModal=document.getElementById('searchModal');
document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('#uniSearchBtn');if(b){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open('')}},true);
const legacyInput=document.getElementById('modalSearch');if(legacyInput){legacyInput.addEventListener('input',function(){if(layer.classList.contains('open')){input.value=legacyInput.value;render(input.value)}});legacyInput.addEventListener('focus',function(){open(legacyInput.value)})}
const launcher=document.getElementById('uniSearchBtn');if(launcher)launcher.addEventListener('click',()=>open(''));else if(!document.getElementById('wsy-search-launch')){const b=document.createElement('button');b.id='wsy-search-launch';b.type='button';b.textContent='⌕  Search products';b.onclick=()=>open('');document.body.appendChild(b)}
document.querySelectorAll('input[type="search"]:not(#wsy-search-input)').forEach(el=>{el.addEventListener('focus',()=>{if(['productSearch','wx-hero-q','modalSearch'].includes(el.id))open(el.value)});el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();open(el.value)}})});
const hero=document.getElementById('wx-hero-search');if(hero)hero.addEventListener('submit',e=>{e.preventDefault();open((document.getElementById('wx-hero-q')||{}).value||'')});
document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>open(b.getAttribute('data-q'))));
function approvedAffiliateLink(p){const raw=p&&(p.link||p.url||p.amazonUrl||p.awinUrl||p.affiliateUrl);if(!raw)return '';try{const u=new URL(raw,location.href),host=u.hostname.toLowerCase();if((host==='amazon.in'||host==='www.amazon.in')&&(function(){const parts=u.pathname.split('/').filter(Boolean);return parts.length>=2&&parts[parts.length-2].toLowerCase()==='dp'&&parts[parts.length-1].length===10&&/^[A-Z0-9]{10}$/i.test(parts[parts.length-1])})()&&u.searchParams.get('tag')==='worthsy0d-21')return u.href;if((host==='awin1.com'||host==='www.awin1.com')&&u.pathname==='/pclick.php'&&u.searchParams.get('a')==='3110404')return u.href}catch(e){}return ''}function normalizeMain(p){if(!p||!p.name)return null;const link=approvedAffiliateLink(p);if(!link)return null;return Object.assign({},p,{link:link,platform:p.platform|| (link.indexOf('amazon.in')>=0?'Amazon':'Awin'),searchTerms:[p.merchant,p.brand,p.category,p.platform].filter(Boolean).join(' '),isSneaker:false})}function normalizeSneaker(p){if(!p||!(p.name||p.model))return null;const link=approvedAffiliateLink(p);return {name:p.name||p.model,brand:p.brand||'',category:p.category||'Sneakers',description:[p.model,p.category,'sneakers shoes footwear trainers'].filter(Boolean).join(' '),searchTerms:[p.brand,p.model,'sneaker sneakers shoe shoes footwear trainer trainers'].filter(Boolean).join(' '),platform:link?(link.indexOf('amazon.in')>=0?'Amazon':'Awin'):'Affiliate link pending',link:link,amazonUrl:p.amazonUrl||'',awinUrl:p.awinUrl||'',image:p.imageUrl||'',imageUrl:p.imageUrl||'',images:p.imageUrl?[p.imageUrl]:[],price:p.price||'',isSneaker:true}}const base=new URL('products.json',document.currentScript.src).toString(),sneakerFeed=new URL('sneakerhead-products.json',document.currentScript.src).toString();Promise.all([fetch(base+'?v=community6',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('products.json unavailable');return r.json()}),fetch(sneakerFeed+'?v=community6',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('sneakerhead-products.json unavailable');return r.json()})]).then(function(data){const main=Array.isArray(data[0])?data[0]:[],sneakers=Array.isArray(data[1])?data[1]:(Array.isArray(data[1].products)?data[1].products:[]);products=main.map(normalizeMain).filter(Boolean).concat(sneakers.map(normalizeSneaker).filter(Boolean));const seen=new Set();products=products.filter(function(p){const key=N(p.name)+'|'+N(p.brand);if(seen.has(key))return false;seen.add(key);return true});ready=true;window.WORTHSY_SEARCH_CATALOGUE=products;if(layer.classList.contains('open'))render(input.value);meta.textContent='Search across '+products.length+' products'}).catch(function(e){console.error('WORTHSY search catalogue failed',e);ready=true;meta.textContent='Catalogue temporarily unavailable. Please refresh and try again.'});
})();