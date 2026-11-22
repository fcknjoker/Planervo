/* PLANERVO – közös beállítások és segédfüggvények (nyilvános oldalak és admin) */
const PLANERVO_CFG = {
  url: 'https://jodzzaqawursaidefdea.supabase.co',
  key: 'sb_publishable_MRB1lXcabd7ptYkUIGqjRw_PaJ6KMh5',
  mediaBucket: 'media',
  quoteBucket: 'quote-uploads',
  notifyFunction: 'notify-quote',
  youtubeFunction: 'youtube-feed'
};

const sb = window.supabase && window.supabase.createClient
  ? window.supabase.createClient(PLANERVO_CFG.url, PLANERVO_CFG.key)
  : null;

const SITE_URL = 'https://planervo.hu';
const OLD_SAMPLE_PHONE = '+36301234567';

/* Az oldal szerkeszthető szövegei. g = csoport az adminban, k = kulcs, l = megnevezés, d = alapérték, t = mezőtípus */
const TEXT_FIELDS = [
  { g: 'Arculat', k: 'logo_url', l: 'Saját logókép a főoldal tetején (üresen a felépülő PLANERVO-logó látszik)', d: '', t: 'image' },
  { g: 'Főoldal teteje', k: 'hero_title', l: 'Főcím (a festés után jelenik meg)', d: 'Festő Üllőn és környékén' },
  { g: 'Főoldal teteje', k: 'hero_text', l: 'Alcím', d: 'Szobafestő vagyok Üllőn. Festést, glettelést és gépi nemesvakolat szórást vállalok Üllőn és a környező településeken, fix áron. Egyedül dolgozom, minden munkát én végzek.', t: 'textarea' },
  { g: 'Főoldal teteje', k: 'hero_line', l: 'Szolgáltatás-sor a logó alatt (pontokkal elválasztva)', d: 'Szobafestés • Glettelés • Nemesvakolat • Felújítás' },
  { g: 'Főoldal teteje', k: 'hero_btn', l: 'Gomb szövege', d: 'Árajánlatot kérek' },
  { g: 'Főoldal teteje', k: 'hero_hint', l: 'Görgetésre ösztönző felirat', d: 'Görgess, és a henger aranyra festi a falat' },
  { g: 'Szolgáltatások', k: 'services_title', l: 'Cím', d: 'Amit a falaidért teszek' },
  { g: 'Szolgáltatások', k: 'services_text', l: 'Bevezető', d: 'Belül festés és glettelés, kívül gépi nemesvakolat szórás és homlokzatfestés. Alvállalkozót nem hívok: a felméréstől az átadásig én dolgozom nálad.', t: 'textarea' },
  { g: 'Számok sáv', k: 'stat1_n', l: '1. szám', d: '24' },
  { g: 'Számok sáv', k: 'stat1_u', l: '1. mértékegység', d: 'óra' },
  { g: 'Számok sáv', k: 'stat1_t', l: '1. felirat', d: 'alatt jelentkezem' },
  { g: 'Számok sáv', k: 'stat2_n', l: '2. szám', d: '5' },
  { g: 'Számok sáv', k: 'stat2_u', l: '2. mértékegység', d: 'lépés' },
  { g: 'Számok sáv', k: 'stat2_t', l: '2. felirat', d: 'a felméréstől az átadásig' },
  { g: 'Számok sáv', k: 'stat3_n', l: '3. szám', d: '2' },
  { g: 'Számok sáv', k: 'stat3_u', l: '3. mértékegység', d: 'réteg' },
  { g: 'Számok sáv', k: 'stat3_t', l: '3. felirat', d: 'festék minden falon' },
  { g: 'Számok sáv', k: 'stat4_n', l: '4. szám (üresen hagyva a doboz eltűnik)', d: '1' },
  { g: 'Számok sáv', k: 'stat4_u', l: '4. mértékegység', d: 'ember' },
  { g: 'Számok sáv', k: 'stat4_t', l: '4. felirat', d: 'minden munkát én végzek' },
  { g: 'Előtte–utána', k: 'ba_title', l: 'Cím', d: 'Előtte és utána' },
  { g: 'Előtte–utána', k: 'ba_text', l: 'Bevezető', d: 'Húzd el a csúszkát: ilyen volt a fal, mielőtt hozzányúltam, és ilyen lett az átadáskor.', t: 'textarea' },
  { g: 'Galéria', k: 'gallery_title', l: 'Cím', d: 'Galéria' },
  { g: 'Galéria', k: 'gallery_text', l: 'Bevezető', d: 'Válogatás az elkészült munkáimból.', t: 'textarea' },
  { g: 'Galéria', k: 'gallery_mode', l: 'Mit mutasson a főoldal galériája', t: 'select', d: 'images', o: [['images', 'Külön képek'], ['albums', 'Albumok (albumborítókkal)']], hint: 'Albumok módban csak az albumba sorolt képek jelennek meg, albumonként egy borítóval.' },
  { g: 'Videók', k: 'videos_title', l: 'Cím', d: 'Videók' },
  { g: 'Videók', k: 'videos_text', l: 'Bevezető', d: 'Így dolgozom, közelről.', t: 'textarea' },
  { g: 'Videók', k: 'video_source', l: 'Mit mutasson a videós ablak', t: 'select', d: 'channel',
    o: [['channel', 'A YouTube-csatornám legújabb videói (automatikus, legújabb elöl)'], ['playlist', 'Egy lejátszási lista videói (a lista sorrendjében)'], ['manual', 'Csak a „Videók” menüben kézzel felvett videók']] },
  { g: 'Videók', k: 'youtube_playlist', l: 'Lejátszási lista linkje', d: '', ph: 'https://www.youtube.com/playlist?list=…' },
  { g: 'Videók', k: 'video_count', l: 'Hány videó jelenjen meg (3–15)', t: 'number', d: 12 },
  { g: 'Hogyan dolgozom', k: 'process_title', l: 'Cím', d: 'Hogyan dolgozom' },
  { g: 'Hogyan dolgozom', k: 'process_text', l: 'Bevezető', d: 'Öt lépés az első telefontól az átadásig.', t: 'textarea' },
  { g: 'Vélemények', k: 'testimonials_title', l: 'Cím', d: 'Akiknek már dolgoztam' },
  { g: 'Vélemények', k: 'testimonials_text', l: 'Bevezető', d: '', t: 'textarea' },
  { g: 'Vélemények', k: 'testimonials_cta', l: 'Gomb szövege a vélemény-íráshoz (üresen: nincs gomb)', d: 'Írd meg a véleményedet' },
  { g: 'Közösségi média', k: 'social_title', l: 'Cím', d: 'Kövess a közösségi oldalakon' },
  { g: 'Közösségi média', k: 'social_text', l: 'Bevezető', d: 'Friss munkák Instagramon, TikTokon és Facebookon.', t: 'textarea' },
  { g: 'Blog', k: 'blog_title', l: 'Cím', d: 'Blog' },
  { g: 'Blog', k: 'blog_text', l: 'Bevezető', d: 'Tanácsok festéshez, felújításhoz és színválasztáshoz.', t: 'textarea' },
  { g: 'Gyakori kérdések', k: 'faq_title', l: 'Cím', d: 'Gyakori kérdések' },
  { g: 'Gyakori kérdések', k: 'faq_text', l: 'Bevezető', d: 'Amit a legtöbben megkérdeznek, mielőtt elkezdem a munkát.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_title', l: 'Cím', d: 'Árajánlatkérés' },
  { g: 'Árajánlatkérés', k: 'quote_text', l: 'Bevezető', d: 'Add meg a helyiségeket és a munkákat, és ha tudsz, csatolj pár fotót. 24 órán belül jelentkezem.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'show_estimate', l: 'Becsült ár mutatása az ügyfélnek', d: true, t: 'bool' },
  { g: 'Árajánlatkérés', k: 'quote_disclaimer', l: 'Megjegyzés a becslés alatt', d: 'A becslés csak a munkadíjat mutatja, az anyag ára nincs benne. Az anyagot kérésre beszerzem, de csak előre fizetéssel. A végleges árat a helyszíni felmérés után mondom meg.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_range_pct', l: 'Ár-sáv szélessége (± százalék)', t: 'number', d: 12, hint: 'A becslés „kb. 118 000 – 142 000 Ft” formában jelenik meg. 0 esetén pontos összeg látszik.' },
  { g: 'Árajánlatkérés', k: 'slots_on', l: 'Kívánt felmérési időpont kérése az űrlapon', t: 'bool', d: true },
  { g: 'Árajánlatkérés', k: 'promo_on', l: 'Akció / kedvezmény bekapcsolva', t: 'bool', d: false },
  { g: 'Árajánlatkérés', k: 'promo_label', l: 'Az akció neve', d: 'Téli akció', ph: 'pl. Téli akció' },
  { g: 'Árajánlatkérés', k: 'promo_pct', l: 'Kedvezmény (százalék)', t: 'number', d: 10, hint: 'A becsült munkadíjból automatikusan levonódik, és az árajánlat-kérésben is látszik.' },
  { g: 'Árajánlatkérés', k: 'promo_until', l: 'Az akció vége (ÉÉÉÉ-HH-NN)', d: '', ph: '2026-12-31', hint: 'Üresen hagyva nincs határidő. A megadott nap végéig érvényes.' },
  { g: 'Árajánlatkérés', k: 'privacy_text', l: 'Adatkezelési hozzájárulás szövege', d: 'Hozzájárulok, hogy a megadott adataimat az árajánlat elkészítéséhez kezelje.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_success', l: 'Köszönő üzenet beküldés után', d: 'Megkaptam az árajánlat-kérésedet. 24 órán belül jelentkezem telefonon vagy e-mailben.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'contact_title', l: 'Cím', d: 'Kapcsolat' },
  { g: 'Kapcsolat', k: 'contact_text', l: 'Bevezető', d: 'Hívj, írj, vagy kérj árajánlatot az űrlapon. Ha épp festek és nem tudom felvenni, visszahívlak.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'phone', l: 'Telefonszám', d: '+36 20 419 4746' },
  { g: 'Kapcsolat', k: 'email', l: 'E-mail-cím', d: 'planervo@gmail.com' },
  { g: 'Kapcsolat', k: 'area', l: 'Munkaterület', d: 'Üllő és környéke: Vecsés, Gyömrő, Monor, Monorierdő, Maglód, Gyál, Kistarcsa, Budapest' },
  { g: 'Kapcsolat', k: 'hours', l: 'Elérhetőség ideje', d: 'Hétfőtől szombatig, 8:00–18:00' },
  { g: 'Kapcsolat', k: 'facebook_url', l: 'Facebook-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'instagram_url', l: 'Instagram-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'youtube_url', l: 'YouTube-csatorna linkje (ebből jönnek a videók is)', d: '', ph: 'https://www.youtube.com/@csatornam' },
  { g: 'Kapcsolat', k: 'areas_title', l: 'Munkaterület blokk címe', d: 'Festő Üllőn és környékén' },
  { g: 'Kapcsolat', k: 'areas_text', l: 'Munkaterület blokk szövege', d: 'Üllőn lakom, innen járok ki a környező településekre és Budapest keleti, déli kerületeibe.', t: 'textarea' },
  { g: 'Lábléc', k: 'footer_text', l: 'Cégadatok a láblécben', d: 'PLANERVO – festő Üllőn és környékén', t: 'textarea' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_name', l: 'Vállalkozó vagy cég neve', d: '', ph: 'pl. Minta Péter egyéni vállalkozó' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_seat', l: 'Székhely', d: '', ph: 'irányítószám, település, utca, házszám' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_tax', l: 'Adószám', d: '' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_reg', l: 'Nyilvántartási szám (egyéni vállalkozói vagy cégjegyzékszám)', d: '' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_email', l: 'E-mail-cím adatkezelési kérdésekre', d: '', hint: 'Üresen a fenti kapcsolati e-mail-cím jelenik meg.' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_hosting', l: 'Tárhelyszolgáltató neve és címe', d: '', ph: 'ahová az oldal fel van töltve' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_updated', l: 'Az adatkezelési tájékoztató hatálya', d: '', ph: 'pl. 2026. december 1.' },
  { g: 'Keresők (SEO)', k: 'site_url', l: 'Az oldal webcíme', d: SITE_URL, ph: SITE_URL, hint: 'A sitemap.xml és a keresőknek szánt adatok használják. Pontosan így add meg, www nélkül, mert az oldalak canonical címe is ez.' },
  { g: 'Süti-tájékoztató', k: 'cookie_text', l: 'A tájékoztató sáv szövege', d: 'Az oldal nem használ követő vagy hirdetési sütiket, csak a működéshez szükséges tárolást.', t: 'textarea' },
  { g: 'Süti-tájékoztató', k: 'cookie_btn', l: 'A gomb szövege', d: 'Rendben' }
];
const TEXT_DEFAULTS = Object.fromEntries(TEXT_FIELDS.map(f => [f.k, f.d]));
const siteBase = TX => String((TX && TX.site_url) || SITE_URL).trim().replace(/\/+$/, '');
const hasCustomLogo = TX => !!TX.logo_url && TX.logo_url !== 'logo.png';
const isOn = v => v === true || v === 'true';

const DEFAULT_SERVICES = [
  { title: 'Szobafestés', body: 'Lakások és családi házak festése két rétegben, glettelés és alapozás után. A padlót és a bent maradt bútort letakarom, a végén kitakarítok.' },
  { title: 'Glettelés, falfelújítás', body: 'Mállott, repedezett, sokszor átfestett falak kaparása, javítása és glettelése, hogy a festés évekig szép maradjon.' },
  { title: 'Gépi nemesvakolat szórás', body: 'Homlokzatok vékonyvakolata géppel szórva, egyenletes szemcsével. Régi és új házakon is, homlokzatfestéssel együtt is.', link: 'homlokzat-nemesvakolat.html' }
];

const DEFAULT_STEPS = [
  { title: 'Felmérés', body: 'Kimegyek, megnézem a helyiségeket, és megbeszéljük a színeket, az anyagot és a kezdés napját.' },
  { title: 'Ajánlat', body: 'Helyiségenként és munkánként bontott, fix árú ajánlatot küldök. Ami benne van, azt fizeted.' },
  { title: 'Előkészítés', body: 'A bútorokat kérlek, előre pakold el vagy told a szoba közepére, mert mozgatást nem vállalok. Letakarom a padlót és ami bent marad, kijavítom a hibákat, glettelek, alapozok.' },
  { title: 'Festés', body: 'Két rétegben festek, tiszta szélekkel, a megbeszélt napokon.' },
  { title: 'Átadás', body: 'Kitakarítok, együtt átnézzük a falakat, és ha valami nem tetszik, kijavítom.' }
];

const DEFAULT_FAQ = [
  { question: 'Hol vállalsz munkát?', answer: 'Üllőn lakom, és a környéken dolgozom: Vecsés, Gyömrő, Monor, Monorierdő, Maglód, Gyál, Kistarcsa, valamint Budapest keleti és déli kerületei. Ha a településed nincs a listában, hívj fel, és megmondom, ki tudok-e menni.' },
  { question: 'Mennyibe kerül a felmérés?', answer: 'A felmérés ingyenes. Kimegyek, megnézem a falakat, és utána írásban küldöm el a fix árat.' },
  { question: 'Ki veszi meg a festéket és a többi anyagot?', answer: 'Ha kéred, én szerzem be az anyagot, de csak előre fizetéssel: az anyag árát a munka előtt kérem. Ha inkább te vásárolnál, megírom, miből mennyi kell.' },
  { question: 'El kell pakolnom a bútorokat?', answer: 'Igen. Egyedül dolgozom, ezért bútormozgatást nem vállalok. Kérlek, a munka előtt pakold ki a helyiséget, vagy told a bútorokat a szoba közepére. Amit bent hagysz, azt fóliával letakarom.' },
  { question: 'Egyedül dolgozol?', answer: 'Igen. A felmérést, a festést és az átadást is én csinálom, így mindig velem egyeztetsz, és tudod, ki dolgozik a lakásodban.' },
  { question: 'Mi az a gépi nemesvakolat szórás?', answer: 'A homlokzat vékony, színezett záróvakolata, amelyet géppel szórok fel. Egyenletesebb lesz a szemcse és a szín, mint kézi felhordásnál, és nagy felületen is gyorsabban halad a munka.' },
  { question: 'Mennyi ideig tart egy szoba festése?', answer: 'Egy jó állapotú szoba festése általában 1–2 munkanap. Ha kaparni vagy glettelni is kell, a száradás miatt több. A pontos időt a felmérés után megírom.' },
  { question: 'Lakott lakásban is festesz?', answer: 'Igen. Helyiségenként haladok, a padlót és a bent maradt bútort letakarom, és minden nap után összetakarítok.' },
  { question: 'Hogyan kérhetek árajánlatot?', answer: 'Az oldal árajánlatkérőjében helyiségenként megadod, mit szeretnél, vagy egyszerűen felhívsz. 24 órán belül jelentkezem.' }
];

/* Aloldalak: a helyi keresőoldalakat az eszkozok/oldalak.mjs készíti; mindegyik szövege az admin „Aloldalak szövegei” menüjében írható át */
const LOCAL_PAGES = [
  ['festo-ullo', 'Festő Üllőn'], ['homlokzat-nemesvakolat', 'Nemesvakolat és homlokzatfestés'], ['festo-vecses', 'Festő Vecsésen'],
  ['festo-gyomro', 'Festő Gyömrőn'], ['festo-monor', 'Festő Monoron'], ['festo-monorierdo', 'Festő Monorierdőn'], ['festo-maglod', 'Festő Maglódon'],
  ['festo-gyal', 'Festő Gyálon'], ['festo-kistarcsa', 'Festő Kistarcsán'], ['festo-budapest', 'Festő Budapesten']
];
const SUBPAGES = [...LOCAL_PAGES, ['blog', 'Blog oldal'], ['velemeny', 'Vélemény írása'], ['adatkezeles', 'Adatkezelési tájékoztató'], ['impresszum', 'Impresszum'], ['sutik', 'Sütik']];
const SEO_PAGES = LOCAL_PAGES.map(([k]) => k + '.html');
/* Aloldalak ki-/bekapcsolása (admin → Aloldalak ki/be; a settings.texts.subpages_off listában a kikapcsolt kulcsok) */
const subpagesOff = TX => Array.isArray(TX && TX.subpages_off) ? TX.subpages_off : [];
function applySubpageToggles(TX) {
  const off = subpagesOff(TX).filter(k => SUBPAGES.some(p => p[0] === k));
  if (!off.length || document.getElementById('app')) return;
  const keyOf = h => { const m = String(h || '').split(/[?#]/)[0].match(/(?:^|\/)([\w-]+)\.html$/); return m ? m[1] : ''; };
  const hide = root => (root.querySelectorAll ? root : document).querySelectorAll('a[href]').forEach(a => {
    if (!off.includes(keyOf(a.getAttribute('href')))) return;
    const li = a.closest('li');
    (li && li.children.length === 1 ? li : a).style.display = 'none';
  });
  hide(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) hide(n); }))).observe(document.body, { childList: true, subtree: true });
  const cur = keyOf(location.pathname);
  if (off.includes(cur)) {
    setMeta('name', 'robots', 'noindex, nofollow');
    document.title = 'Az oldal nem érhető el | PLANERVO';
    const main = document.getElementById('main') || document.querySelector('main');
    if (main) main.innerHTML = '<div class="wrap page-top page-body"><h1>Ez az oldal jelenleg nem érhető el.</h1><p class="empty">Nézz vissza később, vagy kérj árajánlatot a főoldalon.</p><div class="btns"><a class="btn gold" href="./">Vissza a főoldalra</a></div></div>';
  }
}

/* Mértékegységek. „surface”: az ügyfél választ falat, mennyezetet vagy mindkettőt; „sqm”, „meter”, „piece”: az ügyfél adja meg a mennyiséget */
const UNITS = {
  surface: 'm² fal és/vagy mennyezet (az ügyfél választja)',
  wall: 'm² falfelület (csak fal)',
  ceiling: 'm² mennyezet (csak mennyezet)',
  wallceil: 'm² fal + mennyezet együtt',
  floor: 'm² alapterület (pl. padló takarása)',
  sqm: 'm² (az ügyfél adja meg a mennyiséget)',
  meter: 'folyóméter (az ügyfél adja meg)',
  piece: 'darab (az ügyfél adja meg)',
  room: 'helyiségenként (átalány)'
};
const UNIT_SHORT = { surface: 'm²', wall: 'm² fal', ceiling: 'm² menny.', wallceil: 'm²', floor: 'm²', sqm: 'm²', meter: 'fm', piece: 'db', room: 'helyiség' };
const QTY_UNITS = ['sqm', 'meter', 'piece'];
const SURFACES = [['wall', 'Fal'], ['ceiling', 'Mennyezet'], ['both', 'Mindkettő']];

const PLACEMENTS = [
  ['after_hero', 'A főoldal teteje után'],
  ['after_services', 'A szolgáltatások után'],
  ['after_ba', 'Az előtte–utána rész után'],
  ['after_gallery', 'A galéria után'],
  ['after_videos', 'A videók után'],
  ['after_blog', 'A blog után'],
  ['before_contact', 'A kapcsolat előtt']
];

const SOCIAL_LABEL = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' };

/* ---------- Elrendezés (admin → Megjelenés; a settings.texts.layout alatt) ---------- */
const LAYOUT_GROUPS = [
  ['szolgaltatasok', 'Szolgáltatások'],
  ['szamok', 'Számok sáv'],
  ['folyamat', 'Hogyan dolgozom'],
  ['munkaink', 'Munkáim (előtte–utána)'],
  ['galeria', 'Galéria'],
  ['velemenyek', 'Vélemények'],
  ['kozossegi', 'Közösségi média'],
  ['videok', 'Videók'],
  ['blog', 'Blog'],
  ['gyik', 'Gyakori kérdések'],
  ['arajanlat', 'Árajánlatkérő'],
  ['kapcsolat', 'Kapcsolat']
];
/* a mentett sorrend kiegészítése a később bevezetett szakaszokkal (az alapsorrend szerinti elődjük után) */
function fullOrder(saved) {
  const base = LAYOUT_GROUPS.map(x => x[0]), out = (saved || []).filter(x => base.includes(x));
  base.forEach((g, i) => {
    if (out.includes(g)) return;
    const prev = base.slice(0, i).reverse().find(x => out.includes(x));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, g);
  });
  return out;
}
const LAYOUT_BGS = [['', 'Alapértelmezett'], ['light', 'Fehér'], ['soft', 'Halvány homok'], ['peach', 'Barack'], ['dark', 'Sötét'], ['gold', 'Arany']];
const LAYOUT_BG_ALLOWED = { arajanlat: ['', 'light', 'soft', 'peach'] };
const CARD_COLS = [['', 'Automatikus'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']];
const CARD_ROWS = [['', 'Mind látszik'], ['1', '1 sor'], ['2', '2 sor'], ['3', '3 sor'], ['4', '4 sor'], ['5', '5 sor'], ['6', '6 sor']];
const CARD_GAPS = [['', 'Alap'], ['s', 'Kicsi'], ['m', 'Közepes'], ['l', 'Nagy']];
const CARD_GAP_PX = { s: 10, m: 18, l: 30 };
const CARD_RADII = [['', 'Alap'], ['0', 'Éles sarok'], ['12', 'Enyhén kerek'], ['22', 'Kerek'], ['34', 'Nagyon kerek']];
const MODE_GRID = ['grid', 'Rács: a kártyák lefelé is folytatódnak'];
const MODE_CAR = ['carousel', 'Oldalra lapozható sáv'];
/* mode = alapértelmezett mód, cols = alapértelmezett oszlopszám, phone = kártyák egy sorban telefonon (rácsnál), ratios = választható képarány */
const CARD_SECTIONS = {
  szolgaltatasok: { label: 'Szolgáltatások', section: 'szolgaltatasok', track: 'svcList', mode: 'grid', modes: [MODE_GRID, MODE_CAR], cols: 4, phone: 1 },
  'elotte-utana': { label: 'Előtte–utána', section: 'elotte-utana', track: 'baList', mode: 'grid', modes: [MODE_GRID, MODE_CAR], cols: 2, phone: 1,
    ratios: [['', 'Alap (16:9, telefonon álló 4:5)'], ['16/9', '16:9 mindenhol'], ['4/3', '4:3'], ['1/1', 'Négyzet'], ['3/4', 'Álló 3:4']] },
  galeria: { label: 'Galéria', section: 'galeria', track: 'galList', mode: 'masonry', cols: 3, phone: 2,
    modes: [['masonry', 'Falazott: a képek eredeti arányban'], ['grid', 'Egyenletes rács'], MODE_CAR],
    ratios: [['', '4:3 (alap, rácsnál)'], ['1/1', 'Négyzet'], ['3/4', 'Álló 3:4'], ['16/9', '16:9 széles']] },
  velemenyek: { label: 'Vélemények', section: 'velemenyek', track: 'tstTrack', mode: 'carousel', modes: [MODE_CAR, MODE_GRID], cols: 3, phone: 1 },
  kozossegi: { label: 'Közösségi média', section: 'kozossegi', track: 'spTrack', mode: 'carousel', modes: [MODE_CAR, MODE_GRID], cols: 4, phone: 2, text: true,
    ratios: [['', '4:5 álló (alap)'], ['1/1', 'Négyzet'], ['16/9', '16:9 fekvő']] },
  videok: { label: 'Videók', section: 'videok', track: 'vidList', mode: 'carousel', modes: [MODE_CAR, MODE_GRID], cols: 3, phone: 1, text: true },
  blog: { label: 'Blog (főoldali előnézet)', section: 'blog', track: 'postList', mode: 'grid', modes: [MODE_GRID, MODE_CAR], cols: 3, phone: 1,
    ratios: [['', '3:2 (alap)'], ['1/1', 'Négyzet'], ['16/9', '16:9 széles'], ['4/5', 'Álló 4:5']] }
};
const LAYOUT_WIDTHS = [['', 'Normál'], ['narrow', 'Keskeny'], ['wide', 'Széles']];
const LAYOUT_SPACINGS = [['', 'Normál'], ['compact', 'Kompakt'], ['airy', 'Levegős']];
const LAYOUT_BANNER_TONES = [['gold', 'Arany'], ['dark', 'Sötét'], ['peach', 'Barack']];
const FX_SPACES = [['', 'Alap térköz'], ['compact', 'Szűk'], ['airy', 'Tágas']];
const FX_WIDTHS = [['', 'Alap szélesség'], ['narrow', 'Keskeny'], ['wide', 'Széles']];
const FX_ANIMS = [['', 'Nincs animáció'], ['fade', 'Áttűnés'], ['up', 'Alulról felfelé'], ['zoom', 'Nagyítva előjön'], ['slide', 'Oldalról érkezik']];
const WIDTH_PX = { narrow: '1080px', wide: '1560px' };
const SPACING_K = { compact: '.6', airy: '1.4' };
const getLayout = tx => (tx && tx.layout && typeof tx.layout === 'object') ? tx.layout : {};

/* ---------- Formázás ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtInt = n => Math.round(+n || 0).toLocaleString('hu-HU');
const fmtFt = n => fmtInt(n) + ' Ft';
const fmtNum = n => (Math.round((+n || 0) * 10) / 10).toLocaleString('hu-HU');
const fmtDate = d => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const telHref = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
const dayStr = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function ytId(u) {
  if (!u) return '';
  const m = String(u).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : '');
}

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

/* ---------- Árszámítás: a helyiség falfelülete négyzetes alaprajzzal becsülve ---------- */
/* o (nem kötelező): { w: szélesség, l: hosszúság, wall: kézzel megadott falkerület }.
   Falkerület: kézi érték, ha van; különben 2·(szélesség+hosszúság)·belmagasság; régi, csak alapterületes kérésnél négyzetes becslés. */
function roomGeometry(area, height, o) {
  const a = +area || 0, h = +height || 0, w = +(o && o.w) || 0, l = +(o && o.l) || 0, ov = +(o && o.wall) || 0;
  let wall = 0;
  if (ov > 0) wall = Math.round(ov * 10) / 10;
  else if (w > 0 && l > 0 && h > 0) wall = Math.round(2 * (w + l) * h * 10) / 10;
  else if (a > 0 && h > 0) wall = Math.round(4 * Math.sqrt(a) * h * 10) / 10;
  return { floor: a, wall, ceiling: a };
}
function unitQty(unit, g, qty) {
  switch (unit) {
    case 'floor': return g.floor;
    case 'wall': return g.wall;
    case 'ceiling': return g.ceiling;
    case 'wallceil': return Math.round((g.wall + g.ceiling) * 10) / 10;
    case 'piece': return Math.max(0, Math.round(+qty || 0));
    case 'sqm': case 'meter': return Math.max(0, Math.round((+qty || 0) * 10) / 10);
    case 'room': return 1;
    default: return 0;
  }
}
const ceilingPrice = w => w.price_ceiling != null && w.price_ceiling !== '' ? +w.price_ceiling : null;
/* egy kiválasztott munka sorai; a „fal és/vagy mennyezet” két sort ad, mert a mennyezetnek külön díja lehet */
function workLines(w, g, sel) {
  const price = +w.price || 0, pc = ceilingPrice(w) ?? price;
  const line = (name, unit, p, qty) => ({ id: w.id, name, unit, price: p, qty, amount: Math.round(qty * p) });
  if (w.unit === 'surface') {
    const s = (sel && sel.surf) || 'both', out = [];
    if (s !== 'ceiling') out.push(line(`${w.name} – fal`, 'wall', price, g.wall));
    if (s !== 'wall') out.push(line(`${w.name} – mennyezet`, 'ceiling', pc, g.ceiling));
    return out;
  }
  return [line(w.name, w.unit, w.unit === 'ceiling' ? pc : price, unitQty(w.unit, g, sel && sel.qty))];
}

/* ---------- Beágyazás és biztonságos HTML (blog, saját ablakok) ---------- */
const EMBED_RE = /^https:\/\/(www\.|m\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/|^https:\/\/www\.facebook\.com\/plugins\/(video|post)\.php\?|^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/embed\/?$|^https:\/\/www\.tiktok\.com\/embed\/(v2\/)?\d+/;

function toEmbedUrl(u) {
  u = String(u || '').trim();
  if (!u || EMBED_RE.test(u)) return u;
  let m;
  if ((m = u.match(/instagram\.com\/(p|reel)\/([\w-]+)/))) return `https://www.instagram.com/${m[1]}/${m[2]}/embed`;
  if ((m = u.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/(?:v2\/)?|v\/)?(\d{10,})/))) return `https://www.tiktok.com/embed/v2/${m[1]}`;
  if (/facebook\.com|fb\.watch/.test(u)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false`;
  if ((m = u.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|\/(?:embed|shorts|live)\/([\w-]{11})/))) return `https://www.youtube-nocookie.com/embed/${m[1] || m[2] || m[3]}`;
  return u;
}

if (window.DOMPurify) {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe' && !EMBED_RE.test(node.getAttribute('src') || '')) node.remove();
  });
}
function sanitize(html) {
  if (!html) return '';
  return window.DOMPurify
    ? DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'target', 'allow', 'scrolling', 'referrerpolicy', 'loading'] })
    : esc(html);
}

