/* PLANERVO – főoldal */
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let TX = { ...TEXT_DEFAULTS };

  /* ---------- Szövegek ---------- */
  function applyTexts() {
    $$('[data-t]').forEach(el => {
      const v = TX[el.dataset.t];
      el.textContent = v == null ? '' : String(v);
      if (el.tagName === 'P' || el.tagName === 'EM') el.hidden = !v;
    });
    if (TX.logo_url) $('#heroLogo').src = TX.logo_url;
    renderContact();
  }

  function renderContact() {
    const tel = String(TX.phone || '').replace(/[^\d+]/g, '');
    const rows = [];
    if (TX.phone) rows.push(`<div><span>Telefon</span><a href="tel:${esc(tel)}">${esc(TX.phone)}</a></div>`);
    if (TX.email) rows.push(`<div><span>E-mail</span><a href="mailto:${esc(TX.email)}">${esc(TX.email)}</a></div>`);
    if (TX.area) rows.push(`<div><span>Munkaterület</span><p>${esc(TX.area)}</p></div>`);
    if (TX.hours) rows.push(`<div><span>Elérhetőség</span><p>${esc(TX.hours)}</p></div>`);
    $('#contactBox').innerHTML = rows.join('');
    const so = [['facebook_url', 'Facebook'], ['instagram_url', 'Instagram'], ['youtube_url', 'YouTube']]
      .filter(([k]) => TX[k]).map(([k, n]) => `<a href="${esc(TX[k])}" target="_blank" rel="noopener">${n}</a>`);
    $('#socials').innerHTML = so.join('');
    const ch = $('#chanLink');
    if (TX.youtube_url) { ch.href = TX.youtube_url; ch.hidden = false; } else ch.hidden = true;
  }

  /* ---------- Menü háttér görgetéskor ---------- */
  const nav = $('#topnav'), track = $('#track');
  function navState() { nav.classList.toggle('solid', track.getBoundingClientRect().bottom < 80); }

  /* ---------- Főoldal teteje: a henger oszlopról oszlopra aranyra festi a logót ----------
     A festés éle pontosan a henger fejének középvonalán fut, a henger feje pedig pontosan
     egy oszlop szélességű. A kivágás (clip-path) a henger dőlését is követi. */
  const stage = $('#stage'), L1 = $('#L1'), roller = $('#roller'), hint = $('#hint');
  const naps = $$('#roller .nap');
  const cl = v => Math.min(1, Math.max(0, v));
  const ease = t => t * t * (3 - 2 * t);
  const HEAD_W = 206, HEAD_CX = 107, HEAD_CY = 26, HANDLE_DOWN = 212;   // az SVG mértékegységei (a fogantyú alja y=236)
  let G = null;

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (G && G.W === W && G.H === H) return G;
    const n = W < 640 ? 2 : Math.max(3, Math.round(W / 340));          // oszlopok száma
    const col = W / n, hw = col + 3, s = hw / HEAD_W;                  // a fej kicsit szélesebb, mint az oszlop
    const cx = j => (j + .5) * col;
    const yEnd = j => (j % 2 ? 0 : H);
    const segs = [{ k: 'in', j: 0, x0: cx(0), x1: cx(0), y0: -(HANDLE_DOWN * s + 40), y1: 0 }];
    for (let j = 0; j < n; j++) {
      const down = j % 2 === 0;
      segs.push({ k: 'paint', j, x0: cx(j), x1: cx(j), y0: down ? 0 : H, y1: down ? H : 0 });
      if (j < n - 1) segs.push({ k: 'move', j, x0: cx(j), x1: cx(j + 1), y0: yEnd(j), y1: yEnd(j) });
    }
    const lastDown = (n - 1) % 2 === 0, ly = yEnd(n - 1);
    segs.push({ k: 'out', j: n - 1, x0: cx(n - 1), x1: cx(n - 1), y0: ly, y1: lastDown ? H + HEAD_CY * s + 40 : -(HANDLE_DOWN * s + 40) });
    let total = 0;
    segs.forEach(g => { g.len = g.k === 'move' ? col * .8 : Math.max(1, Math.abs(g.y1 - g.y0)); g.at = total; total += g.len; });
    const scroll = total / 1.5;                                        // a henger 1,5-szer gyorsabban halad, mint a görgetés
    track.style.height = (scroll + H) + 'px';
    roller.style.width = (230 * s) + 'px';
    return G = { W, H, n, col, s, segs, total, scroll };
  }

  function hero() {
    const g = layout(), { W, H, n, col, s, segs, total } = g;
    const p = cl(-track.getBoundingClientRect().top / g.scroll), d = p * total;

    /* hol tart a henger? */
    let i = 0;
    while (i < segs.length - 1 && d > segs[i].at + segs[i].len) i++;
    const sg = segs[i], t = cl((d - sg.at) / sg.len);
    let x = sg.x0 + (sg.x1 - sg.x0) * (sg.k === 'move' ? ease(t) : t);
    const y = sg.y0 + (sg.y1 - sg.y0) * t;
    const down = sg.j % 2 === 0;
    let tilt = 0, lift = 0;
    if (sg.k === 'paint') tilt = (down ? 1 : -1) * 1.4 * Math.sin(Math.PI * t);
    if (sg.k === 'move') { lift = Math.sin(Math.PI * t); tilt = (sg.x1 > sg.x0 ? 1 : -1) * 3 * lift; }

    /* a festett terület: kész oszlopok + a most festett oszlop a henger élével */
    const pad = 1, parts = [];
    const rect = j => { const l = j * col - pad, r = (j + 1) * col + pad; return `M${l} -2L${r} -2L${r} ${H + 2}L${l} ${H + 2}Z`; };
    const done = sg.k === 'in' ? 0 : sg.k === 'paint' ? sg.j : sg.k === 'move' ? sg.j + 1 : n;
    for (let j = 0; j < done; j++) parts.push(rect(j));
    if (sg.k === 'paint' && t > 0) {
      const l = sg.j * col - pad, r = (sg.j + 1) * col + pad, tn = Math.tan(tilt * Math.PI / 180);
      const edge = xx => Math.max(-2, Math.min(H + 2, y + (xx - x) * tn));
      const yl = edge(l), yr = edge(r);
      parts.push(down ? `M${l} -2L${r} -2L${r} ${yr}L${l} ${yl}Z` : `M${l} ${yl}L${r} ${yr}L${r} ${H + 2}L${l} ${H + 2}Z`);
    }
    const clip = done >= n ? 'none' : parts.length ? `path('${parts.join('')}')` : 'inset(0 0 100% 0)';
    L1.style.setProperty('-webkit-clip-path', clip);
    L1.style.setProperty('clip-path', clip);

    /* henger: a feje (a fej közepe) pontosan az (x, y) pontban van */
    const top = HEAD_CY * s, bottom = HANDLE_DOWN * s;
    const hidden = p <= 0 || p >= 1 || y < -(bottom + 30) || y > H + top + 30;
    roller.style.visibility = hidden ? 'hidden' : 'visible';
    if (!hidden) {
      roller.style.transform = `translate(${x - HEAD_CX * s}px,${y - top}px) rotate(${tilt}deg) scale(${1 + .07 * lift})`;
      /* a henger fejének felszíne gördül: a jelölések a függőleges úttal arányosan haladnak */
      let ry = 0;
      for (let k = 0; k < i; k++) ry += segs[k].y1 - segs[k].y0;
      ry += (sg.y1 - sg.y0) * t;
      const ang = ry / top;
      naps.forEach((el, k) => {
        const a = ang + k * Math.PI / 3, c = Math.cos(a), h = .8 + 2.6 * Math.max(0, c);
        el.setAttribute('height', h.toFixed(2));
        el.setAttribute('y', (HEAD_CY + HEAD_CY * Math.sin(a) - h / 2).toFixed(2));
        el.setAttribute('opacity', (c > 0 ? .34 * c : 0).toFixed(2));
      });
    }
    hint.style.opacity = p > .02 ? 0 : 1;
    navState();
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { hero(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', hero);

  /* ---------- Szolgáltatások ---------- */
  function renderServices(rows) {
    $('#svcList').innerHTML = rows.map(r => `<div><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p></div>`).join('');
    $('#szolgaltatasok').hidden = !rows.length;
  }

  /* ---------- Saját ablakok ---------- */
  function renderSections(rows) {
    $$('.slot').forEach(s => s.innerHTML = '');
    rows.forEach(r => {
      const slot = $(`.slot[data-slot="${r.placement}"]`) || $('.slot[data-slot="after_services"]');
      const theme = { dark: 'dark', peach: 'peach', gold: 'gold-bg' }[r.theme] || '';
      const layout = r.image_url ? (r.layout || 'image-left') : 'text';
      const media = r.image_url ? `<div class="media"><img src="${esc(r.image_url)}" alt="" loading="lazy"></div>` : '';
      const btn = r.button_text && r.button_url
        ? `<div class="btns"><a class="btn ${r.theme === 'dark' ? 'gold' : ''}" href="${esc(r.button_url)}"${/^https?:/.test(r.button_url) ? ' target="_blank" rel="noopener"' : ''}>${esc(r.button_text)}</a></div>` : '';
      const el = document.createElement('section');
      el.className = `band custom ${theme} ${layout}`;
      el.innerHTML = `<div class="wrap inner">${layout === 'image-top' ? media : ''}${layout === 'image-left' || layout === 'image-right' ? media : ''}
        <div class="txt">${r.title ? `<h2>${esc(r.title)}</h2>` : ''}<div class="prose">${sanitize(r.body)}</div>${btn}</div></div>`;
      slot.appendChild(el);
    });
  }

  /* ---------- Előtte–utána ---------- */
  const sweepObs = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { sweepObs.unobserve(e.target); if (!reduced) sweep(e.target); }
  }), { threshold: .6 }) : null;
  function setX(c, v) { c.style.setProperty('--x', v + '%'); c.querySelector('input').value = v; }
  function sweep(c) {
    let t0 = null; c.classList.add('sweep');
    const go = t => {
      t0 = t0 ?? t; const k = Math.min(1, (t - t0) / 1400), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setX(c, Math.round(88 - 66 * e));
      if (k < 1) requestAnimationFrame(go); else setTimeout(() => { c.classList.remove('sweep'); setX(c, 50); }, 500);
    };
    requestAnimationFrame(go);
  }
  function renderBA(rows) {
    const box = $('#baList'); box.innerHTML = '';
    rows.forEach((r, i) => {
      const fig = document.createElement('figure'); fig.className = 'cmp-card'; fig.style.margin = 0;
      fig.innerHTML = `<div class="cmp"><img class="b" src="${esc(r.before_url)}" alt="Előtte${r.title ? ': ' + esc(r.title) : ''}" loading="lazy">
        <img class="a" src="${esc(r.after_url)}" alt="Utána${r.title ? ': ' + esc(r.title) : ''}" loading="lazy"><div class="shine"></div>
        <input type="range" min="0" max="100" value="50" aria-label="Előtte–utána csúszka ${i + 1}"><div class="line"></div>
        <span class="tag" style="left:14px">Előtte</span><span class="tag" style="right:14px">Utána</span></div>
        ${r.title ? `<figcaption>${esc(r.title)}</figcaption>` : ''}`;
      const c = fig.querySelector('.cmp');
      c.querySelector('input').addEventListener('input', e => { c.classList.remove('sweep'); c.style.setProperty('--x', e.target.value + '%'); });
      box.appendChild(fig); sweepObs && sweepObs.observe(c);
    });
    $('#elotte-utana').hidden = !rows.length;
  }

  /* ---------- Galéria + nagyító ---------- */
  let GAL = [], gi = 0;
  const lb = $('#lightbox');
  function renderGallery(rows) {
    GAL = rows;
    $('#galList').innerHTML = rows.map((r, i) => `<figure><button type="button" data-i="${i}" aria-label="Kép megnyitása${r.caption ? ': ' + esc(r.caption) : ''}">
      <img src="${esc(r.image_url)}" alt="${esc(r.caption || 'Elkészült munka')}" loading="lazy"></button>
      ${r.caption ? `<figcaption>${esc(r.caption)}</figcaption>` : ''}</figure>`).join('');
    $$('#galList img').forEach(img => { if (img.complete) img.classList.add('ld'); else img.onload = () => img.classList.add('ld'); });
    $('#galeria').hidden = !rows.length;
  }
  function showLb(i) {
    gi = (i + GAL.length) % GAL.length; const r = GAL[gi];
    $('#lbImg').src = r.image_url; $('#lbImg').alt = r.caption || ''; $('#lbCap').textContent = r.caption || '';
    if (!lb.open) lb.showModal();
  }
  $('#galList').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) showLb(+b.dataset.i); });
  lb.querySelector('.lb-x').onclick = () => lb.close();
  lb.querySelector('.lb-p').onclick = () => showLb(gi - 1);
  lb.querySelector('.lb-n').onclick = () => showLb(gi + 1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb')) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') showLb(gi - 1); if (e.key === 'ArrowRight') showLb(gi + 1); });

  /* ---------- Lapozható sáv (videók, közösségi bejegyzések) ----------
     A nyilak kártyacsoportonként lapoznak, lágyan gyorsuló és lassuló animációval; ujjal,
     egérgörgővel és billentyűzettel is görgethető. A sáv szélén kilógó kártyák halványabbak. */
  function carousel(track, prev, next, dots, nav) {
    let anim = 0, pages = -1, queued = false, queuedAt = 0;
    const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
    const max = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const starts = () => [...track.children].map(c => c.offsetLeft - track.children[0].offsetLeft);
    const perView = () => {
      const c = track.children[0]; if (!c) return 1;
      return Math.max(1, Math.floor((track.clientWidth + gap() + 2) / (c.offsetWidth + gap())));
    };
    const stop = () => { cancelAnimationFrame(anim); track.classList.remove('moving'); };
    function go(target) {
      stop();
      const from = track.scrollLeft, to = Math.max(0, Math.min(max(), target)), d = to - from;
      if (Math.abs(d) < 1) return;
      if (reduced) { track.scrollLeft = to; update(); return; }
      const dur = Math.min(950, 480 + Math.abs(d) * .3), t0 = performance.now();
      track.classList.add('moving');                     // a pattanó igazítás ne szóljon bele az animációba
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        track.scrollLeft = from + d * e;
        if (k < 1) anim = requestAnimationFrame(step); else { track.classList.remove('moving'); update(); }
      };
      anim = requestAnimationFrame(step);
    }
    function page(dir) {
      const s = starts(); if (!s.length) return;
      let i = s.findIndex(x => x >= track.scrollLeft - 4); if (i < 0) i = s.length - 1;
      go(s[Math.max(0, Math.min(s.length - 1, i + dir * perView()))]);
    }
    function update() {
      queued = false;
      const m = max(), sl = track.scrollLeft, r = track.getBoundingClientRect();
      prev.disabled = sl <= 2; next.disabled = sl >= m - 2;
      if (nav) nav.hidden = m <= 2;
      for (const c of track.children) {
        const b = c.getBoundingClientRect();
        const vis = b.width ? (Math.min(b.right, r.right) - Math.max(b.left, r.left)) / b.width : 1;
        c.style.setProperty('--vis', Math.max(0, Math.min(1, vis)).toFixed(3));
      }
      if (dots) {
        const n = m > 2 ? Math.ceil(track.children.length / perView()) : 0;
        if (n !== pages) {
          pages = n;
          dots.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<button type="button" aria-label="${i + 1}. oldal"></button>`).join('') : '';
        }
        const cur = n > 1 ? Math.round(sl / m * (n - 1)) : 0;
        [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
      }
    }
    const req = () => {                                   // képkockánként legfeljebb egy frissítés, de sosem ragad be
      const now = performance.now();
      if (!queued || now - queuedAt > 300) { queued = true; queuedAt = now; requestAnimationFrame(update); }
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    if (dots) dots.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const s = starts(), i = [...dots.children].indexOf(b);
      go(s[Math.min(s.length - 1, i * perView())] || 0);
    });
    track.addEventListener('pointerdown', stop, { passive: true });
    track.addEventListener('wheel', stop, { passive: true });
    track.addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
    return { refresh() { stop(); track.scrollLeft = 0; update(); } };
  }

  /* ---------- Videók ----------
     Forrás az adminban (YouTube-videók menü): a csatorna legújabb videói, egy lejátszási lista,
     vagy a kézzel felvett videók. Ha az automatikus lista nem érhető el, a kézzel felvettek jönnek. */
  const vidCar = carousel($('#vidList'), $('#vidPrev'), $('#vidNext'), $('#vidDots'), $('#vidNav'));
  let playing = null;
  function renderVideos(items) {
    playing = null;
    $('#vidList').innerHTML = items.map(v => `<article class="vc"><div class="vid" data-id="${esc(v.id)}">
        <button type="button" aria-label="Videó lejátszása: ${esc(v.title || 'YouTube-videó')}">
        <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span></span></button></div>
        <div class="vc-t">${v.date ? `<time datetime="${esc(v.date)}">${fmtDate(v.date)}</time>` : v.ago ? `<time>${esc(v.ago)}</time>` : ''}${v.title ? `<h3>${esc(v.title)}</h3>` : ''}</div></article>`).join('');
    $('#videok').hidden = !items.length; $('#navVideo').hidden = !items.length;
    vidCar.refresh();
  }
  async function loadVideos(manualRows) {
    const mode = TX.video_source || 'channel';
    const count = Math.min(15, Math.max(3, parseInt(TX.video_count, 10) || 12));
    const src = mode === 'playlist' ? TX.youtube_playlist : mode === 'channel' ? TX.youtube_url : '';
    let items = null;
    if (src && sb && sb.functions) {
      try {
        const { data, error } = await sb.functions.invoke(PLANERVO_CFG.youtubeFunction, { body: { type: mode, source: src } });
        if (!error && data && Array.isArray(data.items) && data.items.length)
          items = data.items.map(v => ({ id: v.id, title: v.title, date: v.published, ago: v.ago }));
      } catch (e) { /* a kézzel felvett videók maradnak */ }
    }
    if (!items) items = manualRows.map(r => ({ id: ytId(r.url), title: r.title || '' })).filter(v => v.id);
    renderVideos(items.slice(0, count));
    const ch = $('#chanLink');
    if (mode === 'playlist' && TX.youtube_playlist && items.length) {
      ch.href = TX.youtube_playlist; ch.textContent = 'A teljes lista a YouTube-on'; ch.hidden = false;
    }
  }
  $('#vidList').addEventListener('click', e => {
    const b = e.target.closest('.vid button'); if (!b) return;
    const v = b.parentElement;
    if (playing && playing !== v && playing.isConnected) playing.innerHTML = playing._thumb;   // egyszerre egy videó szóljon
    v._thumb = v.innerHTML; playing = v;
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.dataset.id)}?autoplay=1&rel=0" title="YouTube-videó" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  /* ---------- Blog előnézet ---------- */
  function renderPosts(rows) {
    $('#postList').innerHTML = rows.map(p => `<a class="post-card" href="blog.html?p=${encodeURIComponent(p.slug)}">
      <div class="cv">${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="" loading="lazy">` : ''}</div>
      <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time><h3>${esc(p.title)}</h3>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</a>`).join('');
    $('#blog').hidden = !rows.length; $('#navBlog').hidden = !rows.length;
  }

  /* =====================================================================
     Árajánlatkérő
     ===================================================================== */
  let WORK = [], workLoaded = false, rooms = [];
  const MAX_FILES = 8, MAX_SIZE = 15 * 1024 * 1024;

  function addRoom() {
    const r = { id: uid(), name: '', area: '', height: '2.7', sel: {}, files: [] };
    const el = document.createElement('fieldset');
    el.className = 'room';
    el.innerHTML = `<legend></legend>
      <button type="button" class="room-del">Helyiség törlése</button>
      <div class="r-top">
        <label>Megnevezés<input class="r-name" list="roomNames" placeholder="pl. Nappali" maxlength="60"></label>
        <label>Alapterület (m²)<input class="r-area" type="number" min="1" max="5000" step="0.1" inputmode="decimal" placeholder="pl. 18"></label>
        <label>Belmagasság (m)<input class="r-h" type="number" min="1.8" max="15" step="0.05" inputmode="decimal" value="2.7"></label>
      </div>
      <p class="geo"></p>
      <div class="r-items"></div>
      <div class="r-files">
        <label class="file-btn"><input type="file" accept="image/*,.heic,.heif" multiple><span>Fotók csatolása</span></label>
        <span class="file-hint">Legfeljebb ${MAX_FILES} kép, egyenként max. 15 MB</span>
        <div class="thumbs"></div>
      </div>`;
    r.el = el; rooms.push(r); $('#rooms').appendChild(el);
    el.querySelector('.r-name').addEventListener('input', e => { r.name = e.target.value; updateSum(); });
    el.querySelector('.r-area').addEventListener('input', e => { r.area = e.target.value; e.target.classList.remove('field-err'); updateGeo(r); updateSum(); });
    el.querySelector('.r-h').addEventListener('input', e => { r.height = e.target.value; e.target.classList.remove('field-err'); updateGeo(r); updateSum(); });
    el.querySelector('.room-del').addEventListener('click', () => removeRoom(r));
    el.querySelector('input[type=file]').addEventListener('change', e => { addFiles(r, [...e.target.files]); e.target.value = ''; });
    renderItems(r); updateGeo(r); renumber(); updateSum();
    return r;
  }
  function removeRoom(r) {
    r.files.forEach(f => URL.revokeObjectURL(f.url));
    r.el.remove(); rooms = rooms.filter(x => x !== r);
    if (!rooms.length) addRoom(); else { renumber(); updateSum(); }
  }
  function renumber() {
    rooms.forEach((r, i) => {
      r.el.querySelector('legend').textContent = `${i + 1}. helyiség`;
      r.el.querySelector('.room-del').hidden = rooms.length === 1;
    });
  }
  function updateGeo(r) {
    const g = roomGeometry(r.area, r.height);
    r.el.querySelector('.geo').textContent = g.wall
      ? `≈ ${fmtNum(g.wall)} m² falfelület és ${fmtNum(g.ceiling)} m² mennyezet (négyzetes alaprajzzal becsülve)`
      : 'Add meg az alapterületet és a belmagasságot, ebből számoljuk a fal- és mennyezetfelületet.';
  }
  function renderItems(r) {
    const box = r.el.querySelector('.r-items');
    if (!WORK.length) {
      box.innerHTML = `<p class="geo">${workLoaded ? 'Írd le a megjegyzésben, milyen munkát szeretnél ebben a helyiségben.' : 'A munkafolyamatok betöltése…'}</p>`;
      return;
    }
    const showP = TX.show_estimate !== false;
    const groups = {};
    WORK.forEach(w => { (groups[w.category || 'Munkák'] = groups[w.category || 'Munkák'] || []).push(w); });
    const priceTxt = w => {
      if (!showP) return esc(UNITS[w.unit] || '');
      const pc = w.price_ceiling != null && w.price_ceiling !== '' ? +w.price_ceiling : null;
      if (w.unit === 'surface' && pc != null && pc !== +w.price) return `fal ${fmtFt(w.price)} / m²<br>menny. ${fmtFt(pc)} / m²`;
      return `${fmtFt(w.unit === 'ceiling' && pc != null ? pc : w.price)} / ${UNIT_SHORT[w.unit] || ''}`;
    };
    const ctl = (w, s) => {
      const on = !!s, dis = on ? '' : ' disabled';
      if (w.unit === 'surface') {
        const cur = (s && s.surf) || 'both';
        return `<span class="seg" role="radiogroup" aria-label="${esc(w.name)}: hol">${SURFACES.map(([k, l]) =>
          `<label><input type="radio" name="s-${r.id}-${w.id}" value="${k}"${cur === k ? ' checked' : ''}${dis}><span>${l}</span></label>`).join('')}</span>`;
      }
      if (QTY_UNITS.includes(w.unit)) {
        const step = w.unit === 'piece' ? '1' : '0.1', def = w.unit === 'piece' ? 1 : '';
        return `<span class="qtyw"><input type="number" class="qty" min="0" max="9999" step="${step}" inputmode="decimal" value="${s ? s.qty : def}" placeholder="0" aria-label="${esc(w.name)}: mennyiség (${UNIT_SHORT[w.unit]})"${dis}><span>${UNIT_SHORT[w.unit]}</span></span>`;
      }
      return '<span></span>';
    };
    const cats = Object.keys(groups);
    box.innerHTML = cats.map((cat, ci) => {
      const items = groups[cat], n = items.filter(w => r.sel[w.id]).length;
      return `<details class="grp"${n ? ' open' : ''}><summary><span>${esc(cat)}</span><em data-cnt>${n ? n + ' kiválasztva' : ''}</em></summary>${items.map(w => {
        const s = r.sel[w.id];
        return `<div class="it${s ? ' on' : ''}" data-id="${w.id}"><label class="it-l"><input type="checkbox" value="${w.id}"${s ? ' checked' : ''}>
          <span class="it-t">${esc(w.name)}${w.description ? `<small>${esc(w.description)}</small>` : ''}</span></label>
          ${ctl(w, s)}<span class="it-p">${priceTxt(w)}</span></div>`;
      }).join('')}</details>`;
    }).join('');
    const count = det => { const n = det.querySelectorAll('.it.on').length; det.querySelector('[data-cnt]').textContent = n ? n + ' kiválasztva' : ''; };
    box.onchange = e => {
      const it = e.target.closest('.it'); if (!it) return;
      const id = it.dataset.id, cb = it.querySelector('input[type=checkbox]'), w = WORK.find(x => x.id === id);
      if (e.target === cb) {
        if (cb.checked) {
          const rad = it.querySelector('input[type=radio]:checked'), q = it.querySelector('.qty');
          if (q && !q.value) q.value = w && w.unit === 'piece' ? 1 : '';
          r.sel[id] = { surf: rad ? rad.value : 'both', qty: q ? (+q.value || 0) : 1 };
        } else delete r.sel[id];
        it.classList.toggle('on', cb.checked);
        it.querySelectorAll('input:not([type=checkbox])').forEach(x => { x.disabled = !cb.checked; });
        if (cb.checked) { const q = it.querySelector('.qty'); if (q && !q.value) q.focus(); }
        count(it.closest('details'));
      } else if (e.target.type === 'radio' && r.sel[id]) r.sel[id].surf = e.target.value;
      box.classList.remove('field-err'); updateSum();
    };
    box.oninput = e => {
      if (!e.target.classList.contains('qty')) return;
      e.target.classList.remove('field-err');
      const id = e.target.closest('.it').dataset.id;
      if (r.sel[id]) { r.sel[id].qty = +e.target.value || 0; updateSum(); }
    };
  }
  function calcRoom(r) {
    const g = roomGeometry(r.area, r.height);
    const items = Object.entries(r.sel).flatMap(([id, s]) => {
      const w = WORK.find(x => x.id === id); return w ? workLines(w, g, s) : [];
    });
    return { g, items, subtotal: items.reduce((t, x) => t + x.amount, 0) };
  }
  function updateSum() {
    const showP = TX.show_estimate !== false;
    let total = 0;
    const li = rooms.map((r, i) => {
      const c = calcRoom(r); total += c.subtotal;
      const meta = [r.area ? `${fmtNum(r.area)} m²` : 'alapterület hiányzik', `${Object.keys(r.sel).length} munka`, r.files.length ? `${r.files.length} fotó` : ''].filter(Boolean).join(', ');
      return `<li><b>${esc(r.name || `${i + 1}. helyiség`)}</b>${showP ? `<em>${fmtFt(c.subtotal)}</em>` : '<em></em>'}<small>${meta}</small></li>`;
    }).join('');
    $('#qSum').innerHTML = `<h3>Összesítő</h3><ul>${li}</ul>
      ${showP ? `<div class="tot">Becsült munkadíj<strong>${fmtFt(total)}</strong></div>` : ''}
      <small class="note">${esc(TX.quote_disclaimer || '')}</small>`;
    return total;
  }
  function addFiles(r, files) {
    let skipped = 0;
    for (const f of files) {
      const isImg = (f.type || '').startsWith('image/') || /\.(heic|heif)$/i.test(f.name);
      if (!isImg || f.size > MAX_SIZE || r.files.length >= MAX_FILES) { skipped++; continue; }
      r.files.push({ file: f, url: URL.createObjectURL(f) });
    }
    renderThumbs(r); updateSum();
    status(skipped ? `${skipped} fájlt nem csatoltunk: csak kép lehet, legfeljebb 15 MB, helyiségenként ${MAX_FILES} darab.` : '', !!skipped);
  }
  function renderThumbs(r) {
    const t = r.el.querySelector('.thumbs');
    t.innerHTML = r.files.map((f, i) => `<div class="thumb"><img src="${f.url}" alt="Csatolt fotó ${i + 1}"><button type="button" data-i="${i}" aria-label="Fotó eltávolítása">×</button></div>`).join('');
    t.onclick = e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const [f] = r.files.splice(+b.dataset.i, 1); URL.revokeObjectURL(f.url); renderThumbs(r); updateSum();
    };
  }
  function status(msg, err) { const s = $('#qStatus'); s.textContent = msg || ''; s.classList.toggle('err', !!err); }

  function validate() {
    let first = null;
    const mark = el => { el.classList.add('field-err'); first = first || el; };
    rooms.forEach(r => {
      const a = r.el.querySelector('.r-area'), h = r.el.querySelector('.r-h');
      if (!(+r.area > 0)) mark(a);
      if (!(+r.height >= 1.5)) mark(h);
      if (WORK.length && !Object.keys(r.sel).length) mark(r.el.querySelector('.r-items'));
      Object.keys(r.sel).forEach(id => {
        const w = WORK.find(x => x.id === id);
        if (w && QTY_UNITS.includes(w.unit) && !(r.sel[id].qty > 0)) mark(r.el.querySelector(`.it[data-id="${id}"] .qty`));
      });
    });
    [['#qName', v => v.trim().length > 1], ['#qEmail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
     ['#qPhone', v => v.replace(/\D/g, '').length >= 6], ['#qCity', v => v.trim().length > 1]]
      .forEach(([s, ok]) => { const el = $(s); el.classList.remove('field-err'); if (!ok(el.value)) mark(el); });
    if (!$('#qOk').checked) mark($('#qOk'));
    if (first) {
      first.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      if (first.tagName !== 'DIV') { const d = first.closest('details'); if (d) d.open = true; }
      status('Néhány mező hiányos. A pirossal jelölteket töltsd ki: alapterület, belmagasság, legalább egy munka helyiségenként, a kiválasztott munkák mennyisége, elérhetőségek és a hozzájárulás.', true);
      return false;
    }
    return true;
  }
  ['#qName', '#qEmail', '#qPhone', '#qCity', '#qOk'].forEach(s => $(s).addEventListener('input', e => e.target.classList.remove('field-err')));

  $('#quoteForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    if (!sb) { status('Az árajánlatkérés most nem küldhető el. Hívj minket, vagy írj e-mailt az alábbi elérhetőségeken.', true); return; }
    const btn = $('#qSend'); btn.disabled = true;
    const id = uid();
    const totalFiles = rooms.reduce((t, r) => t + r.files.length, 0);
    let done = 0;
    try {
      const roomsOut = [];
      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i], c = calcRoom(r), paths = [];
        for (let j = 0; j < r.files.length; j++) {
          status(`Fotók feltöltése: ${done + 1} / ${totalFiles}`);
          const img = await shrinkImage(r.files[j].file);
          const path = `${id}/${i + 1}-${j + 1}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`;
          const { error } = await sb.storage.from(PLANERVO_CFG.quoteBucket).upload(path, img.blob, { contentType: img.type, upsert: false });
          if (error) throw new Error('A fotók feltöltése nem sikerült (' + error.message + ').');
          paths.push(path); done++;
        }
        roomsOut.push({
          name: r.name.trim() || `${i + 1}. helyiség`, area: +r.area, height: +r.height,
          wall: c.g.wall, ceiling: c.g.ceiling, items: c.items, subtotal: c.subtotal, images: paths
        });
      }
      status('Árajánlat-kérés küldése…');
      const estimate = roomsOut.reduce((t, r) => t + r.subtotal, 0);
      const { error } = await sb.from('quotes').insert({
        id, name: $('#qName').value.trim(), email: $('#qEmail').value.trim(), phone: $('#qPhone').value.trim(),
        city: $('#qCity').value.trim(), message: $('#qMsg').value.trim() || null, rooms: roomsOut, estimate
      });
      if (error) throw new Error('Az árajánlat-kérés mentése nem sikerült (' + error.message + ').');
      try { await sb.functions.invoke(PLANERVO_CFG.notifyFunction, { body: { id } }); } catch (x) { /* az admin felületen így is látszik */ }
      status('');
      $('#quoteForm').hidden = true; $('#qDone').hidden = false; $('#qDone').focus();
      $('#qDone').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    } catch (err) {
      status(err.message + ' Próbáld újra, vagy hívj minket telefonon.', true);
    } finally { btn.disabled = false; }
  });

  $('#qAgain').addEventListener('click', () => {
    rooms.forEach(r => { r.files.forEach(f => URL.revokeObjectURL(f.url)); r.el.remove(); });
    rooms = []; $('#quoteForm').reset(); addRoom();
    $('#qDone').hidden = true; $('#quoteForm').hidden = false;
  });
  $('#addRoom').addEventListener('click', () => { const r = addRoom(); r.el.querySelector('.r-name').focus(); });

  /* ---------- Közösségi média: lapozható ablak, első a legújabb ---------- */
  const spCar = carousel($('#spTrack'), $('#spPrev'), $('#spNext'), $('#spDots'), $('#spNav'));
  function renderSocial(rows) {
    const list = rows.slice().sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    $('#spTrack').innerHTML = list.map(r => {
      const p = SOCIAL_LABEL[r.platform] || r.platform || '';
      const img = r.image_url ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">` : `<span class="sp-ph">${esc(p)}</span>`;
      return `<a class="sp-card" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(p)}: ${esc(r.title || 'bejegyzés')}, megnyitás új lapon">
        <div class="sp-img">${img}<span class="sp-plat">${esc(p)}</span></div>
        <div class="sp-txt">${r.published_at ? `<time datetime="${esc(r.published_at)}">${fmtDate(r.published_at)}</time>` : ''}${r.title ? `<h3>${esc(r.title)}</h3>` : ''}</div></a>`;
    }).join('');
    $('#kozossegi').hidden = !list.length; $('#navSocial').hidden = !list.length;
    spCar.refresh();
  }

  /* ---------- Betöltés ---------- */
  async function load() {
    applyTexts(); renderServices(DEFAULT_SERVICES); addRoom(); hero();
    if (!sb) { workLoaded = true; rooms.forEach(renderItems); return; }
    const list = t => sb.from(t).select('*').eq('visible', true).order('position').order('created_at');
    const safe = p => Promise.resolve(p).catch(error => ({ error }));
    const [tx, svc, sec, ba, gal, vid, work, posts, soc] = await Promise.all([
      safe(loadTexts()), safe(list('services')), safe(list('sections')), safe(list('before_after')),
      safe(list('gallery')), safe(list('videos')), safe(list('work_items')),
      safe(sb.from('posts').select('title,slug,excerpt,cover_url,published_at').eq('published', true)
        .lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(3)),
      safe(sb.from('social_posts').select('*').eq('visible', true).order('published_at', { ascending: false }).limit(30))
    ]);
    if (tx && !tx.error) { TX = tx; applyTexts(); }
    if (!svc.error) renderServices(svc.data || []);
    if (!sec.error) renderSections(sec.data || []);
    if (!ba.error) renderBA(ba.data || []);
    if (!gal.error) renderGallery(gal.data || []);
    loadVideos(vid.error ? [] : (vid.data || []));
    if (!posts.error) renderPosts(posts.data || []);
    if (!soc.error) renderSocial(soc.data || []);
    workLoaded = true;
    if (!work.error) WORK = work.data || [];
    rooms.forEach(renderItems); updateSum(); hero();
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) scrollToSection(t, false); }
  }
  /* ---------- Ugrás a szakaszokra ----------
     A lazy-betöltött képek és a galéria a célpont fölött utólag nyújtják az oldalt, ezért
     a böngésző saját (sima) görgetése a régi helyen állhat meg, például a blognál.
     Itt a célt minden képkockában újraszámoljuk, és a betöltés végéig igazítjuk. */
  function scrollToSection(t, animate = true) {
    const aim = () => t.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0);
    const go = y => window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    const start = scrollY, t0 = performance.now(), dur = animate && !reduced ? 900 : 0;
    const EV = ['wheel', 'touchstart', 'keydown'];
    let timer = null, raf = 0;
    const end = () => { cancelAnimationFrame(raf); clearInterval(timer); EV.forEach(ev => removeEventListener(ev, end)); };
    EV.forEach(ev => addEventListener(ev, end, { passive: true }));   // ha a látogató maga görget, átadjuk neki
    const frame = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      go(start + (aim() - start) * e);
      if (k < 1) { raf = requestAnimationFrame(frame); return; }
      let n = 0;
      timer = setInterval(() => {
        if (Math.abs(aim() - scrollY) > 2) go(aim());
        if (++n >= 15) end();                                      // kb. 1,5 s igazítás
      }, 100);
    };
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1)), t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    history.pushState(null, '', '#' + id);
    scrollToSection(t);
  });

  load();
})();
