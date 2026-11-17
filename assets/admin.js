/* PLANERVO – admin felület */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view'), dlg = $('#dlg'), dlgBody = $('#dlgBody');

  function toast(m, err) {
    const t = $('#toast'); t.textContent = m; t.className = err ? 'show err' : 'show';
    clearTimeout(t._t); t._t = setTimeout(() => { t.className = ''; }, err ? 6000 : 3000);
  }
  const errBox = e => `<div class="errbox">Hiba történt: ${esc(e.message || e)}. Ha az adatbázis még nincs beállítva, futtasd a supabase/schema.sql fájlt.</div>`;

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
      // az új mezőt csak akkor küldjük, ha van értéke vagy az adatbázis már ismeri (lásd supabase/2026-11-arlista.sql)
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
      fields: [{ k: 'title', l: 'Cím', req: 1 }, { k: 'body', l: 'Leírás', t: 'textarea' }, { k: 'image_url', l: 'Kép (nem kötelező)', t: 'image', folder: 'szolgaltatasok' }],
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
        { k: 'title', l: 'Cím', ph: 'pl. Nappali felújítás, Budaörs' },
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
      help: 'Egyszerre több képet is feltölthetsz. A sorrendet a nyilakkal állíthatod, a képaláírás a kép fölé húzott egérrel látszik.',
      empty: 'Még nincs kép a galériában. Tölts fel néhányat a „Több kép feltöltése” gombbal.',
      fields: [{ k: 'image_url', l: 'Kép', t: 'image', req: 1, folder: 'galeria' }, { k: 'caption', l: 'Képaláírás' }],
      thumb: 'image_url', title: r => r.caption || 'Kép aláírás nélkül'
    },
    process_steps: {
      label: 'Hogyan dolgozunk', single: 'lépés', addLabel: 'Új lépés',
      help: 'A főoldali „Hogyan dolgozunk” szakasz lépései, a megadott sorrendben (a nyilakkal rendezheted). Érdemes 3–6 lépést megadni, mindegyikhez egy-két mondatot.',
      empty: 'Még nincs lépés. Ha üres, a szakasz nem jelenik meg a főoldalon.',
      fields: [{ k: 'title', l: 'Lépés neve', req: 1, ph: 'pl. Felmérés' }, { k: 'body', l: 'Leírás', t: 'textarea' }],
      title: r => r.title, sub: r => r.body
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

  const NAV = [
    ['overview', 'Áttekintés'], ['quotes', 'Árajánlat-kérések'], ['work_items', 'Munkafolyamatok és díjak'],
    ['layout', 'Megjelenés és elrendezés'], ['texts', 'Oldal szövegei'],
    ['sections', 'Főoldal ablakok'], ['services', 'Szolgáltatások'], ['process_steps', 'Hogyan dolgozunk'], ['testimonials', 'Vélemények'], ['before_after', 'Előtte–utána'],
    ['gallery', 'Galéria'], ['videos', 'YouTube-videók'], ['social_posts', 'Közösségi média'], ['posts', 'Blog'],
    ['backup', 'Mentés és visszaállítás']
  ];
  $('#nav').innerHTML = NAV.map(([k, l]) => `<button type="button" data-v="${k}"><span>${l}</span>${k === 'quotes' ? '<span class="badge" id="qBadge" hidden></span>' : ''}</button>`).join('');
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
      lmsg('#lMsg', error ? 'Az adatbázis nincs beállítva. Futtasd a supabase/schema.sql fájlt.' : 'Ez a fiók nem admin. Vedd fel az e-mail-címét az admins táblába.', true);
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
    $$('#nav button').forEach(b => { if (b.dataset.v === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (dlg.open) dlg.close();
    window.scrollTo(0, 0);
    if (v === 'overview') showOverview(); else if (v === 'quotes') showQuotes(); else if (v === 'texts') showTexts(); else if (v === 'layout') showLayout(); else if (v === 'backup') showBackup(); else showTable(v);
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
      default: return `<label class="fl">${lab}<input id="${id}" type="text" value="${esc(v)}" maxlength="${f.max || 500}"${req}${ph}>${hint}</label>`;
    }
  }
  function wireImages(root) {
    $$('.img-field', root).forEach(box => {
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
  let ROWS = [], CUR = null;
  async function showTable(key) {
    const T = TABLES[key]; CUR = key;
    view.innerHTML = `<header class="vh"><div><h1>${esc(T.label)}</h1>${T.help ? `<p class="help">${esc(T.help)}</p>` : ''}</div>
      <div class="vh-act">${T.multi ? '<label class="btn o">Több kép feltöltése<input type="file" accept="image/*" multiple hidden id="multi"></label>' : ''}
      ${T.importList ? '<button type="button" class="btn o" id="importList">Árlista betöltése</button>' : ''}
      ${T.bulkPrice ? '<button type="button" class="btn o" id="bulkPrice">Árak módosítása</button>' : ''}
      <button type="button" class="btn" id="addNew">${esc(T.addLabel)}</button></div></header>
      ${T.search ? `<div class="filt"><input type="search" id="fltQ" placeholder="Keresés a megnevezésben…" aria-label="Keresés"><select id="fltC" aria-label="Kategória"><option value="">Minden kategória</option></select><span class="muted" id="fltN"></span></div>` : ''}
      ${key === 'videos' ? '<form class="vsrc" id="vsrc" novalidate><p class="muted">Betöltés…</p></form><h2 class="sub-h">Kézzel felvett videók</h2>' : ''}
      <div id="list" class="list"><p class="muted">Betöltés…</p></div>`;
    $('#addNew').onclick = () => openEditor(key, null);
    if (key === 'videos') videoSource();
    if (T.multi) $('#multi').onchange = e => multiUpload(key, [...e.target.files]);
    if (T.importList) $('#importList').onclick = () => importPriceList(key);
    if (T.bulkPrice) $('#bulkPrice').onclick = bulkPriceDialog;
    if (T.search) { $('#fltQ').oninput = applyFilter; $('#fltC').onchange = applyFilter; }
    await loadList(key);
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
        msg(`Nem sikerült lekérni a videókat: ${x.message} Ha a youtube-feed függvény még nincs telepítve a Supabase-ben, a README leírja, hogyan kell.`, true);
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
    for (let i = 0; i < files.length; i++) {
      toast(`Feltöltés: ${i + 1} / ${files.length}`);
      try {
        const u = await uploadMedia(files[i], 'galeria');
        const { error } = await sb.from(key).insert({ image_url: u, position: pos }); if (error) throw error;
        pos += 10; ok++;
      } catch (e) { toast(`${files[i].name}: ${e.message}`, true); }
    }
    toast(`${ok} kép feltöltve.`); $('#multi').value = ''; loadList(key);
  }

  function openEditor(key, row) {
    const T = TABLES[key], isNew = !row, cur = row || {};
    dlgBody.innerHTML = `<form class="ed" id="edForm" novalidate>
      <header><h2>${isNew ? 'Új ' + esc(T.single) : 'Szerkesztés'}</h2><button type="button" class="x" data-close aria-label="Bezárás">×</button></header>
      <div class="ed-fields">${T.fields.map(f => fieldHtml(f, cur[f.k] ?? (isNew && f.t === 'bool' ? key !== 'posts' : undefined))).join('')}</div>
      <footer><button type="button" class="btn o" data-close>Mégse</button><button class="btn" type="submit">Mentés</button></footer></form>`;
    const quills = {};
    T.fields.filter(f => f.t === 'rich').forEach(f => { quills[f.k] = makeQuill(document.getElementById('f_' + f.k), cur[f.k]); });
    wireImages(dlgBody);
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

  /* ---------- Oldal szövegei ---------- */
  async function showTexts() {
    CUR = 'texts';
    view.innerHTML = `<header class="vh"><div><h1>Oldal szövegei</h1><p class="help">A főoldal címei, bevezetői, elérhetőségei és a logó. Üresen hagyott bevezető nem jelenik meg.</p></div></header>
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

  /* ---------- Árajánlat-kérések ---------- */
  let QUOTES = [], qFilter = 'all';
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
        <span class="num">${q.estimate_min && q.estimate_max && +q.estimate_min !== +q.estimate_max ? fmtInt0(q.estimate_min) + '–' + fmtFt(q.estimate_max) : fmtFt(q.estimate)}</span><time>${q.appointment_at ? '📅 ' + new Date(q.appointment_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }) : new Date(q.created_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}</time></button>`).join('')
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
          <p class="meta">${fmtNum(r.area)} m² alapterület, ${fmtNum(r.height)} m belmagasság, ≈ ${fmtNum(r.wall)} m² fal, ${fmtNum(r.ceiling)} m² mennyezet</p>
          <div class="tbl"><table>${(r.items || []).map(it => `<tr><td>${esc(it.name)}</td><td>${fmtNum(it.qty)} ${UNIT_SHORT[it.unit] || ''}</td><td>${fmtFt(it.price)}</td><td>${fmtFt(it.amount)}</td></tr>`).join('')}
            <tr class="sub"><td colspan="3">Részösszeg</td><td>${fmtFt(r.subtotal)}</td></tr></table></div>
          ${(r.images || []).length ? `<div class="qd-imgs">${r.images.map((p, j) => urls[p] ? `<a href="${urls[p]}" target="_blank" rel="noopener"><img src="${urls[p]}" alt="${j + 1}. fotó"></a>` : '').join('')}</div>` : ''}
        </div>`).join('')}
        ${q.discount && q.discount.amount ? `<div class="qd-promo">${esc(q.discount.label || 'Akció')} (−${esc(q.discount.pct)}%): −${fmtFt(q.discount.amount)}</div>` : ''}
        <div class="qd-total">Becsült munkadíj összesen:<strong>${q.estimate_min && q.estimate_max && +q.estimate_min !== +q.estimate_max ? 'kb. ' + fmtInt0(q.estimate_min) + ' – ' + fmtFt(q.estimate_max) : fmtFt(q.estimate)}</strong>${q.estimate_min && +q.estimate_min !== +q.estimate_max ? `<small class="muted"> középérték: ${fmtFt(q.estimate)}</small>` : ''}</div>
        <div class="qd-appt"><b>Felmérés időpontja</b>
          <div class="qd-appt-row"><label>Időpont<input type="datetime-local" id="qApptAt" value="${q.appointment_at ? toLocalInput(q.appointment_at) : ''}"></label>
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
  const fmtInt0 = n => Math.round(+n || 0).toLocaleString('hu-HU');
  const slotLabel = sl => (sl.date ? new Date(sl.date + 'T12:00:00').toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '') + (sl.part ? ', ' + sl.part : '');
  const toLocalInput = v => { const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
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
  const todayStr = () => new Date().toISOString().slice(0, 10);

  /* ---------- Áttekintés ---------- */
  async function showOverview() {
    CUR = 'overview';
    view.innerHTML = `<header class="vh"><div><h1>Áttekintés</h1><p class="help">Egy pillantás az oldalad állapotára. Kattints egy csempére, és a megfelelő szerkesztőre ugrasz.</p></div>
      <div class="vh-act"><a class="btn o" href="index.html" target="_blank" rel="noopener">Weboldal megnyitása</a></div></header>
      <div class="stats" id="stats"><p class="muted">Betöltés…</p></div>
      <div id="ovAppts"></div>
      <h2 class="sub-h">Legutóbbi árajánlat-kérések</h2><div class="list" id="ovQuotes"><p class="muted">Betöltés…</p></div>
      <h2 class="sub-h">Tennivalók</h2><ul class="todo" id="todo"></ul>`;
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
      $('#ovAppts').innerHTML = `<h2 class="sub-h">Közelgő felmérések</h2><div class="list">${ap.data.map(a => `<a class="qrow appt" href="#quotes"><span class="st st-scheduled">${new Date(a.appointment_at).toLocaleString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><b>${esc(a.name)}</b><span>${esc(a.city)}</span><span><a href="tel:${esc(String(a.phone || '').replace(/[^\\d+]/g, ''))}">${esc(a.phone)}</a></span><span class="num"></span><time>${esc(a.appointment_note || '')}</time></a>`).join('')}</div>`;
    }
    const rows = (last && !last.error && last.data) || [];
    $('#ovQuotes').innerHTML = rows.length ? rows.map(q => `<a class="qrow" href="#quotes"><span class="st st-${q.status}">${STATUS[q.status] || q.status}</span><b>${esc(q.name)}</b><span>${esc(q.city)}</span><span></span><span class="num">${fmtFt(q.estimate)}</span><time>${new Date(q.created_at).toLocaleString('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })}</time></a>`).join('')
      : '<div class="emptybox"><p>Még nem érkezett árajánlat-kérés.</p></div>';
    const tx = { ...TEXT_DEFAULTS, ...((txr && txr.data && txr.data.value) || {}) }, todo = [];
    if (tx.phone === TEXT_DEFAULTS.phone) todo.push(['texts', 'A telefonszám még a minta: írd át az „Oldal szövegei” menüben.']);
    if (work === 0) todo.push(['work_items', 'Nincs munkafolyamat az árajánlatkérőben: töltsd be az árlistát.']);
    if ((tx.video_source || 'channel') !== 'manual' && !(tx.video_source === 'playlist' ? tx.youtube_playlist : tx.youtube_url) && !vid) todo.push(['videos', 'A videós ablak üres: add meg a YouTube-csatornádat vagy egy lejátszási listát.']);
    if (svc === 0) todo.push(['services', 'Nincs szolgáltatás felvéve, ezért az alapértelmezettek látszanak.']);
    if (gal === 0 && ba === 0) todo.push(['gallery', 'Még nincs galéria vagy előtte–utána kép: a fotók sokat dobnak a bizalmon.']);
    if (qNew > 0) todo.push(['quotes', `${qNew} új árajánlat-kérés vár válaszra.`]);
    if (tstWait > 0) todo.push(['testimonials', `${tstWait} új vélemény vár jóváhagyásra.`]);
    if (!tx.legal_name || !tx.legal_seat) todo.push(['texts', 'A jogi adatok (név, székhely, adószám) hiányosak: az adatkezelési tájékoztató és az impresszum ezektől teljes.']);
    if (!tx.site_url) todo.push(['texts', 'Add meg az oldal webcímét („Keresők (SEO)” csoport), hogy a keresők megtalálják és jól jelenítsék meg.']);
    $('#todo').innerHTML = todo.length ? todo.map(([k, t]) => `<li><a href="#${k}">${esc(t)}</a></li>`).join('') : '<li class="ok">Minden rendben, nincs teendő.</li>';
  }

  /* ---------- Megjelenés és elrendezés ---------- */
  let LY = {}, lyDirty = false, lyTimer = 0;
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
  const lyOrdered = () => { const s = LY.order || []; return [...s.filter(x => lyBase.includes(x)), ...lyBase.filter(x => !s.includes(x))]; };

  function lyOrderList() {
    const ord = lyOrdered(), hid = new Set(LY.hidden || []);
    $('#lyOrder').innerHTML = ord.map((g, i) => {
      const name = LAYOUT_GROUPS.find(x => x[0] === g)[1], allowed = LAYOUT_BG_ALLOWED[g];
      const bgs = allowed ? LAYOUT_BGS.filter(b => allowed.includes(b[0])) : LAYOUT_BGS;
      return `<li data-g="${g}"><b>${esc(name)}</b>
        <span class="mv"><button type="button" data-mv="-1" aria-label="Feljebb"${i ? '' : ' disabled'}>↑</button><button type="button" data-mv="1" aria-label="Lejjebb"${i < ord.length - 1 ? '' : ' disabled'}>↓</button></span>
        <label class="sw"><input type="checkbox" data-vis${hid.has(g) ? '' : ' checked'}${g === 'arajanlat' ? ' disabled' : ''}>Látható</label>
        ${lySel('bg.' + g, bgs, (LY.bg || {})[g])}</li>`;
    }).join('');
  }

  function lyPreview() {
    lyDirty = true;
    clearTimeout(lyTimer);
    lyTimer = setTimeout(() => {
      const f = $('#lyFrame');
      if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'planervo-layout', layout: JSON.parse(JSON.stringify(LY)) }, location.origin);
    }, 120);
  }

  function lyBuild() {
    const card = (key, c) => {
      const p = k => `cards.${key}.${k}`, v = k => lyGet(p(k));
      return `<details class="card lycard"><summary><b>${esc(c.label)}</b></summary><div class="lygrid">
        ${lyField('Elrendezés', lySel(p('mode'), c.modes.map(m => m), v('mode') || c.mode), 'Lefelé folytatódó rács, vagy oldalra lapozható sáv nyilakkal.')}
        ${lyField('Kártyák egy sorban', lySel(p('cols'), CARD_COLS, v('cols')), 'Asztali gépen. Táblagépen és telefonon az oldal automatikusan csökkenti.')}
        ${lyField('Kártyák közti távolság', lySel(p('gap'), CARD_GAPS, v('gap')))}
        ${lyField('Sarkok', lySel(p('radius'), CARD_RADII, v('radius')))}
        ${c.ratios ? lyField('Képarány', lySel(p('ratio'), c.ratios, v('ratio'))) : ''}
        ${c.text ? `<label class="lyf chk"><input type="checkbox" data-p="${p('text')}" data-neg${v('text') === 'off' ? '' : ' checked'}><span>Szöveg (dátum, cím) a képek alatt</span></label>` : ''}
      </div></details>`;
    };
    const b = LY.banner || {}, m = LY.meta || {};
    $('#lyForm').innerHTML = `
      <fieldset class="card"><legend>Szakaszok sorrendje, láthatósága és háttere</legend>
        <p class="muted">A nyilakkal mozgathatod a szakaszokat a főoldalon. Az Árajánlatkérő mindig látható marad, mert a menü gombja oda vezet. A főoldal tetejét (a festőhengeres részt) nem lehet áthelyezni.</p>
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
        ${lyField('Szöveg', `<input type="text" data-p="banner.text" maxlength="200" value="${esc(b.text)}" placeholder="pl. Karácsonykor december 23-tól január 2-ig szünetelünk.">`)}
        ${lyField('Link szövege (opcionális)', `<input type="text" data-p="banner.link_text" maxlength="40" value="${esc(b.link_text)}" placeholder="pl. Részletek">`)}
        ${lyField('Link címe (opcionális)', `<input type="text" data-p="banner.url" maxlength="300" value="${esc(b.url)}" placeholder="#arajanlat vagy https://…">`)}</div></fieldset>
      <fieldset class="card"><legend>Keresők és megosztás</legend>
        <p class="muted">Ez látszik a böngésző fülén és a Google találatokban. Üresen az eredeti marad.</p><div class="lygrid one">
        ${lyField('Az oldal címe', `<input type="text" data-p="meta.title" maxlength="70" value="${esc(m.title)}" placeholder="PLANERVO – Szobafestés, hőszigetelés, felújítás">`, 'Legfeljebb kb. 60 karakter.')}
        ${lyField('Rövid leírás', `<textarea data-p="meta.desc" rows="3" maxlength="170" placeholder="Egy-két mondat arról, mit csináltok és hol.">${esc(m.desc)}</textarea>`, 'Legfeljebb kb. 160 karakter.')}</div>
        <div class="vs-act"><button type="button" class="btn o" id="lySitemap">Sitemap letöltése</button><span class="vs-msg" id="lySmMsg" role="status">A sitemap.xml a keresőknek mutatja az oldal lapjait. Töltsd fel a főoldal mellé, és add meg a Google Search Console-ban.</span></div></fieldset>`;
    lyOrderList();
  }

  async function showLayout() {
    CUR = 'layout';
    view.innerHTML = `<header class="vh"><div><h1>Megjelenés és elrendezés</h1><p class="help">Itt állítod be, hogyan nézzen ki a főoldal: milyen sorrendben jönnek a szakaszok, a kártyák lefelé vagy oldalra lapozva jelennek-e meg, mekkorák legyenek, milyen színűek. A jobb oldali előnézet mentés előtt is mutatja a változást.</p></div>
      <div class="vh-act"><button type="button" class="btn o" id="lyReset">Alapértelmezés</button><button type="button" class="btn" id="lySave">Mentés</button></div></header>
      <div class="ly"><form id="lyForm" class="ly-form" novalidate><p class="muted">Betöltés…</p></form>
        <aside class="ly-prev"><div class="ly-bar" role="group" aria-label="Előnézet mérete">
          <button type="button" class="btn sm o" data-w="100%" aria-pressed="true">Asztali</button><button type="button" class="btn sm o" data-w="768px" aria-pressed="false">Tablet</button><button type="button" class="btn sm o" data-w="390px" aria-pressed="false">Telefon</button>
          <a class="link" href="index.html" target="_blank" rel="noopener">Megnyitás új lapon</a></div>
          <div class="ly-frame"><iframe id="lyFrame" src="index.html" title="A főoldal élő előnézete"></iframe></div></aside></div>`;
    const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
    if (CUR !== 'layout') return;
    if (error) { $('#lyForm').innerHTML = errBox(error); return; }
    LY = JSON.parse(JSON.stringify(getLayout((data && data.value) || {}))); lyDirty = false;
    lyBuild();
    const form = $('#lyForm'), frame = $('#lyFrame');
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
    $$('.ly-bar [data-w]').forEach(b => b.onclick = () => {
      $$('.ly-bar [data-w]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      frame.style.width = b.dataset.w;
    });
    $('#lySitemap').onclick = async () => {
      const msg = (t, err) => { const m = $('#lySmMsg'); m.textContent = t; m.classList.toggle('err', !!err); };
      const { data: st } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
      const base = String((st && st.value && st.value.site_url) || '').trim().replace(/\/+$/, '');
      if (!/^https?:\/\/[^\s/]+\.[^\s/]+/.test(base)) return msg('Előbb add meg az oldal webcímét az „Oldal szövegei” menü „Keresők (SEO)” csoportjában, például https://www.planervo.hu', true);
      const { data: posts } = await sb.from('posts').select('slug,updated_at,published_at').eq('published', true).lte('published_at', new Date().toISOString());
      const day = v => String(v || new Date().toISOString()).slice(0, 10);
      const urls = [[base + '/', todayStr(), 'weekly', '1.0'], [base + '/blog.html', todayStr(), 'weekly', '0.6']];
      (posts || []).forEach(p => urls.push([`${base}/blog.html?p=${encodeURIComponent(p.slug)}`, day(p.updated_at || p.published_at), 'monthly', '0.5']));
      ['adatkezeles.html', 'impresszum.html', 'sutik.html'].forEach(f => urls.push([`${base}/${f}`, todayStr(), 'yearly', '0.2']));
      const x = u => String(u).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(([l, m, f, p]) => `  <url><loc>${x(l)}</loc><lastmod>${m}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join('\n') + '\n</urlset>\n';
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
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'planervo-ready' || CUR !== 'layout') return;
    const f = $('#lyFrame'); if (f && e.source === f.contentWindow) f.contentWindow.postMessage({ type: 'planervo-layout', layout: JSON.parse(JSON.stringify(LY)) }, location.origin);
  });
  addEventListener('beforeunload', e => { if (lyDirty && CUR === 'layout') { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Mentés és visszaállítás ---------- */
  const BACKUP_TABLES = ['services', 'process_steps', 'testimonials', 'sections', 'before_after', 'gallery', 'videos', 'social_posts', 'posts', 'work_items'];
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
      downloadFile(`planervo-mentes-${todayStr()}.json`, JSON.stringify(out, null, 1), 'application/json');
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
        <label class="fl">Változás százalékban<input id="bpPct" type="number" step="0.1" value="5" placeholder="pl. 5 vagy -10"><span class="hint">Pozitív szám emel, negatív csökkent.</span></label>
        <label class="fl">Melyik tételekre<select id="bpCat"><option value="">Minden tételre (${ROWS.length})</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label class="fl">Kerekítés<select id="bpRound"><option value="10">10 Ft-ra</option><option value="50">50 Ft-ra</option><option value="100">100 Ft-ra</option><option value="1">Nincs kerekítés</option></select></label>
        <p class="bp-sum" id="bpSum" role="status"></p></div>
      <footer><button type="button" class="btn o" data-close>Mégse</button><button class="btn" type="submit">Árak módosítása</button></footer></form>`;
    $$('[data-close]', dlgBody).forEach(b => b.onclick = () => dlg.close());
    const calc = () => {
      const pct = parseFloat($('#bpPct').value) || 0, step = +$('#bpRound').value || 1, cat = $('#bpCat').value;
      const sel = ROWS.filter(r => !cat || (r.category || '') === cat);
      const np = v => Math.max(0, Math.round((+v || 0) * (1 + pct / 100) / step) * step);
      const ex = sel.find(r => +r.price > 0);
      $('#bpSum').textContent = sel.length ? `${sel.length} tétel módosul${ex ? `. Például: „${ex.name}”: ${fmtFt(ex.price)} → ${fmtFt(np(ex.price))}` : ''}.` : 'Nincs ilyen tétel.';
      return { pct, sel, np };
    };
    ['#bpPct', '#bpCat', '#bpRound'].forEach(s => $(s).addEventListener('input', calc)); calc();
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
  let qSearch = '';
  function filteredQuotes() {
    const s = qSearch.trim().toLowerCase();
    return QUOTES.filter(q => (qFilter === 'all' || q.status === qFilter) &&
      (!s || [q.name, q.city, q.phone, q.email, q.message].some(x => String(x || '').toLowerCase().includes(s))));
  }
  function exportQuotesCsv() {
    const rows = filteredQuotes();
    if (!rows.length) return toast('Nincs exportálható árajánlat-kérés.', true);
    const cell = v => { v = String(v ?? '').replace(/\r?\n/g, ' ').trim(); return /[;"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const head = ['Beérkezett', 'Állapot', 'Név', 'E-mail', 'Telefon', 'Település', 'Megjegyzés', 'Helyiségek', 'Becsült munkadíj (Ft)', 'Ár-sáv tól (Ft)', 'Ár-sáv ig (Ft)', 'Akció', 'Kívánt időpontok', 'Felmérés időpontja', 'Kért munkák', 'Saját jegyzet'];
    const lines = rows.map(q => [new Date(q.created_at).toLocaleString('hu-HU'), STATUS[q.status] || q.status, q.name, q.email, q.phone, q.city, q.message,
      (q.rooms || []).length, Math.round(+q.estimate || 0), q.estimate_min ? Math.round(+q.estimate_min) : '', q.estimate_max ? Math.round(+q.estimate_max) : '', q.discount ? `${q.discount.label || 'Akció'} −${q.discount.pct}%` : '', (q.preferred_slots || []).map(slotLabel).join(' | '), q.appointment_at ? new Date(q.appointment_at).toLocaleString('hu-HU') : '', (q.rooms || []).map(r => `${r.name}: ${(r.items || []).map(i => i.name).join(', ')}`).join(' | '), q.admin_note]);
    downloadFile(`arajanlat-kerések-${todayStr()}.csv`, '﻿' + [head, ...lines].map(r => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
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