/* ---------- Szövegek betöltése és alkalmazása ---------- */
async function loadTexts() {
  if (!sb) return { ...TEXT_DEFAULTS };
  const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
  if (error) throw error;
  const v = (data && data.value) || {}, out = { ...TEXT_DEFAULTS };
  Object.keys(v).forEach(k => { if (v[k] !== null && v[k] !== undefined) out[k] = v[k]; });
  applySubpageToggles(out);
  return out;
}
async function loadTextsSafe() {
  try { return await loadTexts(); } catch (e) { return { ...TEXT_DEFAULTS }; }
}
/* a [data-t] elemek kitöltése; üres szövegnél a bekezdés eltűnik */
function applyDataTexts(TX, root = document) {
  root.querySelectorAll('[data-t]').forEach(el => {
    const v = TX[el.dataset.t] == null ? '' : String(TX[el.dataset.t]);
    el.textContent = v;
    if (el.tagName === 'P') el.hidden = !v;
  });
}
function setMeta(attr, key, val) {
  if (!val) return;
  let m = document.querySelector(`meta[${attr}="${key}"]`);
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.content = val;
}
/* az admin „Aloldalak szövegei” menüjében mentett szöveg alkalmazása ([data-edit] elemek, cím, leírás) */
function applyPageTexts(key, TX) {
  const pg = ((TX && TX.pages) || {})[key];
  if (!pg) return {};
  if (pg.title) { document.title = pg.title; setMeta('property', 'og:title', pg.title); }
  if (pg.desc) { setMeta('name', 'description', pg.desc); setMeta('property', 'og:description', pg.desc); }
  document.querySelectorAll('[data-edit]').forEach(el => {
    const v = pg[el.dataset.edit];
    if (v == null || v === '') return;
    if (el.hasAttribute('data-rich')) el.innerHTML = sanitize(v); else el.textContent = v;
  });
  return pg;
}

