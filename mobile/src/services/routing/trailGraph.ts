import { RAW_UNIT_M, Pt } from '../../utils/projection';

/* Đồ thị đường đi dựng từ các đường vẽ trong index.html (không gian "raw"). 1 đơn vị raw ≈ 4 m TRÊN SƠ ĐỒ;
   khoảng cách THẬT được hiệu chỉnh từ cột d/f của data.js (REAL_KM) vì sơ đồ không theo tỉ lệ. */
export const ROAD: Pt[] = [[390,800],[425,680],[440,600],[490,520],[510,440],[520,410],[700,345],[790,312],[940,305],[1000,292],[1180,300],[1310,293]];
export const TRAIL: Pt[] = [[520,410],[480,368],[380,320],[320,265],[240,200],[200,160],[150,135],[112,80]];
export const BRANCHES: Pt[][] = [
  [[425,680],[390,590]], [[425,680],[365,640],[390,590]], [[425,680],[400,686]], [[470,370],[447,433]], [[380,320],[365,392]],
  [[320,265],[245,300],[212,316]], [[240,200],[210,237]], [[200,160],[165,190],[138,203]], [[532,538],[482,522]],
  [[573,469],[512,440]], [[320,768],[408,762]], [[395,765],[432,790]],
];
// GIẢ ĐỊNH CẦN XÁC NHẬN: node 13 (Cây Si Trăm Thân) cách node 11 tới 2 km theo data.js nhưng trên hình lại nằm sát nhánh của node 12
// (cách 0,5 km), nên coi node 13 nằm ở cuối đường mòn (đầu mút 112,80). Liên kết này chỉ dùng để tìm đường, không vẽ lên sơ đồ.
export const EXTRA_LINKS: Pt[][] = [[[112, 80], [80, 170]]];
export const VISITOR_CENTER: Pt = [390, 850];
export const NODE_RAW: Record<number, Pt> = { 1:[320,768],2:[331,638],3:[357,600],4:[398,686],5:[532,538],6:[573,469],7:[447,433],8:[365,392],9:[212,316],10:[210,237],11:[213,131],12:[138,203],13:[80,170],14:[990,333],15:[1180,338] };
// [node, tính từ node (0 = Trung tâm Du khách), km theo sơ đồ du lịch] — cột d, f của data.js
export const REAL_KM: [number, number, number][] = [[2,4,.2],[3,4,.2],[4,0,.7],[5,4,.6],[6,5,.1],[7,6,.5],[8,7,2],[9,8,5],[10,8,7.5],[11,10,1],[12,11,.5],[13,11,2],[14,6,3.6],[15,14,.7]];

const TOL = 15;               // dung sai hàn đường (đơn vị raw)
export const MAX_SNAP = 150;  // xa đường hơn mức này (≈ 600 m trên sơ đồ): coi như ngoài khu sơ đồ

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function project(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return { q: [a[0] + t * dx, a[1] + t * dy] as Pt, t };
}

class Graph {
  nodes: Pt[] = [];
  adj: Map<number, Map<number, number>> = new Map();
  segs: [number, number][] = [];
  private idx = new Map<string, number>();
  add(p: Pt) {
    const k = p.join(',');
    let i = this.idx.get(k);
    if (i === undefined) { i = this.nodes.push(p) - 1; this.idx.set(k, i); this.adj.set(i, new Map()); }
    return i;
  }
  link(a: number, b: number, w = dist(this.nodes[a], this.nodes[b])) {
    if (a === b) return;
    this.adj.get(a)!.set(b, w); this.adj.get(b)!.set(a, w);
  }
  unlink(a: number, b: number) { this.adj.get(a)!.delete(b); this.adj.get(b)!.delete(a); }
}

function build(): Graph {
  const g = new Graph();
  for (const line of [ROAD, TRAIL, ...BRANCHES, ...EXTRA_LINKS]) {
    line.forEach((p, i) => {
      const b = g.add(p);
      if (!i) return;
      const a = g.add(line[i - 1]);
      g.link(a, b); g.segs.push([a, b]);
    });
  }
  // Hàn: mỗi đỉnh nối vào đoạn của đường khác nếu đủ gần (đỉnh-đỉnh hoặc chạm giữa đoạn)
  const vertices = g.nodes.map((_, i) => i);
  for (const v of vertices) {
    for (let s = 0; s < g.segs.length; s++) {
      const [a, b] = g.segs[s];
      if (a === v || b === v) continue;
      const { q, t } = project(g.nodes[v], g.nodes[a], g.nodes[b]);
      const d = dist(g.nodes[v], q);
      if (d > TOL) continue;
      let qi: number;
      if (t <= 0.02) qi = a;
      else if (t >= 0.98) qi = b;
      else { qi = g.add(q); g.unlink(a, b); g.link(a, qi); g.link(qi, b); g.segs.splice(s, 1, [a, qi], [qi, b]); }
      g.link(v, qi, d);
      break;
    }
  }
  return g;
}
const G = build();

const mul = new Map<string, number>();   // hệ số "mét thật / mét trên sơ đồ" cho từng đoạn
const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

interface Solved { ids: number[]; nodes: Pt[]; segOf: Map<number, [number, number]>; cost: number; off: number; }

