(()=> {
 'use strict';
 function wire(header){
  if(!header || header.dataset.sharedReady==='true') return;
  header.dataset.sharedReady='true';
  const shop=header.querySelector('.wx-shop');
  const toggle=header.querySelector('#wxShopToggle');
  const menu=header.querySelector('#wxShopMenu');
  if(toggle && menu){
   const setOpen=(open)=>{
    menu.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close affiliate platform menu':'Open affiliate platform menu');
   };
   toggle.addEventListener('click',(event)=>{
    event.preventDefault();
    event.stopPropagation();
    setOpen(menu.hidden);
   });
   menu.addEventListener('click',(event)=>{
    if(event.target.closest('a')) setOpen(false);
   });
   document.addEventListener('click',(event)=>{
    if(shop && !shop.contains(event.target)) setOpen(false);
   });
   document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape' && !menu.hidden){setOpen(false);toggle.focus();}
   });
   window.addEventListener('hashchange',()=>setOpen(false));
  }
  const mobileBtn=header.querySelector('#mobileMenuBtn');
  const mobile=header.querySelector('#mobileMenu');
  if(mobileBtn && mobile){
   mobileBtn.addEventListener('click',()=>{
    const open=!mobile.classList.contains('is-open');
    mobile.classList.toggle('is-open',open);
    mobileBtn.setAttribute('aria-expanded',String(open));
    mobileBtn.innerHTML=open?'<i class="fa-solid fa-xmark text-xl"></i>':'<i class="fa-solid fa-bars text-xl"></i>';
   });
  }
 }
 function mount(){
  let header=document.querySelector('body>header.worthsy-header.wx-header');
  if(!header){header=document.querySelector('header.worthsy-header.wx-header');}
  if(header){wire(header);return;}
  fetch('index.html',{cache:'no-store'}).then(response=>{
   if(!response.ok) throw new Error('HTTP '+response.status);
   return response.text();
  }).then(html=>{
   const parsed=new DOMParser().parseFromString(html,'text/html');
   const source=parsed.querySelector('body>header.worthsy-header.wx-header');
   if(!source) throw new Error('Homepage header not found');
   header=source.cloneNode(true);
   document.querySelectorAll('body>header').forEach(el=>el.remove());
   document.body.prepend(header);
   wire(header);
  }).catch(error=>console.error('WORTHSY navigation failed:',error));
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();