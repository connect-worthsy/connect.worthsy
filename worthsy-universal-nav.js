(()=> {
 'use strict';
 const closeMenu=(menu,button)=>{
  if(!menu||!button)return;
  menu.hidden=true;
  menu.classList.remove('is-open');
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Open affiliate platform menu');
 };
 const openMenu=(menu,button)=>{
  menu.hidden=false;
  menu.classList.add('is-open');
  button.setAttribute('aria-expanded','true');
  button.setAttribute('aria-label','Close affiliate platform menu');
 };
 function installMotionAssets(){
  if(!document.querySelector('link[data-worthsy-motion]')){const l=document.createElement('link');l.rel='stylesheet';l.href='worthsy-motion.css?v=5';l.setAttribute('data-worthsy-motion','');document.head.appendChild(l);}
  if(!document.querySelector('script[data-worthsy-motion]')){const s=document.createElement('script');s.src='worthsy-motion.js?v=7';s.defer=true;s.setAttribute('data-worthsy-motion','');document.head.appendChild(s);}
 }
 function removeHeaderLinks(){
  const header=document.querySelector('header.worthsy-header.wx-header');
  if(!header)return;
  header.querySelectorAll('a').forEach(a=>{
   const label=(a.textContent||'').trim().replace(/\\s+/g,' ').toLowerCase();
   if(['partners','about','contact'].includes(label))a.remove();
  });
 }
 function init(){
  installMotionAssets();
  removeHeaderLinks();
  const header=document.querySelector('header.worthsy-header.wx-header');
  if(header){new MutationObserver(removeHeaderLinks).observe(header,{childList:true,subtree:true});}
  document.addEventListener('click',(event)=>{
   const button=event.target.closest('#wxShopToggle');
   if(button){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const menu=document.getElementById('wxShopMenu');
    if(!menu)return;
    if(menu.hidden || !menu.classList.contains('is-open'))openMenu(menu,button);
    else closeMenu(menu,button);
    return;
   }
   const menu=document.getElementById('wxShopMenu');
   const toggle=document.getElementById('wxShopToggle');
   if(menu && toggle && !event.target.closest('.wx-shop')){
    closeMenu(menu,toggle);
   }
   if(menu && event.target.closest('#wxShopMenu a'))closeMenu(menu,toggle);
  },true);
  document.addEventListener('keydown',(event)=>{
   if(event.key!=='Escape')return;
   const menu=document.getElementById('wxShopMenu');
   const button=document.getElementById('wxShopToggle');
   if(menu && button && !menu.hidden){closeMenu(menu,button);button.focus();}
  });
  window.addEventListener('hashchange',()=>{
   closeMenu(document.getElementById('wxShopMenu'),document.getElementById('wxShopToggle'));
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();