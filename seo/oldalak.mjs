// PLANERVO – helyi keresőoldalak generátora („festő Üllő”, „festő Vecsés” stb.)
// Futtatás a projekt mappájából:  node seo/oldalak.mjs
// Az itt megadott szöveg a kiinduló (statikus) változat, ezt látják a keresők JavaScript nélkül is.
// Az oldalak szövegét az admin „Aloldalak szövegei” menüjében is átírhatod; a mentett változat felülírja ezt a látogatóknál.
// Fontos: minden oldal szövege legyen egyedi és igaz. A Google a csak városnévben eltérő oldalakat bünteti.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://planervo.hu';
const BRAND = 'PLANERVO';
const PHONE = '+36 20 419 4746';

/* Közös, igaz állítások. Egyedül dolgozom, bútort nem mozgatok, anyagot csak előre fizetéssel szerzek be. */
const SERVICES = {
  festes: 'Szobafestés, lakásfestés, tisztasági festés',
  glett: 'Glettelés, gipszkarton glettelése, csiszolás, alapozás',
  regi: 'Régi falak felújítása: kaparás, repedésjavítás, glettelés, festés',
  uj: 'Új építésű házak glettelése és első festése',
  vakolat: 'Gépi nemesvakolat szórás homlokzatra',
  homlokzat: 'Homlokzatfestés régi és új házakon',
  kicsi: 'Kisebb munkák is: egy szoba, egy fal, ablakcsere utáni javítás'
};

