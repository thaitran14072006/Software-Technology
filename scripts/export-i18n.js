// Sinh src/i18n/locales/legacy.<lang>.json từ i18n.js gốc (5 ngôn ngữ). Chạy: node scripts/export-i18n.js
const fs = require('fs'), path = require('path'), c = require('./load-legacy')();
const out = path.join(__dirname, '..', 'mobile', 'src', 'i18n', 'locales');
fs.mkdirSync(out, { recursive: true });
for (const k of ['vi', 'en', 'ja', 'zh', 'ko']) {
  const u = c.I18N[k].u, t = c.T[k];
  fs.writeFileSync(path.join(out, `legacy.${k}.json`), JSON.stringify({
    label: c.I18N[k].n, locale: c.I18N[k].v,
    head: { title: t.h, subtitle: t.s, hours: t.o, reset: t.r, ferry: t.f, water: t.w, visitor: t.v },
    ui: { open: u[0], stops: u[1], road: u[2], trail: u[3], trees: u[4], water: u[5], facilities: u[6],
          unique: u[7], night: u[8], services: u[9], play: u[10], stop: u[11], auto: u[12], hint: u[13] },
  }, null, 2));
  console.log('legacy.' + k + '.json');
}
