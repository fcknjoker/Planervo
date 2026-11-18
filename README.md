# PLANERVO weboldal – telepítési útmutató

Statikus weboldal (HTML + JS) Supabase háttérrel. Bármilyen tárhelyre feltölthető
(pl. Netlify, Vercel, cPanel), szerver nem kell hozzá.

## Fájlok

| Fájl | Mi ez |
|---|---|
| `index.html` | Főoldal: festőhengeres logó, szolgáltatások, saját ablakok, előtte–utána, galéria, videók, blog-előnézet, árajánlatkérő, kapcsolat |
| `blog.html` | Blog lista és egyes bejegyzések (`blog.html?p=webcim`) |
| `belepes-7k2m9x.html` (titkos cím, sehol nincs belinkelve) | Admin felület (belépés után) |
| `logo.png` | Alapértelmezett logó (az adminban lecserélhető) |
| `assets/shared.js` | Közös beállítások: **itt van a Supabase URL és a nyilvános kulcs** |
| `assets/site.js`, `assets/blog.js`, `assets/admin.js` | Az oldalak működése |
| `assets/style.css`, `assets/admin.css` | Megjelenés |
| `supabase/schema.sql` | Adatbázis, jogosultságok, tárhely, kezdő adatok |
| `supabase/functions/notify-quote/index.ts` | E-mail értesítő új árajánlat-kérésről |

## 1. Adatbázis létrehozása

1. Nyisd meg a Supabase projektet → **SQL Editor** → **New query**.
2. Másold be a `supabase/schema.sql` teljes tartalmát, majd **Run**.
   Létrejönnek a táblák, a jogosultságok, a `media` (nyilvános) és a `quote-uploads` (privát) tárhely,
   valamint néhány minta szolgáltatás és munkafolyamat. **A munkadíjak példák**, az adminban írd át őket.

## 2. Admin felhasználó

1. **Authentication → Users → Add user → Create new user**
   - e-mail: `planervo@gmail.com`, jelszó: amit szeretnél, **Auto Confirm User** bekapcsolva.
2. **Authentication → Sign In / Providers**: kapcsold ki az **Allow new users to sign up** opciót,
   így más nem tud regisztrálni.
3. **Authentication → URL Configuration → Site URL**: add meg a weboldal címét
   (pl. `https://planervo.hu`). Ez kell az „Elfelejtettem a jelszót” levélhez.

Másik admin e-mail-címet az SQL Editorban így adhatsz hozzá:
```sql
insert into public.admins(email) values ('masik@cim.hu');
```

## 3. E-mail értesítés (planervo@gmail.com)

A levelet a [Resend](https://resend.com) szolgáltatás küldi (havi 3000 levél ingyenes).

1. Regisztrálj a Resendnél **a planervo@gmail.com címmel**, és hozz létre egy API kulcsot.
   A tesztfeladó (`onboarding@resend.dev`) csak a regisztrált címre küld, ami itt pont jó.
   Ha később saját domainről (pl. `ajanlat@planervo.hu`) küldenél, a Resendben igazold a domaint,
   és írd át a `MAIL_FROM` értéket.
2. Telepítsd a függvényt. Két lehetőség:

   **a) Supabase Dashboardon:** Edge Functions → **Deploy a new function** → Via Editor →
   név: `notify-quote` → illeszd be az `index.ts` tartalmát → Deploy.
   Utána a függvény beállításainál kapcsold **ki** a **Verify JWT** opciót.
   Edge Functions → **Secrets**: add hozzá:
   - `RESEND_API_KEY` = a Resend kulcs
   - `MAIL_TO` = `planervo@gmail.com`
   - `MAIL_FROM` = `PLANERVO <onboarding@resend.dev>`

   **b) Supabase CLI-vel:**
   ```bash
   supabase functions deploy notify-quote --no-verify-jwt --project-ref jodzzaqawursaidefdea
   supabase secrets set RESEND_API_KEY=re_xxx MAIL_TO=planervo@gmail.com \
     MAIL_FROM="PLANERVO <onboarding@resend.dev>" --project-ref jodzzaqawursaidefdea
   ```

