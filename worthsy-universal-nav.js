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
 function init(){
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