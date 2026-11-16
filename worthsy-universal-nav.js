(()=>{
  const mount=async()=>{
    if(document.querySelector('body>header.worthsy-header'))return;
    document.querySelectorAll('body>header').forEach(h=>h.remove());
    try{
      const response=await fetch(new URL('index.html',location.href).href,{cache:'no-cache'});
      if(!response.ok)throw new Error('Could not load the homepage header');
      const html=await response.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const source=doc.querySelector('body>header.worthsy-header');
      if(!source)throw new Error('Homepage header not found');
      const bar=source.cloneNode(true);
      // Keep the homepage header's exact markup; only make its in-page links work from other pages.
      bar.querySelectorAll('a[href^="#"]').forEach(a=>a.setAttribute('href','index.html'+a.getAttribute('href')));
      bar.querySelectorAll('a[href^="index.html#"]').forEach(a=>a.setAttribute('href',new URL(a.getAttribute('href'),location.href).pathname.split('/').pop()+a.getAttribute('href').slice('index.html'.length)));
      document.body.prepend(bar);
      const shopToggle=bar.querySelector('#wxShopToggle'),shopMenu=bar.querySelector('#wxShopMenu');
      shopToggle?.addEventListener('click',()=>{const open=shopMenu.hidden;shopMenu.hidden=!open;shopToggle.setAttribute('aria-expanded',String(open))});
      document.addEventListener('click',e=>{if(!e.target.closest('.wx-shop')){if(shopMenu)shopMenu.hidden=true;if(shopToggle)shopToggle.setAttribute('aria-expanded','false')}});
      const mobileBtn=bar.querySelector('#mobileMenuBtn'),mobile=bar.querySelector('#mobileMenu');
      mobileBtn?.addEventListener('click',()=>{const open=mobile.classList.contains('hidden');mobile.classList.toggle('hidden',!open);mobileBtn.setAttribute('aria-expanded',String(open));mobileBtn.innerHTML=open?'<i class="fa-solid fa-xmark text-xl"></i>':'<i class="fa-solid fa-bars text-xl"></i>'});
      bar.querySelector('#uniSearchBtn')?.addEventListener('click',()=>location.href='index.html#top');
    }catch(error){console.error('WORTHSY shared header:',error)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
