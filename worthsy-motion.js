/* WORTHSY motion + privacy-conscious storefront telemetry. */
(()=> {
  'use strict';
  if(window.WORTHSY_MOTION_READY)return;
  window.WORTHSY_MOTION_READY=true;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cfg=window.WORTHSY_SUPABASE_CONFIG||{};
  const endpoint=String(cfg.url||'').replace(/\/+$/,'')+'/functions/v1/track-storefront-event';
  const sessionKey='worthsy_analytics_session_v1';
  const eventTypes=new Set(['page_view','product_view','product_click','wishlist_toggle','compare_toggle','search_submit','category_filter','brand_filter']);
  const safeText=(value,max=80)=>String(value||'').replace(/[<>]/g,'').trim().slice(0,max);
  function hasConsent(){
    try{return JSON.parse(localStorage.getItem('worthsy_personalisation_v1')||'{}').consent===true}catch(_){return false}
  }
  function sessionId(){
    try{
      let id=sessionStorage.getItem(sessionKey);
      if(!id){id=window.crypto&&crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});sessionStorage.setItem(sessionKey,id)}
      return id;
    }catch(_){return ''}
  }
  function send(eventType,details){
    if(!hasConsent()||!cfg.anonKey||!eventTypes.has(eventType)||!window.fetch)return;
    const sid=sessionId();if(!sid)return;
    const payload=Object.assign({sessionId:sid,eventType,pagePath:(location.pathname||'/').slice(0,300)},details||{});
    fetch(endpoint,{method:'POST',mode:'cors',keepalive:true,headers:{'Content-Type':'application/json','apikey':cfg.anonKey},body:JSON.stringify(payload)}).catch(()=>{});
  }
  function productInfo(el){
    if(!el)return {};
    const link=el.matches&&el.matches('a[href]')?el:el.querySelector('a[href*="amazon.in"],a[href*="awin1.com"]');
    let productId='';
    if(link){try{const u=new URL(link.href);const m=u.pathname.match(/\/dp\/([A-Z0-9]{10})/i);if(m)productId=m[1].toUpperCase()}catch(_){}}
    const title=el.querySelector('h1,h2,h3,h4,[data-product-name],.roam-info strong')?.textContent||el.getAttribute('data-product-name')||document.getElementById('modalName')?.textContent||'';
    const brandNode=el.querySelector('.wsy-p-meta,.wsy-result-meta,[data-product-meta],.brand-name,.product-brand-word,.product-tag');
    const brandImage=el.querySelector('img.product-brand-logo');
    const categoryNode=el.querySelector('.card-type,[data-product-category]');
    const brand=safeText(el.getAttribute('data-brand')||(brandNode&&brandNode.textContent)||(brandImage&&brandImage.alt.replace(/\\s+logo$/i,''))||document.getElementById('modalBrand')?.textContent||'');
    const category=safeText(el.getAttribute('data-category')||(categoryNode&&categoryNode.textContent)||document.getElementById('modalCategory')?.textContent||'');
    const platform=link?(link.href.includes('amazon.in')?'Amazon':'Awin'):'';
    return {productId:productId||safeText(el.getAttribute('data-product-id')||title,80),brand,category,platform};
  }
  function addMotion(){
    document.body.classList.add('wsy-motion-ready');
    if(!document.getElementById('wsy-scroll-progress')){
      const bar=document.createElement('div');bar.id='wsy-scroll-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
    }
    if(!document.getElementById('wsy-back-top')){
      const top=document.createElement('button');top.id='wsy-back-top';top.type='button';top.textContent='↑';top.setAttribute('aria-label','Back to top');top.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));document.body.appendChild(top);
    }
    if(reduced||!('IntersectionObserver'in window))return;
    const selectors='.wsy-p-card,.wsy-result-shell,.wsy-result,[data-product-card],.product-card,.product-item,.product-grid > .product,#productGrid > .card,.roam-card,.platform-logo-card,.brand-strip .brand-btn,.wx-gta-product,.ws-art-card,.wx-brand-card,.brand-card';
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('wsy-in-view');
          if(entry.target.matches('.wsy-p-card,.wsy-result-shell,.wsy-result,[data-product-card],.product-card,.product-item,.product-grid > .product,#productGrid > .card,.roam-card')){
            const info=productInfo(entry.target);
            if(info.productId)send('product_view',info);
          }
          observer.unobserve(entry.target);
        }
      });
    },{rootMargin:'0px 0px -7% 0px',threshold:.08});
    const decorate=root=>{
      (root||document).querySelectorAll(selectors).forEach((el,i)=>{
        if(el.dataset.wsyMotion==='1')return;
        el.dataset.wsyMotion='1';el.classList.add('wsy-motion-item','wsy-motion-hover');
        el.style.setProperty('--wsy-motion-delay',Math.min(i%7,6)*45+'ms');
        observer.observe(el);
      });
    };
    decorate();
    if('MutationObserver'in window)new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches&&n.matches(selectors))decorate(n.parentNode);else decorate(n)}}))).observe(document.body,{childList:true,subtree:true});
  }
  let scrollQueued=false;
  function onScroll(){
    if(scrollQueued)return;scrollQueued=true;
    requestAnimationFrame(()=>{
      scrollQueued=false;
      const doc=document.documentElement,max=doc.scrollHeight-doc.clientHeight,progress=max>0?(doc.scrollTop/max)*100:0;
      const bar=document.getElementById('wsy-scroll-progress'),top=document.getElementById('wsy-back-top');
      if(bar)bar.style.width=progress.toFixed(2)+'%';
      if(top)top.classList.toggle('is-visible',doc.scrollTop>420);
    });
  }
  document.addEventListener('click',event=>{
    const target=event.target;
    const save=target.closest&&target.closest('[data-wsy-save]');
    const compare=target.closest&&target.closest('[data-wsy-compare]');
    if(save){send('wishlist_toggle',{productId:safeText(save.getAttribute('data-wsy-save'),80)});return}
    if(compare){send('compare_toggle',{productId:safeText(compare.getAttribute('data-wsy-compare'),80)});return}
    const brand=target.closest&&target.closest('[data-brand-filter],.brand-filter,[data-filter-brand],.brand-strip .brand-btn');
    if(brand){send('brand_filter',{brand:safeText(brand.getAttribute('data-brand-filter')||brand.getAttribute('data-filter-brand')||brand.dataset.brand||brand.textContent)});return}
    const category=target.closest&&target.closest('[data-category-filter],.category-filter,[data-filter-category]');
    if(category){send('category_filter',{category:safeText(category.getAttribute('data-category-filter')||category.getAttribute('data-filter-category')||category.textContent)});return}
    const outbound=target.closest&&target.closest('a[href]');
    if(outbound&&/amazon\.in|awin1\.com/i.test(outbound.href)){
      const card=outbound.closest('.wsy-p-card,.wsy-result-shell,.wsy-result,[data-product-card],.product-card,.product-item')||outbound;
      send('product_click',productInfo(card));
    }
  },{passive:true});
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target&&event.target.matches('#wsy-search-input,#search,[type="search"],[data-wsy-search]'))send('search_submit',{});
  });
  document.addEventListener('change',event=>{const el=event.target;if(!el||!el.matches)return;if(el.matches('#brandFilter,[data-brand-filter],.brand-filter'))send('brand_filter',{brand:safeText(el.value||el.getAttribute('data-brand-filter'))});else if(el.matches('#categoryFilter,[data-category-filter],.category-filter'))send('category_filter',{category:safeText(el.value||el.getAttribute('data-category-filter'))})});\n  window.addEventListener('scroll',onScroll,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addMotion();onScroll();send('page_view',{})},{once:true});
  else {addMotion();onScroll();send('page_view',{})}
})();
