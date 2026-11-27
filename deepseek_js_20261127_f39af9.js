(function () {
  var root = document.documentElement;
  var body = document.body;

  /* ---- theme ---- */
  var themeBtn   = document.getElementById('themeBtn');
  var themeIcon  = document.getElementById('themeIcon');
  var themeLabel = document.getElementById('themeLabel');

  function paintTheme(t) {
    root.setAttribute('data-theme', t);
    var dark = t === 'dark';
    if (themeIcon)  themeIcon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (themeLabel) themeLabel.textContent = dark ? 'Light mode' : 'Dark mode';
  }

  var saved = null;
  try { saved = localStorage.getItem('worthsy-theme'); } catch (e) {}
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    saved = 'dark';
  }
  paintTheme(saved || 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      paintTheme(next);
      try { localStorage.setItem('worthsy-theme', next); } catch (e) {}
    });
  }

  /* ---- desktop collapse ---- */
  var collapseBtn = document.getElementById('collapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      body.classList.toggle('nav-collapsed');
    });
  }

  /* ---- mobile drawer ---- */
  var scrim = document.getElementById('scrim');
  var menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { body.classList.toggle('nav-open'); });
  }
  if (scrim) {
    scrim.addEventListener('click', function () { body.classList.remove('nav-open'); });
  }
  document.querySelectorAll('.sidebar a').forEach(function (a) {
    a.addEventListener('click', function () { body.classList.remove('nav-open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') body.classList.remove('nav-open');
  });

  /* ---- auto-highlight the current page in the sidebar ---- */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(function (a) {
    var raw = a.getAttribute('href') || '';
    if (raw.indexOf('#') !== -1) return;          // skip in-page anchors
    if (raw === here) a.classList.add('active');
  });

  /* ---- breadcrumb from <body data-page="..."> ---- */
  var crumbTarget = document.querySelector('.crumb b');
  if (crumbTarget && body.dataset.page) {
    crumbTarget.textContent = body.dataset.page;
  }
})();