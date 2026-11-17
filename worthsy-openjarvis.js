(function(){
'use strict';
if(window.WORTHSY_OPENJARVIS_UI)return;
window.WORTHSY_OPENJARVIS_UI=true;
var cfg=window.WORTHSY_OPENJARVIS_CONFIG||{};
var endpoint=(String(cfg.apiBase||'').replace(/\/+$/,'')+(cfg.chatPath||'/openjarvis/chat'));
var enabled=cfg.enabled===true&&!!cfg.apiBase;
var panel=document.createElement('section');
panel.id='wsy-jarvis-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','WORTHSY AI shopping assistant');
panel.innerHTML='<div id="wsy-jarvis-head"><div id="wsy-jarvis-mark" aria-hidden="true">✳</div><div><div id="wsy-jarvis-title">WORTHSY AI Assistant</div><div id="wsy-jarvis-sub">POWERED BY OPENJARVIS</div></div><button id="wsy-jarvis-close" type="button" aria-label="Close assistant">×</button></div><div id="wsy-jarvis-log" role="log" aria-live="polite"><div class="wsy-jarvis-msg bot">Hey! I can help you discover products, compare options and shop by budget. What are you looking for?</div><div id="wsy-jarvis-suggestions"><button class="wsy-jarvis-suggest" type="button" data-prompt="Find gaming laptops under ₹70,000">Gaming laptops under ₹70k</button><button class="wsy-jarvis-suggest" type="button" data-prompt="Recommend wireless headphones">Wireless headphones</button><button class="wsy-jarvis-suggest" type="button" data-prompt="Help me compare smartphones">Compare smartphones</button></div></div><div><div id="wsy-jarvis-status" role="status"></div><form id="wsy-jarvis-form"><input id="wsy-jarvis-input" maxlength="600" autocomplete="off" placeholder="Ask WORTHSY AI..." aria-label="Message WORTHSY AI"><button id="wsy-jarvis-send" type="submit" aria-label="Send message">➤</button></form></div>';
document.body.appendChild(panel);
var launch=document.createElement('button');launch.id='wsy-jarvis-launch';launch.type='button';launch.innerHTML='<span class="wsy-j-spark">✳</span><span>Ask WORTHSY AI</span>';launch.setAttribute('aria-controls',panel.id);launch.setAttribute('aria-expanded','false');document.body.appendChild(launch);
var log=panel.querySelector('#wsy-jarvis-log'),input=panel.querySelector('#wsy-jarvis-input'),form=panel.querySelector('#wsy-jarvis-form'),send=panel.querySelector('#wsy-jarvis-send'),status=panel.querySelector('#wsy-jarvis-status'),history=[];
function open(prefill){panel.classList.add('open');launch.setAttribute('aria-expanded','true');if(prefill){input.value=prefill;}if(enabled){status.textContent='AI shopping assistant';input.disabled=false;send.disabled=false;}else{status.textContent='Staging preview';input.disabled=true;send.disabled=true;if(!panel.querySelector('#wsy-jarvis-connect-note')){var note=document.createElement('div');note.id='wsy-jarvis-connect-note';note.textContent='The customer interface is installed on this staging branch. The OpenJarvis server is not connected yet, so chat is paused until the private AI service and gateway are deployed and tested.';log.appendChild(note);}}if(enabled)input.focus();}
function close(){panel.classList.remove('open');launch.setAttribute('aria-expanded','false');}
function addMessage(role,text){var el=document.createElement('div');el.className='wsy-jarvis-msg '+(role==='user'?'user':'bot');el.textContent=text;log.appendChild(el);log.scrollTop=log.scrollHeight;return el;}
function ask(q){open();if(!enabled)return;var text=String(q||'').trim();if(!text)return;addMessage('user',text);history.push({role:'user',content:text});input.value='';send.disabled=true;status.textContent='Thinking…';fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-8)})}).then(function(r){if(!r.ok)throw new Error(r.status===503?'The AI service is not available yet.':'The assistant could not complete that request.');return r.json();}).then(function(data){var reply=String(data.reply||'I could not prepare an answer.');addMessage('assistant',reply);history.push({role:'assistant',content:reply});history=history.slice(-8);status.textContent='Powered by OpenJarvis';}).catch(function(err){addMessage('assistant',err.message||'Please try again shortly.');status.textContent='Connection unavailable';}).finally(function(){send.disabled=false;input.focus();});}
launch.addEventListener('click',function(){panel.classList.contains('open')?close():open();});
panel.querySelector('#wsy-jarvis-close').addEventListener('click',close);
panel.querySelectorAll('[data-prompt]').forEach(function(b){b.addEventListener('click',function(){ask(b.getAttribute('data-prompt'));});});
form.addEventListener('submit',function(e){e.preventDefault();ask(input.value);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
window.WORTHSY_OPENJARVIS_OPEN=function(q){open(q||'');if(q&&enabled)ask(q);};
/* Add an AI hand-off beside the existing universal-search controls without replacing search. */
function addAskButton(anchor,queryFn){if(!anchor||!anchor.parentElement||anchor.parentElement.querySelector('.wsy-ask-ai'))return;var b=document.createElement('button');b.type='button';b.className='wsy-ask-ai';b.textContent='✳ Ask AI about this';b.addEventListener('click',function(){var q=queryFn();window.WORTHSY_OPENJARVIS_OPEN(q||'');});anchor.parentElement.insertBefore(b,anchor.nextSibling);}
function connectSearch(){var searchInput=document.getElementById('modalSearch');if(searchInput){var row=searchInput.parentElement;addAskButton(row,function(){return searchInput.value.trim();});}
var universal=document.getElementById('wsy-search-input');if(universal){var wrap=document.getElementById('wsy-search-input-wrap');addAskButton(wrap,function(){return universal.value.trim();});}}
connectSearch();
var observer=new MutationObserver(connectSearch);observer.observe(document.body,{childList:true,subtree:true});
})();
