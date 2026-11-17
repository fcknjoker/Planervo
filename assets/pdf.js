/* PLANERVO – PDF készítés (a látogatói becsléshez és az admin ajánlatához)
   A pdfmake és betűtípusa csak akkor töltődik be, amikor PDF kell, így az oldal alapbetöltése nem lassul.
   A Roboto betűtípus tartalmazza az ő és ű betűket is. */
const PlanervoPdf = (function () {
  const BASE = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/';
  let loading = null;

  function load() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
    if (loading) return loading;
    const add = src => new Promise((ok, fail) => {
      const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('A PDF-készítő nem töltődött be. Ellenőrizd az internetkapcsolatot.'));
      document.head.appendChild(s);
    });
    loading = add(BASE + 'pdfmake.min.js').then(() => add(BASE + 'vfs_fonts.js')).catch(e => { loading = null; throw e; });
    return loading;
  }

  async function logoData() {
    try {
      const img = new Image(); img.src = 'logo.png';
      await img.decode();
      const w = 520, h = Math.round(img.naturalHeight / img.naturalWidth * w);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/jpeg', .9);
    } catch (e) { return null; }
  }

  const ft = n => Math.round(+n || 0).toLocaleString('hu-HU').replace(/ | /g, ' ') + ' Ft';
  const num = n => (Math.round((+n || 0) * 10) / 10).toLocaleString('hu-HU').replace(/ | /g, ' ');
  const GOLD = '#a37c3a', INK = '#1a1a1a', MUTE = '#6b655c', LINE = '#e0d8c8';

  /* data: { title, date, customer:{name,email,phone,city}, rooms:[{name,area,height,wall,ceiling,items:[{name,unit,price,qty,amount}],subtotal}],
             discount:{label,pct,amount}|null, net, lo, hi, range:boolean, note, contact:{phone,email,site}, intro, appointment } */
  function definition(data, logo) {
    const unit = u => ({ wall: 'm²', ceiling: 'm²', wallceil: 'm²', floor: 'm²', sqm: 'm²', surface: 'm²', meter: 'fm', piece: 'db', room: 'db' }[u] || '');
    const content = [];
    const head = [{ stack: [
      { text: data.title || 'Becsült árajánlat', style: 'h1' },
      { text: data.date || '', color: MUTE, margin: [0, 2, 0, 0] }
    ], width: '*' }];
    if (logo) head.push({ image: logo, width: 130, alignment: 'right' });
    content.push({ columns: head, margin: [0, 0, 0, 14] });

    const c = data.customer || {}, cl = [c.name, c.city, c.phone, c.email].filter(Boolean);
    if (cl.length) content.push({ text: cl.join('  ·  '), color: MUTE, margin: [0, 0, 0, 10] });
    if (data.intro) content.push({ text: data.intro, margin: [0, 0, 0, 10] });

    (data.rooms || []).forEach((r, i) => {
      const geo = [r.area ? num(r.area) + ' m² alapterület' : '', r.height ? num(r.height) + ' m belmagasság' : '', r.wall ? '≈ ' + num(r.wall) + ' m² fal' : '', r.ceiling ? num(r.ceiling) + ' m² mennyezet' : ''].filter(Boolean).join(', ');
      content.push({ text: `${i + 1}. ${r.name || 'Helyiség'}`, style: 'h2', margin: [0, 8, 0, 2], unbreakable: true });
      if (geo) content.push({ text: geo, color: MUTE, fontSize: 9, margin: [0, 0, 0, 4] });
      const body = [[{ text: 'Munka', style: 'th' }, { text: 'Mennyiség', style: 'th', alignment: 'right' }, { text: 'Egységár', style: 'th', alignment: 'right' }, { text: 'Összeg', style: 'th', alignment: 'right' }]];
      (r.items || []).forEach(it => body.push([{ text: it.name }, { text: `${num(it.qty)} ${unit(it.unit)}`.trim(), alignment: 'right' }, { text: ft(it.price), alignment: 'right' }, { text: ft(it.amount), alignment: 'right' }]));
      body.push([{ text: 'Részösszeg', bold: true, colSpan: 3 }, {}, {}, { text: ft(r.subtotal), bold: true, alignment: 'right' }]);
      content.push({ table: { headerRows: 1, widths: ['*', 70, 70, 80], body }, layout: { hLineColor: () => LINE, vLineWidth: () => 0, hLineWidth: () => .6, paddingTop: () => 4, paddingBottom: () => 4 } });
    });

    const tot = [];
    if (data.discount && data.discount.amount) tot.push([{ text: `${data.discount.label || 'Akció'} (−${data.discount.pct}%)`, color: GOLD }, { text: '−' + ft(data.discount.amount), alignment: 'right', color: GOLD }]);
    tot.push([{ text: 'Becsült munkadíj', bold: true, fontSize: 12 }, { text: data.range ? `kb. ${ft(data.lo).replace(' Ft', '')} – ${ft(data.hi)}` : ft(data.net), bold: true, fontSize: 14, alignment: 'right' }]);
    content.push({ table: { widths: ['*', 'auto'], body: tot }, layout: { hLineWidth: (i) => i === 0 ? 1.2 : 0, hLineColor: () => INK, vLineWidth: () => 0, paddingTop: () => 6, paddingBottom: () => 2 }, margin: [0, 14, 0, 4], unbreakable: true });
    if (data.range) content.push({ text: `Középérték: ${ft(data.net)}`, color: MUTE, fontSize: 9, alignment: 'right' });

    if (data.appointment) content.push({ text: data.appointment, margin: [0, 12, 0, 0] });
    if (data.note) content.push({ text: data.note, color: MUTE, fontSize: 9, margin: [0, 14, 0, 0] });
    const ct = data.contact || {}, cf = [ct.phone, ct.email, ct.site].filter(Boolean);
    if (cf.length) content.push({ text: cf.join('   ·   '), margin: [0, 16, 0, 0], color: INK, fontSize: 10 });

    return {
      pageSize: 'A4', pageMargins: [44, 44, 44, 52],
      defaultStyle: { font: 'Roboto', fontSize: 10, color: INK, lineHeight: 1.2 },
      styles: { h1: { fontSize: 20, bold: true }, h2: { fontSize: 13, bold: true }, th: { bold: true, color: MUTE, fontSize: 9 } },
      footer: (p, n) => ({ columns: [{ text: 'PLANERVO – Minőség minden rétegben', color: MUTE, fontSize: 8 }, { text: `${p}. oldal / ${n}`, alignment: 'right', color: MUTE, fontSize: 8 }], margin: [44, 0, 44, 0] }),
      content
    };
  }

  async function make(data) {
    await load();
    return window.pdfMake.createPdf(definition(data, await logoData()));
  }

  return {
    download: async (data, filename) => { const pdf = await make(data); pdf.download(filename || 'planervo.pdf'); },
    blobUrl: async data => { const pdf = await make(data); return new Promise(ok => pdf.getBlob(b => ok(URL.createObjectURL(b)))); },
    base64: async data => { const pdf = await make(data); return new Promise(ok => pdf.getBase64(ok)); }
  };
})();