function solve(from: Pt, to: Pt, useMul: boolean): Solved | null {
  const nodes = [...G.nodes];
  const segOf = new Map<number, [number, number]>();
  const adj = new Map<number, Map<number, number>>();
  G.adj.forEach((m, a) => {
    const c = new Map<number, number>();
    m.forEach((raw, b) => c.set(b, raw * (useMul ? mul.get(ek(a, b)) ?? 1 : 1)));
    adj.set(a, c);
  });
  const link = (a: number, b: number, w: number) => { adj.get(a)!.set(b, w); adj.get(b)!.set(a, w); };

  const attach = (p: Pt) => {                       // hút điểm vào đoạn đường gần nhất
    let best = { d: Infinity, s: -1, q: p };
    G.segs.forEach(([a, b], s) => {
      const { q } = project(p, G.nodes[a], G.nodes[b]);
      const d = dist(p, q);
      if (d < best.d) best = { d, s, q };
    });
    if (best.d > MAX_SNAP) return null;
    const [a, b] = G.segs[best.s], m = useMul ? mul.get(ek(a, b)) ?? 1 : 1;
    const id = nodes.push(best.q) - 1;
    adj.set(id, new Map()); segOf.set(id, [a, b]);
    link(id, a, dist(best.q, G.nodes[a]) * m); link(id, b, dist(best.q, G.nodes[b]) * m);
    return { id, ...best };
  };
  const A = attach(from), B = attach(to);
  if (!A || !B) return null;
  if (A.s === B.s) { const [a, b] = G.segs[A.s]; link(A.id, B.id, dist(A.q, B.q) * (useMul ? mul.get(ek(a, b)) ?? 1 : 1)); }

  const D = new Array(nodes.length).fill(Infinity), prev = new Array(nodes.length).fill(-1), done = new Array(nodes.length).fill(false);
  D[A.id] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < D.length; i++) if (!done[i] && D[i] < Infinity && (u < 0 || D[i] < D[u])) u = i;
    if (u < 0 || u === B.id) break;
    done[u] = true;
    adj.get(u)!.forEach((w, v) => { if (D[u] + w < D[v]) { D[v] = D[u] + w; prev[v] = u; } });
  }
  if (!isFinite(D[B.id])) return null;
  const ids: number[] = [];
  for (let n = B.id; n >= 0; n = prev[n]) ids.push(n);
  ids.reverse();
  return { ids, nodes, segOf, cost: D[B.id], off: A.d + B.d };
}

/**
 * Hiệu chỉnh khoảng cách thật. Mỗi chặng (node, from, km) của sơ đồ du lịch là một ràng buộc:
 *   tổng( độ dài sơ đồ của đoạn × hệ số đoạn ) + đoạn "ngoài đường" = km thật.
 * Các chặng dùng chung đoạn đường (đặc biệt các nhánh dẫn vào node) nên phải giải ĐỒNG THỜI,
 * không thể gán lần lượt (gán lần lượt làm chặng sau ghi đè chặng trước). Dùng MART (multiplicative ART):
 * lặp, mỗi ràng buộc kéo các hệ số của nó về phía mục tiêu theo tỉ lệ đóng góp. Hệ số luôn dương.
 */
(function calibrate() {
  const cons: { target: number; L: Map<string, number> }[] = [];
  for (const [id, from, km] of REAL_KM) {
    const s = solve(from === 0 ? VISITOR_CENTER : NODE_RAW[from], NODE_RAW[id], false);
    if (!s || s.cost <= 0) continue;
    const L = new Map<string, number>();                       // độ dài raw của từng đoạn trên đường đi
    for (let i = 1; i < s.ids.length; i++) {
      const u = s.ids[i - 1], v = s.ids[i], seg = s.segOf.get(u) ?? s.segOf.get(v);
      const key = seg ? ek(seg[0], seg[1]) : ek(u, v);
      L.set(key, (L.get(key) ?? 0) + dist(s.nodes[u], s.nodes[v]));
    }
    // đoạn ngoài đường (node vẽ lệch khỏi đường) giữ theo tỉ lệ sơ đồ => phần còn lại dành cho đường; tối thiểu 25% để không âm
    const targetRaw = Math.max(km * 1000 - s.off * RAW_UNIT_M, km * 250) / RAW_UNIT_M;
    cons.push({ target: targetRaw, L });
  }
  for (let iter = 0; iter < 400; iter++) {
    for (const c of cons) {
      let cur = 0;
      c.L.forEach((l, k) => { cur += l * (mul.get(k) ?? 1); });
      if (cur <= 0) continue;
      const f = c.target / cur;
      c.L.forEach((l, k) => { const m = mul.get(k) ?? 1; mul.set(k, m * Math.pow(f, (l * m) / cur)); });
    }
  }
})();

export interface TrailRoute { points: Pt[]; lengthRaw: number; offPathRaw: number; lengthM: number; durationS: number; }

export function findRoute(from: Pt, to: Pt, walkMps = 1.2): TrailRoute | null {
  const s = solve(from, to, true);
  if (!s) return null;
  const onPath = s.ids.map((i) => s.nodes[i]);
  const lengthM = (s.cost + s.off) * RAW_UNIT_M;     // đoạn "ngoài đường" tính theo tỉ lệ sơ đồ
  return { points: [from, ...onPath, to], lengthRaw: lengthM / RAW_UNIT_M, offPathRaw: s.off, lengthM, durationS: lengthM / walkMps };
}
