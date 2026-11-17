// PLANERVO – helyi keresőoldalak generátora („festő Budapest”, „festő Gyál” stb.)
// Futtatás a projekt mappájából:  node seo/oldalak.mjs
// A szöveget ebben a fájlban szerkeszd, majd futtasd újra: a HTML-oldalak és a sitemap.xml felülíródnak.
// Fontos: minden oldal szövege legyen egyedi és igaz. A Google a csak városnévben eltérő oldalakat bünteti.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://planervo.hu';
const BRAND = 'PLANERVO';

/* Közös, igaz állítások (a PLANERVO szórólapjáról és a főoldalról) */
const SERVICES = {
  festes: 'Szobafestés, lakásfestés, tisztasági festés',
  glett: 'Glettelés, gépi glettelés és festékszórás',
  regi: 'Régi falak teljes felújítása: a falkaparástól a készre festett felületig',
  uj: 'Új építésű házak glettelése és festése',
  homlokzat: 'Homlokzatfestés és homlokzati hőszigetelés régi és új házakon',
  kicsi: 'Kisebb javítások is: például ablakcsere utáni javítás, egy-egy fal vagy helyiség rendbetétele'
};

/* Oldalak. slug = fájlnév, place = településnév, in = „-ban/-ben/-on” alak, adj = melléknévi alak */
const PAGES = [
  {
    slug: 'festo-budapest', place: 'Budapest', in: 'Budapesten', adj: 'budapesti',
    title: 'Festő Budapesten – szobafestés, lakásfestés, glettelés',
    desc: 'Szobafestő Budapesten, minden kerületben: lakásfestés, glettelés, régi falak felújítása, homlokzatfestés. Ingyenes felmérés, fix áras ajánlat online.',
    h1: 'Festő Budapesten',
    lead: 'Lakások, családi házak és irodák festése Budapest minden kerületében. Felmérés után helyiségenként bontott, fix áras ajánlatot adunk.',
    services: ['festes', 'glett', 'regi', 'kicsi', 'homlokzat'],
    local: [
      'Budapesten a legtöbb munkánk lakott lakásban zajlik: panellakásban, téglaépítésű bérházban és kertvárosi családi házban egyaránt. Ilyenkor a bútorokat letakarjuk vagy a helyiség közepére toljuk, a padlót és a nyílászárókat védjük, és naponta takarítva adjuk át a helyiségeket, hogy közben élni lehessen a lakásban.',
      'A régi pesti és budai bérházakban gyakori a sokszor átfestett, mállott vagy repedezett fal. Ezeket nem festjük át még egyszer: lekaparjuk, glettelünk, csiszolunk, és csak utána jön a festés. Így a felület évekig szép marad.'
    ],
    faq: [
      ['Mennyi idő alatt készül el egy lakás festése?', 'Ez a lakás méretétől és a falak állapotától függ. Egy átlagos, jó állapotú kétszobás lakás festése néhány nap; ha glettelni vagy kaparni is kell, több. A pontos ütemezést a felmérés után az ajánlatban leírjuk.'],
      ['Kell-e előre kiürítenem a lakást?', 'Nem. Lakott lakásban is dolgozunk: a bútorokat letakarjuk vagy félretoljuk, a kényes tárgyakat érdemes előtte elpakolni.'],
      ['Melyik kerületekben dolgoztok?', 'Budapest minden kerületében, és a főváros keleti és délkeleti agglomerációjában is.']
    ]
  },
  {
    slug: 'homlokzatfestes-hoszigeteles', place: 'Budapest és környéke', in: 'Budapesten és környékén', adj: 'budapesti',
    title: 'Homlokzatfestés és hőszigetelés Budapesten és környékén',
    desc: 'Homlokzati hőszigetelés és homlokzatfestés családi házakra Budapesten és az agglomerációban. Régi és új házak, ingyenes felmérés, részletes ajánlat.',
    h1: 'Homlokzatfestés és hőszigetelés',
    lead: 'Családi házak homlokzati hőszigetelése és festése Budapesten és a keleti, délkeleti agglomerációban, régi és új házakon egyaránt.',
    services: ['homlokzat', 'regi', 'uj'],
    local: [
      'A homlokzati hőszigetelés a fűtésszámlán és a lakás komfortján is érződik: télen melegebb, nyáron hűvösebb marad a ház. Régi háznál először felmérjük a falak állapotát, a nedvességet és a vakolatot, mert ezek döntik el, milyen rendszer és milyen vastagság való a házra.',
      'Új építésű háznál a hőszigetelés és a homlokzat színezése sokszor egy menetben készül. Ilyenkor a színt és a vakolat szemcseméretét előre egyeztetjük, és mintafelületet is mutatunk.'
    ],
    faq: [
      ['Mikor érdemes homlokzatot szigetelni?', 'Fagymentes, száraz időben, jellemzően tavasztól őszig. Érdemes a felmérést hónapokkal előbb kérni, mert a szezon gyorsan betelik.'],
      ['Régi, vizes falú házat is lehet szigetelni?', 'Előbb a nedvesség okát kell megszüntetni, különben a szigetelés alatt tovább bomlik a fal. Ezt a felméréskor megnézzük, és megmondjuk, mi a teendő.']
    ]
  },
  {
    slug: 'festo-gyal', place: 'Gyál', in: 'Gyálon', adj: 'gyáli',
    title: 'Festő Gyálon – szobafestés, glettelés, homlokzat',
    desc: 'Szobafestő Gyálon: lakások és családi házak festése, glettelés, régi falak felújítása, homlokzatfestés. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Gyálon',
    lead: 'Gyáli lakások és családi házak festése, glettelése és felújítása. A dél-pesti kerületekből rövid idő alatt kiérünk, ezért a felmérést is gyorsan meg tudjuk tartani.',
    services: ['festes', 'glett', 'regi', 'homlokzat', 'kicsi'],
    local: [
      'Gyálon sok a régebbi, többször bővített családi ház, ahol az egyes helyiségek falai más-más korúak és állapotúak. Ilyenkor helyiségenként mérjük fel, hol elég egy friss festés, és hol kell a régi rétegeket lekaparni és újraglettelni. Az ajánlatban is helyiségenként bontjuk a munkát, így pontosan látod, mi mennyibe kerül.',
      'Ha csak egy-egy helyiséget szeretnél rendbe tenni, például egy gyerekszobát vagy egy ablakcsere utáni sérült falat, azt is szívesen elvállaljuk.'
    ],
    faq: [
      ['Egyetlen szoba festését is vállaljátok Gyálon?', 'Igen, kisebb munkát is vállalunk. Az ajánlatkérőben elég egy helyiséget megadni.'],
      ['Mennyi a kiszállás?', 'A felmérés ingyenes. A pontos árat a felmérés után, írásos ajánlatban adjuk meg.']
    ]
  },
  {
    slug: 'festo-vecses', place: 'Vecsés', in: 'Vecsésen', adj: 'vecsési',
    title: 'Festő Vecsésen – lakásfestés, új házak glettelése és festése',
    desc: 'Festő Vecsésen: új építésű házak glettelése és festése, lakások felújító festése, homlokzat és hőszigetelés. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Vecsésen',
    lead: 'Vecsési családi házak, ikerházak és lakások festése. Új építésű házak első festését és régi házak felújítását is vállaljuk.',
    services: ['uj', 'glett', 'festes', 'homlokzat', 'kicsi'],
    local: [
      'Vecsésen az utóbbi években sok új ház és ikerház épült. Új háznál a falak glettelése és az első festés különösen fontos, mert ez adja a ház végleges belső felületét. Gépi glettel és festékszórással nagy felületen is egyenletes, csíkmentes eredményt adunk, gyorsabban, mint kézzel.',
      'Régebbi vecsési házaknál a beköltözés előtti teljes felújító festés a jellemző: a régi festékrétegek eltávolítása, a repedések javítása, majd a glettelés és a festés.'
    ],
    faq: [
      ['Új háznál mikor érdemes festeni?', 'Ha a vakolat és az esztrich kiszáradt. Ezt a felméréskor ellenőrizzük, mert a túl korán felvitt festék később foltosodhat.'],
      ['Vállaljátok a homlokzatot is?', 'Igen, a homlokzati hőszigetelést és a homlokzatfestést is, akár a belső festéssel egy ütemben.']
    ]
  },
  {
    slug: 'festo-ullo', place: 'Üllő', in: 'Üllőn', adj: 'üllői',
    title: 'Festő Üllőn – szobafestés, homlokzatfestés, hőszigetelés',
    desc: 'Festő Üllőn: családi házak belső festése, glettelés, régi falak felújítása, homlokzatfestés és hőszigetelés. Ingyenes felmérés, írásos ajánlat.',
    h1: 'Festő Üllőn',
    lead: 'Üllői családi házak belső festése, felújítása, homlokzatfestése és hőszigetelése, egy kézből.',
    services: ['festes', 'regi', 'homlokzat', 'glett', 'kicsi'],
    local: [
      'Üllőn főként családi házakban dolgozunk, ahol a belső festés mellett gyakran a homlokzat is felújításra szorul. Ha mindkettő esedékes, érdemes egyben kérni a felmérést: így egy ajánlatban látod a belső és a külső munkát, és az ütemezést is össze tudjuk hangolni.',
      'Régebbi házaknál előfordul a salétromos, vizes falrész a lábazat környékén. Ezt a felméréskor megnézzük, mert itt nem elég az átfestés, előbb a fal javítására van szükség.'
    ],
    faq: [
      ['Belső és külső munkát is kérhetek egyszerre?', 'Igen. Egy felméréssel mindkettőt megnézzük, és egy, tételesen bontott ajánlatot adunk.'],
      ['Mennyi idő múlva tudtok kezdeni?', 'Ez a szezontól függ. Az ajánlatkérés után 24 órán belül jelentkezünk, és egyeztetjük a lehetséges kezdést.']
    ]
  },
  {
    slug: 'festo-gyomro', place: 'Gyömrő', in: 'Gyömrőn', adj: 'gyömrői',
    title: 'Festő Gyömrőn – lakás- és házfestés, glettelés, homlokzat',
    desc: 'Festő Gyömrőn: családi házak és lakások festése, glettelés, falfelújítás, homlokzatfestés és hőszigetelés. Ingyenes felmérés, fix áras ajánlat online.',
    h1: 'Festő Gyömrőn',
    lead: 'Gyömrői családi házak és lakások festése, felújítása és homlokzati munkái. A felmérést a helyszínen tartjuk, és utána írásban adjuk meg az árat.',
    services: ['festes', 'glett', 'regi', 'homlokzat', 'uj'],
    local: [
      'Gyömrőn a régi, kertes családi házak és az újabb építésű házak egyaránt jellemzőek, ezért nálunk mindkettő megszokott munka. Régi háznál a falak előkészítése adja a munka nagyobb részét, új háznál a glettelés minősége dönti el, mennyire lesz szép a végeredmény.',
      'Ha nyaraló vagy kevésbé használt ház felújítását tervezed, azt is vállaljuk: ilyenkor gyakran a teljes ház egyszerre készül, a falkaparástól a festésig.'
    ],
    faq: [
      ['Kell-e előre megvennem a festéket?', 'Nem kell. Az anyagot mi szerezzük be, és az ajánlatban külön jelöljük. Ha saját színt vagy márkát szeretnél, azt egyeztetjük.'],
      ['Hogyan kérhetek ajánlatot?', 'Online, helyiségenként: a főoldali árajánlatkérőben add meg a helyiségeket és a munkákat, utána felvesszük veled a kapcsolatot.']
    ]
  },
  {
    slug: 'festo-maglod', place: 'Maglód', in: 'Maglódon', adj: 'maglódi',
    title: 'Festő Maglódon – új házak festése, glettelés, felújítás',
    desc: 'Festő Maglódon: új építésű házak glettelése és festése, lakásfestés, régi falak felújítása, homlokzat. Ingyenes felmérés, tételes, fix áras ajánlat.',
    h1: 'Festő Maglódon',
    lead: 'Maglódi új és régebbi házak festése, glettelése és felújítása. Budapest keleti kerületeiből gyorsan kiérünk.',
    services: ['uj', 'glett', 'festes', 'regi', 'homlokzat'],
    local: [
      'Maglódon sok új ház épült, és az ilyen házaknál a belső felületek elkészítése nagy munka: glettelés, csiszolás, alapozás, két réteg festés. Gépesített munkafolyamatokkal dolgozunk, így a nagy felületek is gyorsabban és kevesebb porral készülnek el.',
      'Ha a házat lakottan kell felújítani, az ütemezést helyiségenként tervezzük meg, hogy mindig maradjon használható rész a házban.'
    ],
    faq: [
      ['Gipszkarton felületet is festtek?', 'Igen. A gipszkarton illesztéseit és csavarfejeit glettelés után festjük, hogy ne látszódjanak.'],
      ['Mennyi idő alatt kapok ajánlatot?', 'Az ajánlatkérés után 24 órán belül jelentkezünk, a felmérés után pedig írásban küldjük az árat.']
    ]
  },
  {
    slug: 'festo-monor', place: 'Monor', in: 'Monoron', adj: 'monori',
    title: 'Festő Monoron – régi házak felújítása, festés, hőszigetelés',
    desc: 'Festő Monoron: régi falak teljes felújítása, szobafestés, glettelés, homlokzatfestés és hőszigetelés családi házakon. Ingyenes felmérés, írásos ajánlat.',
    h1: 'Festő Monoron',
    lead: 'Monori családi házak belső felújítása, festése, homlokzatfestése és hőszigetelése, a régi falak előkészítésétől a kész felületig.',
    services: ['regi', 'festes', 'glett', 'homlokzat', 'kicsi'],
    local: [
      'Monoron sok a régebbi építésű ház, ahol a falakon évtizedek festékrétegei vannak. Ha ezek mállanak vagy pattognak, nem érdemes rájuk festeni: lekaparjuk őket, a repedéseket kijavítjuk, glettelünk, és csak utána festünk. Ez a munka több időt kér, de a végeredmény tartós.',
      'A régi házaknál a homlokzat hőszigetelése is sokat javít a komforton. Ha ezen gondolkodsz, a belső festéssel együtt is felmérhetjük.'
    ],
    faq: [
      ['Monorra is kiszálltok?', 'Igen, Monor rendszeres munkaterületünk. A felmérés ingyenes.'],
      ['Mi a teendő, ha pattogzik a régi festék?', 'Le kell kaparni a laza rétegeket, különben az új festék is leválik. Ezt a felméréskor megnézzük, és az ajánlatban külön tételként jelöljük.']
    ]
  },
  {
    slug: 'festo-monorierdo', place: 'Monorierdő', in: 'Monorierdőn', adj: 'monorierdei',
    title: 'Festő Monorierdőn – házfestés, felújítás, homlokzat',
    desc: 'Festő Monorierdőn: családi házak festése és felújítása, glettelés, homlokzatfestés és hőszigetelés. Ingyenes felmérés, tételes, fix áras ajánlat.',
    h1: 'Festő Monorierdőn',
    lead: 'Monorierdei családi házak festése, felújítása és homlokzati munkái, egy kézből és egy ajánlatban.',
    services: ['festes', 'regi', 'homlokzat', 'glett', 'uj'],
    local: [
      'Monorierdőn főként családi házakban dolgozunk, gyakran olyanokban, amelyeket korábban hétvégi házként használtak, és most állandó otthonná alakítják őket. Ilyenkor a teljes belső felület felújítása és a homlokzat szigetelése is szóba jön.',
      'Mivel Monorierdő kis település, a munkákat úgy szervezzük, hogy egy kiszállással minél többet elvégezzünk: a felméréskor minden helyiséget és a homlokzatot is megnézzük, ha kéred.'
    ],
    faq: [
      ['Hétvégi házból átalakított épületet is felújítotok?', 'Igen. Ilyenkor a falak állapotát és a nedvességet alaposan megnézzük, mert ezek döntik el a munka menetét.'],
      ['Mennyibe kerül a felmérés?', 'A felmérés ingyenes.']
    ]
  },
  {
    slug: 'festo-kistarcsa', place: 'Kistarcsa', in: 'Kistarcsán', adj: 'kistarcsai',
    title: 'Festő Kistarcsán – szobafestés, glettelés, homlokzat',
    desc: 'Festő Kistarcsán: lakások és családi házak festése, glettelés, régi falak felújítása, homlokzatfestés és hőszigetelés. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Kistarcsán',
    lead: 'Kistarcsai lakások és családi házak festése, glettelése, felújítása és homlokzati munkái.',
    services: ['festes', 'glett', 'homlokzat', 'regi', 'kicsi'],
    local: [
      'Kistarcsán lakásokban és családi házakban egyaránt dolgozunk. Lakásnál a gyors, tiszta munka a legfontosabb, ezért a helyiségeket egyenként vesszük sorra, és a bútorokat, padlót gondosan letakarjuk.',
      'Családi háznál a belső festés mellett gyakran a homlokzat is esedékes. Ha mindkettőt tervezed, egy felméréssel és egy ajánlattal mindkettőt megnézzük.'
    ],
    faq: [
      ['Lakott lakásban is festetek?', 'Igen. A bútorokat letakarjuk vagy félretoljuk, és a munka végén kitakarítunk.'],
      ['Milyen festéket használtok?', 'A felülethez és a helyiséghez illőt: más kell egy hálószobába és más egy fürdőszobába vagy konyhába. Ha konkrét márkát szeretnél, azzal is dolgozunk.']
    ]
  }
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(p) {
  const url = `${BASE}/${p.slug}.html`;
  const others = PAGES.filter(o => o.slug !== p.slug);
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Service', name: p.h1, serviceType: 'Festés, glettelés, homlokzatfestés, hőszigetelés',
      url, description: p.desc,
      areaServed: { '@type': p.slug.startsWith('festo-') ? 'City' : 'AdministrativeArea', name: p.place.replace(' és környéke', '') },
      provider: { '@type': 'HousePainter', name: BRAND, url: BASE + '/' }
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    }
  ];
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="only light">
<title>${esc(p.title)} | ${BRAND}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:image" content="${BASE}/logo.png">
<link rel="icon" href="logo.png">
<link rel="preload" href="assets/fonts/jost-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/uj.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<!-- Generálva: seo/oldalak.mjs – ne kézzel szerkeszd, hanem ott, és futtasd újra. -->
<nav class="topnav solid" id="topnav" aria-label="Fő menü">
  <a class="brand" href="index.html" aria-label="${BRAND} főoldal">PLAN<i><b></b><b></b><b></b></i>RVO</a>
  <div class="links" id="navLinks">
    <a href="index.html#szolgaltatasok">Szolgáltatások</a>
    <a href="index.html#munkaink">Munkáink</a>
    <a href="blog.html">Blog</a>
    <a href="index.html#kapcsolat">Kapcsolat</a>
  </div>
  <a class="pill" href="index.html#arajanlat">Árajánlat</a>
  <button type="button" class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="navLinks" aria-label="Menü megnyitása"><span></span></button>
