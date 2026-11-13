/* PLANERVO – blog lista és bejegyzés */
(async function () {
  const main = document.getElementById('blogMain');
  const slug = new URLSearchParams(location.search).get('p');
  let TX = { ...TEXT_DEFAULTS };
  try { TX = await loadTexts(); } catch (e) { /* alapértelmezett szövegek */ }
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TX[el.dataset.t] || ''; });

  const msg = html => { main.innerHTML = `<div class="wrap blog-top post-body">${html}</div>`; };
  if (!sb) return msg('<p class="empty">A blog most nem érhető el. Nézz vissza később.</p>');
  const now = new Date().toISOString();

  if (slug) {
    const { data: p, error } = await sb.from('posts').select('*').eq('slug', slug).eq('published', true).lte('published_at', now).maybeSingle();
    if (error || !p) return msg('<a class="back" href="blog.html">Vissza a bloghoz</a><h1>Ez a bejegyzés nem található.</h1><p class="empty">Lehet, hogy a címe megváltozott, vagy már nem elérhető.</p>');
    document.title = `${p.title} – PLANERVO blog`;
    const d = document.querySelector('meta[name=description]'); if (d && p.excerpt) d.content = p.excerpt;
    main.innerHTML = `<article>
      ${p.cover_url ? `<img class="post-cover" src="${esc(p.cover_url)}" alt="">` : '<div class="blog-top"></div>'}
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
  main.innerHTML = `<section class="band"><div class="wrap blog-top" style="padding-top:calc(60px + env(safe-area-inset-top,0px))">
    <h1 style="font-size:clamp(3rem,8vw,6rem)">${esc(TX.blog_title)}</h1>
    ${TX.blog_text ? `<p class="lead">${esc(TX.blog_text)}</p>` : ''}
    ${(data || []).length ? `<div class="posts">${data.map(p => `<a class="post-card" href="blog.html?p=${encodeURIComponent(p.slug)}">
      <div class="cv">${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="" loading="lazy">` : ''}</div>
      <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time><h3>${esc(p.title)}</h3>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</a>`).join('')}</div>`
      : '<p class="empty" style="margin-top:32px">Még nincs bejegyzés. Hamarosan jelentkezünk az elsővel.</p>'}
  </div></section>`;
})();
