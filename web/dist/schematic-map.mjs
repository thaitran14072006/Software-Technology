import {REFERENCE_STOPS,renderReferenceMap,referenceStopName} from './reference-map.mjs';

// The poster supplies stable visitor numbers by POI code.
const posterNumbers = new Map(REFERENCE_STOPS.map(([number]) => [String(number), String(number)]));
export function stopNumber(poi) {
  return posterNumbers.get(String(poi?.code)) || '•';
}

export function schematicStopName(poi) {
  return referenceStopName(poi.code,poi.lang || 'vi',poi);
}

// Cards follow the same fifteen numbered stops and order as the drawing.
export function schematicStops(pois) {
  const byCode = new Map(pois.map(p => [String(p.code), p]));
  return REFERENCE_STOPS.flatMap(([number]) => {
    const poi = byCode.get(String(number));
    return poi ? [{...poi, name:schematicStopName(poi)}] : [];
  });
}

// Match by stable code, never by a visitor sort order with different numbering.
// The poster does not invent drawing positions for additional GPS-only places.
export function schematicLayout(pois) {
  const positions=new Map(REFERENCE_STOPS.map(([n,x,y])=>[String(n),{x,y}]));
  positions.set('coord-01',{x:385,y:817});
  return pois.filter(p=>positions.has(p.code)).map(p=>({...p,...positions.get(p.code)}));
}

export function renderSchematic(options) {
  return renderReferenceMap({...options,lang:options.lang || options.pois?.find(p=>p.lang)?.lang || 'vi',zoom:1,center:undefined});
}
