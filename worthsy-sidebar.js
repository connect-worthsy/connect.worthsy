/* WORTHSY sidebar collapse: adds a toggle button and remembers the choice. */
(function(){
  var h=document.querySelector('header.wx-header'),root=document.documentElement;
  if(!h||h.querySelector('.wsb-toggle'))return;
  try{if(localStorage.getItem('wsb-min')==='1')root.classList.add('wsb-min')}catch(e){}
  var b=document.createElement('button');
  b.type='button';b.className='wsb-toggle';
  b.innerHTML='<i class="fa-solid fa-table-columns" aria-hidden="true"></i>';
  function sync(){var m=root.classList.contains('wsb-min');
    b.setAttribute('aria-label',m?'Expand sidebar':'Minimise sidebar');b.title=b.getAttribute('aria-label');b.setAttribute('aria-expanded',String(!m))}
  b.addEventListener('click',function(){
    root.classList.toggle('wsb-min');
    try{localStorage.setItem('wsb-min',root.classList.contains('wsb-min')?'1':'0')}catch(e){}
    sync()});
  h.appendChild(b);sync();
})();
