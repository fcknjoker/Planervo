# PLANERVO weboldal

Statikus weboldal (HTML, CSS, JavaScript) Supabase-háttérrel. Bármilyen statikus tárhelyre feltölthető
(GitHub Pages, Netlify, cPanel), szerver nem kell hozzá. Ugyanazt a Supabase-adatbázist használja, mint a korábbi változat,
így minden tartalom, beállítás és árajánlat-kérés megmarad.

## Mappaszerkezet

| Elem | Mi ez |
|---|---|
| `index.html` | Főoldal: felépülő logó és festőhenger, szolgáltatások, számok, folyamat, előtte–utána, galéria, vélemények, közösségi média, videók, blog, GYIK, árajánlatkérő, kapcsolat |
| `festo-*.html`, `homlokzat-nemesvakolat.html` | Helyi keresőoldalak (az `eszkozok/oldalak.mjs` készíti) |
| `blog.html` | Blog lista és bejegyzések (`blog.html?p=webcim`) |
| `velemeny.html` | Vélemény beküldése (nem indexelt) |
| `adatkezeles.html`, `impresszum.html`, `sutik.html` | Jogi oldalak (nem indexeltek) |
| `404.html` | Hibaoldal nem létező címekhez |
| `belepes-7k2m9x.html` | Admin felület. Titkos cím, sehol nincs belinkelve, a keresők nem indexelik |
| `sitemap.xml`, `robots.txt`, `CNAME` | Keresőknek, illetve a planervo.hu domainhez (GitHub Pages) |
| `assets/style.css` | A nyilvános oldalak teljes megjelenése (a betűtípussal együtt) |
| `assets/shared.js` | Közös beállítások: Supabase-cím és nyilvános kulcs, szerkeszthető szövegek, segédfüggvények |
| `assets/site.js` | A főoldal működése és mozgásai |
| `assets/blog.js`, `legal.js`, `review.js`, `page.js` | Az aloldalak működése |
| `assets/pdf.js` | PDF-becslés letöltése (a pdfmake csak gombnyomásra töltődik be) |
| `assets/admin.js`, `admin.css`, `arlista.js` | Admin felület és a betölthető alap árlista |
| `eszkozok/` | Csak a géphez: oldalgenerátor és helyi megtekintő. **Nem kell feltölteni** |
| `supabase/` | Adatbázis-kiegészítések és a `youtube-feed` függvény. **Nem kell feltölteni** |

## Feltöltés

Töltsd fel a mappa tartalmát a tárhely gyökerébe, az `eszkozok` és a `supabase` mappa kivételével.
A régi változatból maradt fájlokat érdemes törölni a tárhelyről: `assets/uj.css`, `assets/uj.js`, `assets/fonts/fonts.css`,
`assets/fonts/cormorant-*.woff2`, `assets/fonts/jost-*-400.woff2`, `assets/fonts/jost-*-var.woff2`, `assets/ures.txt`, `logo.png`,
`admin.html`, `homlokzatfestes-hoszigeteles.html`, `KERESEK_ES_VALASZOK.md`, `inditas.bat`, `seo/`.

Az oldal csak webcímről működik, a számítógépen dupla kattintással megnyitva (`file://`) nem.

## Helyi megtekintés

```bash
node eszkozok/szerver.mjs
```

Utána: http://localhost:8091/

## Helyi keresőoldalak és sitemap

A helyi oldalak kiinduló szövege az `eszkozok/oldalak.mjs` fájlban van. Ha ott módosítasz, futtasd újra:

```bash
node eszkozok/oldalak.mjs
```

Ez újraírja a `festo-*.html`, a `homlokzat-nemesvakolat.html` és a `sitemap.xml` fájlt. Feltöltés nélkül az admin
„Aloldalak szövegei” menüjében is átírhatod őket. A blogbejegyzésekkel bővített sitemapet az admin „Megjelenés” oldalán töltheted le.

## Supabase