</nav>
<main id="main">
  <article class="wrap blog-top legal area-page">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Főoldal</a> › <span>${esc(p.h1)}</span></nav>
    <span class="eyebrow">${esc(p.place)}</span>
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <div class="btns"><a class="btn gold" href="index.html#arajanlat">Árajánlatot kérek</a><a class="btn o" href="index.html#munkaink">Munkáink</a></div>

    <h2>Milyen munkákat vállalunk ${esc(p.in)}?</h2>
    <ul>${p.services.map(k => `<li>${esc(SERVICES[k])}</li>`).join('')}</ul>

    <h2>${esc(p.adj.charAt(0).toUpperCase() + p.adj.slice(1))} munkák, amiket jól ismerünk</h2>
    ${p.local.map(t => `<p>${esc(t)}</p>`).join('\n    ')}

    <h2>Így dolgozunk</h2>
    <ol>
      <li><b>Ajánlatkérés online:</b> a főoldalon helyiségenként megadod, mit szeretnél. 24 órán belül jelentkezünk.</li>
      <li><b>Ingyenes felmérés</b> a helyszínen: megnézzük a falakat, és egyeztetjük a színeket, az anyagot és az időpontot.</li>
      <li><b>Írásos, fix áras ajánlat</b> helyiségenként és munkánként bontva. Ami benne van, azt fizeted.</li>
      <li><b>Munka és átadás:</b> letakarunk, dolgozunk, takarítunk, és együtt átnézzük az elkészült felületeket.</li>
    </ol>

    <h2>Gyakori kérdések</h2>
    ${p.faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n    ')}

    <div class="area-cta">
      <p><b>Kérj ajánlatot még ma.</b> Az ajánlatkérés pár perc, a felmérés ingyenes.</p>
      <a class="btn gold" href="index.html#arajanlat">Árajánlatot kérek</a>
    </div>

    <h2>Máshol is dolgozunk</h2>
    <ul class="area-links">${others.map(o => `<li><a href="${o.slug}.html">${esc(o.h1)}</a></li>`).join('')}</ul>
  </article>
</main>
<footer class="site">
  <a class="brand" href="index.html">PLAN<i><b></b><b></b><b></b></i>RVO</a>
  <em data-t="footer_text"></em>
  <nav aria-label="Lábléc"><a href="index.html">Főoldal</a><a href="blog.html">Blog</a><a href="adatkezeles.html">Adatkezelés</a><a href="impresszum.html">Impresszum</a><a href="sutik.html">Sütik</a></nav>
</footer>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.min.js"></script>
<script src="assets/shared.js"></script>
<script>(async () => { let TX = { ...TEXT_DEFAULTS }; try { TX = await loadTexts(); } catch (e) {} document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TX[el.dataset.t] || ''; }); })();</script>
</body>
</html>
`;
}

for (const p of PAGES) fs.writeFileSync(path.join(ROOT, p.slug + '.html'), page(p));

/* sitemap.xml: főoldal, blog, jogi oldalak és a helyi oldalak (a blogbejegyzéseket az admin sitemap-letöltése adja hozzá) */
const today = new Date().toISOString().slice(0, 10);
const urls = [[BASE + '/', '1.0', 'weekly'], ...PAGES.map(p => [`${BASE}/${p.slug}.html`, '0.8', 'monthly']), [BASE + '/blog.html', '0.6', 'weekly'],
  ...['adatkezeles.html', 'impresszum.html', 'sutik.html'].map(f => [`${BASE}/${f}`, '0.2', 'yearly'])];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([u, pr, f]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n') + '\n</urlset>\n');

console.log(`${PAGES.length} oldal és a sitemap.xml elkészült.`);
