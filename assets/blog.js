/* PLANERVO – blog lista és bejegyzés */
(async function () {
  const main = document.getElementById('blogMain');
  const slug = new URLSearchParams(location.search).get('p');
  let TX = { ...TEXT_DEFAULTS };
  try { TX = await loadTexts(); } catch (e) { /* alapértelmezett szövegek */ }
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TX[el.dataset.t] || ''; });

  /* Keresőknek és megosztáshoz: saját cím, leírás, kép és strukturált adat bejegyzésenként */
  function setMeta(attr, key, val) {
    if (!val) return;
    let m = document.querySelector(`meta[${attr}="${key}"]`);
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.content = val;
  }
  function seoForPost(p) {
    const base = String(TX.site_url || '').replace(/\/+$/, '');
    const abs = u => /^https?:/i.test(u || '') ? u : (base && u ? base + '/' + String(u).replace(/^\/+/, '') : '');
    const url = base ? `${base}/blog.html?p=${encodeURIComponent(p.slug)}` : '';
    const img = abs(p.cover_url) || abs('logo.png');
    setMeta('property', 'og:type', 'article'); setMeta('property', 'og:title', p.title); setMeta('property', 'og:description', p.excerpt);
    setMeta('property', 'og:image', img); setMeta('property', 'og:url', url); setMeta('name', 'twitter:card', img ? 'summary_large_image' : 'summary');
    if (url) { let c = document.querySelector('link[rel=canonical]'); if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); } c.href = url; }
    const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.published_at, dateModified: p.updated_at || p.published_at,
      author: { '@type': 'Organization', name: TX.legal_name || 'PLANERVO' }, publisher: { '@type': 'Organization', name: TX.legal_name || 'PLANERVO' } };
    if (p.excerpt) ld.description = p.excerpt; if (img) ld.image = img; if (url) ld.mainEntityOfPage = url;
    const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
  }

  const msg = html => { main.innerHTML = `<div class="wrap blog-top post-body">${html}</div>`; };
  if (!sb) return msg('<p class="empty">A blog most nem érhető el. Nézz vissza később.</p>');
  const now = new Date().toISOString();

  if (slug) {
    const { data: p, error } = await sb.from('posts').select('*').eq('slug', slug).eq('published', true).lte('published_at', now).maybeSingle();
    if (error || !p) return msg('<a class="back" href="blog.html">Vissza a bloghoz</a><h1>Ez a bejegyzés nem található.</h1><p class="empty">Lehet, hogy a címe megváltozott, vagy már nem elérhető.</p>');
    document.title = `${p.title} – PLANERVO blog`;
    const d = document.querySelector('meta[name=description]'); if (d && p.excerpt) d.content = p.excerpt;
    seoForPost(p);
    main.innerHTML = `<article>
      ${p.cover_url ? `<div class="wrap post-cover-wrap"><img class="post-cover" src="${esc(p.cover_url)}" alt=""></div>` : '<div class="blog-top"></div>'}
      <div class="wrap post-head">
        <a class="back" href="blog.html">Vissza a bloghoz</a><br>
        <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time>
        <h1>${esc(p.title)}</h1>
        ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
      </div>
      <div class="wrap post-body"><div class="prose">${sanitize(p.content)}</div>
        <div class="btns"><a class="btn gold" href="index.html#arajanlat">Árajánlatot kérek</a></div></div>
    </article>`;
    return;
  }

  const { data, error } = await sb.from('posts').select('title,slug,excerpt,cover_url,published_at')
    .eq('published', true).lte('published_at', now).order('published_at', { ascending: false });
  if (error) return msg('<p class="empty">A bejegyzések betöltése nem sikerült. Frissítsd az oldalt.</p>');
  /* az admin „Aloldalak szövegei” menüjében mentett cím és bevezető */
  const own = (TX.pages || {}).blog || {};
  if (own.title) document.title = own.title;
  if (own.desc) setMeta('name', 'description', own.desc);
  const bh = own.h1 || TX.blog_title, bl = own.lead || TX.blog_text;
  main.innerHTML = `<section class="band"><div class="wrap blog-top" style="padding-top:calc(60px + env(safe-area-inset-top,0px))">
    <h1>${esc(bh)}</h1>
    ${bl ? `<p class="lead">${esc(bl)}</p>` : ''}
    ${(data || []).length ? `<div class="posts">${data.map(p => `<a class="post-card" href="blog.html?p=${encodeURIComponent(p.slug)}">
      <div class="cv">${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="" loading="lazy">` : ''}</div>
      <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time><h3>${esc(p.title)}</h3>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</a>`).join('')}</div>`
      : '<p class="empty" style="margin-top:32px">Még nincs bejegyzés. Hamarosan jelentkezem az elsővel.</p>'}
  </div></section>`;
})();
