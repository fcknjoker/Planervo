/* =====================================================================
   PLANERVO – közös beállítások és segédfüggvények
   (a főoldal, a blog és az admin felület is ezt használja)
   ===================================================================== */
const PLANERVO_CFG = {
  url: 'https://jodzzaqawursaidefdea.supabase.co',
  key: 'sb_publishable_MRB1lXcabd7ptYkUIGqjRw_PaJ6KMh5', // nyilvános kulcs, ide tartozik
  mediaBucket: 'media',
  quoteBucket: 'quote-uploads',
  notifyFunction: 'notify-quote',
  youtubeFunction: 'youtube-feed'
};

const sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(PLANERVO_CFG.url, PLANERVO_CFG.key)
  : null;

/* Az oldal szerkeszthető szövegei. g = csoport az adminban, k = kulcs,
   l = megnevezés, d = alapértelmezés, t = mezőtípus */
const TEXT_FIELDS = [
  { g: 'Arculat', k: 'logo_url', l: 'Logó (a főoldal tetején)', d: 'logo.png', t: 'image' },
  { g: 'Főoldal teteje', k: 'hero_title', l: 'Főcím (a festés után jelenik meg)', d: 'Minőség minden rétegben.' },
  { g: 'Főoldal teteje', k: 'hero_text', l: 'Alcím', d: 'Szobafestés, hőszigetelés, felújítás és felületképzés. Fix áron, tisztán, határidőre.', t: 'textarea' },
  { g: 'Főoldal teteje', k: 'hero_btn', l: 'Gomb szövege', d: 'Árajánlatot kérek' },
  { g: 'Főoldal teteje', k: 'hero_hint', l: 'Görgetésre ösztönző felirat', d: 'Görgess, és a henger aranyra festi a falat' },
  { g: 'Szolgáltatások', k: 'services_title', l: 'Cím', d: 'Amit a falaidért teszünk' },
  { g: 'Szolgáltatások', k: 'services_text', l: 'Bevezető', d: '', t: 'textarea' },
  { g: 'Számok sáv', k: 'stat1_n', l: '1. szám', d: '24' },
  { g: 'Számok sáv', k: 'stat1_u', l: '1. mértékegység', d: 'óra' },
  { g: 'Számok sáv', k: 'stat1_t', l: '1. felirat', d: 'alatt jelentkezünk' },
  { g: 'Számok sáv', k: 'stat2_n', l: '2. szám', d: '5' },
  { g: 'Számok sáv', k: 'stat2_u', l: '2. mértékegység', d: 'lépés' },
  { g: 'Számok sáv', k: 'stat2_t', l: '2. felirat', d: 'a felméréstől az átadásig' },
  { g: 'Számok sáv', k: 'stat3_n', l: '3. szám', d: '2' },
  { g: 'Számok sáv', k: 'stat3_u', l: '3. mértékegység', d: 'réteg' },
  { g: 'Számok sáv', k: 'stat3_t', l: '3. felirat', d: 'festék minden falon' },
  { g: 'Számok sáv', k: 'stat4_n', l: '4. szám (üresen hagyva a doboz eltűnik)', d: '4' },
  { g: 'Számok sáv', k: 'stat4_u', l: '4. mértékegység', d: 'szakma' },
  { g: 'Számok sáv', k: 'stat4_t', l: '4. felirat', d: 'egy csapatban' },
  { g: 'Előtte–utána', k: 'ba_title', l: 'Cím', d: 'Előtte és utána' },
  { g: 'Előtte–utána', k: 'ba_text', l: 'Bevezető', d: 'Húzd el a csúszkát, és nézd meg, mit hozunk ki egy falból.', t: 'textarea' },
  { g: 'Galéria', k: 'gallery_title', l: 'Cím', d: 'Galéria' },
  { g: 'Galéria', k: 'gallery_text', l: 'Bevezető', d: 'Válogatás az elkészült munkáinkból.', t: 'textarea' },
  { g: 'Galéria', k: 'gallery_mode', l: 'Mit mutasson a főoldal galériája', t: 'select', d: 'images', o: [['images', 'Külön képek'], ['albums', 'Albumok (albumborítókkal)']], hint: 'Albumok módban csak az albumba sorolt képek jelennek meg, albumonként egy borítóval.' },
  { g: 'Videók', k: 'videos_title', l: 'Cím', d: 'Videóink' },
  { g: 'Videók', k: 'videos_text', l: 'Bevezető', d: 'Nézd meg, hogyan dolgozunk.', t: 'textarea' },
  { g: 'Videók', k: 'video_source', l: 'Mit mutasson a videós ablak', t: 'select', d: 'channel',
    o: [['channel', 'A YouTube-csatornám legújabb videói (automatikus, legújabb elöl)'], ['playlist', 'Egy lejátszási lista videói (a lista sorrendjében)'], ['manual', 'Csak a „YouTube-videók” menüben kézzel felvett videók']] },
  { g: 'Videók', k: 'youtube_playlist', l: 'Lejátszási lista linkje', d: '', ph: 'https://www.youtube.com/playlist?list=…' },
  { g: 'Videók', k: 'video_count', l: 'Hány videó jelenjen meg (3–15)', t: 'number', d: 12 },
  { g: 'Hogyan dolgozunk', k: 'process_title', l: 'Cím', d: 'Hogyan dolgozunk' },
  { g: 'Hogyan dolgozunk', k: 'process_text', l: 'Bevezető', d: 'Öt lépés az első egyeztetéstől az átadásig.', t: 'textarea' },
  { g: 'Vélemények', k: 'testimonials_title', l: 'Cím', d: 'Ügyfeleink mondták' },
  { g: 'Vélemények', k: 'testimonials_text', l: 'Bevezető', d: '', t: 'textarea' },
  { g: 'Vélemények', k: 'testimonials_cta', l: 'Gomb szövege a vélemény-íráshoz (üresen: nincs gomb)', d: 'Írd meg a véleményedet' },
  { g: 'Közösségi média', k: 'social_title', l: 'Cím', d: 'Kövess minket' },
  { g: 'Közösségi média', k: 'social_text', l: 'Bevezető', d: 'Legfrissebb bejegyzéseink Instagramon, TikTokon és Facebookon.', t: 'textarea' },
  { g: 'Blog', k: 'blog_title', l: 'Cím', d: 'Blog' },
  { g: 'Blog', k: 'blog_text', l: 'Bevezető', d: 'Tanácsok festéshez, felújításhoz és színválasztáshoz.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_title', l: 'Cím', d: 'Árajánlatkérés' },
  { g: 'Árajánlatkérés', k: 'quote_text', l: 'Bevezető', d: 'Add hozzá a helyiségeket, válaszd ki a munkákat, és csatolj fotókat. 24 órán belül jelentkezünk.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'show_estimate', l: 'Becsült ár mutatása az ügyfélnek', d: true, t: 'bool' },
  { g: 'Árajánlatkérés', k: 'quote_disclaimer', l: 'Megjegyzés a becslés alatt', d: 'A becslés tájékoztató jellegű munkadíj, az anyagköltséget nem tartalmazza. A végleges árat helyszíni felmérés után adjuk.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_range_pct', l: 'Ár-sáv szélessége (± százalék)', t: 'number', d: 12, hint: 'A becslés „kb. 118 000 – 142 000 Ft” formában jelenik meg. 0 esetén pontos összeg látszik.' },
  { g: 'Árajánlatkérés', k: 'slots_on', l: 'Kívánt felmérési időpont kérése az űrlapon', t: 'bool', d: true },
  { g: 'Árajánlatkérés', k: 'promo_on', l: 'Akció / kedvezmény bekapcsolva', t: 'bool', d: false },
  { g: 'Árajánlatkérés', k: 'promo_label', l: 'Az akció neve', d: 'Téli akció', ph: 'pl. Téli akció' },
  { g: 'Árajánlatkérés', k: 'promo_pct', l: 'Kedvezmény (százalék)', t: 'number', d: 10, hint: 'A becsült munkadíjból automatikusan levonódik, és az árajánlat-kérésben is látszik.' },
  { g: 'Árajánlatkérés', k: 'promo_until', l: 'Az akció vége (ÉÉÉÉ-HH-NN)', d: '', ph: '2026-12-31', hint: 'Üresen hagyva nincs határidő. A megadott nap végéig érvényes.' },
  { g: 'Árajánlatkérés', k: 'privacy_text', l: 'Adatkezelési hozzájárulás szövege', d: 'Hozzájárulok, hogy a megadott adataimat az árajánlat elkészítéséhez kezeljék.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_success', l: 'Köszönő üzenet beküldés után', d: 'Megkaptuk az árajánlat-kérésedet. 24 órán belül jelentkezünk a megadott elérhetőségeiden.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'contact_title', l: 'Cím', d: 'Beszéljünk a falaidról.' },
  { g: 'Kapcsolat', k: 'contact_text', l: 'Bevezető', d: 'Hívj, írj, vagy kérj árajánlatot az űrlapon.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'phone', l: 'Telefonszám', d: '+36 30 123 4567' },
  { g: 'Kapcsolat', k: 'email', l: 'E-mail-cím', d: 'planervo@gmail.com' },
  { g: 'Kapcsolat', k: 'area', l: 'Munkaterület', d: 'Budapest és vonzáskörzete' },
  { g: 'Kapcsolat', k: 'hours', l: 'Elérhetőség ideje', d: 'Hétfőtől szombatig, 8:00–18:00' },
  { g: 'Kapcsolat', k: 'facebook_url', l: 'Facebook-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'instagram_url', l: 'Instagram-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'youtube_url', l: 'YouTube-csatorna linkje (ebből jönnek a videók is)', d: '', ph: 'https://www.youtube.com/@csatornam' },
  { g: 'Lábléc', k: 'footer_text', l: 'Cégadatok a láblécben', d: 'PLANERVO – Minőség minden rétegben', t: 'textarea' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_name', l: 'Vállalkozó vagy cég neve', d: '', ph: 'pl. Minta Péter egyéni vállalkozó' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_seat', l: 'Székhely', d: '', ph: 'irányítószám, település, utca, házszám' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_tax', l: 'Adószám', d: '' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_reg', l: 'Nyilvántartási szám (egyéni vállalkozói vagy cégjegyzékszám)', d: '' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_email', l: 'E-mail-cím adatkezelési kérdésekre', d: '', hint: 'Üresen a fenti kapcsolati e-mail-cím jelenik meg.' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_hosting', l: 'Tárhelyszolgáltató neve és címe', d: '', ph: 'ahová az oldal fel van töltve' },
  { g: 'Jogi adatok (adatkezelés, impresszum)', k: 'legal_updated', l: 'Az adatkezelési tájékoztató hatálya', d: '', ph: 'pl. 2026. december 1.' },
  { g: 'Keresők (SEO)', k: 'site_url', l: 'Az oldal webcíme', d: '', ph: 'https://www.planervo.hu', hint: 'A sitemap.xml és a keresőknek szánt adatok használják. Üresen a keresőmotor-adatok egy része nem jelenik meg.' },
  { g: 'Süti-tájékoztató', k: 'cookie_text', l: 'A tájékoztató sáv szövege', d: 'Az oldal nem használ követő vagy hirdetési sütiket. Csak a működéshez szükséges tárolást használjuk.', t: 'textarea' },
  { g: 'Süti-tájékoztató', k: 'cookie_btn', l: 'A gomb szövege', d: 'Rendben' }
];
const TEXT_DEFAULTS = Object.fromEntries(TEXT_FIELDS.map(f => [f.k, f.d]));

const DEFAULT_SERVICES = [
  { title: 'Szobafestés', body: 'Glettelés, alapozás, kétrétegű festés bútortakarással és takarítással.' },
  { title: 'Hőszigetelés', body: 'Homlokzati szigetelés szakszerűen, a páratechnikai részletekre figyelve.' },
  { title: 'Felújítás', body: 'Komplett lakásfelújítás egy kézből, egyeztetett ütemtervvel.' },
  { title: 'Felületképzés', body: 'Beton-, márvány- és antikolt hatású felületek, akcentfalak.' }
];

/* Mértékegységek. A „surface” tételnél az ügyfél választ: fal, mennyezet vagy mindkettő.
   Az „sqm”, „meter” és „piece” tételnél az ügyfél adja meg a mennyiséget. */
const DEFAULT_STEPS = [
  { title: 'Felmérés', body: 'Megnézzük a helyiségeket, egyeztetünk az elképzelésről, a színekről és a határidőről.' },
  { title: 'Ajánlat', body: 'Helyiségenként, munkánként bontott, fix árú ajánlatot adunk. Ami az ajánlatban van, azt fizeted.' },
  { title: 'Előkészítés', body: 'Letakarjuk a bútorokat és a padlót, kijavítjuk a hibákat, glettelünk és alapozunk.' },
  { title: 'Festés', body: 'Két rétegben, tiszta szélekkel dolgozunk, a megbeszélt napokon.' },
  { title: 'Átadás', body: 'Kitakarítunk, végigmegyünk együtt a munkán, és csak akkor végeztünk, ha elégedett vagy.' }
];

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
const QTY_UNITS = ['sqm', 'meter', 'piece'];            // ezeknél az ügyfél írja be a mennyiséget
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

/* =====================================================================
   Elrendezés (admin → Megjelenés). Az itt felsoroltakat az admin kínálja fel,
   a főoldal (site.js) pedig alkalmazza. A beállítások a settings tábla
   „texts” sorában, a „layout” kulcs alatt vannak.
   ===================================================================== */
const LAYOUT_GROUPS = [
  ['szolgaltatasok', 'Szolgáltatások'],
  ['szamok', 'Számok sáv'],
  ['folyamat', 'Hogyan dolgozunk'],
  ['munkaink', 'Munkáink (előtte–utána és galéria)'],
  ['velemenyek', 'Vélemények'],
  ['kozossegi', 'Közösségi média'],
  ['videok', 'Videók'],
  ['blog', 'Blog'],
  ['arajanlat', 'Árajánlatkérő'],
  ['kapcsolat', 'Kapcsolat']
];
const LAYOUT_BGS = [['', 'Alapértelmezett'], ['light', 'Fehér'], ['soft', 'Halvány homok'], ['peach', 'Barack'], ['dark', 'Sötét'], ['gold', 'Arany']];
const LAYOUT_BG_ALLOWED = { arajanlat: ['', 'light', 'soft', 'peach'] };   // az árajánlatkérő űrlapja világos háttéren olvasható
const CARD_COLS = [['', 'Automatikus'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']];
/* A seo/oldalak.mjs által generált helyi keresőoldalak (az admin sitemap-letöltése is ezeket listázza). Új oldalnál ide is vedd fel. */
const SEO_PAGES = ['festo-budapest.html', 'homlokzatfestes-hoszigeteles.html', 'festo-gyal.html', 'festo-vecses.html', 'festo-ullo.html', 'festo-gyomro.html', 'festo-maglod.html', 'festo-monor.html', 'festo-monorierdo.html', 'festo-kistarcsa.html'];
const CARD_ROWS = [['', 'Mind látszik'], ['1', '1 sor'], ['2', '2 sor'], ['3', '3 sor'], ['4', '4 sor'], ['5', '5 sor'], ['6', '6 sor']];
const CARD_GAPS = [['', 'Alap'], ['s', 'Kicsi'], ['m', 'Közepes'], ['l', 'Nagy']];
const CARD_GAP_PX = { s: 10, m: 18, l: 30 };
const CARD_RADII = [['', 'Alap'], ['0', 'Éles sarok'], ['12', 'Enyhén kerek'], ['22', 'Kerek'], ['34', 'Nagyon kerek']];
const MODE_GRID = ['grid', 'Rács: a kártyák lefelé is folytatódnak'];
const MODE_CAR = ['carousel', 'Oldalra lapozható sáv'];
/* mode = alapértelmezett mód, cols = alapértelmezett oszlopszám lapozható sávban,
   phone = hány kártya fér egy sorba telefonon rácsban; ratios = választható képarány */
const CARD_SECTIONS = {
  szolgaltatasok: { label: 'Szolgáltatások', section: 'szolgaltatasok', track: 'svcList', mode: 'grid', modes: [MODE_GRID, MODE_CAR], cols: 4, phone: 1 },
  'elotte-utana': { label: 'Előtte–utána', section: 'elotte-utana', track: 'baList', mode: 'grid', modes: [MODE_GRID, MODE_CAR], cols: 2, phone: 1,
    ratios: [['', '4:3 (alap)'], ['16/9', '16:9 széles'], ['1/1', 'Négyzet'], ['3/4', 'Álló 3:4']] },
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
/* szakaszonkénti beállítások (layout.fx.<szakasz>.*) */
const FX_SPACES = [['', 'Alap térköz'], ['compact', 'Szűk'], ['airy', 'Tágas']];
const FX_WIDTHS = [['', 'Alap szélesség'], ['narrow', 'Keskeny'], ['wide', 'Széles']];
const FX_ANIMS = [['', 'Nincs animáció'], ['fade', 'Áttűnés'], ['up', 'Alulról felfelé'], ['zoom', 'Nagyítva előjön'], ['slide', 'Oldalról érkezik']];
const getLayout = tx => (tx && tx.layout && typeof tx.layout === 'object') ? tx.layout : {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtFt = n => Math.round(+n || 0).toLocaleString('hu-HU') + ' Ft';
const fmtDate = d => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const fmtNum = n => (Math.round((+n || 0) * 10) / 10).toLocaleString('hu-HU');

function ytId(u) {
  if (!u) return '';
  const m = String(u).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : '');
}

/* Helyiség geometriája: négyzet alaprajzzal becsülve */
function roomGeometry(area, height) {
  const a = +area || 0, h = +height || 0;
  const wall = a > 0 && h > 0 ? Math.round(4 * Math.sqrt(a) * h * 10) / 10 : 0;
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

/* Egy kiválasztott munka sorai az árajánlatban. sel = { qty, surf }.
   A „fal + mennyezet” választás két sort ad, mert a mennyezetnek külön díja lehet. */
function workLines(w, g, sel) {
  const price = +w.price || 0;
  const pc = w.price_ceiling != null && w.price_ceiling !== '' ? +w.price_ceiling : price;
  const line = (name, unit, p, qty) => ({ id: w.id, name, unit, price: p, qty, amount: Math.round(qty * p) });
  if (w.unit === 'surface') {
    const s = (sel && sel.surf) || 'both', out = [];
    if (s !== 'ceiling') out.push(line(`${w.name} – fal`, 'wall', price, g.wall));
    if (s !== 'wall') out.push(line(`${w.name} – mennyezet`, 'ceiling', pc, g.ceiling));
    return out;
  }
  return [line(w.name, w.unit, w.unit === 'ceiling' ? pc : price, unitQty(w.unit, g, sel && sel.qty))];
}

/* Beágyazható források (YouTube, Facebook, Instagram, TikTok). Csak ezek az iframe-címek engedettek. */
const EMBED_RE = /^https:\/\/(www\.|m\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/|^https:\/\/www\.facebook\.com\/plugins\/(video|post)\.php\?|^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/embed\/?$|^https:\/\/www\.tiktok\.com\/embed\/(v2\/)?\d+/;

/* Bármilyen megosztott link (pl. böngésző címsora) beágyazható alakra alakítása.
   Ismeretlen linknél változatlanul adja vissza; az EMBED_RE dönt, mi engedett. */
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

/* Biztonságos HTML (blog, saját ablakok). A EMBED_RE-nek megfelelő iframe-eket engedi. */
if (window.DOMPurify) {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src') || '';
      if (!EMBED_RE.test(src)) node.remove();
    }
  });
}
function sanitize(html) {
  if (!html) return '';
  return window.DOMPurify
    ? DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'target', 'allow', 'scrolling', 'referrerpolicy', 'loading'] })
    : esc(html);
}

async function loadTexts() {
  if (!sb) return { ...TEXT_DEFAULTS };
  const { data, error } = await sb.from('settings').select('value').eq('key', 'texts').maybeSingle();
  if (error) throw error;
  const v = (data && data.value) || {};
  const out = { ...TEXT_DEFAULTS };
  Object.keys(v).forEach(k => { if (v[k] !== null && v[k] !== undefined) out[k] = v[k]; });
  return out;
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

/* Kép kicsinyítése feltöltés előtt (max. 2000 px, JPEG). Ha a böngésző
   nem tudja megnyitni (pl. HEIC), az eredeti fájl megy fel. */
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

/* Telefonos lenyíló menü (főoldal, blog) */
(function initMenu() {
  const btn = document.getElementById('menuBtn'), nav = document.getElementById('topnav'), links = document.getElementById('navLinks');
  if (!btn || !nav || !links) return;
  const set = open => { nav.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása'); };
  btn.addEventListener('click', () => set(!nav.classList.contains('menu-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });   // menüpont vagy az Árajánlat gomb
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('menu-open')) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (nav.classList.contains('menu-open') && !nav.contains(e.target)) set(false); });
  addEventListener('resize', () => { if (innerWidth > 1000) set(false); });
})();

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
