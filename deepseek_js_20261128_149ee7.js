const pages = document.querySelectorAll('[data-page]');
const navLinks = document.querySelectorAll('.nav a[data-route]');
function route(){
  let h = location.hash.replace(/^#\/?/, '') || 'home';
  if(![...pages].some(p=>p.dataset.page===h)) h='home';
  pages.forEach(p=>p.classList.toggle('active', p.dataset.page===h));
  navLinks.forEach(a=>a.classList.toggle('active', a.dataset.route===h));
  main.scrollTop=0;
  document.title = titles[h] || 'WORTHSY';
  closeSidebar();
}
window.addEventListener('hashchange', route);