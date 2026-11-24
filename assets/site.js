/* PLANERVO – főoldal */
(function () {
  const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const inFrame = window.parent !== window;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  let TX = { ...TEXT_DEFAULTS };
  let fcMini = false; /* lebegő kártya összecsukva (az árajánlat összesítőjénél) */

  /* =====================================================================
     Szövegek, kapcsolat, süti-tájékoztató, strukturált adat
     ===================================================================== */
  function applyTexts() {
    applyDataTexts(TX);
    $$('[data-line]').forEach(el => {
      const parts = String(TX[el.dataset.line] || '').split(/\s*[•·|]\s*/).filter(Boolean);
      el.innerHTML = parts.map(esc).join(' <b>•</b> ');
      el.hidden = !parts.length;
    });
    const custom = hasCustomLogo(TX), logo = $('#heroLogo');
    if (custom) logo.src = TX.logo_url;
    logo.hidden = !custom;
    ['#house', '#wordmark', '#svcline'].forEach(s => { $(s).hidden = custom; });

    $$('#numList > div').forEach((d, i) => { d.hidden = !String(TX[`stat${i + 1}_n`] || '').trim(); });
    $('#szamok').classList.toggle('empty', !$$('#numList > div').some(d => !d.hidden));
    $('#tstCta').hidden = !TX.testimonials_cta;
    const slotsOff = TX.slots_on === false || TX.slots_on === 'false';
    $('#slotsBox').hidden = slotsOff;
    $('#qsTime').hidden = slotsOff;
    renderContact(); applyCookie(); applyJsonLd(); renderFloat();
  }

  /* Lebegő kapcsolat-kártya a jobb oldalon: telefonszám és közösségi ikonok (admin: „Lebegő kártya”) */
  /* Az árajánlat összesítőjénél a kártya összecsukódik a jobb szélre, hogy ne takarja az összesítőt. Rákattintva, ráhúzva vagy fókuszba kerülve kinyílik. */
  function syncFloatMini() {
    const box = $('#fcard'); if (!box) return;
    box.classList.toggle('mini', fcMini);
    if (!fcMini) box.classList.remove('peek');
  }
  if (hasIO && $('#qSum')) {
    new IntersectionObserver(es => { fcMini = es[es.length - 1].isIntersecting; syncFloatMini(); }, { threshold: 0 }).observe($('#qSum'));
  }
  function renderFloat() {
    const f = getFloat(TX), tel = f.phone && String(TX.phone || '').trim();
    const soc = f.links.map(l => ({ l, h: floatHref(l) })).filter(x => x.h);
    let box = $('#fcard');
    if (!f.on || (!tel && !soc.length)) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('aside');
      box.id = 'fcard'; box.className = 'fcard'; box.setAttribute('aria-label', 'Kapcsolat');
      document.body.appendChild(box);
      /* összecsukott állapotban az első érintés csak kinyitja a kártyát */
      box.addEventListener('click', e => {
        if (box.classList.contains('mini') && !box.classList.contains('peek')) { e.preventDefault(); box.classList.add('peek'); }
      });
      box.addEventListener('mouseleave', () => box.classList.remove('peek'));
    }
    syncFloatMini();
    box.innerHTML = (tel ? `<a class="fc-phone" href="${esc(telHref(TX.phone))}" aria-label="Hívás: ${esc(TX.phone)}"><span class="fc-ic">${PHONE_ICON}</span><span class="fc-num">${esc(TX.phone)}</span></a>` : '') +
      (soc.length ? `<div class="fc-soc">${soc.map(({ l, h }) => `<a href="${esc(h)}" target="_blank" rel="noopener" aria-label="${esc(FLOAT_TYPES[l.t].l)}" title="${esc(FLOAT_TYPES[l.t].l)}"><span class="fc-ic">${floatIcon(l.t)}</span></a>`).join('')}</div>` : '');
  }

  function renderContact() {
    const rows = [];
    if (TX.phone) rows.push(`<div><span>Telefon</span><a href="${esc(telHref(TX.phone))}">${esc(TX.phone)}</a></div>`);
    if (TX.email) rows.push(`<div><span>E-mail</span><a href="mailto:${esc(TX.email)}">${esc(TX.email)}</a></div>`);
    if (TX.area) rows.push(`<div><span>Munkaterület</span><p>${esc(TX.area)}</p></div>`);
    if (TX.hours) rows.push(`<div><span>Elérhetőség</span><p>${esc(TX.hours)}</p></div>`);
    $('#contactBox').innerHTML = rows.join('');
    $('#socials').innerHTML = [['facebook_url', 'Facebook'], ['instagram_url', 'Instagram'], ['youtube_url', 'YouTube']]
      .filter(([k]) => TX[k]).map(([k, n]) => `<a href="${esc(TX[k])}" target="_blank" rel="noopener">${n}</a>`).join('');
    const ch = $('#chanLink');
    ch.hidden = !TX.youtube_url;
    if (TX.youtube_url) ch.href = TX.youtube_url;
  }

  function applyCookie() {
    if (inFrame) return;
    let seen = false;
    try { seen = localStorage.getItem('pv-cookie') === '1'; } catch (e) { /* tárolás nélkül mindig megjelenik */ }
    if (seen) return;
    $('#cookieText').textContent = TX.cookie_text || '';
    $('#cookieOk').textContent = TX.cookie_btn || 'Rendben';
    $('#cookie').hidden = !TX.cookie_text;
  }
  $('#cookieOk').addEventListener('click', () => {
    $('#cookie').hidden = true;
    try { localStorage.setItem('pv-cookie', '1'); } catch (e) { /* nem baj */ }
  });

  /* a statikus HousePainter-adatot az admin adataival egészíti ki */
  function applyJsonLd() {
    const s = $('#ld');
    let d = {};
    try { d = JSON.parse(s.textContent || '{}'); } catch (e) { return; }
    const base = siteBase(TX);
    if (TX.phone) d.telephone = TX.phone.replace(/[^\d+]/g, '');
    if (TX.email) d.email = TX.email;
    if (hasCustomLogo(TX)) d.logo = /^https?:/i.test(TX.logo_url) ? TX.logo_url : base + '/' + TX.logo_url.replace(/^\/+/, '');
    if (TX.legal_seat) d.address = { ...(d.address || { '@type': 'PostalAddress', addressCountry: 'HU' }), streetAddress: TX.legal_seat };
    const same = ['facebook_url', 'instagram_url', 'youtube_url'].map(k => TX[k]).filter(Boolean);
    if (same.length) d.sameAs = [...new Set([...(d.sameAs || []), ...same])];
    s.textContent = JSON.stringify(d);
  }

  /* =====================================================================
     Nyitókép: görgetésre a henger oszlopról oszlopra aranyra festi a logót.
     A festés éle a henger fejének középvonalán fut, és követi a henger dőlését.
     ===================================================================== */
  const nav = $('#topnav'), track = $('#track'), stage = $('#stage'), L1 = $('#L1'), roller = $('#roller'), hint = $('#hint');
  const naps = $$('#roller .nap');
  const smooth = t => t * t * (3 - 2 * t);
  const HEAD_W = 206, HEAD_CX = 107, HEAD_CY = 26, HANDLE_DOWN = 212;
  let G = null;

  function heroLayout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (G && G.W === W && G.H === H) return G;
    const n = W < 640 ? 2 : Math.max(3, Math.round(W / 340));
    const col = W / n, s = (col + 3) / HEAD_W;
    const cx = j => (j + .5) * col, yEnd = j => (j % 2 ? 0 : H);
    const segs = [{ k: 'in', j: 0, x0: cx(0), x1: cx(0), y0: -(HANDLE_DOWN * s + 40), y1: 0 }];
    for (let j = 0; j < n; j++) {
      const down = j % 2 === 0;
      segs.push({ k: 'paint', j, x0: cx(j), x1: cx(j), y0: down ? 0 : H, y1: down ? H : 0 });
      if (j < n - 1) segs.push({ k: 'move', j, x0: cx(j), x1: cx(j + 1), y0: yEnd(j), y1: yEnd(j) });
    }
    const lastDown = (n - 1) % 2 === 0;
    segs.push({ k: 'out', j: n - 1, x0: cx(n - 1), x1: cx(n - 1), y0: yEnd(n - 1), y1: lastDown ? H + HEAD_CY * s + 40 : -(HANDLE_DOWN * s + 40) });
    let total = 0;
    segs.forEach(g => { g.len = g.k === 'move' ? col * .8 : Math.max(1, Math.abs(g.y1 - g.y0)); g.at = total; total += g.len; });
    const scroll = total / 1.5;
    track.style.height = (scroll + H) + 'px';
    roller.style.width = (230 * s) + 'px';
    return (G = { W, H, n, col, s, segs, total, scroll });
  }

  function hero() {
    const { H, n, col, s, segs, total, scroll } = heroLayout();
    const p = clamp01(-track.getBoundingClientRect().top / scroll), d = p * total;
    let i = 0;
    while (i < segs.length - 1 && d > segs[i].at + segs[i].len) i++;
    const sg = segs[i], t = clamp01((d - sg.at) / sg.len);
    const x = sg.x0 + (sg.x1 - sg.x0) * (sg.k === 'move' ? smooth(t) : t);
    const y = sg.y0 + (sg.y1 - sg.y0) * t;
    const down = sg.j % 2 === 0;
    let tilt = 0, lift = 0;
    if (sg.k === 'paint') tilt = (down ? 1 : -1) * 1.4 * Math.sin(Math.PI * t);
    if (sg.k === 'move') { lift = Math.sin(Math.PI * t); tilt = (sg.x1 > sg.x0 ? 1 : -1) * 3 * lift; }

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

    const top = HEAD_CY * s, bottom = HANDLE_DOWN * s;
    const hidden = p <= 0 || p >= 1 || y < -(bottom + 30) || y > H + top + 30;
    roller.style.visibility = hidden ? 'hidden' : 'visible';
    if (!hidden) {
      roller.style.transform = `translate(${x - HEAD_CX * s}px,${y - top}px) rotate(${tilt}deg) scale(${1 + .07 * lift})`;
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
    nav.classList.toggle('solid', track.getBoundingClientRect().bottom < 80);
    nav.classList.toggle('over-gold', p > 0);
  }

  /* =====================================================================
     Szolgáltatások: kép, logó-sávok vagy előtte–utána képpárok
     ===================================================================== */
  let SVC_PAIRS = [];
  const pairList = r => (Array.isArray(r.pairs) ? r.pairs : []).filter(p => p && p.before && p.after);
  function pairsHtml(r, si) {
    const ps = SVC_PAIRS[si];
    const cols = ps.length === 1 ? 1 : ps.length <= 4 ? 2 : ps.length <= 9 ? 3 : 4;
    return `<div class="svc-pairs" style="--pc:${cols}" role="list" aria-label="Előtte–utána képek">${ps.map((p, j) => {
      const t = p.title ? ': ' + esc(p.title) : '';
      return `<button type="button" role="listitem" class="pair-t" data-s="${si}" data-p="${j}" aria-label="Előtte–utána kép megnyitása${t}"><img src="${esc(p.before)}" alt="${esc(r.title)} előtte${t}" loading="lazy"><img src="${esc(p.after)}" alt="${esc(r.title)} utána${t}" loading="lazy"><b>Előtte</b><b>Utána</b></button>`;
    }).join('')}</div>`;
  }
  function renderServices(rows) {
    SVC_PAIRS = rows.map(pairList);
    $('#svcList').innerHTML = rows.map((r, i) => {
      const media = SVC_PAIRS[i].length ? `<div class="svc-pic haspairs">${pairsHtml(r, i)}</div>`
        : r.image_url ? `<div class="svc-pic"><img src="${esc(r.image_url)}" alt="${esc(r.title)}" loading="lazy"></div>`
        : '<div class="svc-pic brandpic"><i></i><i></i><i></i></div>';
      const link = r.link || (/nemesvakolat|homlokzat/i.test(r.title) ? 'homlokzat-nemesvakolat.html' : '');
      const btn = link ? `<a class="btn o arrow" href="${esc(link)}">Részletek</a>` : '<a class="btn o arrow" href="#arajanlat">Árajánlatot kérek</a>';
      return `<article class="svc-row"><div class="svc-media">${media}</div><div class="svc-txt"><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${esc(r.title)}</h3>${r.body ? `<p>${esc(r.body)}</p>` : ''}${btn}</div></article>`;
    }).join('');
    $('#szolgaltatasok').hidden = !rows.length;
    refreshCards('szolgaltatasok');
  }

  function wireLightbox(dlg, prev, next) {
    dlg.querySelector('.lb-x').addEventListener('click', () => dlg.close());
    dlg.querySelector('.lb-p').addEventListener('click', prev);
    dlg.querySelector('.lb-n').addEventListener('click', next);
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lb')) dlg.close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); });
  }
  function setSlider(c, v) { c.style.setProperty('--x', v + '%'); c.querySelector('input').value = v; }

  const plb = $('#pairLb'), plbCmp = $('#plbCmp');
  let pairCur = [], pairIdx = 0, pairCap = '';
  function showPair(i) {
    const n = pairCur.length; if (!n) return;
    pairIdx = (i + n) % n;
    const p = pairCur[pairIdx];
    plbCmp.querySelector('.b').src = p.before;
    plbCmp.querySelector('.a').src = p.after;
    setSlider(plbCmp, 50);
    $('#plbCap').textContent = [pairCap, p.title, n > 1 ? `${pairIdx + 1} / ${n}` : ''].filter(Boolean).join(' · ');
    if (!plb.open) plb.showModal();
  }
  $('#svcList').addEventListener('click', e => {
    const b = e.target.closest('.pair-t'); if (!b) return;
    pairCur = SVC_PAIRS[+b.dataset.s] || [];
    pairCap = (b.closest('.svc-row').querySelector('h3') || {}).textContent || '';
    showPair(+b.dataset.p);
  });
  plbCmp.querySelector('input').addEventListener('input', e => plbCmp.style.setProperty('--x', e.target.value + '%'));
  wireLightbox(plb, () => showPair(pairIdx - 1), () => showPair(pairIdx + 1));

  /* =====================================================================
     Gyakori kérdések, saját ablakok, lépések, vélemények
     ===================================================================== */
  function renderFaq(rows) {
    const list = rows.length ? rows : DEFAULT_FAQ;
    $('#faqList').innerHTML = list.map(f => `<details class="faq-i"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('');
    $('#ldfaq').textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: list.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) });
  }

  function renderSections(rows) {
    $$('.slot').forEach(s => { s.innerHTML = ''; });
    rows.forEach(r => {
      const slot = $(`.slot[data-slot="${r.placement}"]`) || $('.slot[data-slot="after_services"]');
      const theme = { dark: 'dark', peach: 'peach', gold: 'gold-bg' }[r.theme] || '';
      const layout = r.image_url ? (r.layout || 'image-left') : 'text';
      const media = layout !== 'text' ? `<div class="media"><img src="${esc(r.image_url)}" alt="${esc(r.title || '')}" loading="lazy"></div>` : '';
      const ext = /^https?:/.test(r.button_url || '');
      const btn = r.button_text && r.button_url
        ? `<div class="btns"><a class="btn${r.theme === 'dark' ? ' gold' : ''}" href="${esc(r.button_url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(r.button_text)}</a></div>` : '';
      const el = document.createElement('section');
      el.className = ['band', 'custom', theme, layout].filter(Boolean).join(' ');
      el.innerHTML = `<div class="wrap inner">${media}<div class="txt">${r.title ? `<h2>${esc(r.title)}</h2>` : ''}<div class="prose">${sanitize(r.body)}</div>${btn}</div></div>`;
      slot.appendChild(el);
    });
  }

  /* a lépések görgetésre sorban kibontakoznak, a vonal a haladással töltődik; mozgás nélkül is minden látszik */
  const stepsEl = $('#stepList');
  let stepObs = null;
  function renderSteps(rows) {
    stepsEl.innerHTML = rows.map((r, i) => `<li><span class="n" aria-hidden="true">${i + 1}</span><h3>${esc(r.title)}</h3>${r.body ? `<p>${esc(r.body)}</p>` : ''}</li>`).join('');
    $('#folyamat').hidden = !rows.length;
    const items = [...stepsEl.children];
    if (stepObs) stepObs.disconnect();
    stepsEl.classList.remove('anim');
    if (reduced || !hasIO || !items.length) { items.forEach(li => li.classList.add('in')); stepsEl.style.setProperty('--p', 1); return; }
    stepsEl.classList.add('anim');
    stepObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); stepObs.unobserve(e.target); } }), { threshold: .35 });
    items.forEach((li, i) => { li.style.setProperty('--d', (i * 90) + 'ms'); stepObs.observe(li); });
    setTimeout(() => items.forEach(li => li.classList.add('in')), 6000);
    stepsProgress();
  }
  function stepsProgress() {
    if (!stepsEl.classList.contains('anim')) return;
    const r = stepsEl.getBoundingClientRect(), h = innerHeight;
    stepsEl.style.setProperty('--p', clamp01((h * .78 - r.top) / (r.height + h * .2)).toFixed(3));
  }

  function renderTestimonials(rows) {
    $('#tstTrack').innerHTML = rows.map(r => {
      const n = Math.min(5, Math.max(1, +r.rating || 5));
      return `<figure class="t-card"><div class="stars" role="img" aria-label="${n} csillag az ötből">${'★'.repeat(n)}<span>${'★'.repeat(5 - n)}</span></div>
        <blockquote>${esc(r.body)}</blockquote>
        <figcaption><b>${esc(r.name)}</b>${r.place ? `<span>${esc(r.place)}</span>` : ''}${r.source ? `<em>${esc(r.source)}</em>` : ''}</figcaption></figure>`;
    }).join('');
    $('#velemenyek').hidden = !rows.length;
    refreshCards('velemenyek');
  }

  /* =====================================================================
     Előtte–utána és galéria
     ===================================================================== */
  let BA_COUNT = 0, GAL_COUNT = 0;
  const sweepObs = hasIO ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { sweepObs.unobserve(e.target); if (!reduced) sweep(e.target); }
  }), { threshold: .6 }) : null;
  function sweep(c) {
    let t0 = null;
    c.classList.add('sweep');
    const go = t => {
      t0 = t0 ?? t;
      const k = Math.min(1, (t - t0) / 1400), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setSlider(c, Math.round(88 - 66 * e));
      if (k < 1) requestAnimationFrame(go); else setTimeout(() => { c.classList.remove('sweep'); setSlider(c, 50); }, 500);
    };
    requestAnimationFrame(go);
  }
  function renderBA(rows) {
    const box = $('#baList');
    box.innerHTML = '';
    rows.forEach((r, i) => {
      const t = r.title ? ': ' + esc(r.title) : '';
      const fig = document.createElement('figure');
      fig.className = 'cmp-card';
      fig.innerHTML = `<div class="cmp"><img class="a" src="${esc(r.after_url)}" alt="Utána${t}" loading="lazy"><img class="b" src="${esc(r.before_url)}" alt="Előtte${t}" loading="lazy"><div class="shine"></div>
        <input type="range" min="0" max="100" value="50" aria-label="Előtte–utána csúszka ${i + 1}"><div class="line"></div>
        <span class="tag tag-b">Előtte</span><span class="tag tag-a">Utána</span></div>${r.title ? `<figcaption>${esc(r.title)}</figcaption>` : ''}`;
      const c = fig.firstElementChild;
      c.querySelector('input').addEventListener('input', e => { c.classList.remove('sweep'); c.style.setProperty('--x', e.target.value + '%'); });
      box.appendChild(fig);
      if (sweepObs) sweepObs.observe(c);
    });
    BA_COUNT = rows.length;
    $('#elotte-utana').hidden = !rows.length;
    refreshCards('elotte-utana');
  }

  const lb = $('#lightbox');
  let GAL = [], galIdx = 0, GAL_ALBUMS = [], lbTitle = '';
  function renderGallery(rows, albums, mode) {
    const list = $('#galList');
    if (mode === 'albums' && albums.length) {
      const byAlbum = {};
      rows.forEach(r => { if (r.album_id) (byAlbum[r.album_id] = byAlbum[r.album_id] || []).push(r); });
      GAL_ALBUMS = albums.map(a => ({ ...a, imgs: byAlbum[a.id] || [] })).filter(a => a.imgs.length);
      GAL_COUNT = GAL_ALBUMS.length;
      list.innerHTML = GAL_ALBUMS.map((a, i) => `<figure class="gal-album"><button type="button" data-a="${i}" aria-label="Album megnyitása: ${esc(a.title)}">
        <img src="${esc(a.cover_url || a.imgs[0].image_url)}" alt="${esc(a.title)}" loading="lazy">
        <span class="gal-album-t">${esc(a.title)}<small>${a.imgs.length} kép</small></span></button></figure>`).join('');
    } else {
      GAL_ALBUMS = []; GAL = rows; GAL_COUNT = rows.length;
      list.innerHTML = rows.map((r, i) => `<figure><button type="button" data-i="${i}" aria-label="Kép megnyitása${r.caption ? ': ' + esc(r.caption) : ''}">
        <img src="${esc(r.image_url)}" alt="${esc(r.caption || 'Elkészült festés, PLANERVO, Üllő és környéke')}" loading="lazy"></button>
        ${r.caption ? `<figcaption>${esc(r.caption)}</figcaption>` : ''}</figure>`).join('');
    }
    $$('img', list).forEach(img => { if (img.complete) img.classList.add('ld'); else img.addEventListener('load', () => img.classList.add('ld'), { once: true }); });
    $('#galeria').hidden = !GAL_COUNT;
    $('#navGal').hidden = !GAL_COUNT;
    refreshCards('galeria');
  }
  function showLb(i) {
    if (!GAL.length) return;
    galIdx = (i + GAL.length) % GAL.length;
    const r = GAL[galIdx];
    $('#lbImg').src = r.image_url;
    $('#lbImg').alt = r.caption || '';
    $('#lbCap').textContent = [lbTitle, r.caption].filter(Boolean).join(' · ');
    if (!lb.open) lb.showModal();
  }
  $('#galList').addEventListener('click', e => {
    const a = e.target.closest('button[data-a]');
    if (a) { const al = GAL_ALBUMS[+a.dataset.a]; if (al) { GAL = al.imgs; lbTitle = al.title; showLb(0); } return; }
    const b = e.target.closest('button[data-i]');
    if (b) { lbTitle = ''; showLb(+b.dataset.i); }
  });
  wireLightbox(lb, () => showLb(galIdx - 1), () => showLb(galIdx + 1));

  /* a „Munkáim” linkek az előtte–utána részre mutatnak; ha az üres, a galériára; ha egyik sincs, eltűnnek */
  function syncWorksLinks() {
    const target = BA_COUNT ? '#munkaink' : GAL_COUNT ? '#galeria' : '';
    $$('[data-works]').forEach(a => { a.hidden = !target; if (target) a.setAttribute('href', target); });
  }

  /* =====================================================================
     Videók, közösségi média, blog előnézet
     ===================================================================== */
  let playing = null;
  function renderVideos(items) {
    playing = null;
    $('#vidList').innerHTML = items.map(v => {
      const title = esc(v.title || 'YouTube-videó');
      const time = v.date ? `<time datetime="${esc(v.date)}">${fmtDate(v.date)}</time>` : v.ago ? `<time>${esc(v.ago)}</time>` : '';
      return `<article class="vc"><div class="vid" data-id="${esc(v.id)}"><button type="button" aria-label="Videó lejátszása: ${title}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="${title}" width="480" height="360" loading="lazy"><span></span></button></div>
        <div class="vc-t">${time}${v.title ? `<h3>${esc(v.title)}</h3>` : ''}</div></article>`;
    }).join('');
    $('#videok').hidden = !items.length;
    $('#navVideo').hidden = !items.length;
    refreshCards('videok');
  }
  /* forrás: a csatorna legújabb videói, egy lejátszási lista, vagy a kézzel felvett videók (ezek a tartalék is) */
  async function loadVideos(manualRows) {
    const mode = TX.video_source || 'channel';
    const count = Math.min(15, Math.max(3, parseInt(TX.video_count, 10) || 12));
    const src = mode === 'playlist' ? TX.youtube_playlist : mode === 'channel' ? TX.youtube_url : '';
    let items = null;
    if (src && sb) {
      try {
        const { data, error } = await sb.functions.invoke(PLANERVO_CFG.youtubeFunction, { body: { type: mode, source: src } });
        if (!error && data && Array.isArray(data.items) && data.items.length)
          items = data.items.map(v => ({ id: v.id, title: v.title, date: v.published, ago: v.ago }));
      } catch (e) { /* a kézzel felvett videók jelennek meg */ }
    }
    if (!items) items = manualRows.map(r => ({ id: ytId(r.url), title: r.title || '' })).filter(v => v.id);
    renderVideos(items.slice(0, count));
    if (mode === 'playlist' && TX.youtube_playlist && items.length) {
      const ch = $('#chanLink');
      ch.href = TX.youtube_playlist; ch.textContent = 'A teljes lista a YouTube-on'; ch.hidden = false;
    }
    motion.refresh();
  }
  $('#vidList').addEventListener('click', e => {
    const b = e.target.closest('.vid button'); if (!b) return;
    const v = b.parentElement;
    if (playing && playing !== v && playing.isConnected) playing.innerHTML = playing.dataset.thumb;
    v.dataset.thumb = v.innerHTML;
    playing = v;
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.dataset.id)}?autoplay=1&rel=0" title="YouTube-videó" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  function renderSocial(rows) {
    const list = rows.slice().sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    $('#spTrack').innerHTML = list.map(r => {
      const p = SOCIAL_LABEL[r.platform] || r.platform || '';
      const img = r.image_url ? `<img src="${esc(r.image_url)}" alt="${esc(r.title || p)}" loading="lazy">` : `<span class="sp-ph">${esc(p)}</span>`;
      return `<a class="sp-card" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(p)}: ${esc(r.title || 'bejegyzés')}, megnyitás új lapon">
        <div class="sp-img">${img}<span class="sp-plat">${esc(p)}</span></div>
        <div class="sp-txt">${r.published_at ? `<time datetime="${esc(r.published_at)}">${fmtDate(r.published_at)}</time>` : ''}${r.title ? `<h3>${esc(r.title)}</h3>` : ''}</div></a>`;
    }).join('');
    $('#kozossegi').hidden = !list.length;
    $('#navSocial').hidden = !list.length;
    refreshCards('kozossegi');
  }

  function renderPosts(rows) {
    $('#postList').innerHTML = rows.map(p => `<a class="post-card" href="blog.html?p=${encodeURIComponent(p.slug)}">
      <div class="cv">${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="${esc(p.title)}" loading="lazy">` : ''}</div>
      <time datetime="${esc(p.published_at)}">${fmtDate(p.published_at)}</time><h3>${esc(p.title)}</h3>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}</a>`).join('');
    $('#blog').hidden = !rows.length;
    $('#navBlog').hidden = !rows.length;
    refreshCards('blog');
  }

  /* =====================================================================
     Lapozható sáv: kártyacsoportonként lapoz; ujjal, egérrel és billentyűzettel is görgethető
     ===================================================================== */
  function carousel(track, prev, next, dots, bar) {
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
      track.classList.add('moving');
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        track.scrollLeft = from + d * e;
        if (k < 1) anim = requestAnimationFrame(step); else { track.classList.remove('moving'); update(); }
      };
      anim = requestAnimationFrame(step);
    }
    function page(dir) {
      const s = starts(); if (!s.length) return;
      let i = s.findIndex(x => x >= track.scrollLeft - 4);
      if (i < 0) i = s.length - 1;
      go(s[Math.max(0, Math.min(s.length - 1, i + dir * perView()))]);
    }
    function update() {
      queued = false;
      const m = max(), sl = track.scrollLeft, r = track.getBoundingClientRect();
      prev.disabled = sl <= 2;
      next.disabled = sl >= m - 2;
      bar.hidden = !track.classList.contains('car-track') || m <= 2;
      for (const c of track.children) {
        const b = c.getBoundingClientRect();
        const vis = b.width ? (Math.min(b.right, r.right) - Math.max(b.left, r.left)) / b.width : 1;
        c.style.setProperty('--vis', clamp01(vis).toFixed(3));
      }
      const n = m > 2 ? Math.ceil(track.children.length / perView()) : 0;
      if (n !== pages) {
        pages = n;
        dots.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<button type="button" aria-label="${i + 1}. oldal"></button>`).join('') : '';
      }
      const cur = n > 1 ? Math.round(sl / m * (n - 1)) : 0;
      [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
    }
    const req = () => {
      const now = performance.now();
      if (!queued || now - queuedAt > 300) { queued = true; queuedAt = now; requestAnimationFrame(update); }
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    dots.addEventListener('click', e => {
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

  /* =====================================================================
     Elrendezés az admin „Megjelenés” oldaláról
     ===================================================================== */
  const CARS = {}, EXPANDED = new Set();
  let META0 = null;
  function ensureCarousel(key) {
    if (CARS[key]) return CARS[key];
    const track = document.getElementById(CARD_SECTIONS[key].track);
    const bar = document.createElement('div');
    bar.className = 'car-bar'; bar.hidden = true;
    bar.innerHTML = '<div class="car-dots"></div><div class="car-btns"><button type="button" aria-label="Előző"></button><button type="button" aria-label="Következő"></button></div>';
    track.before(bar);
    const [prev, next] = bar.querySelectorAll('.car-btns button');
    return (CARS[key] = carousel(track, prev, next, bar.querySelector('.car-dots'), bar));
  }
  /* rácsnál a „Látható sorok” feletti kártyák egy „Tovább” gomb mögé kerülnek */
  function applyRows(key) {
    const c = CARD_SECTIONS[key], track = document.getElementById(c.track), sec = document.getElementById(c.section);
    const rows = +((getLayout(TX).cards || {})[key] || {}).rows || 0;
    const kids = [...track.children];
    kids.forEach(k => k.classList.remove('row-hid'));
    let wrap = sec.querySelector(`.more-wrap[data-for="${key}"]`);
    const limit = Math.max(1, Math.round(parseFloat(getComputedStyle(sec).getPropertyValue('--cols')) || 1)) * rows;
    if (!(rows > 0 && track.classList.contains('t-grid') && kids.length > limit)) { if (wrap) wrap.hidden = true; return; }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'more-wrap'; wrap.dataset.for = key;
      wrap.innerHTML = '<button type="button" class="btn o">Tovább</button>';
      track.after(wrap);
      wrap.firstChild.addEventListener('click', () => { EXPANDED.add(key); applyRows(key); });
    }
    const open = EXPANDED.has(key);
    wrap.hidden = open;
    if (!open) kids.forEach((k, i) => { if (i >= limit) k.classList.add('row-hid'); });
  }
  function refreshCards(key) {
    if (CARS[key]) CARS[key].refresh();
    applyRows(key);
  }

  const BG_CLASSES = ['dark', 'peach', 'soft', 'gold-bg'];
  const BG_MAP = { light: [], soft: ['soft'], peach: ['peach'], dark: ['dark'], gold: ['gold-bg'] };
  function setBg(el, val) {
    if (el.dataset.bg0 === undefined) el.dataset.bg0 = BG_CLASSES.filter(c => el.classList.contains(c)).join(' ');
    el.classList.remove(...BG_CLASSES);
    (BG_MAP[val] || el.dataset.bg0.split(' ').filter(Boolean)).forEach(c => el.classList.add(c));
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = k < 0 ? 0 : 255, p = Math.abs(k);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round((f - v) * p + v).toString(16).padStart(2, '0')).join('');
  }
  const setVar = (el, k, v) => (v === '' || v == null ? el.style.removeProperty(k) : el.style.setProperty(k, v));

  function bannerHeight() {
    const el = $('#banner');
    if (!el.hidden) document.documentElement.style.setProperty('--bh', Math.max(36, Math.ceil(el.getBoundingClientRect().height)) + 'px');
  }
  function applyBanner(b) {
    const el = $('#banner');
    let show = !!(b && b.on && String(b.text || '').trim());
    if (show) { try { show = sessionStorage.getItem('pv-banner') !== b.text; } catch (e) { /* tárolás nélkül mindig látszik */ } }
    el.hidden = !show;
    if (!show) { document.documentElement.style.removeProperty('--bh'); return; }
    el.dataset.tone = ['dark', 'peach'].includes(b.tone) ? b.tone : 'gold';
    $('#bannerText').textContent = b.text;
    const a = $('#bannerLink'), ok = b.url && /^(https?:\/\/|#|mailto:|tel:)/i.test(b.url);
    a.hidden = !ok;
    if (ok) {
      a.href = b.url;
      a.textContent = b.link_text || 'Részletek';
      if (/^https?:/i.test(b.url)) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    }
    bannerHeight();
  }
  $('#bannerX').addEventListener('click', () => {
    try { sessionStorage.setItem('pv-banner', $('#bannerText').textContent); } catch (e) { /* nem baj */ }
    $('#banner').hidden = true;
    document.documentElement.style.removeProperty('--bh');
  });

  const fxObs = hasIO ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('fx-on'); fxObs.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  const FX_CLASSES = ['fx-up', 'fx-fade', 'fx-zoom', 'fx-slide', 'fx-on'];

  function applyLayout(L) {
    const html = document.documentElement;
    setVar(html, '--wrapw', WIDTH_PX[L.width]);
    setVar(html, '--bandk', SPACING_K[L.spacing]);
    if (/^#[0-9a-f]{6}$/i.test(L.accent || '')) {
      const n = parseInt(L.accent.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      setVar(html, '--gold', L.accent);
      setVar(html, '--gold-d', shade(L.accent, -.2));
      setVar(html, '--on-gold', lum < .56 ? '#ffffff' : '');
    } else ['--gold', '--gold-d', '--on-gold'].forEach(k => html.style.removeProperty(k));

    const ogT = $('meta[property="og:title"]'), mD = $('meta[name="description"]');
    if (!META0) META0 = { title: document.title, og: ogT.content, desc: mD.content };
    const meta = L.meta || {};
    document.title = meta.title || META0.title;
    ogT.content = meta.title || META0.og;
    mD.content = meta.desc || META0.desc;
    applyBanner(L.banner);

    const off = new Set(L.hidden || []);
    LAYOUT_GROUPS.forEach(([g]) => {
      const el = document.getElementById(g);
      const hide = off.has(g) && g !== 'arajanlat';
      el.toggleAttribute('data-off', hide);
      $$(g === 'munkaink' ? '#navLinks [data-works]' : `#navLinks a[href="#${g}"]`).forEach(a => a.classList.toggle('nav-off', hide));
      const allowed = LAYOUT_BG_ALLOWED[g], want = (L.bg || {})[g] || '';
      setBg(g === 'munkaink' ? $('#elotte-utana') : el, allowed && !allowed.includes(want) ? '' : want);

      const fx = (L.fx || {})[g] || {};
      setVar(el, '--bandk', SPACING_K[fx.space]);
      setVar(el, '--wrapw', WIDTH_PX[fx.width]);
      const inner = el.querySelector(':scope > .wrap') || el;
      if (fxObs) fxObs.unobserve(inner);
      inner.classList.remove(...FX_CLASSES);
      const anim = FX_ANIMS.some(a => a[0] && a[0] === fx.anim) ? fx.anim : '';
      if (anim && !reduced) {
        inner.classList.add('fx-' + anim);
        if (fxObs) fxObs.observe(inner); else inner.classList.add('fx-on');
      }
    });

    const main = $('main');
    if (Array.isArray(L.order) && L.order.length) {
      const pos = {};
      fullOrder(L.order).forEach((g, i) => { pos[g] = (i + 1) * 10; document.getElementById(g).style.order = pos[g]; });
      const slotPos = { after_hero: 0, after_services: pos.szolgaltatasok + 1, after_gallery: pos.galeria + 1, after_videos: pos.videok + 1, after_blog: pos.blog + 1, before_contact: pos.kapcsolat - 1 };
      $$('main > .slot').forEach(s => { s.style.order = slotPos[s.dataset.slot] ?? 0; });
      main.classList.add('flex-col');
    } else {
      main.classList.remove('flex-col');
      [...main.children].forEach(c => { c.style.order = ''; });
    }

    Object.entries(CARD_SECTIONS).forEach(([key, c]) => {
      const sec = document.getElementById(c.section), track = document.getElementById(c.track), cfg = (L.cards || {})[key] || {};
      const mode = c.modes.some(m => m[0] === cfg.mode) ? cfg.mode : c.mode;
      const d = [1, 2, 3, 4, 5].includes(+cfg.cols) ? +cfg.cols : 0, cols = d || c.cols;
      const tablet = cols >= 4 ? 3 : cols >= 3 ? 2 : cols;
      const phone = mode === 'carousel' ? (cols === 1 ? 1 : c.phone === 2 ? 1.7 : 1.12) : Math.min(cols, c.phone);
      sec.classList.add('cs');
      sec.style.setProperty('--cols-d', cols);
      sec.style.setProperty('--cols-t', tablet);
      sec.style.setProperty('--cols-m', phone);
      setVar(sec, '--cgap', CARD_GAP_PX[cfg.gap] ? CARD_GAP_PX[cfg.gap] + 'px' : '');
      setVar(sec, '--cr', /^\d{1,2}$/.test(cfg.radius || '') ? cfg.radius + 'px' : '');
      setVar(sec, '--ratio', (c.ratios || []).some(r => r[0] && r[0] === cfg.ratio) ? cfg.ratio : '');
      sec.toggleAttribute('data-hidetext', !!c.text && cfg.text === 'off');
      track.classList.toggle('car-track', mode === 'carousel');
      track.classList.toggle('t-grid', mode === 'grid' && (!!d || c.mode !== 'grid' || key === 'galeria'));
      track.classList.toggle('t-masonry', mode === 'masonry' && !!d);
      if (mode === 'carousel') { track.tabIndex = 0; track.setAttribute('role', 'region'); track.setAttribute('aria-label', c.label); }
      else { track.removeAttribute('tabindex'); track.removeAttribute('role'); track.removeAttribute('aria-label'); }
      ensureCarousel(key).refresh();
      applyRows(key);
    });
  }

  /* =====================================================================
     Árajánlatkérő
     ===================================================================== */
  const MAX_FILES = 8, MAX_SIZE = 15 * 1024 * 1024;
  let WORK = [], workLoaded = false, rooms = [];

  function status(msg, err) { const s = $('#qStatus'); s.textContent = msg || ''; s.classList.toggle('err', !!err); }
  let flashTimer = 0;
  function flash(msg) {
    status(msg);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { if ($('#qStatus').textContent === msg) status(''); }, 2800);
  }

  function addRoom(src) {
    const r = { id: uid(), name: '', w: '', l: '', area: '', height: '2.7', wallIn: '', sel: {}, files: [] };
    if (src) Object.assign(r, { name: src.name, w: src.w, l: src.l, area: src.area, height: src.height, wallIn: src.wallIn, sel: JSON.parse(JSON.stringify(src.sel)) });
    const el = document.createElement('fieldset');
    el.className = 'room' + (reduced ? '' : ' fresh');
    el.innerHTML = `<legend></legend>
      <div class="room-acts"><button type="button" class="room-copy">Másolás</button><button type="button" class="room-del">Törlés</button></div>
      <div class="r-top">
        <label>Megnevezés<input class="r-name" list="roomNames" placeholder="pl. Nappali" maxlength="60"></label>
        <label>Szélesség (m)<input class="r-w" type="number" min="0.5" max="100" step="0.01" inputmode="decimal" placeholder="pl. 4"></label>
        <label>Hosszúság (m)<input class="r-l" type="number" min="0.5" max="100" step="0.01" inputmode="decimal" placeholder="pl. 4,5"></label>
        <label>Belmagasság (m)<input class="r-h" type="number" min="1.8" max="15" step="0.05" inputmode="decimal" value="2.7"></label>
        <label>Falkerület (m²)<input class="r-wall" type="number" min="1" max="5000" step="0.1" inputmode="decimal" placeholder="automatikus"></label>
      </div>
      <p class="geo"></p>
      <div class="r-items"></div>
      <div class="r-files">
        <label class="file-btn"><input type="file" accept="image/*,.heic,.heif" multiple><span>Fotók csatolása</span></label>
        <span class="file-hint">Legfeljebb ${MAX_FILES} kép, egyenként max. 15 MB</span>
        <div class="thumbs"></div>
      </div>`;
    r.el = el;
    if (src && rooms.includes(src)) { src.el.after(el); rooms.splice(rooms.indexOf(src) + 1, 0, r); }
    else { rooms.push(r); $('#rooms').appendChild(el); }
    if (src) { el.querySelector('.r-name').value = r.name; el.querySelector('.r-w').value = r.w; el.querySelector('.r-l').value = r.l; el.querySelector('.r-h').value = r.height; el.querySelector('.r-wall').value = r.wallIn; }
    el.addEventListener('animationend', () => el.classList.remove('fresh'), { once: true });
    el.querySelector('.room-copy').addEventListener('click', () => { addRoom(r).el.querySelector('.r-name').focus(); flash('Helyiség lemásolva. Írd át a nevét, ha kell.'); });
    el.querySelector('.room-del').addEventListener('click', () => removeRoom(r));
    el.querySelector('.r-name').addEventListener('input', e => { r.name = e.target.value; updateSum(); });
    el.querySelector('.r-w').addEventListener('input', e => { r.w = e.target.value; e.target.classList.remove('field-err'); updateGeo(r); updateSum(); });
    el.querySelector('.r-l').addEventListener('input', e => { r.l = e.target.value; e.target.classList.remove('field-err'); updateGeo(r); updateSum(); });
    el.querySelector('.r-h').addEventListener('input', e => { r.height = e.target.value; e.target.classList.remove('field-err'); updateGeo(r); updateSum(); });
    /* a falkerület a méretekből kitöltődik; ha átírod, az marad, ha kiürítöd, újra automatikus */
    el.querySelector('.r-wall').addEventListener('input', e => { r.wallIn = e.target.value; e.target.classList.remove('field-err'); updateGeo(r, true); updateSum(); });
    el.querySelector('.r-wall').addEventListener('change', () => updateGeo(r));
    el.querySelector('input[type=file]').addEventListener('change', e => { addFiles(r, [...e.target.files]); e.target.value = ''; });
    renderItems(r); updateGeo(r); renumber(); updateSum();
    motion.watch(el);
    return r;
  }
  function removeRoom(r) {
    r.files.forEach(f => URL.revokeObjectURL(f.url));
    r.el.remove();
    rooms = rooms.filter(x => x !== r);
    if (!rooms.length) addRoom(); else { renumber(); updateSum(); }
  }
  function renumber() {
    rooms.forEach((r, i) => {
      r.el.querySelector('legend').textContent = `${i + 1}. helyiség`;
      r.el.querySelector('.room-del').hidden = rooms.length === 1;
    });
  }
  const roomOpts = r => ({ w: r.w, l: r.l, wall: r.wallIn });
  function updateGeo(r, fromWall) {
    r.area = +r.w > 0 && +r.l > 0 ? String(Math.round(r.w * r.l * 100) / 100) : '';
    const wf = r.el.querySelector('.r-wall');
    if (!fromWall && !(+r.wallIn > 0)) {
      const auto = roomGeometry(r.area, r.height, { w: r.w, l: r.l }).wall;
      wf.value = +r.w > 0 && +r.l > 0 && auto ? auto : '';
    }
    const g = roomGeometry(r.area, r.height, roomOpts(r));
    r.el.querySelector('.geo').textContent = g.wall
      ? `≈ ${fmtNum(g.wall)} m² falfelület${g.ceiling ? ` és ${fmtNum(g.ceiling)} m² mennyezet (alapterület)` : ''}. A falkerületet átírhatod, ha az ajtók és ablakok miatt kevesebb festendő fal van.`
      : 'Add meg a szélességet, a hosszúságot és a belmagasságot, ebből számolom ki a falkerületet és a mennyezetet.';
  }

  function priceTxt(w) {
    if (TX.show_estimate === false) return esc(UNITS[w.unit] || '');
    const pc = ceilingPrice(w);
    if (w.unit === 'surface' && pc != null && pc !== +w.price) return `fal ${fmtFt(w.price)} / m²<br>menny. ${fmtFt(pc)} / m²`;
    return `${fmtFt(w.unit === 'ceiling' && pc != null ? pc : w.price)} / ${UNIT_SHORT[w.unit] || ''}`;
  }
  /* Egy munka többször is kiválasztható egy helyiségben: az első példány kulcsa a munka azonosítója, a továbbiaké „azonosító#2”, „#3”… */
  const nz = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const keyId = k => String(k).split('#')[0];
  const keyN = k => +(String(k).split('#')[1] || 1);
  const MAX_DUP = 6;

  /* Szabály: ha falkaparás van kiválasztva, két mély alapozás is kell (egy nem elég). */
  const ruleIds = () => ({
    scrape: WORK.filter(w => /^falkapar/.test(nz(w.name))).map(w => w.id),
    primer: (WORK.find(w => /melyalapoz/.test(nz(w.name))) || {}).id
  });
  const lockedKeys = r => {
    const { scrape, primer } = ruleIds();
    return primer && Object.values(r.sel).some(s => scrape.includes(s.wid)) ? [primer, primer + '#2'] : [];
  };
  function enforceRules(r) {
    const { primer } = ruleIds();
    let added = false;
    lockedKeys(r).forEach(k => {
      if (r.sel[k]) return;
      const base = r.sel[primer];
      r.sel[k] = { wid: primer, surf: base ? base.surf : 'both', qty: base ? base.qty : 0 };
      added = true;
    });
    return added;
  }

  function itemControl(r, w, key, s, canDup) {
    const dis = s ? '' : ' disabled';
    let c = '';
    if (w.unit === 'surface') {
      const cur = (s && s.surf) || 'both';
      c = `<span class="seg" role="radiogroup" aria-label="${esc(w.name)}: hol">${SURFACES.map(([k, l]) =>
        `<label><input type="radio" name="s-${r.id}-${key}" value="${k}"${cur === k ? ' checked' : ''}${dis}><span>${l}</span></label>`).join('')}</span>`;
    } else if (QTY_UNITS.includes(w.unit)) {
      const piece = w.unit === 'piece';
      c = `<span class="qtyw"><input type="number" class="qty" min="0" max="9999" step="${piece ? 1 : 0.1}" inputmode="decimal" value="${s ? (s.qty || '') : piece ? 1 : ''}" placeholder="0" aria-label="${esc(w.name)}: mennyiség (${UNIT_SHORT[w.unit]})"${dis}><span>${UNIT_SHORT[w.unit]}</span></span>`;
    }
    if (canDup) c += `<button type="button" class="it-dup" title="Ugyanez a munka még egyszer (pl. két réteg)">+ még egyszer</button>`;
    return `<span class="it-c">${c}</span>`;
  }
  function renderItems(r, openState) {
    const box = r.el.querySelector('.r-items');
    if (!WORK.length) {
      box.innerHTML = `<p class="geo">${workLoaded ? 'Írd le a megjegyzésben, milyen munkát szeretnél ebben a helyiségben.' : 'A munkafolyamatok betöltése…'}</p>`;
      return;
    }
    enforceRules(r);
    const locked = lockedKeys(r);
    const groups = {};
    WORK.forEach(w => { (groups[w.category || 'Munkák'] = groups[w.category || 'Munkák'] || []).push(w); });
    const cnt = n => (n ? n + ' kiválasztva' : '');
    const row = (w, key, s, extra) => {
      const lock = locked.includes(key), n = keyN(key);
      return `<div class="it${s ? ' on' : ''}${extra ? ' extra' : ''}" data-id="${w.id}" data-key="${key}"><label class="it-l"><input type="checkbox" value="${key}"${s ? ' checked' : ''}${lock ? ' disabled' : ''}>
          <span class="it-t">${esc(w.name)}${extra ? ` <b class="it-n">(${n}. alkalom)</b>` : ''}${!extra && w.description ? `<small>${esc(w.description)}</small>` : ''}${lock ? '<small>A falkaparás mellé két mély alapozás kell, ezért ez nem vehető ki.</small>' : ''}</span></label>
          ${itemControl(r, w, key, s, !extra && !!s)}<span class="it-p">${extra ? '' : priceTxt(w)}</span></div>`;
    };
    box.innerHTML = Object.entries(groups).map(([cat, items], gi) => {
      const ids = items.map(w => w.id), n = Object.values(r.sel).filter(s => ids.includes(s.wid)).length;
      const open = n || (openState && openState[gi]);
      return `<details class="grp"${open ? ' open' : ''}><summary><span>${esc(cat)}</span><em data-cnt>${cnt(n)}</em></summary>${items.map(w => {
        const extras = Object.keys(r.sel).filter(k => r.sel[k].wid === w.id && k !== w.id).sort((a, b) => keyN(a) - keyN(b));
        return row(w, w.id, r.sel[w.id], false) + extras.map(k => row(w, k, r.sel[k], true)).join('');
      }).join('')}</details>`;
    }).join('');

    /* a lista újrarajzolása a nyitott csoportok megtartásával; fókusz a megadott sorra */
    const redraw = (key, focusQty) => {
      renderItems(r, [...box.querySelectorAll('details.grp')].map(d => d.open));
      const it = box.querySelector(`.it[data-key="${key}"]`);
      if (!it) return;
      const q = it.querySelector('.qty');
      (q && (focusQty || !q.value) && !q.disabled ? q : it.querySelector('input[type=checkbox]')).focus();
    };
    box.onchange = e => {
      const it = e.target.closest('.it'); if (!it) return;
      const key = it.dataset.key, id = it.dataset.id, w = WORK.find(x => x.id === id);
      if (e.target.type === 'checkbox') {
        if (e.target.checked) {
          r.sel[key] = { wid: id, surf: 'both', qty: w && QTY_UNITS.includes(w.unit) ? (w.unit === 'piece' ? 1 : 0) : 1 };
        } else {
          /* az első példány kivétele az összes példányt kiveszi, egy további példány csak önmagát */
          Object.keys(r.sel).forEach(k => { if (r.sel[k].wid === id && (k === key || key === id)) delete r.sel[k]; });
        }
        const added = enforceRules(r);
        box.classList.remove('field-err');
        redraw(key);
        if (added) flash('A falkaparás mellé két mély alapozás kell, ezért mindkettőt kijelöltem.');
        updateSum();
      } else if (e.target.type === 'radio' && r.sel[key]) {
        r.sel[key].surf = e.target.value;
        box.classList.remove('field-err');
        updateSum();
      }
    };
    box.onclick = e => {
      const b = e.target.closest('.it-dup'); if (!b) return;
      const id = b.closest('.it').dataset.id, base = r.sel[id]; if (!base) return;
      let n = 2;
      while (r.sel[id + '#' + n]) n++;
      if (n > MAX_DUP) { flash(`Egy munkát legfeljebb ${MAX_DUP}-szor lehet felvenni egy helyiségben.`); return; }
      r.sel[id + '#' + n] = { ...base };
      redraw(id + '#' + n, true);
      updateSum();
    };
    box.oninput = e => {
      if (!e.target.classList.contains('qty')) return;
      e.target.classList.remove('field-err');
      const key = e.target.closest('.it').dataset.key;
      if (r.sel[key]) { r.sel[key].qty = +e.target.value || 0; updateSum(); }
    };
  }

  function calcRoom(r) {
    const g = roomGeometry(r.area, r.height, roomOpts(r));
    const pos = id => WORK.findIndex(x => x.id === id);
    const items = Object.entries(r.sel)
      .map(([k, s]) => ({ k, s, w: WORK.find(x => x.id === (s.wid || keyId(k))) })).filter(x => x.w)
      .sort((a, b) => workPhase(a.w, keyN(a.k)) - workPhase(b.w, keyN(b.k)) || pos(a.w.id) - pos(b.w.id) || keyN(a.k) - keyN(b.k))
      .flatMap(({ k, s, w }) => {
        const lines = workLines(w, g, s), n = keyN(k);
        return n > 1 ? lines.map(l => ({ ...l, name: `${l.name} (${n}. alkalom)` })) : lines;
      });
    return { g, items, subtotal: items.reduce((t, x) => t + x.amount, 0) };
  }

  function promo() {
    if (!isOn(TX.promo_on)) return null;
    const pct = parseFloat(TX.promo_pct);
    if (!(pct > 0 && pct < 100)) return null;
    const until = String(TX.promo_until || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(until) && dayStr(new Date()) > until) return null;
    return { label: String(TX.promo_label || '').trim() || 'Akció', pct, until };
  }
  /* részösszegek, akció, majd a fix végösszeg */
  function totals() {
    let total = 0;
    const per = rooms.map(r => { const c = calcRoom(r); total += c.subtotal; return c; });
    const pr = promo(), disc = pr ? Math.round(total * pr.pct / 100) : 0, net = total - disc;
    return { per, total, pr, disc, net };
  }
  const fmtRange = v => `${fmtInt(v[0])} Ft`;
  let shownTotal = [0], tweenRaf = 0;
  function showTotal(el, vals) {
    cancelAnimationFrame(tweenRaf);
    const from = shownTotal.length === vals.length ? shownTotal : vals.map(() => 0);
    const changed = from.join() !== vals.join();
    shownTotal = vals;
    if (reduced || !changed) { el.textContent = fmtRange(vals); return; }
    el.classList.add('bump');
    const t0 = performance.now(), dur = 420;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtRange(vals.map((v, i) => from[i] + (v - from[i]) * e));
      if (k < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  }
  function updateSum() {
    const showP = TX.show_estimate !== false, T = totals();
    const li = rooms.map((r, i) => {
      const c = T.per[i], g = c.g;
      const meta = [r.area ? `${fmtNum(r.w)} × ${fmtNum(r.l)} m` : 'méretek hiányoznak', r.files.length ? `${r.files.length} fotó` : ''].filter(Boolean).join(', ');
      const surf = [g.wall ? `<li>Fal: <b>${fmtNum(g.wall)} m²</b></li>` : '', g.ceiling ? `<li>Mennyezet: <b>${fmtNum(g.ceiling)} m²</b></li>` : ''].join('');
      const steps = c.items.map(it => `<li><span>${esc(it.name)}</span><small>${fmtNum(it.qty)} ${UNIT_SHORT[it.unit] || ''}</small>${showP ? `<em>${fmtFt(it.amount)}</em>` : ''}</li>`).join('');
      return `<li class="q-room"><b>${esc(r.name || `${i + 1}. helyiség`)}</b><em>${showP ? fmtFt(c.subtotal) : ''}</em><small>${meta}</small>
        ${surf ? `<div class="q-sub">Felületek</div><ul class="q-surf">${surf}</ul>` : ''}
        ${steps ? `<div class="q-sub">Munkafolyamatok sorrendben</div><ol class="q-steps">${steps}</ol>` : ''}</li>`;
    }).join('');
    const promoLine = T.pr && T.total ? `<div class="promo-line"><span>${esc(T.pr.label)} (−${fmtNum(T.pr.pct)}%)</span><em>−${fmtFt(T.disc)}</em></div>` : '';
    $('#qSum').innerHTML = `<h3>Összesítő</h3><ul>${li}</ul>
      ${showP ? `<div class="tot">${promoLine}Becsült munkadíj<strong id="qTotal"></strong></div>
        <button type="button" class="btn sm pdf" id="qPdf"${T.total ? '' : ' disabled'}>Becslés letöltése PDF-ben</button>` : ''}
      <small class="note">${esc(TX.quote_disclaimer || '')}</small>`;
    const strong = $('#qTotal');
    if (strong) showTotal(strong, [T.net]);
    const pn = $('#promoNote');
    pn.hidden = !T.pr;
    if (T.pr) {
      const until = T.pr.until ? ', ' + new Date(T.pr.until + 'T12:00:00').toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' }).replace(/\.$/, '') + '-ig' : '';
      pn.textContent = `${T.pr.label}: −${fmtNum(T.pr.pct)}% a becsült munkadíjból${until}. Automatikusan levonom az összesítőből.`;
    }
  }

  function addFiles(r, files) {
    let skipped = 0;
    for (const f of files) {
      const isImg = (f.type || '').startsWith('image/') || /\.(heic|heif)$/i.test(f.name);
      if (!isImg || f.size > MAX_SIZE || r.files.length >= MAX_FILES) { skipped++; continue; }
      r.files.push({ file: f, url: URL.createObjectURL(f) });
    }
    renderThumbs(r); updateSum();
    status(skipped ? `${skipped} fájlt nem csatoltam: csak kép lehet, legfeljebb 15 MB, helyiségenként ${MAX_FILES} darab.` : '', !!skipped);
  }
  function renderThumbs(r) {
    const t = r.el.querySelector('.thumbs');
    t.innerHTML = r.files.map((f, i) => `<div class="thumb"><img src="${f.url}" alt="Csatolt fotó ${i + 1}"><button type="button" data-i="${i}" aria-label="Fotó eltávolítása">×</button></div>`).join('');
    t.onclick = e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const [f] = r.files.splice(+b.dataset.i, 1);
      URL.revokeObjectURL(f.url);
      renderThumbs(r); updateSum();
    };
  }

  /* kívánt felmérési időpontok (legfeljebb 3, holnaptól 120 napig) */
  const SLOT_PARTS = ['Bármikor', 'Reggel (8–10)', 'Délelőtt (10–12)', 'Délután (12–16)', 'Késő délután (16–19)'];
  const MAX_SLOTS = 3;
  const dayFromNow = n => { const d = new Date(); d.setDate(d.getDate() + n); return dayStr(d); };
  function syncSlots() {
    const rows = [...$('#slotRows').children];
    $('#addSlot').hidden = rows.length >= MAX_SLOTS;
    rows.forEach(r => { r.querySelector('.slot-x').hidden = rows.length === 1; });
  }
  function addSlot() {
    const box = $('#slotRows');
    if (box.children.length >= MAX_SLOTS) return null;
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.innerHTML = `<label>Nap<input type="date" class="s-date" min="${dayFromNow(1)}" max="${dayFromNow(120)}"></label>
      <label>Napszak<select class="s-part">${SLOT_PARTS.map(p => `<option>${p}</option>`).join('')}</select></label>
      <button type="button" class="slot-x" aria-label="Időpont törlése">×</button>`;
    box.appendChild(row);
    row.querySelector('.slot-x').addEventListener('click', () => { row.remove(); syncSlots(); });
    row.querySelector('.s-date').addEventListener('input', e => e.target.classList.remove('field-err'));
    syncSlots();
    return row;
  }
  function resetSlots() { $('#slotRows').innerHTML = ''; addSlot(); }
  function readSlots() {
    if ($('#slotsBox').hidden) return [];
    return $$('#slotRows .slot-row').map(r => ({ date: r.querySelector('.s-date').value, part: r.querySelector('.s-part').value })).filter(s => s.date);
  }
  $('#addSlot').addEventListener('click', () => { const r = addSlot(); if (r) r.querySelector('.s-date').focus(); });

  function validate() {
    let first = null;
    const mark = el => { el.classList.add('field-err'); first = first || el; };
    rooms.forEach(r => {
      if (!(+r.w > 0)) mark(r.el.querySelector('.r-w'));
      if (!(+r.l > 0)) mark(r.el.querySelector('.r-l'));
      if (!(+r.height >= 1.5)) mark(r.el.querySelector('.r-h'));
      if (!(calcRoom(r).g.wall > 0)) mark(r.el.querySelector('.r-wall'));
      if (WORK.length && !Object.keys(r.sel).length) mark(r.el.querySelector('.r-items'));
      if (lockedKeys(r).some(k => !r.sel[k])) mark(r.el.querySelector('.r-items'));
      Object.keys(r.sel).forEach(key => {
        const w = WORK.find(x => x.id === r.sel[key].wid);
        if (w && QTY_UNITS.includes(w.unit) && !(r.sel[key].qty > 0)) mark(r.el.querySelector(`.it[data-key="${key}"] .qty`));
      });
    });
    [['#qName', v => v.trim().length > 1], ['#qEmail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
     ['#qPhone', v => v.replace(/\D/g, '').length >= 6], ['#qCity', v => v.trim().length > 1]]
      .forEach(([s, ok]) => { const el = $(s); el.classList.remove('field-err'); if (!ok(el.value)) mark(el); });
    if (!$('#qOk').checked) mark($('#qOk'));
    if (!$('#slotsBox').hidden) {
      const lo = dayFromNow(1), hi = dayFromNow(120);
      $$('#slotRows .s-date').forEach(d => { if (d.value && (d.value < lo || d.value > hi)) mark(d); });
    }
    if (!first) return true;
    first.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    if (first.tagName !== 'DIV') { const d = first.closest('details'); if (d) d.open = true; }
    status('Néhány mező hiányos. A pirossal jelölteket töltsd ki: szélesség, hosszúság, belmagasság, falkerület, legalább egy munka helyiségenként, a kiválasztott munkák mennyisége, a kívánt időpont (holnaptól kérhető), elérhetőségek és a hozzájárulás.', true);
    return false;
  }
  ['#qName', '#qEmail', '#qPhone', '#qCity', '#qOk'].forEach(s => $(s).addEventListener('input', e => e.target.classList.remove('field-err')));

  $('#quoteForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    if (!sb) { status('Az árajánlatkérés most nem küldhető el. Hívj fel, vagy írj e-mailt a lenti elérhetőségeken.', true); return; }
    const btn = $('#qSend');
    btn.disabled = true; btn.classList.add('busy');
    const id = uid(), totalFiles = rooms.reduce((t, r) => t + r.files.length, 0);
    let uploaded = 0;
    try {
      const roomsOut = [];
      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i], c = calcRoom(r), paths = [];
        for (let j = 0; j < r.files.length; j++) {
          status(`Fotók feltöltése: ${uploaded + 1} / ${totalFiles}`);
          const img = await shrinkImage(r.files[j].file);
          const path = `${id}/${i + 1}-${j + 1}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`;
          const { error } = await sb.storage.from(PLANERVO_CFG.quoteBucket).upload(path, img.blob, { contentType: img.type, upsert: false });
          if (error) throw new Error('A fotók feltöltése nem sikerült (' + error.message + ').');
          paths.push(path); uploaded++;
        }
        roomsOut.push({ name: r.name.trim() || `${i + 1}. helyiség`, width: +r.w, length: +r.l, area: +r.area, height: +r.height, wall: c.g.wall, ceiling: c.g.ceiling, items: c.items, subtotal: c.subtotal, images: paths });
      }
      status('Árajánlat-kérés küldése…');
      const T = totals(), slots = readSlots();
      const base = {
        id, name: $('#qName').value.trim(), email: $('#qEmail').value.trim(), phone: $('#qPhone').value.trim(),
        city: $('#qCity').value.trim(), message: $('#qMsg').value.trim() || null, rooms: roomsOut, estimate: T.net
      };
      let { error } = await sb.from('quotes').insert({
        ...base,
        estimate_min: T.net, estimate_max: T.net,
        discount: T.pr && T.disc ? { label: T.pr.label, pct: T.pr.pct, amount: T.disc } : null,
        preferred_slots: slots.length ? slots : null
      });
      if (error && /column|schema cache|PGRST204/i.test(`${error.code || ''} ${error.message || ''}`)) {
        /* ha az adatbázisban még nincsenek meg az új oszlopok, a kérés akkor se vesszen el: az időpontok a megjegyzésbe kerülnek */
        const note = slots.length ? 'Kívánt időpontok: ' + slots.map(s => `${s.date} (${s.part})`).join('; ') : '';
        ({ error } = await sb.from('quotes').insert({ ...base, message: [base.message, note].filter(Boolean).join('\n\n') || null }));
      }
      if (error) throw new Error('Az árajánlat-kérés mentése nem sikerült (' + error.message + ').');
      try { await sb.functions.invoke(PLANERVO_CFG.notifyFunction, { body: { id } }); } catch (x) { /* az adminban így is megjelenik */ }
      status('');
      $('#quoteForm').hidden = true;
      $('#qDone').hidden = false;
      $('#qDone').focus();
      $('#qDone').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    } catch (err) {
      status(err.message + ' Próbáld újra, vagy hívj fel telefonon.', true);
    } finally { btn.disabled = false; btn.classList.remove('busy'); }
  });

  $('#qAgain').addEventListener('click', () => {
    rooms.forEach(r => { r.files.forEach(f => URL.revokeObjectURL(f.url)); r.el.remove(); });
    rooms = [];
    $('#quoteForm').reset();
    addRoom(); resetSlots();
    $('#qDone').hidden = true;
    $('#quoteForm').hidden = false;
  });
  $('#addRoom').addEventListener('click', () => addRoom().el.querySelector('.r-name').focus());

  $('#qSum').addEventListener('click', async e => {
    const b = e.target.closest('#qPdf'); if (!b || b.disabled) return;
    b.disabled = true; b.textContent = 'PDF készül…';
    const T = totals();
    try {
      await PlanervoPdf.download({
        title: 'Becsült árajánlat', date: fmtDate(new Date()),
        customer: { name: $('#qName').value.trim(), city: $('#qCity').value.trim(), phone: $('#qPhone').value.trim(), email: $('#qEmail').value.trim() },
        rooms: rooms.map((r, i) => { const c = T.per[i]; return { name: r.name.trim() || `${i + 1}. helyiség`, width: +r.w, length: +r.l, area: +r.area, height: +r.height, wall: c.g.wall, ceiling: c.g.ceiling, items: c.items, subtotal: c.subtotal }; }),
        discount: T.pr && T.disc ? { label: T.pr.label, pct: T.pr.pct, amount: T.disc } : null,
        net: T.net,
        note: TX.quote_disclaimer || '', contact: { phone: TX.phone, email: TX.email, site: siteBase(TX).replace(/^https?:\/\//, '') }
      }, `planervo-becsles-${dayStr(new Date())}.pdf`);
      flash('A PDF letöltődött.');
    } catch (err) { status(err.message || 'A PDF elkészítése nem sikerült.', true); }
    updateSum();
  });

  /* lépésjelző: a görgetéssel együtt váltja az aktív lépést */
  function qStepsUpdate() {
    if ($('#quoteForm').hidden) return;
    const line = innerHeight * .4;
    let cur = 0;
    ['#qs1', '#qs2', '#qs3'].forEach((s, i) => { const el = $(s); if (el.offsetParent !== null && el.getBoundingClientRect().top < line) cur = i; });
    $$('#qSteps a').forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  }

  /* =====================================================================
     Mozgások: görgetéses megjelenés, számláló, kártyák fénycsóvája, gombhullám.
     Minden tartalom akkor is látszik, ha a mozgás ki van kapcsolva.
     ===================================================================== */
  const motion = (function () {
    const waiting = new Map(), seen = new WeakSet();
    const io = !reduced && hasIO ? new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      (waiting.get(e.target) || []).forEach(show);
      waiting.delete(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .01 }) : null;
    function show(el) {
      el.classList.add('rv-in');
      const delay = parseInt(el.style.getPropertyValue('--rd'), 10) || 0;
      setTimeout(() => { el.classList.remove('rv', 'rv-in', 'rv-blur', 'rv-left', 'rv-clip', 'rv-r', 'rv-h'); el.style.removeProperty('--rd'); }, 1500 + delay);
    }
    /* a kivágással rejtett elemeknél (cím, kép) a szülőt figyeljük, mert a böngésző azt nem látja láthatónak */
    function watch(el, cls = '', delay = 0) {
      if (!io || !el || seen.has(el)) return;
      seen.add(el);
      if (el.getBoundingClientRect().top < innerHeight * .9) return;
      el.classList.add(...(cls === 'h' ? ['rv-h'] : ['rv', ...cls.split(' ').filter(Boolean)]));
      if (delay) el.style.setProperty('--rd', delay + 'ms');
      const target = cls === 'h' || cls.includes('rv-clip') ? el.parentElement : el;
      if (!waiting.has(target)) { waiting.set(target, []); io.observe(target); }
      waiting.get(target).push(el);
    }
    const group = (box, cls, step = 90, max = 6) => { if (box) [...box.children].forEach((c, i) => watch(c, cls, (i % max) * step)); };
    function scan() {
      $$('.head').forEach(h => [...h.children].forEach((c, i) => watch(c, c.tagName === 'H2' ? 'h' : '', i * 80)));
      const svc = $('#svcList'), svcCards = svc.matches('.car-track,.t-grid');
      $$('.svc-row', svc).forEach((r, i) => {
        if (svcCards) return watch(r, '', (i % 4) * 90);
        watch(r.querySelector('.svc-pic'), i % 2 ? 'rv-clip rv-r' : 'rv-clip');
        watch(r.querySelector('.svc-txt'), i % 2 ? '' : 'rv-left', 150);
      });
      group($('#numList'), '', 110, 4);
      $$('#stepList > li').forEach(li => watch(li, 'rv-left'));
      group($('#baList'), '', 120, 2);
      group($('#galList'), 'rv-blur', 80, 3);
      ['#tstTrack', '#spTrack', '#vidList', '#postList'].forEach(s => { const b = $(s); if (b.classList.contains('car-track')) watch(b); else group(b, '', 100, 4); });
      $$('.room').forEach(r => watch(r));
      watch($('#qSum'), '', 150);
      group($('#contactBox'), 'rv-left', 80, 5);
      $$('.slot .custom .inner').forEach(x => watch(x));
      setTimeout(() => $$('.rv:not(.rv-in), .rv-h:not(.rv-in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) show(el); }), 4000);
    }
    function counters() {
      if (reduced || !hasIO) return;
      $$('#numList .cnt').forEach(el => {
        const o = new IntersectionObserver(es => {
          if (!es[0].isIntersecting) return;
          o.disconnect();
          const txt = el.textContent.trim(), to = parseFloat(txt.replace(',', '.'));
          if (!isFinite(to)) return;
          const dec = (txt.split(/[.,]/)[1] || '').length, t0 = performance.now(), dur = 1600;
          const step = now => {
            const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            el.textContent = k < 1 ? (to * e).toLocaleString('hu-HU', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : txt;
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }, { threshold: .6 });
        o.observe(el);
      });
    }
    function cards() {
      if (!finePointer || reduced) return;
      $$('.t-card, .sp-card, .vc, .post-card').forEach(el => {
        if (el.classList.contains('tilt')) return;
        el.classList.add('tilt');
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
          el.classList.add('lit');
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; el.classList.remove('lit'); });
      });
    }
    if (!reduced) document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn, .pill'); if (!b || b.disabled) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), i = document.createElement('i');
      i.className = 'rip';
      i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      b.appendChild(i);
      setTimeout(() => i.remove(), 650);
    });
    return { watch, refresh() { scan(); cards(); }, counters };
  })();

  /* =====================================================================
     Ugrás a szakaszokra: a később betöltődő képek nyújtják az oldalt, ezért a célt a betöltés végéig igazítjuk
     ===================================================================== */
  function scrollToSection(t, animate = true) {
    const aim = () => t.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0);
    const go = y => window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    const start = scrollY, t0 = performance.now(), dur = animate && !reduced ? 900 : 0;
    const EV = ['wheel', 'touchstart', 'keydown'];
    let timer = null, raf = 0;
    const end = () => { cancelAnimationFrame(raf); clearInterval(timer); EV.forEach(ev => removeEventListener(ev, end)); };
    EV.forEach(ev => addEventListener(ev, end, { passive: true }));
    const frame = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      go(start + (aim() - start) * e);
      if (k < 1) { raf = requestAnimationFrame(frame); return; }
      let n = 0;
      timer = setInterval(() => { if (Math.abs(aim() - scrollY) > 2) go(aim()); if (++n >= 15) end(); }, 100);
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

  /* =====================================================================
     Görgetés, átméretezés, betöltés
     ===================================================================== */
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { hero(); stepsProgress(); qStepsUpdate(); ticking = false; });
  }, { passive: true });
  let resizeTimer = 0;
  addEventListener('resize', () => {
    hero(); stepsProgress(); qStepsUpdate(); bannerHeight();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => Object.keys(CARD_SECTIONS).forEach(applyRows), 150);
  });

  async function load() {
    applyTexts(); applyLayout(getLayout(TX));
    renderServices(DEFAULT_SERVICES); renderSteps(DEFAULT_STEPS);
    addRoom(); resetSlots(); hero();
    if (!sb) { workLoaded = true; rooms.forEach(r => renderItems(r)); syncWorksLinks(); motion.refresh(); motion.counters(); return; }
    const list = t => sb.from(t).select('*').eq('visible', true).order('position').order('created_at');
    const safe = p => Promise.resolve(p).catch(error => ({ error }));
    const now = new Date().toISOString();
    const [tx, svc, sec, ba, gal, alb, vid, work, posts, soc, stp, tst, faq] = await Promise.all([
      safe(loadTexts()), safe(list('services')), safe(list('sections')), safe(list('before_after')),
      safe(list('gallery')), safe(list('gallery_albums')), safe(list('videos')), safe(list('work_items')),
      safe(sb.from('posts').select('title,slug,excerpt,cover_url,published_at').eq('published', true).lte('published_at', now).order('published_at', { ascending: false }).limit(3)),
      safe(sb.from('social_posts').select('*').eq('visible', true).order('published_at', { ascending: false }).limit(30)),
      safe(list('process_steps')),
      safe(sb.from('testimonials').select('*').eq('visible', true).order('position').order('created_at', { ascending: false }).limit(30)),
      safe(list('faqs'))
    ]);
    if (!tx.error) { TX = tx; applyTexts(); applyLayout(getLayout(TX)); }
    if (!svc.error) renderServices(svc.data || []);
    if (!sec.error) renderSections(sec.data || []);
    if (!ba.error) renderBA(ba.data || []);
    if (!gal.error) renderGallery(gal.data || [], alb.error ? [] : (alb.data || []), TX.gallery_mode || 'images');
    syncWorksLinks();
    if (!posts.error) renderPosts(posts.data || []);
    if (!soc.error) renderSocial(soc.data || []);
    if (!stp.error) renderSteps(stp.data || []);
    if (!tst.error) renderTestimonials(tst.data || []);
    if (!faq.error) renderFaq(faq.data || []);
    workLoaded = true;
    if (!work.error) WORK = work.data || [];
    rooms.forEach(r => renderItems(r)); updateSum(); hero();
    motion.refresh(); motion.counters();
    loadVideos(vid.error ? [] : (vid.data || []));
    if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) scrollToSection(t, false); }
  }
  load();
})();
