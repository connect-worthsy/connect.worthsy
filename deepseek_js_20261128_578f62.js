function card(p){
  return `<article class="card">
    <div class="thumb"><span class="thumb-mono">${p.name.charAt(0)}</span></div>
    <div class="card-body">
      <span class="card-brand">${p.brand}</span>
      <h3 class="card-title">${p.name}</h3>
      <p class="card-desc">${p.desc}</p>
      <div class="card-foot"><span class="price">${p.price}</span><span class="card-link">View →</span></div>
    </div>
  </article>`;
}