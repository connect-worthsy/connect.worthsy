var here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-item').forEach(function(a){
  var href = a.getAttribute('href').split('#')[0];
  if (href === here) a.classList.add('active');
});