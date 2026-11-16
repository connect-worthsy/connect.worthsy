(()=>{
  const mount=()=>{
    if(document.querySelector('body>header.worthsy-header.wx-header[data-homepage-exact="true"]'))return;
    document.querySelectorAll('body>header').forEach(h=>h.remove());

    // Render the real homepage in a same-origin, off-screen frame at this viewport.
    // Copy its computed styles onto the cloned header so page-specific CSS cannot restyle it.
    const frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');
    frame.tabIndex=-1;
    frame.style.cssText='position:fixed;left:-20000px;top:0;width:'+window.innerWidth+'px;height:'+window.innerHeight+'px;border:0;visibility:hidden;pointer-events:none';
    frame.onload=()=>{
      try{
        const sourceDoc=frame.contentDocument;
        const source=sourceDoc.querySelector('body>header.worthsy-header.wx-header');
        if(!source)throw new Error('Homepage header not found');
        const bar=source.cloneNode(true);
        const originals=[source,...source.querySelectorAll('*')];
        const clones=[bar,...bar.querySelectorAll('*')];
        originals.forEach((node,index)=>{
          const clone=clones[index];
          if(!clone)return;
          const computed=frame.contentWindow.getComputedStyle(node);
          for(let i=0;i<computed.length;i++){
            const prop=computed[i];
            clone.style.setProperty(prop,computed.getPropertyValue(prop),'important');
          }
          clone.style.setProperty('box-sizing','border-box','important');
        });
        bar.setAttribute('data-homepage-exact','true');
        // Convert homepage section anchors into links back to the homepage from inner pages.
        bar.querySelectorAll('a[href^="#"]').forEach(a=>a.setAttribute('href','index.html'+a.getAttribute('href')));
        document.body.prepend(bar);
        document.body.style.setProperty('padding-top',bar.getBoundingClientRect().height+'px','important');

        const shopToggle=bar.querySelector('#wxShopToggle'),shopMenu=bar.querySelector('#wxShopMenu');
        if(shopMenu)shopMenu.style.setProperty('display','none','important');
        shopToggle?.addEventListener('click',()=>{
          const open=shopMenu.hidden;
          shopMenu.hidden=!open;
          shopMenu.style.setProperty('display',open?'block':'none','important');
          shopToggle.setAttribute('aria-expanded',String(open));
        });
        document.addEventListener('click',e=>{
          if(!e.target.closest('.wx-shop')){
            if(shopMenu){shopMenu.hidden=true;shopMenu.style.setProperty('display','none','important')}
            shopToggle?.setAttribute('aria-expanded','false');
          }
        });
        const mobileBtn=bar.querySelector('#mobileMenuBtn'),mobile=bar.querySelector('#mobileMenu');
        if(mobile)mobile.style.setProperty('display','none','important');
        mobileBtn?.addEventListener('click',()=>{
          const open=mobile.classList.contains('hidden');
          mobile.classList.toggle('hidden',!open);
          mobile.style.setProperty('display',open?'block':'none','important');
          mobileBtn.setAttribute('aria-expanded',String(open));
          mobileBtn.innerHTML=open?'<i class="fa-solid fa-xmark text-xl"></i>':'<i class="fa-solid fa-bars text-xl"></i>';
        });
        bar.querySelector('#uniSearchBtn')?.addEventListener('click',()=>location.href='index.html#top');
      }catch(error){console.error('WORTHSY exact homepage header:',error)}
      finally{frame.remove()}
    };
    frame.onerror=()=>{console.error('WORTHSY could not load homepage styles');frame.remove()};
    frame.src=new URL('index.html',location.href).href;
    document.body.appendChild(frame);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();