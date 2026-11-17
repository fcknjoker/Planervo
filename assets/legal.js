/* PLANERVO – jogi oldalak (adatkezelés, impresszum, sütik)
   A szöveg sablon; a cégadatokat az admin „Oldal szövegei / Jogi adatok” mezőiből tölti.
   Ami hiányzik, azt kiemelve jelöli, hogy kitöltés nélkül ne maradhasson észrevétlen.
   A sablon nem helyettesíti a jogi tanácsadást: élesítés előtt érdemes ügyvéddel átnézetni. */
(async function () {
  const main = document.getElementById('legalMain');
  const page = document.body.dataset.legal;
  let TX = { ...TEXT_DEFAULTS };
  try { TX = await loadTexts(); } catch (e) { /* alapértelmezett szövegek */ }
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TX[el.dataset.t] || ''; });

  const miss = label => `<mark class="miss">[${esc(label)}: hiányzik]</mark>`;
  const val = (k, label) => TX[k] ? esc(TX[k]) : miss(label);
  const email = TX.legal_email || TX.email || '';
  const mail = email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : miss('E-mail-cím');
  const phone = TX.phone ? esc(TX.phone) : '';
  const hosting = val('legal_hosting', 'Tárhelyszolgáltató');

  const dl = rows => `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const controller = dl([
    ['Név', val('legal_name', 'Vállalkozó vagy cég neve')],
    ['Székhely', val('legal_seat', 'Székhely')],
    ['Adószám', val('legal_tax', 'Adószám')],
    ['Nyilvántartási szám', val('legal_reg', 'Nyilvántartási szám')],
    ['E-mail', mail],
    ...(phone ? [['Telefon', phone]] : [])
  ]);

  const PAGES = {
    privacy: {
      title: 'Adatkezelési tájékoztató',
      html: () => `
        <p class="lead">Ez a tájékoztató azt írja le, milyen személyes adatot kezelünk, ha árajánlatot kérsz tőlünk vagy véleményt írsz, mire használjuk, meddig őrizzük, és milyen jogaid vannak.</p>
        <h2>1. Az adatkezelő</h2>${controller}
        <h2>2. Milyen adatot kezelünk, és miért</h2>
        <h3>Árajánlat-kérés</h3>
        <p>Az árajánlatkérő űrlapon megadott adataidat: név, e-mail-cím, telefonszám, település, megjegyzés, a megadott helyiségek adatai és a kért munkák, valamint az általad feltöltött fotók. Célja az ajánlat elkészítése és a kapcsolatfelvétel veled.</p>
        <p><b>Jogalap:</b> a hozzájárulásod (GDPR 6. cikk (1) a) pont), amelyet az űrlap elküldésével, a jelölőnégyzet bejelölésével adsz meg, illetve a szerződéskötést megelőző lépések megtétele (6. cikk (1) b) pont).</p>
        <p><b>Megőrzés:</b> az ajánlatadás vagy a megkeresés lezárásától számított legfeljebb 1 évig, ha nem jön létre szerződés. Szerződés esetén a vonatkozó számviteli és adózási jogszabályok szerinti ideig. A fotókat a munka lezárása után törölhetjük.</p>
        <h3>Vélemény beküldése</h3>
        <p>Ha véleményt küldesz, a nevedet, a megadott települést és a vélemény szövegét kezeljük. Csak az átnézésünk és a jóváhagyásod után jelenik meg az oldalon. <b>Jogalap:</b> hozzájárulás. <b>Megőrzés:</b> a törlési kérésedig.</p>
        <h3>Kapcsolatfelvétel e-mailben vagy telefonon</h3>
        <p>Ha írsz vagy hívsz, a megadott elérhetőségeidet a válaszadáshoz használjuk (jogalap: jogos érdek, illetve a szerződéskötést megelőző lépés).</p>
        <h3>Látogatottság</h3>
        <p>Az oldal összesített, személyes adatot nem tartalmazó látogatottsági számokat gyűjthet (süti és egyedi azonosító nélkül). Ez alapján téged nem lehet azonosítani.</p>
        <h2>3. Kik férhetnek hozzá az adataidhoz</h2>
        <p>Az adatokat az adatkezelő kezeli. Az oldal működéséhez adatfeldolgozókat veszünk igénybe:</p>
        <ul><li><b>Adatbázis és tárhely:</b> Supabase (az árajánlat-kérések és a feltöltött fotók tárolása).</li>
        <li><b>Értesítő e-mailek:</b> Resend (új árajánlat-kérésről szóló értesítés küldése).</li>
        <li><b>Az oldal tárhelye:</b> ${hosting}</li></ul>
        <p>A YouTube-videókat csak akkor tölti be az oldal, ha a lejátszásra kattintasz (adatvédelmi szempontból kíméletesebb, „nocookie” beágyazással). A videók előnézeti képe a YouTube szervereiről érkezik. Az adataidat harmadik félnek nem adjuk át marketing célra.</p>
        <h2>4. Milyen jogaid vannak</h2>
        <p>Kérheted a rólad tárolt adatok megismerését, helyesbítését, törlését, kezelésének korlátozását, tiltakozhatsz a kezelés ellen, kérheted az adataid kiadását, és bármikor visszavonhatod a hozzájárulásodat (ez nem érinti a korábbi kezelés jogszerűségét). Kérésedet küldd erre a címre: ${mail}. Egy hónapon belül válaszolunk.</p>
        <p>Ha úgy érzed, hogy sérült a jogod, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk Miksa utca 9–11., <a href="https://www.naih.hu" target="_blank" rel="noopener">naih.hu</a>), vagy bírósághoz fordulhatsz.</p>
        <p class="muted">Hatály: ${TX.legal_updated ? esc(TX.legal_updated) : miss('Hatálybalépés dátuma')}</p>`
    },
    imprint: {
      title: 'Impresszum',
      html: () => `
        <p class="lead">Az oldal üzemeltetőjének adatai.</p>
        <h2>Üzemeltető</h2>${controller}
        <h2>Tevékenység</h2><p>Szobafestés, hőszigetelés, felújítás és felületképzés.${TX.area ? ' Munkaterület: ' + esc(TX.area) + '.' : ''}</p>
        <h2>Tárhelyszolgáltató</h2><p>${hosting}</p>
        <h2>Panaszkezelés</h2><p>Észrevételeidet vagy panaszodat küldd erre a címre: ${mail}.</p>`
    },
    cookies: {
      title: 'Sütik és tárolt adatok',
      html: () => `
        <p class="lead">Az oldal <b>nem használ követő vagy hirdetési sütiket</b>, és nem épít be marketing- vagy hirdetési szolgáltatásokat.</p>
        <h2>Mi kerül a böngésződbe</h2>
        <ul><li><b>pv-cookie</b> (a böngésző helyi tárhelye): azt jegyzi meg, hogy bezártad a süti-tájékoztatót, hogy ne jelenjen meg újra.</li>
        <li><b>pv-banner</b> (munkamenet-tárhely): azt jegyzi meg, hogy bezártál egy közleményt, a böngészőablak bezárásáig.</li>
        <li><b>Az admin felület munkamenete:</b> csak az üzemeltető belépésekor jön létre, látogatóknál nem.</li></ul>
        <p>Ezek az oldal működéséhez szükségesek, nem tartalmaznak személyes azonosítót, és nem adjuk át őket senkinek.</p>
        <h2>Harmadik felek tartalmai</h2>
        <ul><li><b>YouTube:</b> a videók csak a lejátszásra kattintás után töltenek be, adatvédelmi (nocookie) módban. A videók előnézeti képét a YouTube szolgáltatja.</li>
        <li><b>Közösségi média:</b> a bejegyzésekre mutató linkekre kattintva elhagyod az oldalt, és az adott platform szabályai érvényesek.</li></ul>
        <p>Részletek az <a href="adatkezeles.html">adatkezelési tájékoztatóban</a>.</p>`
    }
  };

  const p = PAGES[page] || PAGES.privacy;
  document.title = `${p.title} – ${TX.legal_name || 'PLANERVO'}`;
  main.innerHTML = `<div class="wrap blog-top post-body legal"><a class="back" href="index.html">Vissza a főoldalra</a><h1>${esc(p.title)}</h1>${p.html()}</div>`;
})();