/* Oldalak. slug = fájlnév, place = településnév, in = „-ban/-ben/-on” alak, adj = melléknévi alak */
const PAGES = [
  {
    slug: 'festo-ullo', place: 'Üllő', in: 'Üllőn', adj: 'üllői', main: true,
    title: 'Festő Üllőn – szobafestés, glettelés, nemesvakolat',
    desc: 'Szobafestő Üllőn: lakás- és házfestés, glettelés, régi falak felújítása, gépi nemesvakolat szórás. Helyi festő, ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Üllőn',
    lead: 'Üllőn lakom, és itt dolgozom a legtöbbet. Családi házak és lakások festését, glettelését és homlokzati nemesvakolatát vállalom, egyedül, fix áron.',
    services: ['festes', 'glett', 'regi', 'vakolat', 'homlokzat', 'kicsi'],
    local: [
      'Üllőn főleg családi házakban dolgozom. Sok helyen egyszerre esedékes a belső festés és a homlokzat: ilyenkor egy felméréssel mindkettőt megnézem, és egy ajánlatban írom le a belső és a külső munkát.',
      'A régebbi üllői házaknál gyakori a vizes, salétromos falrész a lábazat környékén. Ezt a felméréskor megmutatom, mert ott nem elég átfesteni: előbb a falat kell rendbe tenni.',
      'Mivel helyben lakom, a felmérésre általában pár napon belül ki tudok menni, és ha munka közben kérdésed van, gyorsan ott vagyok.'
    ],
    faq: [
      ['Mennyi idő alatt jössz ki felmérni Üllőn?', 'Üllőn lakom, ezért általában pár napon belül. Az ajánlatkérés után 24 órán belül felhívlak, és megbeszéljük az időpontot.'],
      ['Belső és külső munkát is kérhetek egyszerre?', 'Igen. Egy felméréssel megnézem a szobákat és a homlokzatot is, és egy tételes ajánlatot küldök.']
    ]
  },
  {
    slug: 'homlokzat-nemesvakolat', place: 'Üllő és környéke', in: 'Üllőn és környékén', adj: 'környékbeli',
    title: 'Gépi nemesvakolat szórás és homlokzatfestés Üllőn és környékén',
    desc: 'Gépi nemesvakolat szórás és homlokzatfestés családi házakra Üllőn, Vecsésen, Gyömrőn, Monoron és környékén. Ingyenes felmérés, tételes ajánlat.',
    h1: 'Gépi nemesvakolat szórás és homlokzatfestés',
    lead: 'Családi házak homlokzatának nemesvakolata géppel szórva, illetve homlokzatfestés Üllőn és a környező településeken, régi és új házakon.',
    services: ['vakolat', 'homlokzat', 'uj'],
    local: [
      'A nemesvakolat a homlokzat vékony, színezett záróvakolata. Géppel szórva egyenletesebb lesz a szemcse és a szín, mint kézi felhordásnál, és a nagy felület is gyorsabban elkészül, kevesebb toldási nyommal.',
      'Szórás előtt a felmérésen megnézem az alapfelületet: a régi vakolat tartását, a repedéseket és a nedvességet. Ha az alap nem jó, azt kell először rendbe tenni, mert különben a nemesvakolat sem tart.',
      'A színt és a szemcseméretet előre egyeztetjük. Az anyagot kérésre beszerzem, de csak előre fizetéssel.'
    ],
    faq: [
      ['Mikor lehet nemesvakolatot szórni?', 'Száraz, fagymentes időben, jellemzően tavasztól őszig. Esőben, tűző napon és fagyban nem dolgozom homlokzaton, mert a vakolat foltos lesz vagy nem köt meg rendesen.'],
      ['Régi, festett homlokzatra is lehet nemesvakolatot tenni?', 'Sokszor igen, de előtte meg kell nézni, tart-e a régi felület. Ezt a felméréskor ellenőrzöm, és megmondom, milyen előkészítés kell.']
    ]
  },
  {
    slug: 'festo-vecses', place: 'Vecsés', in: 'Vecsésen', adj: 'vecsési',
    title: 'Festő Vecsésen – lakásfestés, új házak glettelése és festése',
    desc: 'Festő Vecsésen: új építésű házak glettelése és festése, lakások felújító festése, gépi nemesvakolat szórás. Üllőről pár perc, ingyenes felmérés.',
    h1: 'Festő Vecsésen',
    lead: 'Vecsési családi házak, ikerházak és lakások festése. Üllőről pár perc alatt ott vagyok, új házat és felújítást is vállalok.',
    services: ['uj', 'glett', 'festes', 'vakolat', 'kicsi'],
    local: [
      'Vecsésen az utóbbi években sok új ház és ikerház épült. Új háznál a glettelés és az első festés adja meg a falak végleges minőségét, ezért itt nem érdemes sietni: glettelés, csiszolás, alapozás, majd két réteg festék.',
      'A régebbi vecsési házakban inkább beköltözés előtti teljes festés a jellemző: a laza festékrétegek lekaparása, a repedések javítása, glettelés és festés. Ilyenkor üres a ház, így gyorsabban haladok.'
    ],
    faq: [
      ['Új háznál mikor érdemes festeni?', 'Ha a vakolat és az esztrich kiszáradt. Ezt a felméréskor megnézem, mert a túl korán felvitt festék később foltos lehet.'],
      ['A homlokzatot is megcsinálod?', 'Igen, gépi nemesvakolat szórást és homlokzatfestést is vállalok, akár a belső festés után.']
    ]
  },
  {
    slug: 'festo-gyomro', place: 'Gyömrő', in: 'Gyömrőn', adj: 'gyömrői',
    title: 'Festő Gyömrőn – lakás- és házfestés, glettelés, nemesvakolat',
    desc: 'Festő Gyömrőn: családi házak és lakások festése, glettelés, falfelújítás, gépi nemesvakolat szórás. Üllő szomszédságából, ingyenes felméréssel.',
    h1: 'Festő Gyömrőn',
    lead: 'Gyömrői családi házak és lakások festése és felújítása. Gyömrő Üllő szomszédja, így a felmérésre és a munkára is gyorsan ki tudok menni.',
    services: ['festes', 'glett', 'regi', 'vakolat', 'uj'],
    local: [
      'Gyömrőn régi, kertes családi házakban és újabb építésű házakban is dolgozom. Régi háznál a falak előkészítése a munka nagyobbik fele, új háznál a glettelés minősége dönti el, milyen lesz a végeredmény.',
      'Ha nyaralót vagy ritkán használt házat újítasz fel, gyakran az egész ház egyszerre készül, a kaparástól a festésig. Ilyenkor helyiségenként írom le az ajánlatot, hogy lásd, mi mennyibe kerül.'
    ],
    faq: [
      ['Kell előre megvennem a festéket?', 'Nem kell. Kérésre én szerzem be, de csak előre fizetéssel. Ha te vennéd meg, megírom, miből mennyi kell.'],
      ['Hogyan kérhetek ajánlatot?', 'A főoldal árajánlatkérőjében helyiségenként megadod, mit szeretnél, vagy felhívsz. 24 órán belül jelentkezem.']
    ]
  },
  {
    slug: 'festo-monor', place: 'Monor', in: 'Monoron', adj: 'monori',
    title: 'Festő Monoron – régi házak felújítása, festés, nemesvakolat',
    desc: 'Festő Monoron: régi falak felújítása, szobafestés, glettelés, gépi nemesvakolat szórás családi házakon. Ingyenes felmérés, írásos, fix áras ajánlat.',
    h1: 'Festő Monoron',
    lead: 'Monori családi házak belső felújítása és festése, a régi falak kaparásától a kész felületig, és kívül a homlokzat nemesvakolata.',
    services: ['regi', 'festes', 'glett', 'vakolat', 'kicsi'],
    local: [
      'Monoron sok a régi építésű ház, ahol a falakon évtizedek festékrétegei vannak. Ha ezek mállanak vagy pattognak, nem festek rájuk: lekaparom őket, kijavítom a repedéseket, glettelek, és csak utána festek. Ez több idő, de így tart.',
      'Ha a homlokzat is megérett a felújításra, a belső munkával együtt felmérem, és nemesvakolattal vagy festéssel újítom fel.'
    ],
    faq: [
      ['Monorra is kijössz?', 'Igen, Monor rendszeresen a munkaterületem. A felmérés ingyenes.'],
      ['Mi a teendő, ha pattogzik a régi festék?', 'A laza rétegeket le kell kaparni, különben az új festék is leválik. Ezt az ajánlatban külön tételként írom le.']
    ]
  },
  {
    slug: 'festo-monorierdo', place: 'Monorierdő', in: 'Monorierdőn', adj: 'monorierdei',
    title: 'Festő Monorierdőn – házfestés, felújítás, nemesvakolat',
    desc: 'Festő Monorierdőn: családi házak festése és felújítása, glettelés, gépi nemesvakolat szórás, homlokzatfestés. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Monorierdőn',
    lead: 'Monorierdei családi házak festése, felújítása és homlokzata, egy ajánlatban és egy emberrel.',
    services: ['festes', 'regi', 'vakolat', 'glett', 'uj'],
    local: [
      'Monorierdőn sok házat korábban hétvégi háznak használtak, most pedig állandó otthon lesz belőlük. Ilyenkor a teljes belső felület felújítása és a homlokzat is szóba jön.',
      'A felméréskor minden helyiséget és, ha kéred, a homlokzatot is megnézem, hogy egy kiszállással lásd a teljes munkát és az árát.'
    ],
    faq: [
      ['Hétvégi házból átalakított épületet is felújítasz?', 'Igen. Ilyenkor a falak állapotát és a nedvességet alaposan megnézem, mert ez dönti el, hogyan haladjunk.'],
      ['Mennyibe kerül a felmérés?', 'A felmérés ingyenes.']
    ]
  },
  {
    slug: 'festo-maglod', place: 'Maglód', in: 'Maglódon', adj: 'maglódi',
    title: 'Festő Maglódon – új házak festése, glettelés, felújítás',
    desc: 'Festő Maglódon: új építésű házak glettelése és festése, lakásfestés, régi falak felújítása, nemesvakolat. Ingyenes felmérés, tételes, fix áras ajánlat.',
    h1: 'Festő Maglódon',
    lead: 'Maglódi új és régebbi házak festése, glettelése és felújítása, Üllőről rövid úton.',
    services: ['uj', 'glett', 'festes', 'regi', 'vakolat'],
    local: [
      'Maglódon sok új ház épült, és ezeknél a belső felületek elkészítése komoly munka: glettelés, csiszolás, alapozás, két réteg festés. Gépi glettel és festékszórással a nagy felület is egyenletesebb lesz, és gyorsabban halad.',
      'Ha lakott házban kell dolgoznom, helyiségenként haladok, hogy mindig maradjon használható rész. A bútorokat előtte kérlek, pakold el vagy told középre, mert egyedül dolgozom, és bútort nem mozgatok.'
    ],
    faq: [
      ['Gipszkartont is festesz?', 'Igen. Az illesztéseket és a csavarfejeket glettelés után festem, hogy ne látsszanak.'],
      ['Mennyi idő alatt kapok ajánlatot?', 'Az ajánlatkérés után 24 órán belül jelentkezem, a felmérés után pedig írásban küldöm el az árat.']
    ]
  },
  {
    slug: 'festo-gyal', place: 'Gyál', in: 'Gyálon', adj: 'gyáli',
    title: 'Festő Gyálon – szobafestés, glettelés, falfelújítás',
    desc: 'Szobafestő Gyálon: lakások és családi házak festése, glettelés, régi falak felújítása, gépi nemesvakolat szórás. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Gyálon',
    lead: 'Gyáli lakások és családi házak festése, glettelése és felújítása. Egy szobát és egy egész házat is vállalok.',
    services: ['festes', 'glett', 'regi', 'vakolat', 'kicsi'],
    local: [
      'Gyálon sok a többször bővített családi ház, ahol a helyiségek falai más-más korúak és állapotúak. Helyiségenként nézem meg, hol elég egy friss festés, és hol kell a régi rétegeket lekaparni és újraglettelni. Az ajánlatot is helyiségenként bontom.',
      'Ha csak egy gyerekszobát vagy egy ablakcsere után megsérült falat szeretnél rendbe tenni, azt is elvállalom.'
    ],
    faq: [
      ['Egyetlen szoba festését is vállalod?', 'Igen. Az ajánlatkérőben elég egy helyiséget megadni.'],
      ['Mennyi a kiszállás?', 'A felmérés ingyenes. A pontos árat a felmérés után írásban küldöm.']
    ]
  },
  {
    slug: 'festo-kistarcsa', place: 'Kistarcsa', in: 'Kistarcsán', adj: 'kistarcsai',
    title: 'Festő Kistarcsán – szobafestés, glettelés, felújítás',
    desc: 'Festő Kistarcsán: lakások és családi házak festése, glettelés, régi falak felújítása, gépi nemesvakolat szórás. Ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Kistarcsán',
    lead: 'Kistarcsai lakások és családi házak festése, glettelése és felújítása.',
    services: ['festes', 'glett', 'regi', 'vakolat', 'kicsi'],
    local: [
      'Kistarcsán lakásokban és családi házakban is dolgozom. Lakásnál a gyors és tiszta munka a legfontosabb: helyiségenként haladok, a padlót és a bent maradt bútort letakarom, és minden nap után összetakarítok.',
      'Családi háznál gyakran a homlokzat is esedékes. Ha mindkettőt tervezed, egy felméréssel megnézem, és egy ajánlatban írom le.'
    ],
    faq: [
      ['Lakott lakásban is festesz?', 'Igen. A bútorokat előtte kérlek, told a szoba közepére vagy pakold ki, mert mozgatást nem vállalok. Amit bent hagysz, letakarom.'],
      ['Milyen festéket használsz?', 'A helyiséghez illőt: más kell a hálószobába, és más a fürdőszobába vagy a konyhába. Ha konkrét márkát szeretnél, azzal dolgozom.']
    ]
  },
  {
    slug: 'festo-budapest', place: 'Budapest', in: 'Budapesten', adj: 'budapesti',
    title: 'Festő Budapesten – szobafestés, lakásfestés, glettelés',
    desc: 'Szobafestő Budapest keleti és déli kerületeiben: lakásfestés, glettelés, régi falak felújítása. Üllőről járok be, ingyenes felmérés, fix áras ajánlat.',
    h1: 'Festő Budapesten',
    lead: 'Lakások és családi házak festése Budapesten, főleg a keleti és déli kerületekben, amelyek Üllőről a legközelebb vannak.',
    services: ['festes', 'glett', 'regi', 'uj', 'kicsi'],
    local: [
      'Budapesten a legtöbb munkám lakott lakásban van: panelben, téglaépítésű bérházban vagy kertvárosi házban. A bútorokat előtte kérlek, pakold el vagy told középre, mert egyedül dolgozom, és bútort nem mozgatok. A padlót, a nyílászárókat és ami bent marad, letakarom.',
      'A régi pesti bérházakban gyakori a sokszor átfestett, mállott vagy repedezett fal. Ezeket nem festem át még egyszer: lekaparom, glettelek, csiszolok, és csak utána festek.'
    ],
    faq: [
      ['Melyik kerületekben dolgozol?', 'Leginkább a XVII., XVIII., X., XIX. és XXIII. kerületben, mert ezek vannak Üllőhöz a legközelebb. Más kerületbe is elmegyek, ha megbeszéljük.'],
      ['Mennyi idő alatt készül el egy lakás?', 'A mérettől és a falak állapotától függ. Egy jó állapotú kétszobás lakás festése pár nap, kaparással és gletteléssel több. A felmérés után megírom.']
    ]
  }
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(p) {
  const url = `${BASE}/${p.slug}.html`;
  const others = PAGES.filter(o => o.slug !== p.slug);
  const area = p.slug.startsWith('festo-') ? { '@type': 'City', name: p.place } : PAGES.filter(o => o.slug.startsWith('festo-')).map(o => ({ '@type': 'City', name: o.place }));
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Service', name: p.h1, serviceType: p.slug === 'homlokzat-nemesvakolat' ? 'Gépi nemesvakolat szórás, homlokzatfestés' : 'Szobafestés, glettelés, falfelújítás',
      url, description: p.desc, areaServed: area,
      provider: { '@type': 'HousePainter', '@id': BASE + '/#ceg', name: BRAND, url: BASE + '/', telephone: PHONE,
        address: { '@type': 'PostalAddress', addressLocality: 'Üllő', postalCode: '2225', addressRegion: 'Pest', addressCountry: 'HU' } }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Főoldal', item: BASE + '/' }, { '@type': 'ListItem', position: 2, name: p.h1, item: url }]
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
<meta property="og:site_name" content="${BRAND}">
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
<body data-page="${p.slug}">
<!-- Generálva: seo/oldalak.mjs. A szöveget az admin „Aloldalak szövegei” menüjében is átírhatod. -->
<nav class="topnav solid" id="topnav" aria-label="Fő menü">
  <a class="brand" href="index.html" aria-label="${BRAND} főoldal">PLAN<i><b></b><b></b><b></b></i>RVO</a>
  <div class="links" id="navLinks">
    <a href="index.html#szolgaltatasok">Szolgáltatások</a>
    <a href="index.html#munkaink">Munkáink</a>
    <a href="index.html#gyik">GYIK</a>
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
    <h1 data-edit="h1">${esc(p.h1)}</h1>
    <p class="lead" data-edit="lead">${esc(p.lead)}</p>
    <div class="btns"><a class="btn gold" href="index.html#arajanlat">Árajánlatot kérek</a><a class="btn o" href="tel:${PHONE.replace(/\s/g, '')}">Hívás: ${PHONE}</a></div>

    <div class="area-body" data-edit="body" data-rich>
    <h2>Milyen munkát vállalok ${esc(p.in)}?</h2>
    <ul>${p.services.map(k => `<li>${esc(SERVICES[k])}</li>`).join('')}</ul>

    <h2>${esc(p.adj.charAt(0).toUpperCase() + p.adj.slice(1))} munkák</h2>
    ${p.local.map(t => `<p>${esc(t)}</p>`).join('\n    ')}

    <h2>Így dolgozom</h2>
    <ol>
      <li><b>Ajánlatkérés:</b> a főoldalon helyiségenként megadod, mit szeretnél, vagy felhívsz. 24 órán belül jelentkezem.</li>
      <li><b>Ingyenes felmérés</b> a helyszínen: megnézem a falakat, megbeszéljük a színeket, az anyagot és a kezdés napját.</li>
      <li><b>Írásos, fix áras ajánlat</b> helyiségenként és munkánként bontva. Ami benne van, azt fizeted.</li>
      <li><b>Munka és átadás:</b> letakarok, dolgozom, takarítok, és együtt átnézzük a falakat.</li>
    </ol>
    <p>Egyedül dolgozom, ezért bútormozgatást nem vállalok: a bútorokat a munka előtt kérlek, pakold el vagy told a szoba közepére. Az anyagot kérésre beszerzem, de csak előre fizetéssel.</p>

    <h2>Kérdések ${esc(p.in)}</h2>
    ${p.faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n    ')}
    </div>

    <div class="area-cta">
      <p><b>Kérj ajánlatot.</b> Pár perc az egész, a felmérés ingyenes.</p>
      <a class="btn gold" href="index.html#arajanlat">Árajánlatot kérek</a>
    </div>

    <h2>Máshol is dolgozom</h2>
    <ul class="area-links">${others.map(o => `<li><a href="${o.slug}.html">${esc(o.h1)}</a></li>`).join('')}</ul>
  </article>
</main>
<footer class="site">
  <a class="brand" href="index.html">PLAN<i><b></b><b></b><b></b></i>RVO</a>
  <em data-t="footer_text">PLANERVO – festő Üllőn és környékén</em>
  <nav aria-label="Lábléc"><a href="index.html">Főoldal</a><a href="blog.html">Blog</a><a href="adatkezeles.html">Adatkezelés</a><a href="impresszum.html">Impresszum</a><a href="sutik.html">Sütik</a></nav>
</footer>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
<script src="assets/shared.js"></script>
<script>(async () => { let TX = { ...TEXT_DEFAULTS }; try { TX = await loadTexts(); } catch (e) {} document.querySelectorAll('[data-t]').forEach(el => { if (TX[el.dataset.t]) el.textContent = TX[el.dataset.t]; }); applyPageTexts(document.body.dataset.page, TX); })();</script>
</body>
</html>
`;
}

for (const p of PAGES) fs.writeFileSync(path.join(ROOT, p.slug + '.html'), page(p));

/* sitemap.xml: főoldal, helyi oldalak, blog, jogi oldalak (a blogbejegyzéseket az admin sitemap-letöltése adja hozzá) */
const today = new Date().toISOString().slice(0, 10);
const urls = [[BASE + '/', '1.0', 'weekly'], ...PAGES.map(p => [`${BASE}/${p.slug}.html`, p.main ? '0.9' : '0.8', 'monthly']), [BASE + '/blog.html', '0.6', 'weekly'],
  ...['adatkezeles.html', 'impresszum.html', 'sutik.html'].map(f => [`${BASE}/${f}`, '0.2', 'yearly'])];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([u, pr, f]) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n') + '\n</urlset>\n');

console.log(`${PAGES.length} oldal és a sitemap.xml elkészült.`);
