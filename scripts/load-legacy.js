// Nạp data.js + i18n.js (+ booklet.js nếu có) của app web gốc vào một sandbox vm (giống gen-audio.js).
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = () => {
  const ctx = {}; ctx.window = ctx; ctx.CT = {}; vm.createContext(ctx);
  for (const f of ['data.js', 'i18n.js', 'booklet.js']) {
    const p = path.join(__dirname, 'legacy', f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  return ctx;   // ctx.P, ctx.W, ctx.I18N, ctx.T, ctx.nm(), ctx.sb(), ctx.txt(), ctx.lang
};
