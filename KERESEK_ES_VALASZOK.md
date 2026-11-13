# PLANERVO weboldal – kérések és válaszok naplója

## 1. kérés
Készíts egy ötletes, modern, elegáns szobafestő weboldalt, valamilyen effekttel. Több variációt, hogy lehessen választani.
**Válasz:** 3 variáció egy oldalon (`variaciok/planervo-szobafesto.html`): Festékfolt (egérkövető színes foltok), Reflektor (kurzorfény festi a címet), Festőhenger (falszín-választó, a henger végigmegy a hero-n).

## 2. kérés
Valami olyan kéne, ahol görgetek, és egy henger színt fest.
**Válasz:** görgetésvezérelt festőhenger (`planervo-henger-scroll.html`): zöld, majd kék réteg, cikkcakkban festve, végén árajánlat-gomb.

## 3. kérés
Ebből kérek több variációt.
**Válasz:** 4 görgetős variáció (`variaciok/planervo-henger-variaciok.html`): Lefelé, Oldalról, Sávonként, Oszloponként.

## 4. kérés (logó feltöltése + fő kérés)
Az oszlopos variáció tetszik. A henger függőlegesen álljon, és 3 oszlopban fesse ki az oldalt. A PLANERVO arany színét fesse. Egészítsd ki az oldalt előtte-utána képekkel, effektekkel. Legyen kapcsolatok rész, YouTube-videónak hely, árajánlat-kalkulátor.
**Válasz:** teljes oldal (`planervo-oldal.html` + `logo.png`): hero 3 oszlopos, arany festékkel, szolgáltatások, előtte–utána csúszka (automatikus söprés), videó-hely, árajánlat-kalkulátor, kapcsolat-űrlap és elérhetőségek.

## 5. kérés
A henger 90 fokkal legyen elforgatva.
**Válasz:** a henger vízszintes lett, a függőleges festés megmaradt.

## 6. kérés
A főoldal a PLANERVO logó legyen, és görgetésnél arra fessen rá a henger.
**Válasz:** a főoldal a logó (fehér alapon), a henger aranyra festi, a végén a „Minőség minden rétegben.” szöveg látszik.

## 7. kérés
Készítsd el a forráskódot az összes kérésemmel és a válaszaiddal együtt, HTML fájllal együtt.
**Válasz:** ez a mappa. A fő oldal a `planervo-oldal.html` (a `logo.png`-vel együtt használandó), a korábbi variációk a `variaciok/` mappában.

---

## Fájlok
- `planervo-oldal.html` – a végleges, teljes oldal (szerkesztendő beállítások: `CONFIG` blokk a script elején)
- `logo.png` – a PLANERVO logó (az oldal ugyanabban a mappában várja)
- `variaciok/planervo-szobafesto.html` – 1. kérés, 3 variáció
- `variaciok/planervo-henger-scroll.html` – 2. kérés
- `variaciok/planervo-henger-variaciok.html` – 3. kérés, 4 variáció

## Szerkesztendő tételek (planervo-oldal.html)
- `CONFIG.youtube` – a YouTube-videó azonosítója
- `CONFIG.pairs` – előtte–utána képek URL-jei
- `CONFIG.services` – szolgáltatások neve és Ft/m² ára
- `CONFIG.email` – kapcsolati e-mail
- Telefonszám és nyitvatartás a Kapcsolat részben (kitalált minta)

## Ismert korlátok
- Az űrlap nem küld üzenetet, csak előkészíti a szöveget (másolható). Valódi küldéshez háttérszolgáltatás kell (pl. Supabase, ahogy a korábbi tervben volt).
- A YouTube-videó új lapon nyílik meg, beágyazva nem jeleníthető meg.

---

## 8. kérés
Admin menü Supabase-szel (projekt: jodzzaqawursaidefdea), ahol az oldal adatai szerkeszthetők és új dolgok adhatók hozzá. Árajánlatkérő: helyiségek hozzáadása alapterülettel és belmagassággal, munkafolyamatok helyiségenként, képek csatolása helyiségenként, név, e-mail, telefon, település. A kérés jelenjen meg az adminban, és menjen e-mailben a planervo@gmail.com címre. Munkafolyamatok és munkadíjak az adminból. YouTube-videók megosztása a főoldalon. Blog szövegszerkesztővel és borítóképpel. Képgaléria feltöltéssel. Az oldal szövegeinek szerkesztése. Új ablakok hozzáadása a főoldalra. Előtte–utána ablakok szerkesztése.
**Válasz:** teljes weboldal a `planervo-weboldal/` mappában: `index.html`, `blog.html`, `admin.html`, `assets/`, `supabase/schema.sql` (adatbázis, jogosultságok, tárhely), `supabase/functions/notify-quote` (e-mail értesítő Resenddel). Telepítési lépések: `planervo-weboldal/README.md`.
