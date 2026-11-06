import {REFERENCE_STOPS,renderReferenceMap} from './reference-map.mjs';

// Use the poster as the single source for visitor-facing stop numbers.
// Places outside the schematic stay unnumbered instead of borrowing a catalog order.
const posterNumbers = new Map(REFERENCE_STOPS.map(([number]) => [String(number), String(number)]));
const posterStops = new Map(REFERENCE_STOPS.map(stop => [String(stop[0]), stop]));
export function stopNumber(poi) {
  return posterNumbers.get(String(poi?.code)) || '•';
}

export function schematicStopName(poi) {
  const stop = posterStops.get(String(poi.code));
  return stop && (!poi.lang || poi.lang === 'vi') ? stop[3] : poi.name;
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
  return renderReferenceMap({...options,zoom:1,center:undefined});
}