Az adatbázis már be van állítva, új teendő nincs. A `supabase` mappa SQL-fájljai az eddigi bővítések
(mind többször is futtatható, adatot nem töröl); csak akkor kellenek, ha egy új Supabase-projektet állítasz be.

- **Admin felhasználó:** Authentication → Users. Új admin e-mail-címet az SQL Editorban adhatsz hozzá:
  `insert into public.admins(email) values ('masik@cim.hu');`
- **E-mail értesítés új árajánlatról:** a `notify-quote` Edge Function (Resend). Titkok: `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`.
- **YouTube-videók:** a `youtube-feed` Edge Function (`supabase/functions/youtube-feed/index.ts`), a **Verify JWT** kikapcsolva.
  CLI-vel: `supabase functions deploy youtube-feed --no-verify-jwt --project-ref jodzzaqawursaidefdea`

A `sb_publishable_…` kulcs nyilvános, a helye a `shared.js`-ben van. A secret / service_role kulcsot soha ne tedd a fájlokba.
Az adatokat a sorszintű jogosultságok (RLS) védik; az ügyfelek fotói privát tárhelyre kerülnek, csak az admin látja őket.

## Mi változott az előző változathoz képest

**Kód**
- A két, egymást felülíró stíluslap (`style.css` + `uj.css`) és a külön betűtípus-fájl egyetlen `style.css`-be került, a felülírt, már nem érvényes szabályok nélkül.
- A főoldal két szkriptje (`site.js` + `uj.js`) egy fájl lett. A logó-felépülés animációja CSS-ben fut, így a GSAP könyvtár (kb. 70 KB) kikerült.
- Kikerültek a régi fejlesztésekből maradt megjegyzések, a nem használt betűtípusok (Cormorant, dupla Jost-fájlok), az üres és felesleges fájlok.
- Minden külső könyvtár SRI-ellenőrzéssel (integrity) töltődik.

**Javított hibák**
- A mobil menü pontjai a panel széléhez tapadtak (egymást felülíró stílusok miatt).
- A jogi oldalak és a vélemény-oldal teteje a rögzített menü alá csúszott.
- A közlemény sáv megjelenésekor a főoldal teteje nem húzódott lejjebb.
- A felső menü logójának „E” betűje eltűnt az arany háttér előtt.
- Az árajánlat összegének kiemelő animációja minden képkockában újraindult.
- A vélemény-oldal hibaüzenete nem volt piros.
- Az admin „Aloldalak szövegei” menüje a jogi oldalaknál a mentett szöveget mutatta „eredeti” helyett.
- Az admin Áttekintés mindig azt írta, hogy a telefonszám még a minta.
- Az előtte–utána képarány „4:3 (alap)” néven szerepelt, pedig az alap 16:9.
- A „Munkáim” link üres szakaszra vitt, ha nem volt előtte–utána kép (most a galériára mutat, vagy eltűnik).
- Egyes szám első személy mindenhol: „Munkáim”, „Hogyan dolgozom”, „szünetelek”.

**Keresőoptimalizálás**
- `WebSite` és bővebb `HousePainter` strukturált adat, nemzetközi formátumú telefonszám.
- Blog: statikus főcím és bevezető (JavaScript nélkül is olvasható), `Blog`, `BlogPosting` és morzsamenü-adat, `article:*` meta.
- Morzsamenü a helyi oldalakon és a blogon (látható és strukturált adatként is).
- A belső linkek a `./` főoldalra mutatnak (nem `index.html`-re), így nincs duplikált cím.
- A nem indexelt oldalakról lekerült a canonical, a 404-es oldal is `noindex`.
- `preconnect` a Supabase és a CDN felé, a betűtípus előtöltése, szélesség/magasság a videó-bélyegképeken.

**Új: lebegő kapcsolat-kártya** a főoldal jobb szélén (telefonszám és közösségi ikonok). Az admin „Lebegő kártya” menüjében szerkeszthető; mentés a `settings` tábla `texts` rekordjának `float` mezőjébe történik, adatbázis-módosítás nem kell.
