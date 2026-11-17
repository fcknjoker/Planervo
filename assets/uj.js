/* =====================================================================
   PLANERVO – új dizájn: mozgások a főoldalon
   - Betöltéskor a logó háza apránként felépül (a „Rétegek” minta idővonala).
   - A henger festését az eredeti site.js végzi, változtatás nélkül.
   - Görgetésre a címek, kártyák, képek finoman beúsznak; a számok felpörögnek;
     a kártyákon fénycsóva követi az egeret; a gombokon kattintásra hullám fut.
   Minden tartalom akkor is látszik, ha a mozgás ki van kapcsolva vagy hiba történik.
   ===================================================================== */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 1. A ház felépülése (ugyanaz, mint az „1. Rétegek” mintán) ---------- */
  function buildHouse() {
    if (reduced || !window.gsap) return;
    const root = $('#L0'); if (!root) return;
    const q = s => root.querySelectorAll(s);
    const custom = !$('#heroLogo').hidden;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (custom) tl.from('#heroLogo', { opacity: 0, y: 30, duration: 1.2 });
    else {
      tl.from(q('.st'), { xPercent: -170, opacity: 0, stagger: .18, duration: 1.3 })
        .from(q('.frame'), { y: -60, opacity: 0, duration: 1 }, '-=.8')
        .from(q('.win rect'), { scale: 0, transformOrigin: '50% 50%', stagger: .06, duration: .6 }, '-=.6')
        .from(q('.ground'), { scaleX: 0, transformOrigin: '50% 50%', duration: 1 }, '<')
        .from(q('.wordmark .ch>span'), { yPercent: 110, stagger: .05, duration: 1 }, '-=.7')
        .from(q('.wordmark i b'), { scaleX: 0, transformOrigin: 'left', stagger: .08, duration: .7 }, '<.15')
        .from(q('.svcline'), { opacity: 0, y: 16, duration: .8 }, '-=.4');
    }
    tl.from([...q('.h1'), ...q('.sub'), ...q('.btns')], { opacity: 0, y: 24, stagger: .1, duration: .9, clearProps: 'opacity,transform' }, '-=.5')
      .from('#hint', { opacity: 0, duration: .8, clearProps: 'opacity' }, '-=.4');
  }

  /* ---------- 2. Görgetéses megjelenés ----------
     IntersectionObserver: a helyzetet a böngésző követi, így a később betöltődő képek és
     tartalmak sem csúsztatják el. Megjelenés után az osztályok lekerülnek, az eredeti stílus marad. */
  // a kivágással rejtett elemeket (cím, kép) a böngésző nem látja „láthatónak”, ezért a szülőjüket figyeljük
  const waiting = new Map();
  const io = !reduced && 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const t = e.target; io.unobserve(t); (waiting.get(t) || []).forEach(show); waiting.delete(t);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .01 }) : null;
  const seen = new WeakSet();
  function show(el) {
    // saját osztálynév: az eredeti oldal az „in” osztályt a folyamatlépésekhez használja
    el.classList.add('rv-in');
    const done = () => { el.classList.remove('rv', 'rv-in', 'rv-blur', 'rv-left', 'rv-clip', 'rv-r', 'rv-h'); el.style.removeProperty('--rd'); };
    setTimeout(done, 1500 + (parseInt(el.style.getPropertyValue('--rd')) || 0));
  }
  function watch(el, cls = '', delay = 0) {
    if (!io || !el || seen.has(el)) return; seen.add(el);
    // ami már a képernyőn vagy fölötte van, azonnal látszik
    if (el.getBoundingClientRect().top < innerHeight * .9) return;
    el.classList.add(...(cls === 'h' ? ['rv-h'] : ['rv', ...cls.split(' ').filter(Boolean)]));
    if (delay) el.style.setProperty('--rd', delay + 'ms');
    const clipped = cls === 'h' || cls.includes('rv-clip'), target = clipped ? el.parentElement : el;
    if (!waiting.has(target)) { waiting.set(target, []); io.observe(target); }
    waiting.get(target).push(el);
  }
  // csoport: a gyerekek egymás után, kis késleltetéssel
  function group(box, cls, step = 90, max = 6) { if (!box) return; [...box.children].forEach((c, i) => watch(c, cls, (i % max) * step)); }

  function scan() {
    $$('.head').forEach(h => { [...h.children].forEach((c, i) => watch(c, c.tagName === 'H2' ? 'h' : '', i * 80)); });
    // szolgáltatások: a kép oldalról nyílik, a szöveg beúszik
    $$('#svcList .svc-row').forEach((r, i) => {
      const grid = $('#svcList').matches('.car-track,.t-grid');
      if (grid) { watch(r, '', (i % 4) * 90); return; }
      watch(r.querySelector('.svc-pic'), i % 2 ? 'rv-clip rv-r' : 'rv-clip');
      watch(r.querySelector('.svc-txt'), i % 2 ? '' : 'rv-left', 150);
    });
    group($('#numList'), '', 110, 4);
    $$('#stepList > li').forEach(li => watch(li, 'rv-left'));
    group($('#baList'), '', 120, 2);
    group($('#galList'), 'rv-blur', 80, 3);
    ['#tstTrack', '#spTrack', '#vidList', '#postList'].forEach(s => { const b = $(s); if (b && !b.classList.contains('car-track')) group(b, '', 100, 4); else if (b) watch(b, ''); });
    $$('.room').forEach(r => watch(r, ''));
    watch($('#qSum'), '', 150);
    group($('#contactBox'), 'rv-left', 80, 5);
    $$('.slot .custom .inner').forEach(x => watch(x, ''));
  }

  /* ---------- 3. Számok felpörgetése ---------- */
  function counters() {
    $$('#numList .cnt').forEach(el => {
      if (el._c) return; el._c = 1;
      const go = () => {
        const txt = el.textContent.trim(), to = parseFloat(txt.replace(',', '.'));
        if (!isFinite(to) || reduced) return;
        const dec = (txt.split(/[.,]/)[1] || '').length, t0 = performance.now(), dur = 1600;
        const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = (to * e).toLocaleString('hu-HU', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); else el.textContent = txt; };
        requestAnimationFrame(step);
      };
      if (!('IntersectionObserver' in window)) return;
      const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { threshold: .6 });
      o.observe(el);
    });
  }

  /* ---------- 4. Kártyák: fénycsóva és dőlés egérrel ---------- */
  function cards() {
    if (!fine || reduced) return;
    $$('.t-card, .sp-card, .vc, .post-card').forEach(el => {
      if (el._g) return; el._g = 1; el.classList.add('tilt');
      el.insertAdjacentHTML('beforeend', '<span class="glare" aria-hidden="true"></span>');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
        el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%'); el.classList.add('lit');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; el.classList.remove('lit'); });
    });
  }

  /* ---------- 5. Gombok: kattintásra hullám ---------- */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn, .pill'); if (!b || reduced || b.disabled) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), i = document.createElement('i');
    i.className = 'rip'; i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(i); setTimeout(() => i.remove(), 650);
  });

  /* ---------- 6. Az árajánlat összegének kiemelése, amikor változik ---------- */
  function sumBump() {
    const box = $('#qSum'); if (!box || reduced) return;
    let last = '';
    new MutationObserver(() => { const s = $('#qTotal'); if (!s) return; const v = s.textContent; if (v && v !== last && /\d/.test(v)) { last = v; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); } })
      .observe(box, { subtree: true, childList: true, characterData: true });
  }

  /* ---------- Indítás: a tartalom a Supabase-ből később érkezik, ezért figyeljük a változást ---------- */
  function refresh() { scan(); counters(); cards(); }
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(refresh, 60); };
  function start() {
    buildHouse(); refresh(); sumBump();
    const main = $('main'); if (main) new MutationObserver(later).observe(main, { childList: true, subtree: true });
    // tartalék: semmi nem maradhat rejtve
    setTimeout(() => $$('.rv:not(.rv-in), .rv-h:not(.rv-in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) show(el); }), 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