A levél tartalmazza a helyiségeket, a kiválasztott munkákat, a becsült árat és a fotók
7 napig érvényes letöltési linkjeit. A kérés e-mail nélkül is megjelenik az adminban.

## 4. Feltöltés a tárhelyre

Töltsd fel a mappa teljes tartalmát (a `supabase` mappa kivételével) a tárhely gyökerébe.
Az oldal csak webcímről működik, a számítógépen dupla kattintással megnyitva (`file://`) nem.

## Árlista és fal / mennyezet választás (2026. november)

1. Supabase → **SQL Editor** → futtasd le a `supabase/2026-11-arlista.sql` fájlt (egyszer kell, adatot nem töröl).
   Ez felveszi a mennyezet külön munkadíját és az új mértékegységeket.
2. Admin → **Munkafolyamatok és díjak** → **Árlista betöltése**. Betölti a kb. 100 tételes árlistát
   (csak munkadíj, `assets/arlista.js`). Rákérdez, hogy a régi tételeket elrejtse-e.
3. Utána minden tétel szerkeszthető: megnevezés, kategória, mértékegység, munkadíj, mennyezet díja.

Mértékegységek: a **fal és/vagy mennyezet** tételnél az ügyfél választ (Fal / Mennyezet / Mindkettő);
az **m² (megadott)**, **folyóméter** és **darab** tételnél az ügyfél írja be a mennyiséget.

## Videós ablak: YouTube-csatorna vagy lejátszási lista (2026. november)

A főoldal videói automatikusan jöhetnek a YouTube-csatornádról (a legújabb elöl) vagy egy lejátszási listából.
Ehhez egy kis függvény kell a Supabase-ben, API-kulcs nem kell hozzá:

1. Supabase → **Edge Functions** → **Deploy a new function** → Via Editor → név: `youtube-feed` →
   illeszd be a `supabase/functions/youtube-feed/index.ts` tartalmát → **Deploy**.
2. A függvény beállításainál kapcsold **ki** a **Verify JWT** opciót (ugyanúgy, mint a `notify-quote`-nál).
   CLI-vel: `supabase functions deploy youtube-feed --no-verify-jwt --project-ref jodzzaqawursaidefdea`
3. Admin → **YouTube-videók** → felül válaszd ki a forrást (csatorna / lejátszási lista / kézi),
   add meg a linket, nyomd meg a **Kipróbálom** gombot, majd **Beállítás mentése**.