/* Kép kicsinyítése feltöltés előtt (JPEG); amit a böngésző nem tud megnyitni (pl. HEIC), az eredetiben megy fel */
async function shrinkImage(file, max = 2000) {
  const ext = ((file.name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const original = { blob: file, ext, type: file.type || 'image/jpeg' };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return original;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (s === 1 && file.size < 1.5e6) return original;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    const ctx = c.getContext('2d');
    if (file.type === 'image/png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return blob ? { blob, ext: 'jpg', type: 'image/jpeg' } : original;
  } catch (e) { return original; }
}

/* Telefonos lenyíló menü */
(function initMenu() {
  const btn = document.getElementById('menuBtn'), nav = document.getElementById('topnav');
  if (!btn || !nav) return;
  const set = open => {
    nav.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
  };
  btn.addEventListener('click', () => set(!nav.classList.contains('menu-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('menu-open')) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (nav.classList.contains('menu-open') && !nav.contains(e.target)) set(false); });
  addEventListener('resize', () => { if (innerWidth > 1000) set(false); });
})();

/* ---------- Lebegő kapcsolat-kártya (főoldal, jobb oldal) ---------- */
const FLOAT_TYPES = {
  facebook: { l: 'Facebook', d: '<path d="M14.5 3.5h-2A3.5 3.5 0 0 0 9 7v2.5H6.5V13H9v7.5h3.5V13h2.3l.5-3.5h-2.8V7.2c0-.5.3-.7.8-.7h1.7z"/>' },
  instagram: { l: 'Instagram', d: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>' },
  youtube: { l: 'YouTube', d: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>' },
  tiktok: { l: 'TikTok', d: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 1.9 3.9 4.5 4.2"/>' },
  whatsapp: { l: 'WhatsApp', d: '<path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19z"/><path d="M9 9.5c.3 2.2 2.3 4.4 5.5 5l1-1.3-1.8-1-.8.7c-.8-.3-1.6-1-2-1.8l.7-.8-1-1.8z"/>' },
  messenger: { l: 'Messenger', d: '<path d="M12 3a9 9 0 0 0-9 8.8c0 2.4 1 4.6 2.7 6.1V21l2.6-1.4c.9.3 1.8.4 2.7.4a9 9 0 0 0 0-18z"/><path d="M7.5 13.5l3-3.2 2 2 3-2"/>' },
  email: { l: 'E-mail', d: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M4 8l8 5.5L20 8"/>' },
  link: { l: 'Weboldal', d: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>' }
};
const floatIcon = t => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(FLOAT_TYPES[t] || FLOAT_TYPES.link).d}</svg>`;
const PHONE_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h3.5l1.7 4.3-2.1 1.4a11 11 0 0 0 5.2 5.2l1.4-2.1L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';

/* Böngészőbe kerülő cím: csak https/http, e-mail és (WhatsApp) telefonszám engedett; minden más üres */
function floatHref(l) {
  const u = String((l && l.u) || '').trim();
  if (!u) return '';
  if (l.t === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return 'mailto:' + u;
  if (l.t === 'whatsapp' && /^\+?[\d\s()-]{7,}$/.test(u)) return 'https://wa.me/' + u.replace(/\D/g, '');
  return /^(https?:\/\/|mailto:)/i.test(u) ? u : '';
}

/* Alapértelmezés: ha még nem állítottad be, a „Kapcsolat” szövegek közösségi linkjei kerülnek rá */
function getFloat(tx) {
  const f = (tx && tx.float && typeof tx.float === 'object') ? tx.float : {};
  const links = Array.isArray(f.links) ? f.links : [['facebook', 'facebook_url'], ['instagram', 'instagram_url'], ['youtube', 'youtube_url']]
    .filter(([, k]) => tx && tx[k]).map(([t, k]) => ({ t, u: tx[k] }));
  return { on: f.on !== false, phone: f.phone !== false, links: links.filter(l => l && FLOAT_TYPES[l.t]) };
}
