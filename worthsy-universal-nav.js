(()=>{
 const wire=header=>{
  if(!header||header.dataset.sharedReady==='true')return;
  header.dataset.sharedReady='true';
  const shopToggle=header.querySelector('#wxShopToggle'),shopMenu=header.querySelector('#wxShopMenu');
  shopToggle?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=shopMenu.hidden;shopMenu.hidden=!open;shopToggle.setAttribute('aria-expanded',String(open))});
  document.addEventListener('click',e=>{if(!e.target.closest('.wx-shop')&&shopMenu){shopMenu.hidden=true;shopToggle?.setAttribute('aria-expanded','false')}});
  const mobileBtn=header.querySelector('#mobileMenuBtn'),mobile=header.querySelector('#mobileMenu');
  mobileBtn?.addEventListener('click',()=>{const open=!mobile.classList.contains('is-open');mobile.classList.toggle('is-open',open);mobileBtn.setAttribute('aria-expanded',String(open));mobileBtn.innerHTML=open?'<i class="fa-solid fa-xmark text-xl"></i>':'<i class="fa-solid fa-bars text-xl"></i>'});
  // The shared search engine owns #uniSearchBtn on every page. Never redirect it.
 };
 const loadEnhancements=()=>{\n  if(!document.querySelector('link[data-wsy-motion-style]')){\n   const link=document.createElement('link');link.rel='stylesheet';link.href='worthsy-motion.css?v=1';link.dataset.wsyMotionStyle='true';document.head.appendChild(link);\n  }\n  if(!document.querySelector('script[data-wsy-motion-script]')){\n   const script=document.createElement('script');script.src='worthsy-motion.js?v=2';script.dataset.wsyMotionScript='true';document.head.appendChild(script);\n  }\n };\n const mount=async()=>{\n  loadEnhancements();
  let header=document.querySelector('body>header.worthsy-header.wx-header');
  if(!header){
   try{
    const response=await fetch('index.html',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);
    const parsed=new DOMParser().parseFromString(await response.text(),'text/html');
    header=parsed.querySelector('body>header.worthsy-header.wx-header')?.cloneNode(true);
    if(!header)throw new Error('Homepage header not found');
    document.querySelectorAll('body>header').forEach(el=>el.remove());
    document.body.prepend(header);
   }catch(err){console.error('WORTHSY header load failed',err);return}
  }
  header.querySelectorAll('a[href^="#"]').forEach(a=>a.setAttribute('href','index.html'+a.getAttribute('href')));
  wire(header);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
