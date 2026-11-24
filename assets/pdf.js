/* PLANERVO – PDF-becslés (látogatói árajánlatkérő). A pdfmake csak a gombnyomásra töltődik be. */
const PlanervoPdf = (function () {
  const LIBS = [
    ['https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js', 'sha384-UbICcZf4B6+FB/cmTNLOqZzUc40rHayX14EhEDfAnFhmte7yAAA7s081OeuC8VVT'],
    ['https://cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/vfs_fonts.js', 'sha384-zmD5tDN2awbMigS/yVcxHObSsdXXKh/27Y/bSII38WfNl+D7O/aVCIteAXsLY3p3']
  ];
  const GOLD = '#a37c3a', INK = '#1a1a1a', MUTE = '#6b655c', LINE = '#e0d8c8';
  let loading = null;

  function addScript([src, integrity]) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.integrity = integrity; s.crossOrigin = 'anonymous';
      s.onload = ok;
      s.onerror = () => fail(new Error('A PDF-készítő nem töltődött be. Ellenőrizd az internetkapcsolatot.'));
      document.head.appendChild(s);
    });
  }
  function load() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
    if (!loading) loading = addScript(LIBS[0]).then(() => addScript(LIBS[1])).catch(e => { loading = null; throw e; });
    return loading;
  }

  async function logoData() {
    try {
      const img = new Image();
      img.src = 'assets/img/planervo-logo.png';
      await img.decode();
      const w = 520, h = Math.round(img.naturalHeight / img.naturalWidth * w);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/jpeg', .9);
    } catch (e) { return null; }
  }

  /* a pdfmake betűkészlete nem ismeri a keskeny nem törő szóközt, ezért sima szóközre cseréljük */
  const plain = s => s.replace(/[  ]/g, ' ');
  const ft = n => plain(Math.round(+n || 0).toLocaleString('hu-HU')) + ' Ft';
  const num = n => plain((Math.round((+n || 0) * 10) / 10).toLocaleString('hu-HU'));
  const unit = u => ({ wall: 'm²', ceiling: 'm²', wallceil: 'm²', floor: 'm²', sqm: 'm²', surface: 'm²', meter: 'fm', piece: 'db', room: 'db' }[u] || '');

  /* data: { title, date, customer, rooms[{ name, area, height, wall, ceiling, items[] (munkasorrendben), subtotal }], discount, net, note, contact } */
  function definition(data, logo) {
    const content = [];
    const head = [{ width: '*', stack: [{ text: data.title || 'Becsült árajánlat', style: 'h1' }, { text: data.date || '', color: MUTE, margin: [0, 2, 0, 0] }] }];
    if (logo) head.push({ image: logo, width: 105, alignment: 'right' });
    content.push({ columns: head, margin: [0, 0, 0, 14] });

    const c = data.customer || {}, cl = [c.name, c.city, c.phone, c.email].filter(Boolean);
    if (cl.length) content.push({ text: cl.join('  ·  '), color: MUTE, margin: [0, 0, 0, 10] });

    (data.rooms || []).forEach((r, i) => {
      content.push({ text: `${i + 1}. ${r.name || 'Helyiség'}`, style: 'h2', margin: [0, 10, 0, 2], unbreakable: true });
      const dims = [r.width && r.length ? `${num(r.width)} × ${num(r.length)} m` : '', r.height ? num(r.height) + ' m belmagasság' : ''].filter(Boolean).join(', ');
      if (dims) content.push({ text: dims, color: MUTE, fontSize: 9, margin: [0, 0, 0, 4] });
      /* 1) felületek külön */
      const surf = [];
      if (r.wall) surf.push(['Fal', num(r.wall) + ' m²']);
      if (r.ceiling) surf.push(['Mennyezet', num(r.ceiling) + ' m²']);
      if (surf.length) {
        content.push({ text: 'Felületek', style: 'h3', margin: [0, 2, 0, 2], unbreakable: true });
        content.push({ table: { widths: ['*', 90], body: surf.map(x => [{ text: x[0] }, { text: x[1], alignment: 'right' }]) }, layout: { hLineColor: () => LINE, vLineWidth: () => 0, hLineWidth: () => .6, paddingTop: () => 3, paddingBottom: () => 3 }, margin: [0, 0, 0, 6] });
      }
      /* 2) munkafolyamatok a munkavégzés sorrendjében */
      content.push({ text: 'Munkafolyamatok sorrendben', style: 'h3', margin: [0, 2, 0, 2], unbreakable: true });
      const body = [[{ text: '#', style: 'th' }, { text: 'Munkafolyamat', style: 'th' }, { text: 'Mennyiség', style: 'th', alignment: 'right' }, { text: 'Egységár', style: 'th', alignment: 'right' }, { text: 'Összeg', style: 'th', alignment: 'right' }]];
      (r.items || []).forEach((it, k) => body.push([{ text: String(k + 1), color: MUTE }, { text: it.name }, { text: `${num(it.qty)} ${unit(it.unit)}`.trim(), alignment: 'right' }, { text: ft(it.price), alignment: 'right' }, { text: ft(it.amount), alignment: 'right' }]));
      body.push([{ text: 'Részösszeg', bold: true, colSpan: 4 }, {}, {}, {}, { text: ft(r.subtotal), bold: true, alignment: 'right' }]);
      content.push({ table: { headerRows: 1, widths: [16, '*', 62, 62, 76], body }, layout: { hLineColor: () => LINE, vLineWidth: () => 0, hLineWidth: () => .6, paddingTop: () => 4, paddingBottom: () => 4 } });
    });

    const tot = [];
    if (data.discount && data.discount.amount) tot.push([{ text: `${data.discount.label || 'Akció'} (−${data.discount.pct}%)`, color: GOLD }, { text: '−' + ft(data.discount.amount), alignment: 'right', color: GOLD }]);
    tot.push([{ text: 'Becsült munkadíj', bold: true, fontSize: 12 }, { text: ft(data.net), bold: true, fontSize: 14, alignment: 'right' }]);
    content.push({ table: { widths: ['*', 'auto'], body: tot }, layout: { hLineWidth: i => (i === 0 ? 1.2 : 0), hLineColor: () => INK, vLineWidth: () => 0, paddingTop: () => 6, paddingBottom: () => 2 }, margin: [0, 14, 0, 4], unbreakable: true });
    if (data.note) content.push({ text: data.note, color: MUTE, fontSize: 9, margin: [0, 14, 0, 0] });
    const ct = data.contact || {}, cf = [ct.phone, ct.email, ct.site].filter(Boolean);
    if (cf.length) content.push({ text: cf.join('   ·   '), margin: [0, 16, 0, 0], color: INK, fontSize: 10 });

    return {
      pageSize: 'A4', pageMargins: [44, 44, 44, 52],
      info: { title: data.title || 'Becsült árajánlat', author: 'PLANERVO' },
      defaultStyle: { font: 'Roboto', fontSize: 10, color: INK, lineHeight: 1.2 },
      styles: { h1: { fontSize: 20, bold: true }, h2: { fontSize: 13, bold: true }, h3: { fontSize: 10, bold: true, color: GOLD }, th: { bold: true, color: MUTE, fontSize: 9 } },
      footer: (p, n) => ({ columns: [{ text: 'PLANERVO – Minőség minden rétegben', color: MUTE, fontSize: 8 }, { text: `${p}. oldal / ${n}`, alignment: 'right', color: MUTE, fontSize: 8 }], margin: [44, 0, 44, 0] }),
      content
    };
  }

  return {
    async download(data, filename) {
      await load();
      window.pdfMake.createPdf(definition(data, await logoData())).download(filename || 'planervo.pdf');
    }
  };
})();
