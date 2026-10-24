import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Image as SvgImage, LinearGradient, Path, Rect, Stop, Text as T } from 'react-native-svg';
import { CAT_BY_ID, colors } from '../../theme/colors';
import { gpsToWorld, Pt, rawToWorld } from '../../utils/projection';
import { BRANCHES, ROAD, TRAIL } from '../../services/routing/trailGraph';
import type { Poi } from '../../services/api/poi.api';
import type { Coords } from '../../store/locationStore';
import type { FilterKey, RouteInfo } from '../../store/mapStore';

const BG = require('../../assets/map-bg.jpg');   // sao chép assets/map-bg.jpg của app web (file hiện tại chỉ là ảnh giữ chỗ)
const d = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
// Đường vẽ lấy từ trailGraph (cùng dữ liệu với index.html). Lớp "river" và các đối tượng cố định sao chép từ index.html.
const PATH = { rd: d(ROAD), tr: d(TRAIL), br: BRANCHES.filter((b) => !(b[0][0] === 395 && b[0][1] === 765)).map(d).join(' '),
  // đoạn nối (395,765) vẽ riêng như đường lớn
  link: 'M395,765 L432,790',
  river: 'M1170,1720 C1110,1560 1090,1440 1130,1340 S1330,1195 1440,1170' };
const FULL = { x: 0, y: 0, w: 2400, h: 1700 };

export interface SchematicHandle { zoom: (f: number) => void; reset: () => void; }
interface Props {
  pois: Poi[]; selectedId: string | null; user: Coords | null; route: RouteInfo | null;
  off: Record<FilterKey, boolean>; onSelect: (id: string) => void; onTouch: (down: boolean) => void;
}

const SchematicMap = forwardRef<SchematicHandle, Props>(function SchematicMap(props, ref) {
  const { pois, selectedId, user, route, off, onSelect } = props;
  const [vb, setVb] = useState(FULL);
  const vbRef = useRef(vb); vbRef.current = vb;
  const size = useRef({ w: 1, h: 1 });
  const startVb = useRef(FULL);
  const touch = useRef(props.onTouch); touch.current = props.onTouch;   // tránh closure cũ trong PanResponder

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderGrant: () => { startVb.current = vbRef.current; touch.current(true); },
    onPanResponderMove: (_, g) => setVb({
      ...startVb.current,
      x: startVb.current.x - (g.dx * startVb.current.w) / size.current.w,
      y: startVb.current.y - (g.dy * startVb.current.h) / size.current.h,
    }),
    onPanResponderRelease: () => touch.current(false),
    onPanResponderTerminate: () => touch.current(false),
  }), []);

  useImperativeHandle(ref, () => ({
    // hệ số 0.7 / 1.4 như zoom(.7) / zoom(1.4) trong ui.js gốc
    zoom: (f) => setVb((v) => {
      const w = Math.min(2400, Math.max(300, v.w * f)), h = (w * 1700) / 2400;
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    }),
    reset: () => setVb(FULL),
  }), []);

  const me = user ? gpsToWorld(user.lat, user.lng) : null;
  const visible = pois.filter((p) => p.schematic && !off[CAT_BY_ID[p.categoryId ?? 2]]);

  return (
    <View style={StyleSheet.absoluteFill} {...pan.panHandlers}
      onLayout={(e: LayoutChangeEvent) => { size.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 }; }}>
      <Svg width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="rg" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.road1} /><Stop offset="1" stopColor={colors.road2} />
          </LinearGradient>
        </Defs>
        <Rect x={-4000} y={-3000} width={10400} height={7700} fill={colors.land} />
        <SvgImage href={BG} x="0" y="0" width="2400" height="1700" preserveAspectRatio="none" />
        {!off.w && <>
          <Path d={PATH.river} fill="none" stroke={colors.water} strokeWidth={70} opacity={0.35} strokeLinecap="round" />
          <Path d={PATH.river} fill="none" stroke={colors.water} strokeWidth={34} opacity={0.5} strokeLinecap="round" />
        </>}

        {/* nhóm raw: translate(35 40) scale(1.6) giống index.html */}
        <G transform="translate(35 40) scale(1.6)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {!off.r && <Path d={PATH.rd} stroke="url(#rg)" strokeWidth={9.5} />}
          {!off.r && <Path d={PATH.link} stroke="url(#rg)" strokeWidth={7} />}
          {!off.q && <Path d={PATH.tr} stroke={colors.trail} strokeWidth={5} strokeDasharray="14 8" />}
          {!off.q && <Path d={PATH.br} stroke={colors.trail} strokeWidth={2.6} strokeDasharray="7 5" />}
          {route?.raw && <Path d={d(route.raw as Pt[])} stroke={colors.accent} strokeWidth={7} strokeDasharray="1 11" />}
          <G transform="translate(390 850)">
            <Circle r={28} fill={colors.card} stroke={colors.road2} strokeWidth={3} />
            <Path d="M-15,3L0,-15L15,3M-10,3v12h20v-12" stroke={colors.road2} strokeWidth={3} />
          </G>
          {[[112, 68], [1330, 292]].map(([x, y]) => (
            <G key={x}>
              <Circle cx={x} cy={y} r={21} fill={colors.danger} stroke={colors.card} strokeWidth={2} />
              <T x={x} y={y + 4} fontSize={10} fontWeight="700" fill="#fff" textAnchor="middle">STOP</T>
            </G>
          ))}
        </G>

        {visible.map((p) => {
          const [x, y] = rawToWorld(p.schematic as Pt), on = p.id === selectedId;
          return (
            <G key={p.id} onPress={() => onSelect(p.id)}>
              <Circle cx={x} cy={y} r={44} fill="transparent" />
              {on && <Circle cx={x} cy={y} r={40} fill="none" stroke={colors.accent} strokeWidth={4} opacity={0.6} />}
              <Circle cx={x} cy={y} r={27} fill={on ? colors.accent : colors.nodeText} stroke={on ? colors.accent : colors.node} strokeWidth={5} />
              <T x={x} y={y + 10} fontSize={30} fontWeight="700" textAnchor="middle" fill={on ? '#fff' : colors.node}>{p.code}</T>
              {/* nhãn tên: viền halo vẽ trước, chữ vẽ sau */}
              <T x={x} y={y + 58} fontSize={25} fontWeight="700" textAnchor="middle" fill="none" stroke={colors.halo} strokeWidth={7}>{p.name}</T>
              <T x={x} y={y + 58} fontSize={25} fontWeight="700" textAnchor="middle" fill={colors.text}>{p.name}</T>
            </G>
          );
        })}
        {me && <>
          <Circle cx={me[0]} cy={me[1]} r={36} fill={colors.me} opacity={0.3} />
          <Circle cx={me[0]} cy={me[1]} r={15} fill={colors.me} stroke="#fff" strokeWidth={5} />
        </>}
      </Svg>
    </View>
  );
});
export default SchematicMap;
