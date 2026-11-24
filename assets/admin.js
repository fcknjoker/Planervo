/* PLANERVO – admin felület */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view'), dlg = $('#dlg'), dlgBody = $('#dlgBody');

  function toast(m, err) {
    const t = $('#toast'); t.textContent = m; t.className = err ? 'show err' : 'show';
    clearTimeout(t._t); t._t = setTimeout(() => { t.className = ''; }, err ? 6000 : 3000);
  }
  const errBox = e => `<div class="errbox">Hiba történt: ${esc(e.message || e)}. Ha ez egy új funkció, futtasd le a hozzá tartozó fájlt a supabase mappából (Supabase → SQL Editor).</div>`;

  const STATUS = { new: 'Új', in_progress: 'Folyamatban', scheduled: 'Időpont megbeszélve', sent: 'Ajánlat elküldve', won: 'Elfogadva', closed: 'Lezárva' };

  /* ---------- Szerkeszthető táblák leírása ---------- */
  const TABLES = {
    work_items: {
      label: 'Munkafolyamatok és díjak', single: 'munkafolyamat', addLabel: 'Új munkafolyamat',
      help: 'Ezekből választ az ügyfél helyiségenként az árajánlatkérőben (csak munkadíj). A „fal és/vagy mennyezet” tételeknél az ügyfél választja ki, hogy falra, mennyezetre vagy mindkettőre kéri. A falfelületet az alapterületből és a belmagasságból számoljuk, négyzetes alaprajzzal becsülve.',
      empty: 'Még nincs munkafolyamat. Töltsd be az alap árlistát az „Árlista betöltése” gombbal, vagy add meg az elsőt kézzel.',
      search: true, importList: true, bulkPrice: true,
      fields: [
        { k: 'name', l: 'Megnevezés', req: 1, ph: 'pl. Festés két rétegben, fehér színben' },
        { k: 'category', l: 'Kategória', ph: 'pl. Alapmunkák, Festési munkák, Mázolási munkák', hint: 'Az azonos kategóriájú munkák egy lenyíló csoportban jelennek meg az árajánlatkérőben.' },
        { k: 'unit', l: 'Mértékegység (mire vonatkozik a díj)', t: 'select', o: Object.entries(UNITS), def: 'surface' },
        { k: 'price', l: 'Munkadíj (Ft / egység)', t: 'number', req: 1 },
        { k: 'price_ceiling', l: 'Mennyezet munkadíja (Ft / m²), ha eltér a faltól', t: 'number', hint: 'Csak a „fal és/vagy mennyezet” és a „csak mennyezet” tételeknél számít. Üresen hagyva a fenti munkadíj érvényes a mennyezetre is.' },
        { k: 'description', l: 'Rövid megjegyzés az ügyfélnek', ph: 'pl. Irányár, a pontos ár felmérés után' }
      ],
      beforeSave: (o, cur) => { if (o.price_ceiling == null && !('price_ceiling' in cur)) delete o.price_ceiling; return null; },
      title: r => r.name,
      sub: r => {
        const pc = r.price_ceiling != null && +r.price_ceiling !== +r.price ? `, mennyezet ${fmtFt(r.price_ceiling)}` : '';
        return `${r.category || 'Kategória nélkül'} · ${fmtFt(r.price)}${pc} / ${UNITS[r.unit] || r.unit}`;
      }
    },
    services: {
      label: 'Szolgáltatások', single: 'szolgáltatás', addLabel: 'Új szolgáltatás',
      help: 'A főoldal szolgáltatás-sorai. Ha képet is adsz meg, a sor mellett nagy képként jelenik meg; kép nélkül a logó színsávjai látszanak.',
      empty: 'Még nincs szolgáltatás. Ha üres, a szakasz nem jelenik meg a főoldalon.',
      fields: [{ k: 'title', l: 'Cím', req: 1 }, { k: 'body', l: 'Leírás', t: 'textarea' }, { k: 'image_url', l: 'Kép (nem kötelező)', t: 'image', folder: 'szolgaltatasok' },
        { k: 'pairs', l: 'Előtte–utána képpárok', t: 'pairs', folder: 'szolgaltatasok', hint: 'Annyi párt adhatsz hozzá, amennyit szeretnél; minél több van, annál kisebb bélyegképként jelennek meg a kártyán. A látogató rákattintva nagyban, csúszkával nézheti meg őket. Képet feltölthetsz, vagy kiválaszthatsz a galériából.' }],
      beforeSave: (o, cur) => { if (!(o.pairs || []).length && !('pairs' in cur)) delete o.pairs; return null; },
      thumb: 'image_url', title: r => r.title, sub: r => r.body
    },
    sections: {
      label: 'Főoldal ablakok', single: 'ablak', addLabel: 'Új ablak',
      help: 'Saját szakaszok a főoldalra: szöveg, kép és gomb. A „Hely a főoldalon” mezővel választod ki, hova kerüljön.',
      empty: 'Még nincs saját ablak. Adj hozzá egyet, például akciót, referenciát vagy bemutatkozást.',
      fields: [
        { k: 'title', l: 'Cím' },
        { k: 'body', l: 'Tartalom', t: 'rich' },
        { k: 'image_url', l: 'Kép', t: 'image', folder: 'ablakok' },
        { k: 'layout', l: 'Elrendezés', t: 'select', o: [['image-left', 'Kép balra, szöveg jobbra'], ['image-right', 'Szöveg balra, kép jobbra'], ['image-top', 'Kép felül, teljes szélességben'], ['text', 'Csak szöveg']], def: 'image-left' },
        { k: 'theme', l: 'Háttér', t: 'select', o: [['light', 'Fehér'], ['peach', 'Barack'], ['dark', 'Sötét'], ['gold', 'Arany']], def: 'light' },
        { k: 'placement', l: 'Hely a főoldalon', t: 'select', o: PLACEMENTS, def: 'after_services' },
        { k: 'button_text', l: 'Gomb szövege', ph: 'pl. Árajánlatot kérek' },
        { k: 'button_url', l: 'Gomb hivatkozása', ph: '#arajanlat vagy https://…' }
      ],
      thumb: 'image_url', title: r => r.title || '(cím nélkül)',
      sub: r => (PLACEMENTS.find(p => p[0] === r.placement) || [, ''])[1]
    },
    before_after: {
      label: 'Előtte–utána', single: 'előtte–utána pár', addLabel: 'Új előtte–utána pár',
      help: 'Két kép ugyanarról a helyről. A látogató csúszkával hasonlítja össze őket. Ugyanolyan képarányú fotók mutatnak a legjobban.',
      empty: 'Még nincs előtte–utána pár. Ha üres, a szakasz nem jelenik meg.',
      fields: [
        { k: 'title', l: 'Cím', ph: 'pl. Nappali felújítás, Üllő' },
        { k: 'before_url', l: 'Előtte kép', t: 'image', req: 1, folder: 'elotte-utana' },
        { k: 'after_url', l: 'Utána kép', t: 'image', req: 1, folder: 'elotte-utana' }
      ],
      thumb: 'after_url', title: r => r.title || '(cím nélkül)'
    },
    videos: {
      label: 'YouTube-videók', single: 'videó', addLabel: 'Új videó',
      help: 'Felül választod ki, honnan jönnek a főoldal videói: a csatornád legújabb videói, egy lejátszási lista, vagy az alábbi, kézzel felvett videók. A kézi lista akkor is tartalék, ha az automatikus lekérés épp nem sikerül.',
      empty: 'Még nincs videó. Ha üres, a szakasz nem jelenik meg.',
      fields: [
        { k: 'url', l: 'YouTube-link', req: 1, ph: 'https://www.youtube.com/watch?v=…' },
        { k: 'title', l: 'Cím' },
        { k: 'description', l: 'Rövid leírás', t: 'textarea' }
      ],
      thumb: r => ytId(r.url) ? `https://i.ytimg.com/vi/${ytId(r.url)}/mqdefault.jpg` : '',
      title: r => r.title || r.url, sub: r => r.title ? r.url : '',
      beforeSave: o => ytId(o.url) ? null : 'Ez nem YouTube-videó linkje. Másold ki a videó címét a böngésző címsorából.'
    },
    gallery: {
      label: 'Galéria', single: 'kép', addLabel: 'Egy kép hozzáadása', multi: true,
      help: 'Egyszerre több képet is feltölthetsz; a felső választóval előre kiválaszthatod az albumot, amelybe kerülnek. A sorrendet a nyilakkal állíthatod, a képaláírás a kép fölé húzott egérrel látszik. A „Főoldal szövegei” menü Galéria csoportjában dől el, hogy az albumok vagy a külön képek látszanak.',
      empty: 'Még nincs kép a galériában. Tölts fel néhányat a „Több kép feltöltése” gombbal.',
      fields: [{ k: 'image_url', l: 'Kép', t: 'image', req: 1, folder: 'galeria' }, { k: 'caption', l: 'Képaláírás' }, { k: 'album_id', l: 'Album (opcionális)', t: 'select', o: [['', '— nincs album —']] }],
      thumb: 'image_url', title: r => r.caption || 'Kép aláírás nélkül',
      sub: r => r.album_id ? 'Album: ' + ((ALBUMS.find(a => a.id === r.album_id) || {}).title || '(ismeretlen)') : 'Nincs albumban'
    },
    gallery_albums: {
      label: 'Galéria albumok', single: 'album', addLabel: 'Új album', visLabel: 'Látható',
      help: 'Az albumok képcsoportokat fognak össze. A főoldalon csak akkor látszanak, ha a Galéria beállításainál az „Albumok” van kiválasztva; ekkor az albumba nem sorolt képek nem jelennek meg. Az album törlése nem törli a benne lévő képeket, azok album nélkül maradnak.',
      empty: 'Még nincs album. Hozz létre egyet, majd a Galéria menüben az albumot kiválasztva tölts fel képeket.',
      fields: [
        { k: 'title', l: 'Album neve', req: 1, max: 120 },
        { k: 'cover_url', l: 'Borítókép (opcionális, különben az album első képe)', t: 'image', folder: 'galeria' },
        { k: 'visible', l: 'Látható az oldalon', t: 'bool' }
      ],
      thumb: 'cover_url', title: r => r.title, sub: r => 'Képek száma: ' + (ALBUM_COUNT[r.id] || 0)
    },
    process_steps: {
      label: 'Hogyan dolgozom', single: 'lépés', addLabel: 'Új lépés',
      help: 'A főoldali „Hogyan dolgozom” szakasz lépései, a megadott sorrendben (a nyilakkal rendezheted). Érdemes 3–6 lépést megadni, mindegyikhez egy-két mondatot.',
      empty: 'Még nincs lépés. Ha üres, a szakasz nem jelenik meg a főoldalon.',
      fields: [{ k: 'title', l: 'Lépés neve', req: 1, ph: 'pl. Felmérés' }, { k: 'body', l: 'Leírás', t: 'textarea' }],
      title: r => r.title, sub: r => r.body
    },
    faqs: {
      label: 'Gyakori kérdések', single: 'kérdés', addLabel: 'Új kérdés',
      help: 'A főoldal „Gyakori kérdések” szakasza. A sorrendet a nyilakkal állíthatod. Ezeket a kérdéseket a Google is látja (strukturált adatként), ezért írj valódi kérdéseket, amiket az ügyfelek tényleg megkérdeznek, rövid, egyenes válasszal.',
      empty: 'Még nincs saját kérdés felvéve, ezért a főoldalon a beépített kérdések látszanak. Ha felveszel egyet, onnantól csak a felvett kérdések jelennek meg.',
      fields: [
        { k: 'question', l: 'Kérdés', req: 1, max: 200, ph: 'pl. El kell pakolnom a bútorokat?' },
        { k: 'answer', l: 'Válasz', t: 'textarea', rows: 5, req: 1 }
      ],
      title: r => r.question, sub: r => String(r.answer || '').slice(0, 110)
    },
    testimonials: {
      label: 'Vélemények', single: 'vélemény', addLabel: 'Új vélemény', visLabel: 'Jóváhagyva',
      help: 'A főoldalon csak a „Jóváhagyva” jelölésű vélemények látszanak. A látogatók a vélemény-oldalon (velemeny.html) küldhetnek újat, ezek jóváhagyásra várnak: olvasd át, és kapcsold be a „Jóváhagyva” jelzőt. Elutasításhoz töröld őket.',
      empty: 'Még nincs vélemény. Vegyél fel egyet kézzel (például egy kapott üzenetből vagy értékelésből), vagy küldd el az ügyfeleknek a vélemény-oldal linkjét.',
      fields: [
        { k: 'name', l: 'Név', req: 1 },
        { k: 'place', l: 'Település (opcionális)' },
        { k: 'rating', l: 'Csillagok', t: 'select', o: [['5', '5 csillag'], ['4', '4 csillag'], ['3', '3 csillag'], ['2', '2 csillag'], ['1', '1 csillag']], def: '5' },
        { k: 'body', l: 'Vélemény', t: 'textarea', rows: 5, req: 1 },
        { k: 'source', l: 'Honnan származik (opcionális)', ph: 'pl. Google, Facebook, e-mail' },
        { k: 'visible', l: 'Jóváhagyva (látható a főoldalon)', t: 'bool' }
      ],
      title: r => `${r.name} ${'★'.repeat(+r.rating || 5)}`,
      sub: r => (r.visible ? '' : 'Jóváhagyásra vár · ') + String(r.body || '').slice(0, 90),
      beforeSave: o => { o.rating = +o.rating || 5; return null; }
    },
    social_posts: {
      label: 'Közösségi média', single: 'bejegyzés', addLabel: 'Új közösségi bejegyzés', noPos: true,
      help: 'Az Instagram-, TikTok- és Facebook-bejegyzéseid a főoldalon egy lapozható ablakban jelennek meg, a legújabb elöl. Másold be a bejegyzés linkjét, és tölts fel hozzá egy borítóképet. Kép nélkül a platform neve jelenik meg.',
      empty: 'Még nincs közösségi bejegyzés. Add hozzá az első Instagram-, TikTok- vagy Facebook-posztodat.',
      fields: [
        { k: 'platform', l: 'Platform', t: 'select', o: [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['facebook', 'Facebook']], def: 'instagram', req: 1 },
        { k: 'url', l: 'A bejegyzés linkje', req: 1, ph: 'https://www.instagram.com/p/…', max: 500 },
        { k: 'title', l: 'Rövid felirat (opcionális)', max: 140 },
        { k: 'image_url', l: 'Borítókép', t: 'image', folder: 'kozossegi' },
        { k: 'published_at', l: 'Közzététel időpontja', t: 'datetime' },
        { k: 'visible', l: 'Látható az oldalon', t: 'bool' }
      ],
      thumb: 'image_url',
      title: r => r.title || SOCIAL_LABEL[r.platform] || 'Bejegyzés',
      sub: r => `${SOCIAL_LABEL[r.platform] || r.platform} · ${fmtDate(r.published_at)}`,
      beforeSave: o => /^https?:\/\//.test(o.url || '') ? null : 'A bejegyzés linkje teljes cím legyen, https:// kezdettel.'
    },
    posts: {
      label: 'Blog', single: 'bejegyzés', addLabel: 'Új bejegyzés', noPos: true, visibleKey: 'published', visLabel: 'Közzétéve',
      help: 'A közzétett bejegyzések a blog oldalon jelennek meg, a legutóbbi három a főoldalon is. Jövőbeli dátummal időzítheted a megjelenést.',
      empty: 'Még nincs bejegyzés. Írd meg az elsőt: színválasztási tippek, egy friss munka bemutatása, karbantartási tanácsok.',
      fields: [
        { k: 'title', l: 'Cím', req: 1 },
        { k: 'slug', l: 'Webcím', ph: 'automatikusan a címből', hint: 'A bejegyzés címe a böngészőben: blog.html?p=webcim' },
        { k: 'excerpt', l: 'Rövid bevezető (a listában és a keresőkben látszik)', t: 'textarea' },
        { k: 'cover_url', l: 'Borítókép', t: 'image', folder: 'blog' },
        { k: 'content', l: 'Tartalom', t: 'rich' },
        { k: 'published_at', l: 'Megjelenés időpontja', t: 'datetime' },
        { k: 'published', l: 'Közzétéve (látható az oldalon)', t: 'bool' }
      ],
      thumb: 'cover_url', title: r => r.title,
      sub: r => `${r.published ? (new Date(r.published_at) > new Date() ? 'Időzítve: ' : 'Megjelent: ') : 'Piszkozat, '}${fmtDate(r.published_at)}`,
      beforeSave: o => { o.slug = slugify(o.slug || o.title); o.updated_at = new Date().toISOString(); return o.slug ? null : 'Adj meg címet vagy webcímet.'; }
    }
  };

  /* ---------- Menü ---------- */
  const NAV_GROUPS = [
    { t: 'Napi munka', items: [['overview', 'Áttekintés'], ['quotes', 'Árajánlat-kérések']] },
    { t: 'Oldalak', items: [['layout', 'Megjelenés'], ['float', 'Lebegő kártya'], ['texts', 'Főoldal szövegei'], ['subpages', 'Aloldalak ki/be'], ['pages', 'Aloldalak szövegei'], ['sections', 'Saját ablakok']] },
    { t: 'Tartalom', items: [['services', 'Szolgáltatások'], ['process_steps', 'Hogyan dolgozom'], ['faqs', 'Gyakori kérdések'], ['testimonials', 'Vélemények'], ['work_items', 'Árak és munkafolyamatok']] },
    { t: 'Munkáim', items: [['before_after', 'Előtte–utána'], ['gallery', 'Galéria és albumok']] },
    { t: 'Média', items: [['videos', 'Videók'], ['social_posts', 'Közösségi média'], ['posts', 'Blog']] },
    { t: 'Eszközök', items: [['seo', 'SEO-ellenőrző'], ['backup', 'Mentés és visszaállítás']] }
  ];
  const NAV_ALIAS = { gallery_albums: 'gallery' };
  const NAV = [...NAV_GROUPS.flatMap(g => g.items), ...Object.keys(NAV_ALIAS).map(k => [k, ''])];
  $('#nav').innerHTML = NAV_GROUPS.map(g => `<div class="nav-g"><span class="nav-h">${esc(g.t)}</span>${g.items.map(([k, l]) => `<button type="button" data-v="${k}"><span>${l}</span>${k === 'quotes' ? '<span class="badge" id="qBadge" hidden></span>' : ''}</button>`).join('')}</div>`).join('');
  $('#nav').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) location.hash = b.dataset.v; });

  /* ---------- Belépés ---------- */
  function lmsg(sel, m, err) { const el = $(sel); el.textContent = m || ''; el.classList.toggle('err', !!err); }
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#loginForm').hidden = false; $('#resetForm').hidden = true; }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); lmsg('#lMsg', 'Belépés…');
    const { error } = await sb.auth.signInWithPassword({ email: $('#lEmail').value.trim(), password: $('#lPass').value });
    if (error) return lmsg('#lMsg', 'Hibás e-mail-cím vagy jelszó.', true);
    lmsg('#lMsg', ''); enter();
  });
  $('#forgot').addEventListener('click', async () => {
    const em = $('#lEmail').value.trim();
    if (!em) return lmsg('#lMsg', 'Írd be az e-mail-címedet, majd kattints újra.', true);
    const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname });
    lmsg('#lMsg', error ? 'A levél küldése nem sikerült: ' + error.message : 'Elküldtük a jelszó-visszaállító levelet. Nézd meg a postafiókodat.', !!error);
  });
  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { error } = await sb.auth.updateUser({ password: $('#rPass').value });
    if (error) return lmsg('#rMsg', 'A jelszó mentése nem sikerült: ' + error.message, true);
    toast('Az új jelszó elmentve.'); enter();
  });
  $('#logout').addEventListener('click', async () => { await sb.auth.signOut(); showLogin(); });

  async function enter() {
    const { data: ok, error } = await sb.rpc('is_admin');
    if (error || !ok) {
      await sb.auth.signOut(); showLogin();
      lmsg('#lMsg', error ? 'Az adatbázis nincs beállítva (hiányzik az is_admin függvény).' : 'Ez a fiók nem admin. Vedd fel az e-mail-címét az admins táblába.', true);
      return;
    }
    const { data: { user } } = await sb.auth.getUser();
    $('#who').textContent = user ? user.email : '';
    $('#login').hidden = true; $('#app').hidden = false;
    route(); refreshBadge();
  }

  /* ---------- Útvonalak ---------- */
  function route() {
    if ($('#app').hidden) return;
    let v = location.hash.slice(1);
    if (!NAV.some(n => n[0] === v)) v = 'overview';
    const navKey = NAV_ALIAS[v] || v;
    $$('#nav button').forEach(b => { if (b.dataset.v === navKey) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (dlg.open) dlg.close();
    window.scrollTo(0, 0);
    if (v === 'overview') showOverview(); else if (v === 'quotes') showQuotes(); else if (v === 'texts') showTexts(); else if (v === 'layout') showLayout(); else if (v === 'float') showFloat(); else if (v === 'backup') showBackup(); else if (v === 'seo') showSeo(); else if (v === 'pages') showPages(); else if (v === 'subpages') showSubpages(); else showTable(v);
  }
  addEventListener('hashchange', route);

  /* ---------- Fájlfeltöltés ---------- */
  async function uploadMedia(file, folder) {
    const img = await shrinkImage(file, 2400);
    const path = `${folder || 'egyeb'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`;
    const { error } = await sb.storage.from(PLANERVO_CFG.mediaBucket).upload(path, img.blob, { contentType: img.type, cacheControl: '31536000', upsert: false });
    if (error) throw error;
    return sb.storage.from(PLANERVO_CFG.mediaBucket).getPublicUrl(path).data.publicUrl;
  }

  /* ---------- Űrlapmezők ---------- */
  const toLocal = v => { if (!v) return ''; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  function fieldHtml(f, v) {
    const id = 'f_' + f.k, req = f.req ? ' required' : '', lab = esc(f.l) + (f.req ? ' *' : '');
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
    switch (f.t) {
      case 'textarea': return `<label class="fl">${lab}<textarea id="${id}" rows="${f.rows || 3}"${req}${ph}>${esc(v)}</textarea>${hint}</label>`;
      case 'number': return `<label class="fl">${lab}<input id="${id}" type="number" step="any" min="0" value="${v ?? ''}"${req}${ph}>${hint}</label>`;
      case 'select': return `<label class="fl">${lab}<select id="${id}">${f.o.map(([k, l]) => `<option value="${esc(k)}"${String(v ?? f.def) === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${hint}</label>`;
      case 'bool': return `<label class="fl chk"><input type="checkbox" id="${id}"${(v ?? f.d) === true ? ' checked' : ''}>${lab}</label>`;
      case 'datetime': return `<label class="fl">${lab}<input id="${id}" type="datetime-local" value="${toLocal(v || new Date())}">${hint}</label>`;
      case 'image': return `<div class="fl img-field" data-folder="${esc(f.folder || 'egyeb')}"><span class="lbl">${lab}</span><div class="img-box">
          <div class="img-prev">${v ? `<img src="${esc(v)}" alt="">` : '<span>Nincs kép</span>'}</div>
          <div class="img-ctl"><label class="btn o sm">Kép feltöltése<input type="file" accept="image/*"></label>
          <input type="text" id="${id}" value="${esc(v)}" placeholder="vagy illeszd be egy kép webcímét">
          <button type="button" class="link" data-clear>Kép eltávolítása</button><small class="up-st" role="status"></small></div></div>${hint}</div>`;
      case 'rich': return `<div class="fl"><span class="lbl">${lab}</span><div class="rich" id="${id}"></div>${hint}</div>`;
      case 'pairs': return `<div class="fl pairs-ed" id="${id}" data-folder="${esc(f.folder || 'egyeb')}"><span class="lbl">${lab}</span>
          <div class="pairs-list">${(Array.isArray(v) ? v : []).map(pairRow).join('')}</div>
          <button type="button" class="btn o sm" data-addpair>+ Új képpár</button>${hint}</div>`;
      default: return `<label class="fl">${lab}<input id="${id}" type="text" value="${esc(v)}" maxlength="${f.max || 500}"${req}${ph}>${hint}</label>`;
    }
  }
  /* Előtte–utána képpárok szerkesztője (szolgáltatásokhoz) */
  function pairImg(cls, label, v) {
    return `<div class="img-field pair-img" data-folder="" data-side="${cls}"><span class="lbl">${label}</span><div class="img-box">
      <div class="img-prev">${v ? `<img src="${esc(v)}" alt="">` : '<span>Nincs kép</span>'}</div>
      <div class="img-ctl"><label class="btn o sm">Feltöltés<input type="file" accept="image/*"></label>
      <button type="button" class="btn o sm" data-gal>Galériából</button>
      <input type="text" value="${esc(v)}" placeholder="vagy webcím"><button type="button" class="link" data-clear>Eltávolítás</button><small class="up-st" role="status"></small></div></div></div>`;
  }
  function pairRow(p) {
    p = p || {};
    return `<div class="pair-row"><div class="pair-imgs">${pairImg('before', 'Előtte', p.before)}${pairImg('after', 'Utána', p.after)}</div>
      <div class="pair-meta"><input type="text" class="pair-title" maxlength="120" placeholder="Felirat (nem kötelező)" value="${esc(p.title)}">
      <span class="pair-ord"><button type="button" class="btn o sm" data-pu aria-label="Fel">↑</button><button type="button" class="btn o sm" data-pd aria-label="Le">↓</button><button type="button" class="btn o sm" data-prm>Törlés</button></span></div></div>`;
  }
  function collectPairs(id) {
    return $$('#' + id + ' .pair-row').map(r => ({
      before: $('[data-side=before] input[type=text]', r).value.trim(), after: $('[data-side=after] input[type=text]', r).value.trim(), title: $('.pair-title', r).value.trim()
    })).filter(p => p.before && p.after).map(p => (p.title ? p : { before: p.before, after: p.after }));
  }
  async function pickFromGallery() {
    const { data, error } = await sb.from('gallery').select('image_url,caption').order('position');
    if (error) { toast('A galéria nem tölthető be: ' + error.message, true); return null; }
    const rows = data || []; if (!rows.length) { toast('A galériában még nincs kép.', true); return null; }
    return new Promise(res => {
      const d = document.createElement('dialog'); d.className = 'gal-pick';
      d.innerHTML = `<form method="dialog"><header><h2>Válassz képet a galériából</h2><button type="button" class="x" data-x aria-label="Bezárás">×</button></header>
        <div class="gp-grid">${rows.map((r, i) => `<button type="button" data-i="${i}" title="${esc(r.caption || '')}"><img src="${esc(r.image_url)}" alt="${esc(r.caption || 'Galériakép')}" loading="lazy"></button>`).join('')}</div></form>`;
      let out = null;
      d.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { out = rows[+b.dataset.i].image_url; d.close(); } else if (e.target.closest('[data-x]') || e.target === d) d.close(); };
      d.onclose = () => { d.remove(); res(out); };
      document.body.appendChild(d); d.showModal();
    });
  }
  function wirePairs(root) {
    $$('.pairs-ed', root).forEach(box => {
      const list = $('.pairs-list', box), folder = box.dataset.folder;
      const fix = () => $$('.img-field', list).forEach(b => { b.dataset.folder = folder; });
      fix();
      $('[data-addpair]', box).onclick = () => { list.insertAdjacentHTML('beforeend', pairRow()); fix(); wireImages(list); };
      list.addEventListener('click', async e => {
        const row = e.target.closest('.pair-row'); if (!row) return;
        if (e.target.closest('[data-prm]')) row.remove();
        else if (e.target.closest('[data-pu]') && row.previousElementSibling) list.insertBefore(row, row.previousElementSibling);
        else if (e.target.closest('[data-pd]') && row.nextElementSibling) list.insertBefore(row.nextElementSibling, row);
        else if (e.target.closest('[data-gal]')) {
          const u = await pickFromGallery(); if (!u) return;
          const f = e.target.closest('.img-field'); const t = $('input[type=text]', f); t.value = u; t.dispatchEvent(new Event('input'));
        }
      });
    });
  }
  function wireImages(root) {
    $$('.img-field', root).forEach(box => {
      if (box.dataset.wired) return; box.dataset.wired = '1';
      const file = $('input[type=file]', box), url = $('input[type=text]', box), prev = $('.img-prev', box), st = $('.up-st', box);
      const show = v => { prev.innerHTML = v ? `<img src="${esc(v)}" alt="">` : '<span>Nincs kép</span>'; };
      url.addEventListener('input', () => show(url.value.trim()));
      $('[data-clear]', box).addEventListener('click', () => { url.value = ''; show(''); });
      file.addEventListener('change', async () => {
        const f = file.files[0]; if (!f) return;
        st.textContent = 'Feltöltés…';
        try { const u = await uploadMedia(f, box.dataset.folder); url.value = u; show(u); st.textContent = 'Feltöltve.'; }
        catch (e) { st.textContent = 'A feltöltés nem sikerült: ' + e.message; }
        file.value = '';
      });
    });
  }
  function makeQuill(el, html) {
    /* A „videó” gomb a YouTube mellett Facebook, Instagram és TikTok linket is elfogad, beágyazható alakra alakítva */
    const VideoBlot = Quill.import('formats/video');
    if (!VideoBlot.__pvEmbed) { VideoBlot.__pvEmbed = true; VideoBlot.sanitize = u => { const e = toEmbedUrl(u); return EMBED_RE.test(e) ? e : 'about:blank'; }; }
    const q = new Quill(el, {
      theme: 'snow', placeholder: 'Írd ide a szöveget…',
      modules: {
        toolbar: {
          container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }], ['blockquote', 'link', 'image', 'video'], ['clean']],
          handlers: {
            image: () => {
              const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
              inp.onchange = async () => {
                const f = inp.files[0]; if (!f) return;
                toast('Kép feltöltése…');
                try {
                  const u = await uploadMedia(f, 'szoveg-kepek');
                  const range = q.getSelection(true); q.insertEmbed(range.index, 'image', u, 'user'); q.setSelection(range.index + 1);
                  toast('A kép bekerült a szövegbe.');
                } catch (e) { toast('A kép feltöltése nem sikerült: ' + e.message, true); }
              };
              inp.click();
            }
          }
        }
      }
    });
    if (html) q.clipboard.dangerouslyPasteHTML(html);
    return q;
  }
  function collect(fields, quills) {
    const out = {};
    for (const f of fields) {
      const el = document.getElementById('f_' + f.k); let v;
      if (f.t === 'pairs') { out[f.k] = collectPairs('f_' + f.k); continue; }
      if (f.t === 'bool') v = el.checked;
      else if (f.t === 'number') v = el.value === '' ? null : +el.value;
      else if (f.t === 'rich') {
        const q = quills[f.k], empty = !q.getText().trim() && !q.root.querySelector('img,iframe');
        v = empty ? null : q.root.innerHTML;
      } else if (f.t === 'datetime') v = el.value ? new Date(el.value).toISOString() : new Date().toISOString();
      else v = el.value.trim() || null;
      if (f.req && (v === null || v === '')) { el.focus && el.focus(); return { error: `A(z) „${f.l}” mező kitöltése kötelező.` }; }
      out[f.k] = v;
    }
    return { out };
  }

  /* ---------- Általános listanézet ---------- */
  let ROWS = [], CUR = null, OPEN_NEW = null;
  let ALBUMS = [], ALBUM_COUNT = {};
  async function loadAlbums() {
    const [a, g] = await Promise.all([
      sb.from('gallery_albums').select('id,title').order('position').order('created_at'),
      sb.from('gallery').select('album_id')
    ]);
    if (a.error) toast('Az albumok nem tölthetők be: ' + a.error.message + ' Futtasd le a supabase/2026-12-albumok.sql fájlt.', true);
    ALBUMS = a.error ? [] : (a.data || []);
    ALBUM_COUNT = {};
    (g.data || []).forEach(r => { if (r.album_id) ALBUM_COUNT[r.album_id] = (ALBUM_COUNT[r.album_id] || 0) + 1; });
    const s = $('#galAlbum');
    if (s) { const cur = s.value; s.innerHTML = '<option value="">Album nélkül</option>' + ALBUMS.map(x => `<option value="${esc(x.id)}">${esc(x.title)}</option>`).join(''); s.value = ALBUMS.some(x => x.id === cur) ? cur : ''; }
  }
  async function showTable(key) {
    const T = TABLES[key]; CUR = key;
    view.innerHTML = `<header class="vh"><div><h1>${esc(T.label)}</h1>${T.help ? `<p class="help">${esc(T.help)}</p>` : ''}</div>
      <div class="vh-act">${key === 'gallery' ? '<select id="galAlbum" aria-label="Album, amelybe a feltöltött képek kerülnek"><option value="">Album nélkül</option></select>' : ''}${T.multi ? '<label class="btn o">Több kép feltöltése<input type="file" accept="image/*" multiple hidden id="multi"></label>' : ''}
      ${T.importList ? '<button type="button" class="btn o" id="importList">Árlista betöltése</button>' : ''}
      ${T.bulkPrice ? '<button type="button" class="btn o" id="bulkPrice">Árak módosítása</button>' : ''}
      <button type="button" class="btn" id="addNew">${esc(T.addLabel)}</button></div></header>
      ${T.search ? `<div class="filt"><input type="search" id="fltQ" placeholder="Keresés a megnevezésben…" aria-label="Keresés"><select id="fltC" aria-label="Kategória"><option value="">Minden kategória</option></select><span class="muted" id="fltN"></span></div>` : ''}
      ${key === 'gallery' || key === 'gallery_albums' ? `<nav class="tabs" aria-label="Galéria részei"><a href="#gallery"${key === 'gallery' ? ' aria-current="page"' : ''}>Képek</a><a href="#gallery_albums"${key === 'gallery_albums' ? ' aria-current="page"' : ''}>Albumok</a></nav>` : ''}
      ${key === 'videos' ? '<form class="vsrc" id="vsrc" novalidate><p class="muted">Betöltés…</p></form><h2 class="sub-h">Kézzel felvett videók</h2>' : ''}
      <div id="list" class="list"><p class="muted">Betöltés…</p></div>`;
    $('#addNew').onclick = () => openEditor(key, null);
    if (key === 'videos') videoSource();
    if (T.multi) $('#multi').onchange = e => multiUpload(key, [...e.target.files]);
    if (T.importList) $('#importList').onclick = () => importPriceList(key);
    if (T.bulkPrice) $('#bulkPrice').onclick = bulkPriceDialog;
    if (T.search) { $('#fltQ').oninput = applyFilter; $('#fltC').onchange = applyFilter; }
    await loadList(key);
    if (OPEN_NEW === key && CUR === key) { OPEN_NEW = null; openEditor(key, null); }
  }
  /* ---------- Videós ablak forrása (csatorna / lejátszási lista / kézi) ---------- */
  const VS_KEYS = ['video_source', 'youtube_url', 'youtube_playlist', 'video_count'];
  async function fnError(error) {
    try { const b = await error.context.json(); return (b && b.error) || error.message; } catch (e) { return error.message; }
  }
  async function videoSource() {
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    const box = $('#vsrc');
    if (CUR !== 'videos' || !box) return;
    if (error) { box.innerHTML = errBox(error); return; }
    const cur = { ...TEXT_DEFAULTS, ...((data && data.value) || {}) };
    box.innerHTML = `<h2>Mit mutasson a főoldal videós ablaka?</h2>
      <p class="help">Csatornánál a legújabb videók jönnek automatikusan, a legújabb elöl. Lejátszási listánál a lista sorrendje számít, így te válogathatod össze, mi kerüljön ki. A YouTube így legfeljebb 15 videót ad ki.</p>
      <div class="vs-grid">${VS_KEYS.map(k => fieldHtml(TEXT_FIELDS.find(f => f.k === k), cur[k])).join('')}</div>
      <div class="vs-act"><button class="btn" type="submit">Beállítás mentése</button><button class="btn o" type="button" id="vsTest">Kipróbálom</button><span class="vs-msg" id="vsMsg" role="status"></span></div>`;
    const sync = () => { $('#f_youtube_playlist').closest('.fl').hidden = $('#f_video_source').value !== 'playlist'; };
    $('#f_video_source').onchange = sync; sync();
    const read = () => ({
      video_source: $('#f_video_source').value, youtube_url: $('#f_youtube_url').value.trim(),
      youtube_playlist: $('#f_youtube_playlist').value.trim(), video_count: parseInt($('#f_video_count').value, 10) || 12
    });
    const msg = (t, err) => { const m = $('#vsMsg'); m.textContent = t; m.classList.toggle('err', !!err); };
    const check = v => {
      if (v.video_count < 3 || v.video_count > 15) return 'A videók száma 3 és 15 között legyen.';
      if (v.youtube_url && !/youtube\.com\/|^@[\w.-]+$|^UC[\w-]{22}$/.test(v.youtube_url)) return 'A csatorna linkje YouTube-cím legyen, például https://www.youtube.com/@csatornam';
      if (v.video_source === 'channel' && !v.youtube_url) return 'Add meg a YouTube-csatornád linkjét.';
      if (v.video_source === 'playlist' && !/[?&]list=[\w-]+|^(PL|UU|OL)[\w-]{10,}$/.test(v.youtube_playlist)) return 'A lejátszási lista linkjében legyen „list=…” rész (a lista oldalának címe a böngészőben).';
      return '';
    };
    $('#vsTest').onclick = async () => {
      const v = read();
      if (v.video_source === 'manual') return msg('Kézi módban az alábbi listában felvett videók jelennek meg.');
      const bad = check(v); if (bad) return msg(bad, true);
      msg('Lekérdezés a YouTube-ról…');
      try {
        const { data: d, error: e } = await sb.functions.invoke(PLANERVO_CFG.youtubeFunction, { body: { type: v.video_source, source: v.video_source === 'playlist' ? v.youtube_playlist : v.youtube_url } });
        if (e) throw new Error(await fnError(e));
        if (d && d.error) throw new Error(d.error);
        const n = (d && d.items || []).length;
        msg(n ? `Rendben: ${n} videót találtam${d.title ? ` („${d.title}”)` : ''}. Az első: „${d.items[0].title}”.` : 'A forrás elérhető, de nincs benne nyilvános videó.', !n);
      } catch (x) {
        msg(`Nem sikerült lekérni a videókat: ${x.message} Ha a youtube-feed függvény még nincs telepítve a Supabase-ben, a README.md leírja, hogyan kell.`, true);
      }
    };
    box.onsubmit = async e => {
      e.preventDefault();
      const v = read(), bad = check(v); if (bad) return msg(bad, true);
      const btn = $('button[type=submit]', box); btn.disabled = true;
      const { data: d2, error: e1 } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
      const { error: e2 } = e1 ? { error: e1 } : await sb.from('settings').upsert({ key: 'texts', value: { ...((d2 && d2.value) || {}), ...v }, updated_at: new Date().toISOString() });
      btn.disabled = false;
      if (e2) return msg('A mentés nem sikerült: ' + e2.message, true);
      msg('Elmentve. A főoldalon frissítés után látszik.'); toast('Videóbeállítás elmentve.');
    };
  }

  function applyFilter() {
    const q = ($('#fltQ') || {}).value, c = ($('#fltC') || {}).value;
    if (q === undefined) return;
    const qq = q.trim().toLowerCase();
    let n = 0;
    $$('#list .row').forEach(el => {
      const r = ROWS[+el.dataset.i];
      const ok = (!qq || String(r.name || '').toLowerCase().includes(qq)) && (!c || (r.category || '') === c);
      el.hidden = !ok; if (ok) n++;
    });
    $('#fltN').textContent = qq || c ? `${n} / ${ROWS.length} tétel` : `${ROWS.length} tétel`;
  }
  async function importPriceList(key) {
    if (typeof PRICE_LIST === 'undefined') return toast('Az árlista fájl (assets/arlista.js) nem töltődött be.', true);
    const have = new Set(ROWS.map(r => (r.name || '').trim().toLowerCase()));
    const add = PRICE_LIST.filter(p => !have.has(p[1].toLowerCase()));
    if (!add.length) return toast('Az árlista minden tétele már szerepel a listában.');
    const others = ROWS.filter(r => r.visible && !PRICE_LIST.some(p => p[1].toLowerCase() === (r.name || '').trim().toLowerCase()));
    if (!confirm(`${add.length} munkafolyamatot töltök be az árlistából (csak munkadíj, anyagdíj nélkül). Utána bármelyik szerkeszthető, elrejthető vagy törölhető.\n\nFolytatod?`)) return;
    const hide = others.length > 0 && confirm(`A jelenlegi ${others.length} másik munkafolyamatot elrejtsem az árajánlatkérőből?\nNem törlöm őket, a „Látható” kapcsolóval bármikor visszakapcsolhatók.\n\nOK = elrejtés, Mégse = maradnak láthatók.`);
    let pos = nextPos();
    const rows = add.map(([category, name, unit, price, description]) => ({ category, name, unit, price, description: description || null, visible: true, position: (pos += 10) }));
    toast('Árlista betöltése…');
    const { error } = await sb.from(key).insert(rows);
    if (error) return toast(/check constraint|unit/i.test(error.message)
      ? 'A betöltés nem sikerült: az adatbázis még nem ismeri az új mértékegységeket. Futtasd le a supabase/2026-11-arlista.sql fájlt a Supabase SQL Editorban, majd próbáld újra.'
      : 'A betöltés nem sikerült: ' + error.message, true);
    if (hide) {
      const { error: e2 } = await sb.from(key).update({ visible: false }).in('id', others.map(r => r.id));
      if (e2) toast('A régi tételek elrejtése nem sikerült: ' + e2.message, true);
    }
    toast(`${rows.length} munkafolyamat betöltve.`); loadList(key);
  }
  async function loadList(key) {
    const T = TABLES[key];
    if (key === 'gallery' || key === 'gallery_albums') await loadAlbums();
    if (CUR !== key) return;
    let q = sb.from(key).select('*');
    q = T.noPos ? q.order('published_at', { ascending: false }) : q.order('position').order('created_at');
    const { data, error } = await q;
    if (CUR !== key) return;
    const list = $('#list');
    if (error) { list.innerHTML = errBox(error); return; }
    ROWS = data || [];
    if (!ROWS.length) {
      list.innerHTML = `<div class="emptybox"><p>${esc(T.empty)}</p><button type="button" class="btn" id="add2">${esc(T.addLabel)}</button></div>`;
      $('#add2').onclick = () => openEditor(key, null); return;
    }
    const vk = T.visibleKey || 'visible', hasThumb = 'thumb' in T;
    list.innerHTML = ROWS.map((r, i) => {
      const th = hasThumb ? (typeof T.thumb === 'function' ? T.thumb(r) : r[T.thumb]) : '';
      return `<div class="row${r[vk] ? '' : ' off'}${hasThumb ? '' : ' nothumb'}" data-i="${i}">
        ${hasThumb ? `<div class="th">${th ? `<img src="${esc(th)}" alt="" loading="lazy">` : ''}</div>` : ''}
        <div class="rt"><b>${esc(T.title(r))}</b>${T.sub && T.sub(r) ? `<small>${esc(T.sub(r))}</small>` : ''}</div>
        <label class="sw"><input type="checkbox" data-act="vis"${r[vk] ? ' checked' : ''}>${esc(T.visLabel || 'Látható')}</label>
        ${T.noPos ? '<span></span>' : `<div class="mv"><button type="button" data-act="up" aria-label="Feljebb"${i ? '' : ' disabled'}>↑</button><button type="button" data-act="down" aria-label="Lejjebb"${i < ROWS.length - 1 ? '' : ' disabled'}>↓</button></div>`}
        <button type="button" class="btn sm o" data-act="edit">Szerkesztés</button>
        <button type="button" class="btn sm o" data-act="dup">Másolás</button>
        <button type="button" class="btn sm danger" data-act="del">Törlés</button></div>`;
    }).join('');
    if (T.search) {
      const sel = $('#fltC'), cur = sel.value, cats = [...new Set(ROWS.map(r => r.category || ''))].filter(Boolean);
      sel.innerHTML = '<option value="">Minden kategória</option>' + cats.map(c => `<option${c === cur ? ' selected' : ''}>${esc(c)}</option>`).join('');
      applyFilter();
    }
    list.onclick = async e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const i = +b.closest('.row').dataset.i, r = ROWS[i];
      if (b.dataset.act === 'edit') openEditor(key, r);
      if (b.dataset.act === 'dup') {
        const { id, created_at, ...copy } = r;
        const nk = ['name', 'title', 'caption'].find(k => copy[k]);
        if (nk) copy[nk] = copy[nk] + ' (másolat)';
        if ('position' in copy) copy.position = nextPos();
        if (key === 'posts') { copy.slug = slugify((copy.slug || 'bejegyzes') + '-masolat-' + Math.random().toString(36).slice(2, 5)); copy.published = false; }
        const { error } = await sb.from(key).insert(copy);
        if (error) return toast('A másolás nem sikerült: ' + error.message, true);
        toast('Lemásolva. A másolat a lista végén van.'); loadList(key);
      }
      if (b.dataset.act === 'up' || b.dataset.act === 'down') move(key, i, b.dataset.act === 'up' ? -1 : 1);
      if (b.dataset.act === 'del') {
        if (!confirm(`Biztosan törlöd? „${T.title(r)}”\nEz nem vonható vissza.`)) return;
        const { error } = await sb.from(key).delete().eq('id', r.id);
        if (error) return toast('A törlés nem sikerült: ' + error.message, true);
        toast('Törölve.'); loadList(key);
      }
    };
    list.onchange = async e => {
      if (e.target.dataset.act !== 'vis') return;
      const i = +e.target.closest('.row').dataset.i, on = e.target.checked;
      const { error } = await sb.from(key).update({ [vk]: on }).eq('id', ROWS[i].id);
      if (error) { e.target.checked = !on; return toast('A mentés nem sikerült: ' + error.message, true); }
      ROWS[i][vk] = on; e.target.closest('.row').classList.toggle('off', !on);
      toast(on ? (key === 'posts' ? 'Közzétéve.' : 'Látható az oldalon.') : (key === 'posts' ? 'Visszavonva, most piszkozat.' : 'Elrejtve az oldalról.'));
    };
  }
  async function move(key, i, dir) {
    const arr = ROWS.slice(), j = i + dir; if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const ups = [];
    arr.forEach((r, idx) => { const pos = (idx + 1) * 10; if (r.position !== pos) ups.push(sb.from(key).update({ position: pos }).eq('id', r.id)); });
    const res = await Promise.all(ups);
    const bad = res.find(r => r.error); if (bad) toast('A sorrend mentése nem sikerült: ' + bad.error.message, true);
    loadList(key);
  }
  const nextPos = () => ROWS.reduce((m, r) => Math.max(m, r.position || 0), 0) + 10;

  async function multiUpload(key, files) {
    if (!files.length) return;
    let ok = 0, pos = nextPos();
    const albumId = key === 'gallery' && $('#galAlbum') ? ($('#galAlbum').value || null) : null;
    for (let i = 0; i < files.length; i++) {
      toast(`Feltöltés: ${i + 1} / ${files.length}`);
      try {
        const u = await uploadMedia(files[i], 'galeria');
        const row = { image_url: u, position: pos };
        if (key === 'gallery') row.album_id = albumId;
        const { error } = await sb.from(key).insert(row); if (error) throw error;
        pos += 10; ok++;
      } catch (e) { toast(`${files[i].name}: ${e.message}`, true); }
    }
    toast(`${ok} kép feltöltve.`); $('#multi').value = ''; loadList(key);
  }

  function openEditor(key, row) {
    const T = TABLES[key], isNew = !row, cur = row || {};
    if (key === 'gallery') T.fields.find(f => f.k === 'album_id').o = [['', '— nincs album —'], ...ALBUMS.map(a => [a.id, a.title])];
    dlgBody.innerHTML = `<form class="ed" id="edForm" novalidate>
      <header><h2>${isNew ? 'Új ' + esc(T.single) : 'Szerkesztés'}</h2><button type="button" class="x" data-close aria-label="Bezárás">×</button></header>
      <div class="ed-fields">${T.fields.map(f => fieldHtml(f, cur[f.k] ?? (isNew && f.t === 'bool' ? key !== 'posts' : undefined))).join('')}</div>
      <footer><button type="button" class="btn o" data-close>Mégse</button><button class="btn" type="submit">Mentés</button></footer></form>`;
    const quills = {};
    T.fields.filter(f => f.t === 'rich').forEach(f => { quills[f.k] = makeQuill(document.getElementById('f_' + f.k), cur[f.k]); });
    wireImages(dlgBody); wirePairs(dlgBody);
    $$('[data-close]', dlgBody).forEach(b => b.onclick = () => dlg.close());
    dlg.showModal();
    $('#edForm').addEventListener('submit', async e => {
      e.preventDefault();
      const { out, error } = collect(T.fields, quills);
      if (error) return toast(error, true);
      if (T.beforeSave) { const m = T.beforeSave(out, cur, isNew); if (m) return toast(m, true); }
      if (isNew && !T.noPos) out.position = nextPos();
      const btn = $('#edForm button[type=submit]'); btn.disabled = true;
      const res = isNew ? await sb.from(key).insert(out) : await sb.from(key).update(out).eq('id', cur.id);
      btn.disabled = false;
      if (res.error) return toast(res.error.code === '23505' ? 'Ez a webcím már foglalt. Adj meg másikat.' : 'A mentés nem sikerült: ' + res.error.message, true);
      dlg.close(); toast('Mentve.'); loadList(key);
    });
  }

  /* ---------- Főoldal szövegei ---------- */
  async function showTexts() {
    CUR = 'texts';
    view.innerHTML = `<header class="vh"><div><h1>Főoldal szövegei</h1><p class="help">A főoldal címei, bevezetői, elérhetőségei és a logó. Üresen hagyott bevezető nem jelenik meg.</p></div></header>
      <form id="txForm" class="tx"><p class="muted">Betöltés…</p></form>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'texts') return;
    if (error) { $('#txForm').innerHTML = errBox(error); return; }
    const cur = { ...TEXT_DEFAULTS, ...((data && data.value) || {}) };
    const groups = {};
    TEXT_FIELDS.forEach(f => { (groups[f.g] = groups[f.g] || []).push({ ...f, folder: 'arculat' }); });
    $('#txForm').innerHTML = Object.entries(groups).map(([g, fs]) => `<fieldset class="card"><legend>${esc(g)}</legend>${fs.map(f => fieldHtml(f, cur[f.k])).join('')}</fieldset>`).join('') +
      '<div class="savebar"><button class="btn" type="submit">Szövegek mentése</button><span class="muted">A változás a weboldal frissítése után látszik.</span></div>';
    wireImages($('#txForm'));
    $('#txForm').onsubmit = async e => {
      e.preventDefault();
      const value = {};
      TEXT_FIELDS.forEach(f => {
        const el = document.getElementById('f_' + f.k);
        value[f.k] = f.t === 'bool' ? el.checked : el.value.trim();
      });
      const { error } = await mergeTexts(value);
      toast(error ? 'A mentés nem sikerült: ' + error.message : 'A szövegek elmentve.', !!error);
    };
  }

  /* ---------- Aloldalak szövegei ----------
     A helyi oldalak, a blog, a vélemény-oldal és a jogi oldalak szövege. A mentett változat a settings.texts.pages.<kulcs>
     alatt van, és a látogatóknál felülírja az oldal beépített szövegét. A beépített szöveg az oldal fájljából jön. */
  const LEGAL_KEYS = ['adatkezeles', 'impresszum', 'sutik'];
  const pageFields = key => {
    if (LEGAL_KEYS.includes(key)) return ['title', 'desc', 'h1', 'body'];
    if (key === 'blog') return ['title', 'desc', 'h1', 'lead'];
    if (key === 'velemeny') return ['title', 'desc', 'h1', 'lead', 'done'];
    return ['title', 'desc', 'h1', 'lead', 'body'];
  };
  const PF_LABEL = { title: 'Az oldal címe a Google-ben és a böngészőfülön', desc: 'Leírás a Google találatokban', h1: 'Főcím', lead: 'Bevezető', done: 'Köszönő szöveg beküldés után', body: 'Az oldal szövege' };
  const PF_HINT = { title: 'Kb. 50–65 karakter. Legyen benne a szolgáltatás és a település, például: „Festő Üllőn – szobafestés, glettelés”.', desc: 'Kb. 120–160 karakter. Ez jelenik meg a cím alatt a találatok között.' };
  /* a beépített szöveg kiolvasása: statikus oldalnál a fájlból, a jogi oldalaknál a kirajzolt sablonból */
  function grabRendered(url, sel) {
    return new Promise(res => {
      const fr = document.createElement('iframe'); fr.style.cssText = 'position:absolute;width:10px;height:10px;left:-9999px;top:0'; fr.src = url;
      let n = 0;
      const t = setInterval(() => {
        let el = null; try { el = fr.contentDocument && fr.contentDocument.querySelector(sel); } catch (e) { n = 99; }
        if (el || ++n > 50) { clearInterval(t); const h = el ? el.innerHTML : ''; fr.remove(); res(h); }
      }, 200);
      document.body.appendChild(fr);
    });
  }
  async function pageDefaults(key) {
    const d = {};
    try {
      const html = await (await fetch(key + '.html', { cache: 'no-store' })).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      d.title = (doc.querySelector('title') || {}).textContent || '';
      d.desc = (doc.querySelector('meta[name="description"]') || {}).content || '';
      doc.querySelectorAll('[data-edit]').forEach(el => { d[el.dataset.edit] = el.hasAttribute('data-rich') ? el.innerHTML.trim() : el.textContent.trim(); });
    } catch (e) { /* nincs alapérték */ }
    if (key === 'blog') { d.h1 = d.h1 || TX0.blog_title || 'Blog'; d.lead = d.lead || TX0.blog_text || ''; }
    if (LEGAL_KEYS.includes(key)) {
      const h = await grabRendered(key + '.html?alap=1', '#legalMain[data-ready]');
      const box = document.createElement('div'); box.innerHTML = h;
      const h1 = box.querySelector('h1'); d.h1 = h1 ? h1.textContent.trim() : '';
      box.querySelectorAll('a.back, h1').forEach(x => x.remove());
      d.body = box.innerHTML.trim();
    }
    return d;
  }
  /* ---------- Aloldalak ki-/bekapcsolása ---------- */
  async function showSubpages() {
    CUR = 'subpages';
    view.innerHTML = `<header class="vh"><div><h1>Aloldalak ki/be</h1><p class="help">Itt kapcsolhatod ki vagy be az aloldalakat. A kikapcsolt oldal a látogatóknak nem érhető el (üzenetet látnak, és a keresők sem indexelik), a rá mutató hivatkozások pedig eltűnnek az oldalakról. Az oldal szövege nem törlődik, bekapcsolás után minden visszatér.</p></div></header>
      <div id="spList" class="list"><p class="muted">Betöltés…</p></div>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'subpages') return;
    if (error) { $('#spList').innerHTML = errBox(error); return; }
    let off = subpagesOff((data && data.value) || {});
    const draw = () => {
      $('#spList').innerHTML = SUBPAGES.map(([k, l]) => `<div class="row nothumb${off.includes(k) ? ' off' : ''}">
        <div class="rt"><b>${esc(l)}</b><small>${esc(k)}.html</small></div>
        <label class="sw"><input type="checkbox" data-k="${esc(k)}"${off.includes(k) ? '' : ' checked'}>Bekapcsolva</label>
        <a class="btn sm o" href="${esc(k)}.html" target="_blank" rel="noopener">Megnyitás</a></div>`).join('');
    };
    draw();
    $('#spList').onchange = async e => {
      const k = e.target.dataset.k; if (!k) return;
      const prev = off, on = e.target.checked;
      const next = on ? off.filter(x => x !== k) : [...off.filter(x => x !== k), k];
      const { error: er } = await mergeTexts({ subpages_off: next });
      if (er) { e.target.checked = !on; return toast('A mentés nem sikerült: ' + er.message, true); }
      off = next; e.target.closest('.row').classList.toggle('off', !on);
      toast(on ? 'Az oldal bekapcsolva.' : 'Az oldal kikapcsolva.');
    };
  }
  let TX0 = {};
  async function showPages() {
    CUR = 'pages';
    const want = sessionStorage.getItem('pv-page') || SUBPAGES[0][0];
    view.innerHTML = `<header class="vh"><div><h1>Aloldalak szövegei</h1><p class="help">A helyi keresőoldalak (pl. „Festő Üllőn”), a blog, a vélemény-oldal és a jogi oldalak szövege. Amit itt átírsz és elmentesz, az a látogatóknál felülírja az oldal eredeti szövegét. A főoldal szövegei a „Főoldal szövegei” menüben vannak.</p></div></header>
      <div class="card pg-pick"><label class="fl">Melyik oldal?<select id="pgSel">${SUBPAGES.map(([k, l]) => `<option value="${k}"${k === want ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <a class="btn o sm" id="pgOpen" href="#" target="_blank" rel="noopener">Oldal megnyitása</a></div>
      <form id="pgForm" class="tx"><p class="muted">Betöltés…</p></form>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'pages') return;
    if (error) { $('#pgForm').innerHTML = errBox(error); return; }
    TX0 = { ...TEXT_DEFAULTS, ...((data && data.value) || {}) };
    $('#pgSel').onchange = () => { sessionStorage.setItem('pv-page', $('#pgSel').value); renderPageForm($('#pgSel').value); };
    renderPageForm($('#pgSel').value);
  }
  async function renderPageForm(key) {
    const form = $('#pgForm'); form.innerHTML = '<p class="muted">Az oldal szövegének betöltése…</p>';
    $('#pgOpen').href = key + '.html';
    const def = await pageDefaults(key);
    if (CUR !== 'pages' || $('#pgSel').value !== key) return;
    const saved = ((TX0.pages || {})[key]) || {};
    const fields = pageFields(key), isLegal = LEGAL_KEYS.includes(key);
    const val = k => saved[k] != null && saved[k] !== '' ? saved[k] : (def[k] || '');
    const hasOwn = Object.keys(saved).some(k => saved[k]);
    form.innerHTML = `<fieldset class="card"><legend>${esc((SUBPAGES.find(p => p[0] === key) || [, key])[1])}</legend>
      ${hasOwn ? '<p class="muted">Ennek az oldalnak saját, mentett szövege van.</p>' : '<p class="muted">Most az oldal eredeti szövege látszik.</p>'}
      ${fields.map(k => {
        const lab = esc(PF_LABEL[k]), hint = PF_HINT[k] ? `<span class="hint">${esc(PF_HINT[k])}</span>` : '';
        if (k === 'body') return `<div class="fl"><span class="lbl">${lab}</span><div class="rich" id="pg_body"></div><span class="hint">${isLegal ? 'Ha átírod és mented, a jogi adatok (név, székhely stb.) változása innentől nem frissül magától ebben a szövegben. Üresen hagyva és mentve a beépített sablon látszik.' : 'Címsorokkal (H2, H3), felsorolással és félkövérrel tagold. Írj konkrétumokat: milyen házakban dolgozol azon a településen, mire figyelsz.'}</span></div>`;
        if (k === 'desc' || k === 'lead' || k === 'done') return `<label class="fl">${lab}<textarea id="pg_${k}" rows="3" maxlength="${k === 'desc' ? 200 : 600}">${esc(val(k))}</textarea>${hint}<small class="cnt-c" data-for="pg_${k}"></small></label>`;
        return `<label class="fl">${lab}<input id="pg_${k}" type="text" maxlength="${k === 'title' ? 90 : 160}" value="${esc(val(k))}">${hint}${k === 'title' ? `<small class="cnt-c" data-for="pg_${k}"></small>` : ''}</label>`;
      }).join('')}
      </fieldset>
      <div class="savebar"><button class="btn" type="submit">Mentés</button><button type="button" class="btn o" id="pgReset"${hasOwn ? '' : ' disabled'}>Visszaállítás az eredetire</button><span class="muted">A változás a weboldal frissítése után látszik.</span></div>`;
    let q = null, bodyDirty = false;
    if (fields.includes('body')) {
      q = makeQuill(document.getElementById('pg_body'), val('body'));
      q.on('text-change', (d, o, src) => { if (src === 'user') bodyDirty = true; });
    }
    $$('.cnt-c', form).forEach(c => { const inp = document.getElementById(c.dataset.for); const up = () => { c.textContent = inp.value.length + ' karakter'; }; inp.addEventListener('input', up); up(); });
    form.onsubmit = async e => {
      e.preventDefault();
      const out = {};
      fields.forEach(k => {
        if (k === 'body') {
          const empty = !q.getText().trim() && !q.root.querySelector('img,iframe');
          if (bodyDirty) out.body = empty ? '' : q.root.innerHTML; else if (saved.body) out.body = saved.body;
          return;
        }
        const v = document.getElementById('pg_' + k).value.trim();
        if (v && v !== (def[k] || '')) out[k] = v;
      });
      Object.keys(out).forEach(k => { if (!out[k]) delete out[k]; });
      const pages = { ...(TX0.pages || {}) };
      if (Object.keys(out).length) pages[key] = out; else delete pages[key];
      const { error } = await mergeTexts({ pages });
      if (error) return toast('A mentés nem sikerült: ' + error.message, true);
      TX0.pages = pages; toast('Az oldal szövege elmentve.'); renderPageForm(key);
    };
    $('#pgReset').onclick = async () => {
      if (!confirm('Biztosan visszaállítod az oldal eredeti szövegét? A mentett saját szöveg törlődik.')) return;
      const pages = { ...(TX0.pages || {}) }; delete pages[key];
      const { error } = await mergeTexts({ pages });
      if (error) return toast('Nem sikerült: ' + error.message, true);
      TX0.pages = pages; toast('Visszaállítva az eredeti szövegre.'); renderPageForm(key);
    };
  }

  /* ---------- Árajánlat-kérések ---------- */
  let QUOTES = [], qFilter = 'all', qSearch = '';
  async function refreshBadge() {
    const { count } = await sb.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'new');
    const b = $('#qBadge'); if (!b) return;
    b.hidden = !count; b.textContent = count || '';
  }
  async function showQuotes() {
    CUR = 'quotes';
    view.innerHTML = `<header class="vh"><div><h1>Árajánlat-kérések</h1><p class="help">A weboldalon beküldött kérések, a legújabb elöl. Minden új kérésről e-mailt is kapsz.</p></div>
      <div class="vh-act"><button type="button" class="btn o" id="qCsv">CSV letöltése</button><button type="button" class="btn o" id="qReload">Frissítés</button></div></header>
      <div class="filt"><input type="search" id="qSearch" placeholder="Keresés név, település, telefon, e-mail alapján…" aria-label="Keresés"></div>
      <div class="chips" id="chips"></div><div class="list" id="qList"><p class="muted">Betöltés…</p></div>`;
    $('#qReload').onclick = showQuotes;
    $('#qCsv').onclick = exportQuotesCsv;
    $('#qSearch').value = qSearch; $('#qSearch').oninput = e => { qSearch = e.target.value; renderQuotes(); };
    const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false });
    if (CUR !== 'quotes') return;
    if (error) { $('#qList').innerHTML = errBox(error); return; }
    QUOTES = data || []; renderQuotes(); refreshBadge();
  }
  function renderQuotes() {
    const cnt = s => QUOTES.filter(q => q.status === s).length;
    $('#chips').innerHTML = [['all', `Összes (${QUOTES.length})`], ...Object.entries(STATUS).map(([k, l]) => [k, `${l} (${cnt(k)})`])]
      .map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${qFilter === k}">${l}</button>`).join('');
    $('#chips').onclick = e => { const b = e.target.closest('button[data-f]'); if (b) { qFilter = b.dataset.f; renderQuotes(); } };
    const list = filteredQuotes();
    $('#qList').innerHTML = list.length ? list.map(q => `<button type="button" class="qrow" data-id="${q.id}">
        <span class="st st-${q.status}">${STATUS[q.status] || q.status}</span>
        <b>${esc(q.name)}</b><span>${esc(q.city)}</span><span>${(q.rooms || []).length} helyiség</span>
        <span class="num">${fmtFt(q.estimate)}</span><time>${q.appointment_at ? '📅 ' + new Date(q.appointment_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : new Date(q.created_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}</time></button>`).join('')
      : `<div class="emptybox"><p>${QUOTES.length ? 'Nincs a szűrésnek megfelelő árajánlat-kérés.' : 'Még nem érkezett árajánlat-kérés. Amint valaki kitölti az űrlapot a weboldalon, itt jelenik meg.'}</p></div>`;
    $('#qList').onclick = e => { const b = e.target.closest('.qrow'); if (b) openQuote(b.dataset.id); };
  }
  async function openQuote(id) {
    const q = QUOTES.find(x => x.id === id); if (!q) return;
    const rooms = q.rooms || [], paths = rooms.flatMap(r => r.images || []), urls = {};
    if (paths.length) {
      const { data } = await sb.storage.from(PLANERVO_CFG.quoteBucket).createSignedUrls(paths, 3600);
      (data || []).forEach(d => { if (d.signedUrl) urls[d.path] = d.signedUrl; });
    }
    const tel = String(q.phone || '').replace(/[^\d+]/g, '');
    dlgBody.innerHTML = `<div class="qd">
      <header><div><h2>${esc(q.name)}</h2><span class="muted">${new Date(q.created_at).toLocaleString('hu-HU', { dateStyle: 'long', timeStyle: 'short' })}</span></div>
        <button type="button" class="x" data-close aria-label="Bezárás">×</button></header>
      <div class="qd-body">
        <div class="qd-contact">
          <div><span>Telefon</span><a href="tel:${esc(tel)}">${esc(q.phone)}</a></div>
          <div><span>E-mail</span><a href="mailto:${esc(q.email)}">${esc(q.email)}</a></div>
          <div><span>Település</span>${esc(q.city)}</div>
        </div>
        ${q.message ? `<p class="qd-msg">${esc(q.message)}</p>` : ''}
        ${(q.preferred_slots || []).length ? `<div class="qd-slots"><b>Kívánt felmérési időpontok</b><ul>${q.preferred_slots.map(sl => `<li>${esc(slotLabel(sl))}</li>`).join('')}</ul></div>` : ''}
        ${rooms.map((r, i) => `<div class="qd-room"><h3>${i + 1}. ${esc(r.name)}</h3>
          <p class="meta">${r.width && r.length ? `${fmtNum(r.width)} × ${fmtNum(r.length)} m, ` : ''}${fmtNum(r.area)} m² alapterület, ${fmtNum(r.height)} m belmagasság, ≈ ${fmtNum(r.wall)} m² fal, ${fmtNum(r.ceiling)} m² mennyezet</p>
          <div class="tbl"><table>${(r.items || []).map(it => `<tr><td>${esc(it.name)}</td><td>${fmtNum(it.qty)} ${UNIT_SHORT[it.unit] || ''}</td><td>${fmtFt(it.price)}</td><td>${fmtFt(it.amount)}</td></tr>`).join('')}
            <tr class="sub"><td colspan="3">Részösszeg</td><td>${fmtFt(r.subtotal)}</td></tr></table></div>
          ${(r.images || []).length ? `<div class="qd-imgs">${r.images.map((p, j) => urls[p] ? `<a href="${urls[p]}" target="_blank" rel="noopener"><img src="${urls[p]}" alt="${j + 1}. fotó"></a>` : '').join('')}</div>` : ''}
        </div>`).join('')}
        ${q.discount && q.discount.amount ? `<div class="qd-promo">${esc(q.discount.label || 'Akció')} (−${esc(q.discount.pct)}%): −${fmtFt(q.discount.amount)}</div>` : ''}
        <div class="qd-total">Becsült munkadíj összesen:<strong>${fmtFt(q.estimate)}</strong></div>
        <div class="qd-appt"><b>Felmérés időpontja</b>
          <div class="qd-appt-row"><label>Időpont<input type="datetime-local" id="qApptAt" value="${q.appointment_at ? toLocal(q.appointment_at) : ''}"></label>
            <label>Megjegyzés (cím, kapucsengő, parkolás)<input type="text" id="qApptNote" maxlength="200" value="${esc(q.appointment_note)}"></label></div>
          <div class="vs-act"><button type="button" class="btn o sm" id="qIcs">Naptárfájl (.ics)</button><a class="btn o sm" id="qGcal" target="_blank" rel="noopener" href="#">Google Naptár</a><span class="vs-msg" id="qApptMsg" role="status"></span></div></div>
        <div class="qd-manage">
          <label>Állapot<select id="qStatusSel">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}"${q.status === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label>Saját jegyzet (csak az adminban látszik)<textarea id="qNote" rows="3">${esc(q.admin_note)}</textarea></label>
        </div>
        <p class="qd-note">${q.notified_at ? 'E-mail értesítés elküldve: ' + new Date(q.notified_at).toLocaleString('hu-HU') : 'E-mail értesítés nem ment ki erről a kérésről. Ellenőrizd a notify-quote függvény beállítását.'}</p>
      </div>
      <footer><button type="button" class="btn danger" id="qDel">Kérés törlése</button><button type="button" class="btn o" data-close>Bezárás</button><button type="button" class="btn" id="qSave">Mentés</button></footer></div>`;
    $$('[data-close]', dlgBody).forEach(b => b.onclick = () => dlg.close());
    dlg.showModal();
    if (q.status === 'new') {
      sb.from('quotes').update({ status: 'in_progress' }).eq('id', id).then(({ error }) => {
        if (error) return;
        q.status = 'in_progress';
        const sel = $('#qStatusSel'); if (sel) sel.value = 'in_progress';
        renderQuotes(); refreshBadge();
      });
    }
    $('#qSave').onclick = async () => {
      const upd = { status: $('#qStatusSel').value, admin_note: $('#qNote').value.trim() || null };
      const at = $('#qApptAt').value, an = $('#qApptNote').value.trim() || null;
      if (at || q.appointment_at) { upd.appointment_at = at ? new Date(at).toISOString() : null; upd.appointment_note = an; }
      if (at && ['new', 'in_progress'].includes(upd.status)) { upd.status = 'scheduled'; $('#qStatusSel').value = 'scheduled'; }
      const { error } = await sb.from('quotes').update(upd).eq('id', id);
      if (error) return toast(/appointment|column|schema cache/i.test(error.message) ? 'A mentés nem sikerült: az adatbázis még nem ismeri az időpont mezőket. Futtasd le a supabase/2026-12-bovites.sql fájlt.' : 'A mentés nem sikerült: ' + error.message, true);
      Object.assign(q, upd); dlg.close(); renderQuotes(); refreshBadge(); toast('Mentve.');
    };
    const apptInfo = () => {
      const at = $('#qApptAt').value; if (!at) return null;
      return { start: new Date(at), name: q.name, phone: q.phone, city: q.city, note: $('#qApptNote').value.trim(), id: q.id };
    };
    const syncGcal = () => { const a = apptInfo(), g = $('#qGcal'); g.href = a ? gcalUrl(a) : '#'; g.classList.toggle('disabled', !a); };
    $('#qApptAt').addEventListener('input', syncGcal); $('#qApptNote').addEventListener('input', syncGcal); syncGcal();
    $('#qIcs').onclick = () => {
      const a = apptInfo(); const m = $('#qApptMsg');
      if (!a) { m.textContent = 'Előbb add meg az időpontot.'; m.classList.add('err'); return; }
      m.classList.remove('err'); m.textContent = 'Naptárfájl letöltve.';
      downloadFile(`felmeres-${slugify(q.name) || 'ugyfel'}.ics`, buildIcs(a), 'text/calendar;charset=utf-8');
    };
    $('#qDel').onclick = async () => {
      if (!confirm(`Biztosan törlöd ${q.name} árajánlat-kérését a csatolt fotókkal együtt?\nEz nem vonható vissza.`)) return;
      if (paths.length) await sb.storage.from(PLANERVO_CFG.quoteBucket).remove(paths);
      const { error } = await sb.from('quotes').delete().eq('id', id);
      if (error) return toast('A törlés nem sikerült: ' + error.message, true);
      QUOTES = QUOTES.filter(x => x.id !== id); dlg.close(); renderQuotes(); refreshBadge(); toast('Törölve.');
    };
  }

  /* ---------- Időpontok: naptárfájl, formázás ---------- */
  const slotLabel = sl => (sl.date ? new Date(sl.date + 'T12:00:00').toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '') + (sl.part ? ', ' + sl.part : '');
  const icsDate = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsText = t => String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function buildIcs(a) {
    const end = new Date(a.start.getTime() + 60 * 60000);
    const desc = ['Felmérés', a.phone ? 'Telefon: ' + a.phone : '', a.note].filter(Boolean).join('\n');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PLANERVO//Felmeres//HU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + a.id + '@planervo', 'DTSTAMP:' + icsDate(new Date()), 'DTSTART:' + icsDate(a.start), 'DTEND:' + icsDate(end),
      'SUMMARY:' + icsText('Felmérés: ' + a.name), 'LOCATION:' + icsText(a.city), 'DESCRIPTION:' + icsText(desc),
      'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText('Felmérés: ' + a.name), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function gcalUrl(a) {
    const end = new Date(a.start.getTime() + 60 * 60000);
    const p = new URLSearchParams({ action: 'TEMPLATE', text: 'Felmérés: ' + a.name, dates: icsDate(a.start) + '/' + icsDate(end), details: ['Telefon: ' + a.phone, a.note].filter(Boolean).join('\n'), location: a.city || '' });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }

  /* ---------- Közös segédek ---------- */
  async function mergeTexts(patch) {
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (error) return { error };
    return sb.from('settings').upsert({ key: 'texts', value: { ...((data && data.value) || {}), ...patch }, updated_at: new Date().toISOString() });
  }
  function downloadFile(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- Áttekintés ---------- */
  async function showOverview() {
    CUR = 'overview';
    view.innerHTML = `<header class="vh"><div><h1>Áttekintés</h1><p class="help">Egy pillantás az oldalad állapotára. Kattints egy csempére, és a megfelelő szerkesztőre ugrasz.</p></div>
      <div class="vh-act"><a class="btn o" href="./" target="_blank" rel="noopener">Weboldal megnyitása</a></div></header>
      <div class="quick" id="quick" aria-label="Gyorsműveletek">
        <a class="btn gold sm" href="#quotes">Árajánlat-kérések</a>
        <a class="btn o sm" href="#gallery">Képek feltöltése</a>
        <button type="button" class="btn o sm" data-new="before_after">Új előtte–utána pár</button>
        <button type="button" class="btn o sm" data-new="posts">Új blogbejegyzés</button>
        <button type="button" class="btn o sm" data-new="testimonials">Új vélemény</button>
        <a class="btn o sm" href="#seo">SEO-ellenőrző</a>
      </div>
      <div class="stats" id="stats"><p class="muted">Betöltés…</p></div>
      <div id="ovAppts"></div>
      <h2 class="sub-h">Legutóbbi árajánlat-kérések</h2><div class="list" id="ovQuotes"><p class="muted">Betöltés…</p></div>
      <h2 class="sub-h">Tennivalók</h2><ul class="todo" id="todo"></ul>`;
    $('#quick').onclick = e => { const b = e.target.closest('[data-new]'); if (!b) return; OPEN_NEW = b.dataset.new; location.hash = b.dataset.new; };
    const count = (t, f) => { let q = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return Promise.resolve(q).then(r => r.error ? null : r.count).catch(() => null); };
    const [qNew, qAll, work, svc, ba, gal, vid, soc, posts, tstOk, tstWait, txr, last] = await Promise.all([
      count('quotes', q => q.eq('status', 'new')), count('quotes'), count('work_items', q => q.eq('visible', true)),
      count('services', q => q.eq('visible', true)), count('before_after', q => q.eq('visible', true)), count('gallery', q => q.eq('visible', true)),
      count('videos', q => q.eq('visible', true)), count('social_posts', q => q.eq('visible', true)), count('posts', q => q.eq('published', true)),
      count('testimonials', q => q.eq('visible', true)), count('testimonials', q => q.eq('visible', false)),
      sb.from('settings').select('value').eq('key', 'texts').maybeSingle(),
      sb.from('quotes').select('id,name,city,estimate,status,created_at').order('created_at', { ascending: false }).limit(5)
    ]);
    if (CUR !== 'overview') return;
    const n = v => v == null ? '–' : v;
    const tiles = [
      ['quotes', qNew, 'új árajánlat-kérés', qAll == null ? '' : `összesen ${qAll}`, qNew > 0],
      ['work_items', work, 'munkafolyamat az árajánlatkérőben', '', false], ['services', svc, 'szolgáltatás', '', false],
      ['before_after', ba, 'előtte–utána pár', '', false], ['gallery', gal, 'kép a galériában', '', false],
      ['videos', vid, 'kézzel felvett videó', '', false], ['social_posts', soc, 'közösségi bejegyzés', '', false], ['posts', posts, 'közzétett blogbejegyzés', '', false],
      ['testimonials', tstOk, 'jóváhagyott vélemény', tstWait ? `${tstWait} vár jóváhagyásra` : '', tstWait > 0]
    ];
    $('#stats').innerHTML = tiles.map(([k, v, l, s, hot]) => `<a class="stat${hot ? ' hot' : ''}" href="#${k}"><b>${n(v)}</b><span>${esc(l)}</span>${s ? `<small>${esc(s)}</small>` : ''}</a>`).join('');
    const ap = await sb.from('quotes').select('id,name,city,phone,appointment_at,appointment_note').gte('appointment_at', new Date(Date.now() - 3600000).toISOString()).order('appointment_at').limit(6);
    if (CUR === 'overview' && ap && !ap.error && (ap.data || []).length) {
      $('#ovAppts').innerHTML = `<h2 class="sub-h">Közelgő felmérések</h2><div class="list">${ap.data.map(a => `<div class="qrow appt"><span class="st st-scheduled">${new Date(a.appointment_at).toLocaleString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><b><a href="#quotes">${esc(a.name || a.phone || 'Árajánlat-kérés')}</a></b><span>${esc(a.city)}</span><span><a href="tel:${esc(String(a.phone || '').replace(/[^\d+]/g, ''))}">${esc(a.phone)}</a></span><span class="num"></span><time>${esc(a.appointment_note || '')}</time></div>`).join('')}</div>`;
    }
    const rows = (last && !last.error && last.data) || [];
    $('#ovQuotes').innerHTML = rows.length ? rows.map(q => `<a class="qrow" href="#quotes"><span class="st st-${q.status}">${STATUS[q.status] || q.status}</span><b>${esc(q.name)}</b><span>${esc(q.city)}</span><span></span><span class="num">${fmtFt(q.estimate)}</span><time>${new Date(q.created_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}</time></a>`).join('')
      : '<div class="emptybox"><p>Még nem érkezett árajánlat-kérés.</p></div>';
    const tx = { ...TEXT_DEFAULTS, ...((txr && txr.data && txr.data.value) || {}) }, todo = [];
    if (!tx.phone || tx.phone.replace(/\s/g, '') === OLD_SAMPLE_PHONE) todo.push(['texts', 'A telefonszám hiányzik vagy még a minta: írd át a „Főoldal szövegei” menüben.']);
    if (work === 0) todo.push(['work_items', 'Nincs munkafolyamat az árajánlatkérőben: töltsd be az árlistát.']);
    if ((tx.video_source || 'channel') !== 'manual' && !(tx.video_source === 'playlist' ? tx.youtube_playlist : tx.youtube_url) && !vid) todo.push(['videos', 'A videós ablak üres: add meg a YouTube-csatornádat vagy egy lejátszási listát.']);
    if (svc === 0) todo.push(['services', 'Nincs szolgáltatás felvéve, ezért az alapértelmezettek látszanak.']);
    if (gal === 0 && ba === 0) todo.push(['gallery', 'Még nincs galéria vagy előtte–utána kép: a fotók sokat dobnak a bizalmon.']);
    if (qNew > 0) todo.push(['quotes', `${qNew} új árajánlat-kérés vár válaszra.`]);
    if (tstWait > 0) todo.push(['testimonials', `${tstWait} új vélemény vár jóváhagyásra.`]);
    if (!tx.legal_name || !tx.legal_seat) todo.push(['texts', 'A jogi adatok (név, székhely, adószám) hiányosak: az adatkezelési tájékoztató és az impresszum ezektől teljes.']);
    if (siteBase(tx) !== SITE_URL) todo.push(['texts', 'Add meg az oldal webcímét („Keresők (SEO)” csoport), hogy a keresők megtalálják és jól jelenítsék meg.']);
    $('#todo').innerHTML = todo.length ? todo.map(([k, t]) => `<li><a href="#${k}">${esc(t)}</a></li>`).join('') : '<li class="ok">Minden rendben, nincs teendő.</li>';
  }

  /* ---------- Megjelenés és elrendezés ---------- */
  let LY = {}, lyDirty = false;
  const lyBase = LAYOUT_GROUPS.map(x => x[0]);
  const lyGet = (path) => path.split('.').reduce((o, k) => o == null ? undefined : o[k], LY);
  function lySet(path, val) {
    const ks = path.split('.'), last = ks.pop(), chain = [];
    let o = LY;
    ks.forEach(k => { if (typeof o[k] !== 'object' || o[k] === null) o[k] = {}; chain.push([o, k]); o = o[k]; });
    if (val === '' || val == null) delete o[last]; else o[last] = val;
    for (let i = chain.length - 1; i >= 0; i--) { const [par, k] = chain[i]; if (par[k] && !Object.keys(par[k]).length) delete par[k]; }
  }
  const lySel = (path, opts, cur) => `<select data-p="${path}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(cur ?? '') === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const lyField = (label, html, hint) => `<label class="lyf"><span>${esc(label)}</span>${html}${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
  const lyOrdered = () => fullOrder(LY.order);

  function lyOrderList() {
    const ord = lyOrdered(), hid = new Set(LY.hidden || []);
    $('#lyOrder').innerHTML = ord.map((g, i) => {
      const name = LAYOUT_GROUPS.find(x => x[0] === g)[1], allowed = LAYOUT_BG_ALLOWED[g];
      const bgs = allowed ? LAYOUT_BGS.filter(b => allowed.includes(b[0])) : LAYOUT_BGS;
      return `<li data-g="${g}"><b>${esc(name)}</b>
        <span class="mv"><button type="button" data-mv="-1" aria-label="Feljebb"${i ? '' : ' disabled'}>↑</button><button type="button" data-mv="1" aria-label="Lejjebb"${i < ord.length - 1 ? '' : ' disabled'}>↓</button></span>
        <div class="ly-ctl">
          <label class="sw"><input type="checkbox" data-vis${hid.has(g) ? '' : ' checked'}${g === 'arajanlat' ? ' disabled' : ''}>Látható</label>
          ${lySel('bg.' + g, bgs, (LY.bg || {})[g])}
          ${lySel('fx.' + g + '.space', FX_SPACES, lyGet('fx.' + g + '.space'))}
          ${lySel('fx.' + g + '.width', FX_WIDTHS, lyGet('fx.' + g + '.width'))}
          ${lySel('fx.' + g + '.anim', FX_ANIMS, lyGet('fx.' + g + '.anim'))}
        </div></li>`;
    }).join('');
  }

  function lyPreview() { lyDirty = true; }

  function lyBuild() {
    const card = (key, c) => {
      const p = k => `cards.${key}.${k}`, v = k => lyGet(p(k));
      return `<details class="card lycard"><summary><b>${esc(c.label)}</b></summary><div class="lygrid">
        ${lyField('Elrendezés', lySel(p('mode'), c.modes.map(m => m), v('mode') || c.mode), 'Lefelé folytatódó rács, vagy oldalra lapozható sáv nyilakkal.')}
        ${lyField('Kártyák egy sorban', lySel(p('cols'), CARD_COLS, v('cols')), 'Asztali gépen. Táblagépen és telefonon az oldal automatikusan csökkenti.')}
        ${lyField('Látható sorok (rácsnál)', lySel(p('rows'), CARD_ROWS, v('rows')), 'Ha több kártya van, a többi egy „Tovább” gomb mögött jelenik meg. Lapozható sávnál nem számít.')}
        ${lyField('Kártyák közti távolság', lySel(p('gap'), CARD_GAPS, v('gap')))}
        ${lyField('Sarkok', lySel(p('radius'), CARD_RADII, v('radius')))}
        ${c.ratios ? lyField('Képarány', lySel(p('ratio'), c.ratios, v('ratio'))) : ''}
        ${c.text ? `<label class="lyf chk"><input type="checkbox" data-p="${p('text')}" data-neg${v('text') === 'off' ? '' : ' checked'}><span>Szöveg (dátum, cím) a képek alatt</span></label>` : ''}
      </div></details>`;
    };
    const b = LY.banner || {}, m = LY.meta || {};
    $('#lyForm').innerHTML = `
      <fieldset class="card"><legend>Szakaszok sorrendje, láthatósága és háttere</legend>
        <p class="muted">A nyilakkal mozgathatod a szakaszokat a főoldalon. Szakaszonként állíthatod a hátteret, a függőleges térközt (szűk / tágas), a tartalom szélességét (keskeny / széles) és a görgetésnél megjelenő animációt. Az Árajánlatkérő mindig látható marad, mert a menü gombja oda vezet. A főoldal tetejét (a festőhengeres részt) nem lehet áthelyezni.</p>
        <ul class="lyorder" id="lyOrder"></ul></fieldset>
      <fieldset class="card"><legend>Kártyák és ablakok</legend>
        <p class="muted">Szakaszonként választhatod ki, hogy a kártyák lefelé (rács) vagy oldalra lapozva jelenjenek meg, hány férjen egymás mellé, mekkorák legyenek a távolságok és a sarkok. Ami „Alap”, az az eddigi megjelenés.</p>
        ${Object.entries(CARD_SECTIONS).map(([k, c]) => card(k, c)).join('')}</fieldset>
      <fieldset class="card"><legend>Általános megjelenés</legend><div class="lygrid">
        ${lyField('Tartalom szélessége', lySel('width', LAYOUT_WIDTHS, LY.width), 'Nagy képernyőn mennyire legyen széles a tartalom.')}
        ${lyField('Szakaszok közti térköz', lySel('spacing', LAYOUT_SPACINGS, LY.spacing))}
        <div class="lyf"><span>Kiemelő szín (gombok, címek, vonalak)</span>
          <div class="lycolor"><label class="chk"><input type="checkbox" data-accent${LY.accent ? ' checked' : ''}><span>Saját szín</span></label>
          <input type="color" data-p="accent" value="${esc(LY.accent || '#c49a54')}"${LY.accent ? '' : ' disabled'} aria-label="Kiemelő szín"></div>
          <small>A logó és a festőhenger színe nem változik. Üresen az eredeti arany marad.</small></div></div></fieldset>
      <fieldset class="card"><legend>Közlemény sáv az oldal tetején</legend>
        <p class="muted">Például ünnepi nyitvatartás, akció vagy szabad időpontok. A látogató bezárhatja.</p><div class="lygrid">
        <label class="lyf chk"><input type="checkbox" data-p="banner.on"${b.on ? ' checked' : ''}><span>Közlemény mutatása</span></label>
        ${lyField('Színe', lySel('banner.tone', LAYOUT_BANNER_TONES, b.tone || 'gold'))}
        ${lyField('Szöveg', `<input type="text" data-p="banner.text" maxlength="200" value="${esc(b.text)}" placeholder="pl. Karácsonykor december 23-tól január 2-ig szünetelek.">`)}
        ${lyField('Link szövege (opcionális)', `<input type="text" data-p="banner.link_text" maxlength="40" value="${esc(b.link_text)}" placeholder="pl. Részletek">`)}
        ${lyField('Link címe (opcionális)', `<input type="text" data-p="banner.url" maxlength="300" value="${esc(b.url)}" placeholder="#arajanlat vagy https://…">`)}</div></fieldset>
      <fieldset class="card"><legend>Keresők és megosztás</legend>
        <p class="muted">Ez látszik a böngésző fülén és a Google találatokban. Üresen az eredeti marad.</p><div class="lygrid one">
        ${lyField('Az oldal címe', `<input type="text" data-p="meta.title" maxlength="70" value="${esc(m.title)}" placeholder="Festő Üllőn és környékén – szobafestés, glettelés | PLANERVO">`, 'Legfeljebb kb. 60 karakter.')}
        ${lyField('Rövid leírás', `<textarea data-p="meta.desc" rows="3" maxlength="170" placeholder="Egy-két mondat arról, mit csinálsz és hol.">${esc(m.desc)}</textarea>`, 'Legfeljebb kb. 160 karakter.')}</div>
        <div class="vs-act"><button type="button" class="btn o" id="lySitemap">Sitemap letöltése</button><span class="vs-msg" id="lySmMsg" role="status">A sitemap.xml a keresőknek mutatja az oldal lapjait. Töltsd fel a főoldal mellé, és add meg a Google Search Console-ban.</span></div></fieldset>`;
    lyOrderList();
  }

  async function showLayout() {
    CUR = 'layout';
    view.innerHTML = `<header class="vh"><div><h1>Megjelenés és elrendezés</h1><p class="help">Itt állítod be, hogyan nézzen ki a főoldal: milyen sorrendben jönnek a szakaszok, a kártyák lefelé vagy oldalra lapozva jelennek-e meg, mekkorák legyenek, milyen színűek. A változás a Mentés után jelenik meg a főoldalon.</p></div>
      <div class="vh-act"><button type="button" class="btn o" id="lyReset">Alapértelmezés</button><button type="button" class="btn" id="lySave">Mentés</button></div></header>
      <div class="ly"><form id="lyForm" class="ly-form" novalidate><p class="muted">Betöltés…</p></form></div>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'layout') return;
    if (error) { $('#lyForm').innerHTML = errBox(error); return; }
    LY = JSON.parse(JSON.stringify(getLayout((data && data.value) || {}))); lyDirty = false;
    lyBuild();
    const form = $('#lyForm');
    const onInput = e => {
      const t = e.target;
      if (t.dataset.accent !== undefined) {
        const c = $('input[type=color]', form); c.disabled = !t.checked; lySet('accent', t.checked ? c.value : ''); return lyPreview();
      }
      const p = t.dataset.p; if (!p) return;
      let v = t.type === 'checkbox' ? t.checked : t.value;
      if (t.dataset.neg !== undefined) v = t.checked ? '' : 'off';
      lySet(p, v); lyPreview();
    };
    form.oninput = onInput; form.onchange = onInput;
    form.onclick = e => {
      const mv = e.target.closest('[data-mv]');
      if (mv) {
        const ord = lyOrdered(), g = mv.closest('li').dataset.g, i = ord.indexOf(g), j = i + (+mv.dataset.mv);
        if (j < 0 || j >= ord.length) return;
        [ord[i], ord[j]] = [ord[j], ord[i]];
        lySet('order', ord.join() === lyBase.join() ? '' : ord); lyOrderList(); return lyPreview();
      }
    };
    form.addEventListener('change', e => {
      const v = e.target.closest('[data-vis]'); if (!v) return;
      const g = v.closest('li').dataset.g, set = new Set(LY.hidden || []);
      if (v.checked) set.delete(g); else set.add(g);
      lySet('hidden', set.size ? [...set] : ''); lyPreview();
    });
    $('#lySitemap').onclick = async () => {
      const msg = (t, err) => { const m = $('#lySmMsg'); m.textContent = t; m.classList.toggle('err', !!err); };
      const { data: st } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
      const base = siteBase(st && st.value);
      if (!/^https?:\/\/[^\s/]+\.[^\s/]+/.test(base)) return msg('Az oldal webcíme hibás. Javítsd a „Főoldal szövegei” menü „Keresők (SEO)” csoportjában, például https://planervo.hu', true);
      const { data: posts } = await sb.from('posts').select('slug,updated_at,published_at').eq('published', true).lte('published_at', new Date().toISOString());
      const day = v => String(v || '').slice(0, 10);
      /* lastmod csak ott, ahol valódi dátum van (a bejegyzéseknél) */
      const urls = [[base + '/'], [base + '/blog.html', day((posts || []).map(p => p.updated_at || p.published_at).sort().pop())]];
      (posts || []).forEach(p => urls.push([`${base}/blog.html?p=${encodeURIComponent(p.slug)}`, day(p.updated_at || p.published_at)]));
      SEO_PAGES.forEach(f => urls.push([`${base}/${f}`]));
      const x = u => String(u).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(([l, m]) => `  <url><loc>${x(l)}</loc>${m ? `<lastmod>${m}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>\n';
      downloadFile('sitemap.xml', xml, 'application/xml'); msg(`Letöltve: ${urls.length} oldal. Töltsd fel a főoldal mellé.`);
    };
    $('#lyReset').onclick = () => {
      if (!confirm('Minden elrendezés-beállítást visszaállítasz az eredetire? A változás csak a „Mentés” után érvényes.')) return;
      LY = {}; lyBuild(); lyPreview(); toast('Visszaállítva. Ha így jó, kattints a Mentésre.');
    };
    $('#lySave').onclick = async () => {
      const btn = $('#lySave'); btn.disabled = true;
      const { error: err } = await mergeTexts({ layout: JSON.parse(JSON.stringify(LY)) });
      btn.disabled = false;
      if (err) return toast('A mentés nem sikerült: ' + err.message, true);
      lyDirty = false; toast('Elmentve. A főoldalon frissítés után mindenki ezt látja.');
    };
  }
  addEventListener('beforeunload', e => { if (lyDirty && CUR === 'layout') { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Lebegő kártya (telefonszám és közösségi ikonok a főoldal jobb szélén) ---------- */
  async function showFloat() {
    CUR = 'float';
    view.innerHTML = `<header class="vh"><div><h1>Lebegő kártya</h1><p class="help">A főoldalon, görgetés közben is a jobb szélen marad egy kis kártya a telefonszámmal és a közösségi ikonokkal. Az ikonra kattintva megnyílik az oldal. A telefonszámot a „Főoldal szövegei” menü „Kapcsolat” csoportjában írhatod át.</p></div>
      <div class="vh-act"><button type="button" class="btn" id="flSave">Mentés</button></div></header>
      <div class="ly"><form id="flForm" class="ly-form" novalidate><p class="muted">Betöltés…</p></form></div>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'float') return;
    const form = $('#flForm');
    if (error) { form.innerHTML = errBox(error); return; }
    const tx = (data && data.value) || {}, F = getFloat(tx);
    const typeOpts = sel => Object.entries(FLOAT_TYPES).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(v.l)}</option>`).join('');
    const row = l => `<div class="fl-row"><select aria-label="Melyik oldal">${typeOpts(l.t)}</select><input type="text" aria-label="Link" value="${esc(l.u)}" placeholder="https://www.facebook.com/oldalad"><span class="fl-act"><button type="button" class="btn sm o" data-mv="-1" aria-label="Feljebb">↑</button><button type="button" class="btn sm o" data-mv="1" aria-label="Lejjebb">↓</button><button type="button" class="btn sm danger" data-del>Törlés</button></span></div>`;
    form.innerHTML = `<fieldset class="card"><legend>Kártya</legend>
        <label class="lyf chk"><input type="checkbox" id="flOn"${F.on ? ' checked' : ''}> Megjelenjen a kártya a főoldalon</label>
        <label class="lyf chk"><input type="checkbox" id="flPhone"${F.phone ? ' checked' : ''}> Telefonszám is szerepeljen rajta (${esc(tx.phone || TEXT_DEFAULTS.phone)})</label></fieldset>
      <fieldset class="card"><legend>Közösségi ikonok</legend>
        <p class="muted">Az ikonok sorrendje megegyezik a kártyán láthatóval. A link legyen teljes webcím (https://…); e-mailnél elég a cím, WhatsAppnál a telefonszám.</p>
        <div id="flRows" class="fl-rows">${F.links.map(row).join('')}</div>
        <div><button type="button" class="btn sm o" id="flAdd">+ Ikon hozzáadása</button></div></fieldset>`;
    const rows = $('#flRows');
    let dirty = false;
    const mark = () => { dirty = true; };
    $('#flAdd').onclick = () => { rows.insertAdjacentHTML('beforeend', row({ t: 'facebook', u: '' })); mark(); const i = rows.querySelectorAll('input'); i[i.length - 1].focus(); };
    form.onchange = form.oninput = mark;
    rows.onclick = e => {
      const r = e.target.closest('.fl-row'); if (!r) return;
      if (e.target.closest('[data-del]')) { r.remove(); return mark(); }
      const mv = e.target.closest('[data-mv]'); if (!mv) return;
      const other = +mv.dataset.mv < 0 ? r.previousElementSibling : r.nextElementSibling;
      if (!other) return;
      if (+mv.dataset.mv < 0) rows.insertBefore(r, other); else rows.insertBefore(other, r);
      mark();
    };
    $('#flSave').onclick = async () => {
      const links = [...rows.querySelectorAll('.fl-row')].map(r => ({ t: r.querySelector('select').value, u: r.querySelector('input').value.trim() })).filter(l => l.u);
      const bad = links.find(l => !floatHref(l));
      if (bad) return toast('Ez a link nem érvényes: ' + bad.u + ' (https://-sel kezdődjön)', true);
      const btn = $('#flSave'); btn.disabled = true;
      const { error: err } = await mergeTexts({ float: { on: $('#flOn').checked, phone: $('#flPhone').checked, links } });
      btn.disabled = false;
      if (err) return toast('A mentés nem sikerült: ' + err.message, true);
      dirty = false; toast('Elmentve. A főoldalon frissítés után mindenki ezt látja.');
    };
    flDirty = () => dirty;
  }
  let flDirty = () => false;
  addEventListener('beforeunload', e => { if (CUR === 'float' && flDirty()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- SEO-ellenőrző (csak olvas, semmit nem ment) ---------- */
  async function showSeo() {
    CUR = 'seo';
    const enc = encodeURIComponent('https://planervo.hu/');
    view.innerHTML = `<header class="vh"><div><h1>SEO-ellenőrző</h1><p class="help">Megnézi, mi segíti és mi hátráltatja, hogy a Google-ben rád találjanak, ha festőt keresnek. Zöld: rendben. Sárga: érdemes javítani. Piros: fontos hiány.</p></div></header>
      <ul class="chk-list" id="seoList"><li><span></span><span class="muted">Ellenőrzés…</span></li></ul>
      <h2 class="sub-h">Helyi keresőoldalak</h2><p class="muted">Ezeket az eszkozok/oldalak.mjs készíti. Megnyitva ellenőrizheted, hogy feltöltötted-e a tárhelyre.</p><div class="seo-links" id="seoPages"></div>
      <h2 class="sub-h">Külső eszközök</h2><div class="seo-links">
        <a class="btn o sm" href="https://business.google.com/" target="_blank" rel="noopener">Google Cégprofil</a>
        <a class="btn o sm" href="https://search.google.com/search-console" target="_blank" rel="noopener">Search Console</a>
        <a class="btn o sm" href="https://pagespeed.web.dev/analysis?url=${enc}" target="_blank" rel="noopener">Sebességmérés (PageSpeed)</a>
        <a class="btn o sm" href="https://search.google.com/test/rich-results?url=${enc}" target="_blank" rel="noopener">Strukturált adat teszt</a>
        <a class="btn o sm" href="#layout">Sitemap letöltése (Megjelenés)</a></div>`;
    $('#seoPages').innerHTML = SEO_PAGES.map(f => `<a class="btn o sm" href="${esc(f)}" target="_blank" rel="noopener">${esc(f.replace('.html', ''))}</a>`).join('');
    const since = new Date(Date.now() - 60 * 864e5).toISOString();
    const safe = p => Promise.resolve(p).catch(error => ({ error }));
    const cnt = q => safe(q.select('id', { count: 'exact', head: true }));
    const [txr, gal, svc, tst, posts, idx] = await Promise.all([
      safe(sb.from('settings').select('value').eq('key', 'texts').maybeSingle()),
      safe(sb.from('gallery').select('caption').eq('visible', true)),
      cnt(sb.from('services')).then(r => r), cnt(sb.from('testimonials')),
      safe(sb.from('posts').select('id', { count: 'exact', head: true }).eq('published', true).gte('published_at', since)),
      safe(fetch('./', { cache: 'no-store' }).then(r => r.text()))
    ]);
    if (CUR !== 'seo') return;
    const tx = { ...TEXT_DEFAULTS, ...((txr && txr.data && txr.data.value) || {}) }, meta = getLayout(tx).meta || {};
    const html = typeof idx === 'string' ? idx : '';
    const grab = re => { const x = html.match(re); return x ? x[1].replace(/&amp;/g, '&') : ''; };
    const title = meta.title || grab(/<title>([^<]*)<\/title>/i), desc = meta.desc || grab(/<meta name="description" content="([^"]*)"/i);
    const out = [], add = (st, t, d, fix) => out.push({ st, t, d, fix });
    const num = r => (r && !r.error && typeof r.count === 'number') ? r.count : null;

    if (!title) add('bad', 'Az oldal címe hiányzik', 'A böngészőfülön és a Google-találatban ez látszik.', '#layout');
    else add(title.length >= 30 && title.length <= 70 && /fest/i.test(title) && /üllő/i.test(title) ? 'ok' : 'warn', 'Az oldal címe',
      `„${title}” (${title.length} karakter${meta.title ? ', az adminban beállítva' : ''}). Ideális: 30–70 karakter, benne a „festő” szó és Üllő.`, '#layout');
    if (!desc) add('bad', 'A keresőknek szóló leírás hiányzik', 'Ez a két sor jelenik meg a Google-találat alatt.', '#layout');
    else add(desc.length >= 70 && desc.length <= 170 ? 'ok' : 'warn', 'Leírás a keresőknek', `${desc.length} karakter. Ideális: 70–170.`, '#layout');
    const url = siteBase(tx);
    add(url === SITE_URL ? 'ok' : 'warn', 'Az oldal webcíme', url === SITE_URL ? url : `${url}: a canonical címek ${SITE_URL} alakúak, ezt add meg (www nélkül).`, '#texts');
    const phoneOk = tx.phone && tx.phone.replace(/\s/g, '') !== OLD_SAMPLE_PHONE;
    add(phoneOk ? 'ok' : 'bad', 'Telefonszám', phoneOk ? `${tx.phone}. Ugyanaz legyen, mint a Google Cégprofilon.` : 'Még a minta-szám szerepel. Ugyanaz legyen, mint a Google Cégprofilon.', '#texts');
    add(tx.area ? 'ok' : 'warn', 'Munkaterület', tx.area || 'Nincs megadva.', '#texts');
    add(tx.legal_name && tx.legal_seat ? 'ok' : 'warn', 'Cégadatok (impresszum)', tx.legal_name && tx.legal_seat ? tx.legal_name : 'Hiányos: a Google a valódi, ellenőrizhető vállalkozásokat részesíti előnyben.', '#texts');
    add(tx.facebook_url || tx.instagram_url ? 'ok' : 'warn', 'Közösségi profilok', tx.facebook_url || tx.instagram_url ? 'Megadva, a keresők összekapcsolják az oldallal.' : 'Add meg a Facebook- vagy Instagram-oldalad linkjét.', '#texts');
    if (gal && !gal.error) {
      const imgs = gal.data || [], noCap = imgs.filter(r => !String(r.caption || '').trim()).length;
      add(!imgs.length ? 'warn' : noCap ? 'warn' : 'ok', 'Galériaképek aláírása',
        !imgs.length ? 'Nincs kép a galériában.' : noCap ? `${noCap} / ${imgs.length} kép aláírás nélkül. Írj hozzájuk rövid leírást, például „Nappali festése, Gyál”.` : `Mind a ${imgs.length} képnek van aláírása.`, '#gallery');
    }
    const s = num(svc), t = num(tst), p = num(posts);
    if (s != null) add(s > 0 ? 'ok' : 'warn', 'Szolgáltatások', s > 0 ? `${s} szolgáltatás felvéve.` : 'Nincs saját szolgáltatás, az alapértelmezettek látszanak.', '#services');
    if (t != null) add(t >= 3 ? 'ok' : 'warn', 'Vélemények az oldalon', t ? `${t} vélemény. Legalább 3 ajánlott.` : 'Nincs vélemény. Kérj az ügyfelektől, és vedd fel őket.', '#testimonials');
    if (p != null) add(p > 0 ? 'ok' : 'warn', 'Friss blogbejegyzés', p > 0 ? `${p} bejegyzés az elmúlt 60 napban.` : 'Az elmúlt 60 napban nem jelent meg bejegyzés. Havi egy rövid cikk sokat segít.', '#posts');

    const order = { bad: 0, warn: 1, ok: 2 };
    out.sort((a, b) => order[a.st] - order[b.st]);
    $('#seoList').innerHTML = out.map(c => `<li class="${c.st}"><span class="dot" aria-hidden="true"></span><div><b>${esc(c.t)}</b><small>${esc(c.d)}</small></div>${c.st !== 'ok' ? `<a class="btn o sm" href="${c.fix}">Javítás</a>` : ''}</li>`).join('');
  }

  /* ---------- Mentés és visszaállítás ---------- */
  const BACKUP_TABLES = ['services', 'process_steps', 'faqs', 'testimonials', 'sections', 'before_after', 'gallery_albums', 'gallery', 'videos', 'social_posts', 'posts', 'work_items'];
  function showBackup() {
    CUR = 'backup';
    view.innerHTML = `<header class="vh"><div><h1>Mentés és visszaállítás</h1><p class="help">Az oldal tartalmáról egyetlen fájlba menthetsz másolatot, és bármikor vissza is töltheted. Érdemes nagyobb átalakítás előtt menteni.</p></div></header>
      <div class="bk"><section class="card"><h2>Másolat letöltése</h2>
        <p class="muted">Tartalmazza a szövegeket, a beállításokat és az elrendezést, a szolgáltatásokat, a munkafolyamatokat és díjakat, a galériát, az előtte–utána párokat, a videókat, a közösségi bejegyzéseket és a blogot. Nem tartalmazza az árajánlat-kéréseket (személyes adatok), és a képfájlokat sem, csak a webcímüket.</p>
        <div class="vs-act"><button type="button" class="btn" id="bkExport">Másolat letöltése</button><span class="vs-msg" id="bkMsg" role="status"></span></div></section>
      <section class="card"><h2>Visszaállítás másolatból</h2>
        <p class="muted">Válaszd ki a korábban letöltött fájlt. A benne lévő elemek felülírják a most meglévő, azonos azonosítójú elemeket, az újak hozzáadódnak. A fájlban nem szereplő elemeket nem törlöm.</p>
        <div class="vs-act"><label class="btn o">Fájl kiválasztása<input type="file" id="bkFile" accept=".json,application/json" hidden></label><span class="vs-msg" id="bkMsg2" role="status"></span></div></section></div>`;
    $('#bkExport').onclick = async () => {
      const msg = t => { $('#bkMsg').textContent = t; };
      msg('Másolat készítése…');
      const out = { app: 'planervo', version: 1, exported_at: new Date().toISOString(), tables: {}, settings: {} };
      for (const t of BACKUP_TABLES) {
        const { data, error } = await sb.from(t).select('*');
        if (error) return msg(`A(z) ${t} tábla nem olvasható: ${error.message}`);
        out.tables[t] = data || [];
      }
      const { data: st, error: se } = await sb.from('settings').select('key,value');
      if (se) return msg('A beállítások nem olvashatók: ' + se.message);
      (st || []).forEach(r => { out.settings[r.key] = r.value; });
      downloadFile(`planervo-mentes-${dayStr(new Date())}.json`, JSON.stringify(out, null, 1), 'application/json');
      msg(`Kész: ${Object.values(out.tables).reduce((s, a) => s + a.length, 0)} elem mentve.`);
    };
    $('#bkFile').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const msg = (t, err) => { const m = $('#bkMsg2'); m.textContent = t; m.classList.toggle('err', !!err); };
      let d;
      try { d = JSON.parse(await f.text()); } catch (x) { return msg('Ez a fájl nem olvasható: nem érvényes mentésfájl.', true); }
      if (!d || d.app !== 'planervo' || !d.tables) return msg('Ez nem Planervo-mentés. Csak a „Másolat letöltése” gombbal készült fájlt lehet visszatölteni.', true);
      const counts = BACKUP_TABLES.map(t => `${(d.tables[t] || []).length} ${t}`).join(', ');
      if (!confirm(`Visszatöltöd a mentést (${d.exported_at ? new Date(d.exported_at).toLocaleString('hu-HU') : 'ismeretlen időpont'})?\n\n${counts}\n\nA meglévő, azonos azonosítójú elemek felülíródnak.`)) return;
      msg('Visszaállítás…');
      try {
        for (const t of BACKUP_TABLES) {
          const rows = d.tables[t] || [];
          for (let i = 0; i < rows.length; i += 100) {
            const { error } = await sb.from(t).upsert(rows.slice(i, i + 100), { onConflict: 'id' });
            if (error) throw new Error(`${t}: ${error.message}`);
          }
        }
        if (d.settings && d.settings.texts) { const { error } = await sb.from('settings').upsert({ key: 'texts', value: d.settings.texts, updated_at: new Date().toISOString() }); if (error) throw new Error('beállítások: ' + error.message); }
        msg('Kész, minden visszaállítva. Frissítsd a főoldalt.');
        toast('A mentés visszaállítva.');
      } catch (x) { msg('A visszaállítás megszakadt: ' + x.message, true); }
    };
  }

  /* ---------- Árlista: árak módosítása százalékkal ---------- */
  function bulkPriceDialog() {
    const cats = [...new Set(ROWS.map(r => r.category || ''))].filter(Boolean);
    dlgBody.innerHTML = `<form class="ed" id="bpForm" novalidate><header><h2>Árak módosítása</h2><button type="button" class="x" data-close aria-label="Bezárás">×</button></header>
      <div class="ed-fields">
        <p class="muted">Az összes (vagy egy kategória) munkadíját módosítja egyszerre, például árváltozás után. A kerekítés a tiszta árakért van.</p>
        <div class="fl"><label for="bpPct">Változás százalékban</label><div class="bp-pct"><button type="button" class="btn o" id="bpSign" aria-label="Előjel váltása (emelés / csökkentés)">+ / −</button><input id="bpPct" type="text" inputmode="decimal" autocomplete="off" value="5" placeholder="pl. 5"></div><span class="hint">Pozitív szám emel, negatív csökkent. Telefonon a „+ / −” gombbal válthatsz előjelet.</span></div>
        <label class="fl">Melyik tételekre<select id="bpCat"><option value="">Minden tételre (${ROWS.length})</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="fl">Kerekítés<select id="bpRound"><option value="10">10 Ft-ra</option><option value="50">50 Ft-ra</option><option value="100">100 Ft-ra</option><option value="1">Nincs kerekítés</option></select></label>
        <p class="bp-sum" id="bpSum" role="status"></p></div>
      <footer><button type="button" class="btn o" data-close>Mégse</button><button class="btn" type="submit">Árak módosítása</button></footer></form>`;
    $$('[data-close]', dlgBody).forEach(b => b.onclick = () => dlg.close());
    const calc = () => {
      const pct = parseFloat(String($('#bpPct').value).replace(',', '.').replace('−', '-')) || 0, step = +$('#bpRound').value || 1, cat = $('#bpCat').value;
      const sel = ROWS.filter(r => !cat || (r.category || '') === cat);
      const np = v => Math.max(0, Math.round((+v || 0) * (1 + pct / 100) / step) * step);
      const ex = sel.find(r => +r.price > 0);
      $('#bpSum').textContent = sel.length ? `${sel.length} tétel módosul${ex ? `. Például: „${ex.name}”: ${fmtFt(ex.price)} → ${fmtFt(np(ex.price))}` : ''}.` : 'Nincs ilyen tétel.';
      return { pct, sel, np };
    };
    ['#bpPct', '#bpCat', '#bpRound'].forEach(s => $(s).addEventListener('input', calc));
    $('#bpSign').onclick = () => { const v = parseFloat(String($('#bpPct').value).replace(',', '.').replace('−', '-')) || 0; $('#bpPct').value = String(-v); calc(); };
    calc();
    dlg.showModal();
    $('#bpForm').addEventListener('submit', async e => {
      e.preventDefault();
      const { pct, sel, np } = calc();
      if (!pct || !sel.length) return toast('Adj meg nullától eltérő százalékot, és válassz tételeket.', true);
      if (!confirm(`${sel.length} tétel ára ${pct > 0 ? 'nő' : 'csökken'} ${Math.abs(pct)}%-kal. Folytatod?`)) return;
      const btn = $('#bpForm button[type=submit]'); btn.disabled = true;
      const rows = sel.map(r => { const o = { ...r, price: np(r.price) }; if (o.price_ceiling != null && o.price_ceiling !== '') o.price_ceiling = np(o.price_ceiling); return o; });
      let err = null;
      for (let i = 0; i < rows.length && !err; i += 100) { const { error } = await sb.from('work_items').upsert(rows.slice(i, i + 100), { onConflict: 'id' }); err = error; }
      btn.disabled = false;
      if (err) return toast('A módosítás nem sikerült: ' + err.message, true);
      dlg.close(); toast(`${rows.length} tétel ára módosítva.`); loadList('work_items');
    });
  }

  /* ---------- Árajánlat-kérések: keresés és CSV ---------- */
  function filteredQuotes() {
    const s = qSearch.trim().toLowerCase();
    return QUOTES.filter(q => (qFilter === 'all' || q.status === qFilter) &&
      (!s || [q.name, q.city, q.phone, q.email, q.message].some(x => String(x || '').toLowerCase().includes(s))));
  }
  function exportQuotesCsv() {
    const rows = filteredQuotes();
    if (!rows.length) return toast('Nincs exportálható árajánlat-kérés.', true);
    const cell = v => { v = String(v ?? '').replace(/\r?\n/g, ' ').trim(); return /[;"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const head = ['Beérkezett', 'Állapot', 'Név', 'E-mail', 'Telefon', 'Település', 'Megjegyzés', 'Helyiségek', 'Becsült munkadíj (Ft)', 'Akció', 'Kívánt időpontok', 'Felmérés időpontja', 'Kért munkák', 'Saját jegyzet'];
    const lines = rows.map(q => [new Date(q.created_at).toLocaleString('hu-HU'), STATUS[q.status] || q.status, q.name, q.email, q.phone, q.city, q.message,
      (q.rooms || []).length, Math.round(+q.estimate || 0), q.discount ? `${q.discount.label || 'Akció'} −${q.discount.pct}%` : '', (q.preferred_slots || []).map(slotLabel).join(' | '), q.appointment_at ? new Date(q.appointment_at).toLocaleString('hu-HU') : '', (q.rooms || []).map(r => `${r.name}: ${(r.items || []).map(i => i.name).join(', ')}`).join(' | '), q.admin_note]);
    downloadFile(`arajanlat-keresek-${dayStr(new Date())}.csv`, '﻿' + [head, ...lines].map(r => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
    toast(`${rows.length} kérés letöltve (Excelben megnyitható).`);
  }

  /* ---------- Indulás ---------- */
  (async function init() {
    if (!sb) { $('#login').hidden = false; lmsg('#lMsg', 'A Supabase könyvtár nem töltődött be. Ellenőrizd az internetkapcsolatot.', true); return; }
    sb.auth.onAuthStateChange(ev => {
      if (ev === 'PASSWORD_RECOVERY') { $('#app').hidden = true; $('#login').hidden = false; $('#loginForm').hidden = true; $('#resetForm').hidden = false; }
    });
    const recovery = /type=recovery/.test(location.hash);
    const { data: { session } } = await sb.auth.getSession();
    if (recovery) { $('#login').hidden = false; $('#loginForm').hidden = true; $('#resetForm').hidden = false; }
    else if (session) enter(); else showLogin();
  })();
})();