A függvény a YouTube csatornaoldalát olvassa (a YouTube RSS-hírcsatornája leállt, ezért nem az kell). Legfeljebb 15 videót ad ki, a dátum helyett a YouTube saját szövegével (pl. „2 héttel ezelőtt"). Ha a lekérés nem sikerül, a kézzel felvett videók jelennek meg.

**Ha a függvényt már korábban telepítetted:** nyisd meg újra a `youtube-feed` függvényt a Supabase-ben, cseréld ki a kódot a `supabase/functions/youtube-feed/index.ts` friss tartalmára, és nyomd meg a Deploy gombot.

## Közösségi média ablak (2026. november)

Supabase → SQL Editor → futtasd le a `supabase/2026-11-kozossegi.sql` fájlt, utána az admin
**Közösségi média** menüjében adhatod hozzá az Instagram-, TikTok- és Facebook-bejegyzéseket.

## Megjelenés, elrendezés és új admin funkciók (2026. november)

Új SQL nem kell hozzá, minden a meglévő beállítás-táblába kerül. Töltsd fel az `index.html`, `belepes-7k2m9x.html` (titkos cím, sehol nincs belinkelve) és az `assets` mappa fájljait.

- **Megjelenés és elrendezés** (admin menü): szakaszok sorrendje, láthatósága, háttere; szakaszonként a kártyák módja (lefelé rács vagy oldalra lapozható sáv), hány férjen egymás mellé, távolság, sarkok, képarány; tartalom szélessége, szakaszok közti térköz, kiemelő szín; közlemény sáv az oldal tetején; oldalcím és leírás a keresőknek. Jobbra élő előnézet asztali, tablet és telefon méretben, mentés előtt is.
- **Áttekintés**: új kérések, tartalmak száma, tennivalók.
- **Árlista**: „Árak módosítása” gomb (százalékos emelés/csökkentés kategóriánként, kerekítéssel), minden listában „Másolás” gomb.
- **Árajánlat-kérések**: keresés és CSV letöltés (Excelben megnyitható).
- **Mentés és visszaállítás**: a teljes tartalom egy fájlba menthető és visszatölthető (az árajánlat-kérések és a képfájlok nélkül).

## 1. fázis: vélemények, lépések, jogi oldalak, SEO (2026. december)

1. Supabase → SQL Editor → futtasd le a `supabase/2026-12-bovites.sql` fájlt (vélemények és „Hogyan dolgozunk” lépések tábla, az öt alap lépéssel).
2. Töltsd fel az egész mappát (új: `adatkezeles.html`, `impresszum.html`, `sutik.html`, `velemeny.html`, `robots.txt`, `assets/fonts`, `assets/legal.js`, `assets/review.js`).
3. Admin → **Oldal szövegei** → töltsd ki a **Jogi adatok** és a **Keresők (SEO)** csoportot (cégnév, székhely, adószám, tárhely, az oldal webcíme). Amíg hiányoznak, az adatkezelési és impresszum oldalon sárgán jelölve látszanak. A jogi szöveg sablon, élesítés előtt érdemes jogásszal átnézetni.
4. Admin → **Vélemények**: vegyél fel véleményt kézzel, vagy küldd el az ügyfeleknek a `velemeny.html` linkjét. A beküldött vélemény jóváhagyásig nem látszik (Jóváhagyva kapcsoló).
5. Admin → **Hogyan dolgozunk**: a lépések szerkeszthetők. Admin → **Megjelenés és elrendezés** → Keresők: a **Sitemap letöltése** gomb elkészíti a sitemap.xml fájlt (előbb add meg az oldal webcímét), töltsd fel a főoldal mellé, és add meg a Google Search Console-ban.
6. A betűtípusok az `assets/fonts` mappából töltődnek, a Google Fonts-hoz az oldal már nem fordul.

## Admin felület (`/belepes-7k2m9x.html`)

- **Árajánlat-kérések:** beérkezett kérések, állapot (Új, Folyamatban, Ajánlat elküldve, Elfogadva, Lezárva),
  saját jegyzet, csatolt fotók, törlés. Az új kérések száma a menüben látszik.
- **Munkafolyamatok és díjak:** az árajánlatkérőben választható munkák. Mértékegységek:
  falfelület m², mennyezet m², fal + mennyezet m², alapterület m², darab, helyiségenkénti átalány.
  A falfelületet az alapterületből és a belmagasságból számolja (négyzetes alaprajzzal becsülve).
- **Oldal szövegei:** minden cím, bevezető, elérhetőség, logó, közösségi linkek, és hogy az ügyfél lássa-e a becsült árat.
- **Főoldal ablakok:** új szakaszok szöveggel, képpel, gombbal; elrendezés, háttérszín és hely választható.
- **Szolgáltatások, Előtte–utána, Galéria (több kép egyszerre), YouTube-videók:** hozzáadás, szerkesztés,
  elrejtés, sorrend nyilakkal.
- **Blog:** szövegszerkesztő (címsorok, félkövér, listák, idézet, link, kép, videó), borítókép,
  rövid bevezető, webcím, időzített megjelenés, piszkozat.

## Biztonság

- A `sb_publishable_…` kulcs nyilvános, a weboldalon a helye. A **secret / service_role kulcsot soha ne tedd a fájlokba**.
- Az adatbázist a sorszintű jogosultságok (RLS) védik: a látogató csak a látható tartalmat olvassa,
  árajánlatot csak beküldeni tud, olvasni nem. Szerkeszteni csak az `admins` táblában szereplő fiók tud.
- Az ügyfelek fotói privát tárhelyre kerülnek, csak az admin látja őket.

## Amit érdemes még beállítani

- Adatkezelési tájékoztató (GDPR) oldal, és a linkje a hozzájárulás szövegébe.
- Saját domain a Resendben, hogy a levél ne a tesztcímről jöjjön.

## 2. fázis: kalkulátor és időpontkérés

**Egyszeri teendő:** a Supabase-ben (SQL Editor) futtasd le újra a `supabase/2026-12-bovites.sql` fájlt (többször futtatható). Ez adja az új `quotes` oszlopokat (ár-sáv, kedvezmény, kívánt időpontok, felmérés időpontja) és az „Időpont megbeszélve” állapotot. Amíg nem futtattad, az űrlap működik, de az új adatok a megjegyzés végére kerülnek, és az admin időpont-mentése hibát jelez.

- **Ár-sáv, akció, időpontkérés beállításai:** Admin → Oldal szövegei → *Árajánlatkérés* (sáv ±%, akció be/ki, felirat, százalék, lejárat, időpontkérés be/ki).
- **Látogatói oldal:** ár-sáv, helyiség másolása, akció sor, PDF letöltés (a pdfmake a gombra tölt be a jsdelivr CDN-ről), legfeljebb 3 kívánt időpont, lépésjelző.
- **Admin → Árajánlatok:** kívánt időpontok, ár-sáv, akció a részleteknél; „Felmérés időpontja” + megjegyzés mentése (állapot automatikusan „Időpont megbeszélve”), `.ics` letöltés és Google Naptár link; az Áttekintésen „Közelgő felmérések”; a CSV új oszlopokkal bővült.

## Új dizájn (ez a mappa: planervo-uj)

Ez a mappa az eredeti PLANERVO oldal teljes másolata, az új dizájnnal. Minden funkció ugyanúgy működik (admin, árajánlatkérő árlistával, PDF, időpontkérés, akció, előtte–utána, galéria, videók, közösségi média, blog, vélemények, jogi oldalak, sütitájékoztató, elrendezés-szerkesztő), ugyanazzal a Supabase-adatbázissal.

**Mi változott**
- Főoldal teteje: betöltéskor a logó háza apránként felépül, görgetésre a henger ugyanúgy aranyra festi a falat, mint eddig.
- Szolgáltatások: nagy, váltakozó kép–szöveg sorok. Az adminban (Szolgáltatások) mostantól képet is adhatsz egy szolgáltatáshoz; kép nélkül a logó színsávjai látszanak.
- Új „Számok sáv” (pl. 24 óra, 5 lépés, 2 réteg, 4 szakma): Admin → Oldal szövegei → Számok sáv. Elrejtés és sorrend: Admin → Megjelenés.
- Hogyan dolgozunk: függőleges, magát megrajzoló idővonal. Előtte–utána: pulzáló csúszka. Galéria: oszlopos, a többi kép elhalványul.
- Vélemények, videók, közösségi média, blog: világos kártyák, egérrel fénycsóva és enyhe dőlés.
- Kapcsolat és lábléc új elrendezésben; minden szakasz világos, és lefelé gördül.
- A dizájn két új fájlban van: `assets/uj.css` (megjelenés) és `assets/uj.js` (mozgások). Az eredeti `style.css` és `site.js` működése megmaradt.

**Egyszeri teendő:** a Supabase SQL Editorban futtasd le a `supabase/2026-12-uj-dizajn.sql` fájlt (a szolgáltatás-képekhez kell). Amíg nem futtattad, minden működik, csak a szolgáltatáshoz nem tudsz képet menteni.

**Élesítés:** ennek a mappának a tartalmát töltsd fel a tárhelyre a régi helyett (előtte érdemes a régit elmenteni).

## Keresőoptimalizálás, GYIK, aloldalak szövegei (2026. november)

1. Supabase → SQL Editor → futtasd le a `supabase/2026-12-seo-gyik-szovegek.sql` fájlt (GYIK-tábla, új szövegek az adatbázisban).
2. Töltsd fel: az összes `.html` fájlt, az `assets` mappát, a `sitemap.xml`-t és a `robots.txt`-t.
3. Töröld a tárhelyről: `admin.html` és `homlokzatfestes-hoszigeteles.html`.
4. Az admin új címe: `/belepes-7k2m9x.html` (sehol nincs belinkelve, a keresők nem indexelik). Tedd el könyvjelzőbe.
5. Search Console: küldd be újra a `https://planervo.hu/sitemap.xml`-t.

A helyi oldalak kiinduló szövege a `seo/oldalak.mjs`-ben van; az admin „Aloldalak szövegei” menüjében átírhatod őket feltöltés nélkül.
