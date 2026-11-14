import {REFERENCE_STOPS,renderReferenceMap,referenceStopName} from './reference-map.mjs';

// API list order supplies visitor numbers; codes remain stable database identities.
const posterNumbers = new Map(REFERENCE_STOPS.map(([number]) => [String(number), String(number)]));
export function stopNumber(poi) {
  const n = poi?.visitorNumber;
  return Number.isInteger(n) && n > 0 ? String(n) : posterNumbers.get(String(poi?.code)) || '•';
}

export function schematicStopName(poi) {
  return poi.name || referenceStopName(poi.code,poi.lang || 'vi');
}

// Cards follow the same fifteen numbered stops and order as the drawing.
export function schematicStops(pois) {
  if (pois.every(p => Number.isInteger(p.visitorNumber) && p.visitorNumber > 0)) return [...pois].sort((a,b)=>a.visitorNumber-b.visitorNumber).map(p=>({...p,name:schematicStopName(p)}));
  const byCode = new Map(pois.map(p => [String(p.code), p]));
  const numbered = REFERENCE_STOPS.flatMap(([number]) => {
    const poi = byCode.get(String(number));
    return poi ? [{...poi, name:schematicStopName(poi)}] : [];
  });
  return [...numbered,...pois.filter(p=>!posterNumbers.has(String(p.code)))];
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
