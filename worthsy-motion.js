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
    if(!document.getElementById('wsy-scroll-progress')){const bar=document.createElement('div');bar.id='wsy-scroll-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar)}
    if(!document.getElementById('wsy-back-top')){const top=document.createElement('button');top.id='wsy-back-top';top.type='button';top.textContent='↑';top.setAttribute('aria-label','Back to top');top.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));document.body.appendChild(top)}
    const revealSelectors='main > section,main > .hero,main > .wrap > .hero,.ws-hero,.hero:not(header .hero),.brand-hero,.brand-signature,.brand-toolbar,.brand-disclaimer,.signature-grid,.wx-gta-campaign,.platform-grid,.search-section,.roam-section,.cta-band,.form-shell,.articles > .article,.articles > article,.article,.hero-art,.hero-visual,.hero-grid > .hero-copy,.hero-grid > .hero-art,.hero-inner > *, .section-head,.wrap > .note,.brand-main,.brand-shell > section,.product-grid > *,#productGrid > .card,#featuredGrid > *, .roam-track > *, .platform-grid > *, .signature-grid > *,.fields > *,footer .grid > div,.wx-footer-social,.wx-foot-bar,.modal-layout > *';
    const cardSelectors='.wsy-p-card,.wsy-result-shell,.wsy-result,[data-product-card],.product-card,.product-item,.product-grid .product,.roam-track .product,#productGrid > .card,.roam-card,.article,.platform-logo-card,.platform,.signature-pick,.wx-gta-product,.ws-art-card,.wx-brand-card,.brand-card,.ws-brand-grid > *,.card';
    const interactiveSelectors='button,.btn,.ws-button,.wx-cta,.wx-gta-cta,.product-buy,.signature-cta,[role="button"]';
    const observer=(!reduced&&'IntersectionObserver'in window)?new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('wsy-in-view');if(entry.target.matches(cardSelectors)){const info=productInfo(entry.target);if(info.productId)send('product_view',info)}observer.unobserve(entry.target)}
    }),{rootMargin:'0px 0px -6% 0px',threshold:.06}):null;
    const decorate=root=>{
      if(!root||!root.querySelectorAll)return;
      const nodes=new Set();
      if(root.nodeType===1&&root.matches(revealSelectors+','+cardSelectors))nodes.add(root);
      root.querySelectorAll(revealSelectors+','+cardSelectors).forEach(el=>nodes.add(el));
      let order=0;
      nodes.forEach(el=>{
        if(el.dataset.wsyMotion==='1'||el.closest('[hidden],[aria-hidden="true"]'))return;
        el.dataset.wsyMotion='1';el.classList.add('wsy-motion-item');
        if(el.matches(cardSelectors))el.classList.add('wsy-motion-hover');
        el.style.setProperty('--wsy-motion-delay',Math.min(order%8,7)*55+'ms');order++;
        if(observer)observer.observe(el);else el.classList.add('wsy-in-view');
      });
      root.querySelectorAll(interactiveSelectors).forEach(el=>{if(!el.dataset.wsyInteractive){el.dataset.wsyInteractive='1';el.classList.add('wsy-interactive')}});
      root.querySelectorAll('a[href]').forEach(el=>{if(!el.dataset.wsyLinkMotion){el.dataset.wsyLinkMotion='1';if(!el.closest('header,button,.wx-shop-menu'))el.classList.add('wsy-link-motion')}});
      root.querySelectorAll('input,select,textarea').forEach(el=>{if(!el.dataset.wsyInputMotion){el.dataset.wsyInputMotion='1';el.classList.add('wsy-input-motion')}});
      root.querySelectorAll('.product-card img,.product-item img,.product-grid img,#productGrid img,.article img,.hero-visual img,.hero-art img,.signature-pick img').forEach(el=>el.classList.add('wsy-image-motion'));
    };
    const hero=document.querySelector('.ws-hero,.hero,.brand-hero,.hero-grid,.hero-inner,.wx-gta-campaign');
    if(hero&&!reduced){hero.querySelectorAll('.ws-eyebrow,.eyebrow,.hero-copy,.hero-inner > *,h1,h2,.hero-art,.hero-visual,.hero-actions,.hero-description,.hero-grid > *').forEach((el,i)=>{if(i<12){el.classList.add('wsy-hero-enter');if(i>0)el.classList.add('wsy-hero-delay-'+Math.min(i%4,3))}})}
    decorate(document);
    const pageName=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.body.classList.add(pageName==='index.html'?'wsy-page-scene-home':pageName.includes('sneaker')?'wsy-page-scene-sneaker':pageName==='shop.html'?'wsy-page-scene-shop':(['about.html','career.html','blog.html'].includes(pageName)?'wsy-page-scene-editorial':'wsy-page-scene-brand'));
    function enhanceMotion(root){
      if(!root||!root.querySelectorAll)return;
      const cards=Array.from(root.querySelectorAll(cardSelectors));
      if(root.nodeType===1&&root.matches(cardSelectors))cards.unshift(root);
      cards.forEach(card=>{
        if(card.dataset.wsyTilt!=='1'){
          card.dataset.wsyTilt='1';
          card.classList.add('wsy-tilt-card');
          if(!reduced&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){card.addEventListener('pointermove',event=>{const r=card.getBoundingClientRect(),px=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),py=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));card.style.setProperty('--wsy-tilt-x',((px-.5)*10).toFixed(2)+'deg');card.style.setProperty('--wsy-tilt-y',((.5-py)*10).toFixed(2)+'deg');card.style.setProperty('--wsy-light-x',(px*100).toFixed(1)+'%');card.style.setProperty('--wsy-light-y',(py*100).toFixed(1)+'%')},{passive:true});card.addEventListener('pointerleave',()=>{card.style.setProperty('--wsy-tilt-x','0deg');card.style.setProperty('--wsy-tilt-y','0deg');card.style.setProperty('--wsy-light-x','50%');card.style.setProperty('--wsy-light-y','50%')},{passive:true})}
          const badge=card.querySelector('[class*="badge"],.badge,.product-badge,.discount-badge');
          if(badge)badge.classList.add('wsy-animated-badge');
        }
      });
      const magnets=Array.from(root.querySelectorAll('button,.btn,.ws-button,.wx-cta,.wx-gta-cta,.product-buy,[role="button"]'));
      if(root.nodeType===1&&root.matches('button,.btn,.ws-button,.wx-cta,.wx-gta-cta,.product-buy,[role="button"]'))magnets.unshift(root);
      magnets.forEach(el=>{
        if(el.dataset.wsyMagnetic==='1')return;
        el.dataset.wsyMagnetic='1';
        if(!reduced&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){el.classList.add('wsy-magnetic');el.addEventListener('pointermove',event=>{const r=el.getBoundingClientRect(),dx=Math.max(-7,Math.min(7,(event.clientX-(r.left+r.width/2))*.13)),dy=Math.max(-7,Math.min(7,(event.clientY-(r.top+r.height/2))*.13));el.style.setProperty('--wsy-magnet-x',dx.toFixed(1)+'px');el.style.setProperty('--wsy-magnet-y',dy.toFixed(1)+'px')},{passive:true});el.addEventListener('pointerleave',()=>{el.style.setProperty('--wsy-magnet-x','0px');el.style.setProperty('--wsy-magnet-y','0px')},{passive:true})}
      });
      root.querySelectorAll('.hero-art,.hero-visual,.ws-hero-art,.hero-grid > img,.brand-hero img,.wx-gta-campaign img').forEach(el=>{
        if(!el.dataset.wsyParallax){el.dataset.wsyParallax='1';el.classList.add('wsy-parallax-layer')}
      });
      root.querySelectorAll('.wsy-motion-item').forEach((el,i)=>{
        if(el.dataset.wsyReveal)return;
        el.dataset.wsyReveal='1';
        if(el.matches(cardSelectors))el.classList.add('wsy-reveal-scale');
        else if(/hero|brand-signature|signature-grid|article|form-shell/i.test(el.className||''))el.classList.add(i%2?'wsy-reveal-right':'wsy-reveal-left');
        else if(/section|platform|roam|grid|footer/i.test(el.className||''))el.classList.add('wsy-reveal-clip');
      });
    }
    function installCursor(){
      if(reduced||!window.matchMedia('(hover:hover) and (pointer:fine)').matches||document.querySelector('.wsy-cursor-ring'))return;
      const ring=document.createElement('span'),dot=document.createElement('span');
      ring.className='wsy-cursor-ring';dot.className='wsy-cursor-dot';ring.setAttribute('aria-hidden','true');dot.setAttribute('aria-hidden','true');
      document.body.append(ring,dot);document.body.classList.add('wsy-cursor-ready');
      let x=-100,y=-100,rx=-100,ry=-100,raf=0;
      const paint=()=>{raf=0;rx+=(x-rx)*.24;ry+=(y-ry)*.24;ring.style.transform='translate3d('+rx+'px,'+ry+'px,0)';dot.style.transform='translate3d('+x+'px,'+y+'px,0)';if(Math.abs(x-rx)+Math.abs(y-ry)>.3)raf=requestAnimationFrame(paint)};
      document.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;ring.style.opacity='1';dot.style.opacity='1';if(!raf)raf=requestAnimationFrame(paint)},{passive:true});
      document.addEventListener('pointerover',e=>{const hot=e.target.closest&&e.target.closest('a,button,[role="button"],.wsy-tilt-card');ring.classList.toggle('is-active',!!hot)},{passive:true});
      document.addEventListener('pointerout',e=>{if(!e.relatedTarget){ring.style.opacity='0';dot.style.opacity='0'}},{passive:true});
    }
    function installCurtain(){
      if(reduced||document.querySelector('.wsy-page-curtain'))return;
      const curtain=document.createElement('div');curtain.className='wsy-page-curtain';curtain.setAttribute('aria-hidden','true');document.body.appendChild(curtain);
      requestAnimationFrame(()=>curtain.classList.add('is-entering'));
      setTimeout(()=>curtain.classList.remove('is-entering'),560);
      document.addEventListener('click',event=>{
        const link=event.target.closest&&event.target.closest('a[href]');
        if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        if(link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
        let url;try{url=new URL(link.href,location.href)}catch(_){return}
        if(url.origin!==location.origin||url.pathname===location.pathname||/^mailto:|^tel:/i.test(link.href))return;
        if(/\.(pdf|zip|png|jpe?g|webp|svg|mp4)$/i.test(url.pathname))return;
        event.preventDefault();
        if(curtain.dataset.busy==='1')return;
        curtain.dataset.busy='1';curtain.classList.remove('is-entering');curtain.classList.add('is-leaving');
        setTimeout(()=>location.assign(url.href),520);
      },true);
      window.addEventListener('pageshow',()=>{curtain.dataset.busy='';curtain.classList.remove('is-leaving');curtain.classList.add('is-entering');setTimeout(()=>curtain.classList.remove('is-entering'),520)});
    }
    enhanceMotion(document);
    installCursor();
    installCurtain();

    if('MutationObserver'in window&&!window.WORTHSY_MOTION_OBSERVER){window.WORTHSY_MOTION_OBSERVER=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){decorate(n);enhanceMotion(n)}})));window.WORTHSY_MOTION_OBSERVER.observe(document.body,{childList:true,subtree:true})}
  }
  let scrollQueued=false;
  function onScroll(){
    if(scrollQueued)return;scrollQueued=true;
    requestAnimationFrame(()=>{
      scrollQueued=false;
      const doc=document.documentElement,max=doc.scrollHeight-doc.clientHeight,progress=max>0?(doc.scrollTop/max)*100:0;
      if(!reduced&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){document.querySelectorAll('.wsy-parallax-layer').forEach(el=>{const r=el.getBoundingClientRect(),offset=Math.max(-28,Math.min(28,(window.innerHeight/2-(r.top+r.height/2))*.035));el.style.setProperty('--wsy-parallax-y',offset.toFixed(1)+'px')})}
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
      const card=outbound.closest('.wsy-p-card,.wsy-result-shell,.wsy-result,[data-product-card],.product-card,.product-item,.product-grid .product,.roam-track .product,#productGrid > .card,.roam-card')||outbound;
      send('product_click',productInfo(card));
    }
  },{passive:true});
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target&&event.target.matches('#wsy-search-input,#search,[type="search"],[data-wsy-search]'))send('search_submit',{});
  });
  document.addEventListener('change',event=>{const el=event.target;if(!el||!el.matches)return;if(el.matches('#brandFilter,[data-brand-filter],.brand-filter'))send('brand_filter',{brand:safeText(el.value||el.getAttribute('data-brand-filter'))});else if(el.matches('#categoryFilter,[data-category-filter],.category-filter'))send('category_filter',{category:safeText(el.value||el.getAttribute('data-category-filter'))})});
  window.addEventListener('scroll',onScroll,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addMotion();onScroll();send('page_view',{})},{once:true});
  else {addMotion();onScroll();send('page_view',{})}
})();
