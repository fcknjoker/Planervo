/* PLANERVO – vélemény beküldése (a vélemény csak jóváhagyás után jelenik meg) */
(async function () {
  const $ = s => document.querySelector(s);
  const t0 = Date.now();
  let TX = { ...TEXT_DEFAULTS };
  try { TX = await loadTexts(); } catch (e) { /* alapértelmezett szövegek */ }
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = TX[el.dataset.t] || ''; });

  const status = (m, err) => { const s = $('#rvStatus'); s.textContent = m || ''; s.classList.toggle('err', !!err); };
  ['#rvName', '#rvBody', '#rvOk'].forEach(s => $(s).addEventListener('input', e => e.target.classList.remove('field-err')));

  $('#rvForm').addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#rvWeb').value) return;                                   // rejtett csapdamező: botok töltik ki
    const name = $('#rvName').value.trim(), body = $('#rvBody').value.trim(), place = $('#rvPlace').value.trim();
    const rating = +(document.querySelector('input[name=rate]:checked') || { value: 5 }).value;
    let bad = null;
    const mark = el => { el.classList.add('field-err'); bad = bad || el; };
    if (name.length < 2) mark($('#rvName'));
    if (body.length < 10) mark($('#rvBody'));
    if (!$('#rvOk').checked) mark($('#rvOk'));
    if (bad) { bad.focus(); return status('Kérlek add meg a nevedet és legalább egy-két mondatos véleményt, és jelöld be a hozzájárulást.', true); }
    if (Date.now() - t0 < 4000) return status('Egy pillanat, kérlek, próbáld újra mindjárt.', true);
    try { const last = +localStorage.getItem('pv-review') || 0; if (Date.now() - last < 60000) return status('Az előző véleményed most ment el. Kérlek, várj egy percet.', true); } catch (x) { /* tárolás nélkül nincs korlát */ }
    if (!sb) return status('A vélemény most nem küldhető el. Írj nekünk e-mailben.', true);
    const btn = $('#rvSend'); btn.disabled = true; status('Küldés…');
    const { error } = await sb.from('testimonials').insert({ name, body, rating, place: place || null, visible: false });
    btn.disabled = false;
    if (error) return status('A vélemény elküldése nem sikerült. Próbáld újra, vagy írj nekünk e-mailben.', true);
    try { localStorage.setItem('pv-review', String(Date.now())); } catch (x) { /* nem baj */ }
    $('#rvForm').hidden = true; $('#rvDone').hidden = false; $('#rvDone').focus();
  });
})();
