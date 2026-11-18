/* PLANERVO – blog: lista és egyes bejegyzések (blog.html?p=webcim) */
(async function () {
  const main = document.getElementById('main');
  const slug = new URLSearchParams(location.search).get('p');
  const TX = await loadTextsSafe();
  const base = siteBase(TX);
  applyDataTexts(TX);

  const card = p => `<a class="post-card" href="blog.html?p=${encodeURIComponent(p.slug)}">
    <div class="cv">${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="${esc(p.title)}" loading="lazy">` : ''}</div>
    <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time><h2>${esc(p.title)}</h2>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</a>`;
  const msg = html => { main.innerHTML = `<div class="wrap page-top page-body">${html}</div>`; };
  const ld = obj => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(obj); document.head.appendChild(s); };
  const now = new Date().toISOString();

  if (!slug) {
    applyPageTexts('blog', TX);
    const own = (TX.pages || {}).blog || {};
    const h1 = document.querySelector('[data-edit="h1"]'), lead = document.querySelector('[data-edit="lead"]');
    if (!own.h1 && TX.blog_title) h1.textContent = TX.blog_title;
    if (!own.lead) lead.textContent = TX.blog_text || '';
    lead.hidden = !lead.textContent.trim();
    const info = document.getElementById('blogMsg');
    if (!sb) { info.textContent = 'A blog most nem érhető el. Nézz vissza később.'; return; }
    const { data, error } = await sb.from('posts').select('title,slug,excerpt,cover_url,published_at')
      .eq('published', true).lte('published_at', now).order('published_at', { ascending: false });
    if (error) { info.textContent = 'A bejegyzések betöltése nem sikerült. Frissítsd az oldalt.'; return; }
    const rows = data || [];
    document.getElementById('postList').innerHTML = rows.map(card).join('');
    info.textContent = rows.length ? '' : 'Még nincs bejegyzés. Hamarosan jelentkezem az elsővel.';
    info.hidden = !!rows.length;
    if (rows.length) ld({ '@context': 'https://schema.org', '@type': 'Blog', name: h1.textContent, url: base + '/blog.html', inLanguage: 'hu',
      publisher: { '@id': base + '/#ceg' },
      blogPost: rows.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${base}/blog.html?p=${encodeURIComponent(p.slug)}`, datePublished: p.published_at })) });
    return;
  }

  if (!sb) return msg('<p class="empty">A blog most nem érhető el. Nézz vissza később.</p>');
  const { data: p, error } = await sb.from('posts').select('*').eq('slug', slug).eq('published', true).lte('published_at', now).maybeSingle();
  if (error || !p) {
    setMeta('name', 'robots', 'noindex');
    document.title = 'A bejegyzés nem található – PLANERVO blog';
    return msg('<a class="back" href="blog.html">Vissza a bloghoz</a><h1>Ez a bejegyzés nem található.</h1><p class="empty">Lehet, hogy a címe megváltozott, vagy már nem elérhető.</p>');
  }

  const url = `${base}/blog.html?p=${encodeURIComponent(p.slug)}`;
  const img = /^https?:/i.test(p.cover_url || '') ? p.cover_url : base + '/assets/img/og-planervo.jpg';
  document.title = `${p.title} – PLANERVO blog`;
  document.querySelector('link[rel=canonical]').href = url;
  setMeta('name', 'description', p.excerpt);
  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:title', p.title);
  setMeta('property', 'og:description', p.excerpt);
  setMeta('property', 'og:image', img);
  setMeta('property', 'og:image:alt', p.title);
  setMeta('property', 'article:published_time', p.published_at);
  setMeta('property', 'article:modified_time', p.updated_at || p.published_at);
  if (img !== base + '/assets/img/og-planervo.jpg') {
    document.querySelector('meta[property="og:image:width"]').remove();
    document.querySelector('meta[property="og:image:height"]').remove();
  }
  ld([
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, inLanguage: 'hu', url, mainEntityOfPage: url, image: img,
      datePublished: p.published_at, dateModified: p.updated_at || p.published_at, ...(p.excerpt ? { description: p.excerpt } : {}),
      author: { '@type': 'Person', name: TX.legal_name || 'PLANERVO', url: base + '/' },
      publisher: { '@type': 'Organization', '@id': base + '/#ceg', name: 'PLANERVO', logo: { '@type': 'ImageObject', url: base + '/assets/img/planervo-logo.png' } } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Főoldal', item: base + '/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: base + '/blog.html' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url }] }
  ]);
  document.getElementById('ldcrumbs').remove();

  main.innerHTML = `<article>
    ${p.cover_url ? `<div class="wrap post-cover-wrap"><img class="post-cover" src="${esc(p.cover_url)}" alt="${esc(p.title)}"></div>` : '<div class="page-top"></div>'}
    <header class="wrap post-head">
      <nav class="crumbs" aria-label="Morzsamenü"><ol><li><a href="./">Főoldal</a></li><li><a href="blog.html">Blog</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
      <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time>
      <h1>${esc(p.title)}</h1>
      ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
    </header>
    <div class="wrap page-body"><div class="prose">${sanitize(p.content)}</div>
      <div class="btns"><a class="btn gold" href="./#arajanlat">Árajánlatot kérek</a><a class="btn o" href="blog.html">További bejegyzések</a></div></div>
  </article>`;
})();
