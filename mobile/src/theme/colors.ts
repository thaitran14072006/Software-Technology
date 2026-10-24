// Màu lấy từ :root của app.css (giao diện web gốc)
export const colors = {
  bg: '#0b2a1f', land: '#0d2a20', card: '#08221bd9', text: '#eef3ec', muted: '#a9bdb0', line: '#ffffff26',
  road1: '#f0c48f', road2: '#d98f6a', trail: '#eadfbf', node: '#f4f1ea', nodeText: '#123328',
  accent: '#e8c58f', tree: '#8fd3a0', water: '#6fc3e6', place: '#eac36e', halo: '#0a251c', me: '#4aa8ff', danger: '#b8574a',
  glass: '#08221bd9',
};
// Hợp đồng danh mục (db/schema.sql): 1 = facility (p), 2 = tree (t), 3 = water (w)
export const CAT_BY_ID: Record<number, 'p' | 't' | 'w'> = { 1: 'p', 2: 't', 3: 'w' };
// GIẢ ĐỊNH: CL[p[7]] trong svgmap.js (chưa được gửi) khớp màu chú giải của thanh .bt
export const CAT_COLOR = { p: colors.place, t: colors.tree, w: colors.water } as const;
export const radius = { card: 15, pill: 24 };
