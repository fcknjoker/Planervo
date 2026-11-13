# PLANERVO weboldal – telepítési útmutató

Statikus weboldal (HTML + JS) Supabase háttérrel. Bármilyen tárhelyre feltölthető
(pl. Netlify, Vercel, cPanel), szerver nem kell hozzá.

## Fájlok

| Fájl | Mi ez |
|---|---|
| `index.html` | Főoldal: festőhengeres logó, szolgáltatások, saját ablakok, előtte–utána, galéria, videók, blog-előnézet, árajánlatkérő, kapcsolat |
| `blog.html` | Blog lista és egyes bejegyzések (`blog.html?p=webcim`) |
| `admin.html` | Admin felület (belépés után) |
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

## Admin felület (`/admin.html`)

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
