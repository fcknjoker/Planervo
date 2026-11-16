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
  { g: 'Előtte–utána', k: 'ba_title', l: 'Cím', d: 'Előtte és utána' },
  { g: 'Előtte–utána', k: 'ba_text', l: 'Bevezető', d: 'Húzd el a csúszkát, és nézd meg, mit hozunk ki egy falból.', t: 'textarea' },
  { g: 'Galéria', k: 'gallery_title', l: 'Cím', d: 'Galéria' },
  { g: 'Galéria', k: 'gallery_text', l: 'Bevezető', d: 'Válogatás az elkészült munkáinkból.', t: 'textarea' },
  { g: 'Videók', k: 'videos_title', l: 'Cím', d: 'Videóink' },
  { g: 'Videók', k: 'videos_text', l: 'Bevezető', d: 'Nézd meg, hogyan dolgozunk.', t: 'textarea' },
  { g: 'Videók', k: 'video_source', l: 'Mit mutasson a videós ablak', t: 'select', d: 'channel',
    o: [['channel', 'A YouTube-csatornám legújabb videói (automatikus, legújabb elöl)'], ['playlist', 'Egy lejátszási lista videói (a lista sorrendjében)'], ['manual', 'Csak a „YouTube-videók” menüben kézzel felvett videók']] },
  { g: 'Videók', k: 'youtube_playlist', l: 'Lejátszási lista linkje', d: '', ph: 'https://www.youtube.com/playlist?list=…' },
  { g: 'Videók', k: 'video_count', l: 'Hány videó jelenjen meg (3–15)', t: 'number', d: 12 },
  { g: 'Közösségi média', k: 'social_title', l: 'Cím', d: 'Kövess minket' },
  { g: 'Közösségi média', k: 'social_text', l: 'Bevezető', d: 'Legfrissebb bejegyzéseink Instagramon, TikTokon és Facebookon.', t: 'textarea' },
  { g: 'Blog', k: 'blog_title', l: 'Cím', d: 'Blog' },
  { g: 'Blog', k: 'blog_text', l: 'Bevezető', d: 'Tanácsok festéshez, felújításhoz és színválasztáshoz.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_title', l: 'Cím', d: 'Árajánlatkérés' },
  { g: 'Árajánlatkérés', k: 'quote_text', l: 'Bevezető', d: 'Add hozzá a helyiségeket, válaszd ki a munkákat, és csatolj fotókat. 24 órán belül jelentkezünk.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'show_estimate', l: 'Becsült ár mutatása az ügyfélnek', d: true, t: 'bool' },
  { g: 'Árajánlatkérés', k: 'quote_disclaimer', l: 'Megjegyzés a becslés alatt', d: 'A becslés tájékoztató jellegű munkadíj, az anyagköltséget nem tartalmazza. A végleges árat helyszíni felmérés után adjuk.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'privacy_text', l: 'Adatkezelési hozzájárulás szövege', d: 'Hozzájárulok, hogy a megadott adataimat az árajánlat elkészítéséhez kezeljék.', t: 'textarea' },
  { g: 'Árajánlatkérés', k: 'quote_success', l: 'Köszönő üzenet beküldés után', d: 'Megkaptuk az árajánlat-kérésedet. 24 órán belül jelentkezünk a megadott elérhetőségeiden.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'contact_title', l: 'Cím', d: 'Kapcsolat' },
  { g: 'Kapcsolat', k: 'contact_text', l: 'Bevezető', d: 'Hívj, írj, vagy kérj árajánlatot az űrlapon.', t: 'textarea' },
  { g: 'Kapcsolat', k: 'phone', l: 'Telefonszám', d: '+36 30 123 4567' },
  { g: 'Kapcsolat', k: 'email', l: 'E-mail-cím', d: 'planervo@gmail.com' },
  { g: 'Kapcsolat', k: 'area', l: 'Munkaterület', d: 'Budapest és vonzáskörzete' },
  { g: 'Kapcsolat', k: 'hours', l: 'Elérhetőség ideje', d: 'Hétfőtől szombatig, 8:00–18:00' },
  { g: 'Kapcsolat', k: 'facebook_url', l: 'Facebook-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'instagram_url', l: 'Instagram-oldal linkje', d: '' },
  { g: 'Kapcsolat', k: 'youtube_url', l: 'YouTube-csatorna linkje (ebből jönnek a videók is)', d: '', ph: 'https://www.youtube.com/@csatornam' },
  { g: 'Lábléc', k: 'footer_text', l: 'Cégadatok a láblécben', d: 'PLANERVO – Minőség minden rétegben', t: 'textarea' }
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

/* Biztonságos HTML (blog, saját ablakok). YouTube-beágyazást enged. */
if (window.DOMPurify) {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src') || '';
      if (!/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\//.test(src)) node.remove();
    }
  });
}
function sanitize(html) {
  if (!html) return '';
  return window.DOMPurify
    ? DOMPurify.sanitize(html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'target'] })
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
