// Visitor numbers are independent of stable database/QR codes.
export function stopNumber(poi) {
  return Number.isInteger(poi.sortOrder) && poi.sortOrder > 0 ? String(poi.sortOrder) : /^\d{1,2}$/.test(poi.code) ? poi.code : '•';
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Project the current GPS bounds, not the superseded hand-drawn coordinates.
// Fixed side callouts keep nearby headquarters stops readable without inventing roads.
export function schematicLayout(pois) {
  const points = pois.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!points.length) return [];
  const latitudes = points.map(p => p.lat), longitudes = points.map(p => p.lng);
  const south = Math.min(...latitudes), north = Math.max(...latitudes);
  const west = Math.min(...longitudes), east = Math.max(...longitudes);
  const cosine = Math.cos((north + south) / 2 * Math.PI / 180);
  const scale = Math.min(470 / Math.max((east-west)*cosine, .001), 660 / Math.max(north-south, .001));
  const projected = points.map(p => ({...p, x:690+(p.lng-(west+east)/2)*cosine*scale, y:450-((p.lat-(north+south)/2)*scale)}));
  const westToEast = [...projected].sort((a,b)=>a.x-b.x || a.y-b.y || stopNumber(a).localeCompare(stopNumber(b)));
  const left = new Set(westToEast.slice(0, Math.ceil(points.length/2)).map(p=>p.id));
  for (const side of [true,false]) {
    const rows = projected.filter(p=>left.has(p.id)===side).sort((a,b)=>a.y-b.y || a.x-b.x);
    rows.forEach((p,i)=>Object.assign(p,{labelX:side?48:1008,labelY:110+i*(700/Math.max(rows.length-1,1)),labelWidth:324,labelHeight:74,left:side}));
  }
  return projected;
}
function wrapName(name) {
  const lines=[''];
  for(const word of String(name).split(/\s+/)) {
    const last=lines.length-1;
    if(lines[last] && [...lines[last]+' '+word].length>25)lines.push(word);
    else lines[last]+=(lines[last]?' ':'')+word;
  }
  return lines;
}
export function renderSchematic({pois,visibleIds,selectedId,routeCodes=[],centerCode='coord-01',title,note,zoom=1}) {
  const layout=schematicLayout(pois), visible=new Set(visibleIds), byCode=new Map(layout.map(p=>[p.code,p]));
  if(byCode.has(centerCode))byCode.set('0',byCode.get(centerCode));
  const route=routeCodes.slice(1).map((code,i)=>{
    const a=byCode.get(String(routeCodes[i])),b=byCode.get(String(code));
    return a&&b?`<path class="map-route" d="M${a.x},${a.y} L${b.x},${b.y}"/>`:'';
  }).join('');
  const nodes=layout.filter(p=>visible.has(p.id)).map(p=>{
    const active=p.id===selectedId, color=active?'#234d3a':'#718960';
    const lines=wrapName(p.name), textY=p.labelY+37-(lines.length-1)*12;
    return `<g class="map-stop" tabindex="0" role="button" aria-label="${escape(stopNumber(p)+'. '+p.name)}" aria-pressed="${active}" data-id="${escape(p.id)}"><title>${escape(p.name)}</title><path class="schematic-leader" d="M${p.left?p.labelX+p.labelWidth:p.labelX},${p.labelY+37} L${p.x},${p.y}" stroke="${color}"/><circle class="schematic-anchor" cx="${p.x}" cy="${p.y}" r="${active?9:5}" fill="${color}"/><rect class="schematic-card" x="${p.labelX}" y="${p.labelY}" width="${p.labelWidth}" height="${p.labelHeight}" rx="16" fill="${active?'#234d3a':'#fafbf4'}" stroke="${color}"/><circle cx="${p.labelX+30}" cy="${p.labelY+37}" r="20" fill="${active?'#d8e9ac':'#e6edda'}"/><text class="schematic-number" x="${p.labelX+30}" y="${p.labelY+38}" text-anchor="middle" dominant-baseline="central">${escape(stopNumber(p))}</text><text class="map-label schematic-label" fill="${active?'#fff':'#234d3a'}">${lines.map((line,i)=>`<tspan x="${p.labelX+62}" y="${textY+i*24}">${escape(line)}</tspan>`).join('')}</text></g>`;
  }).join('');
  const width=1380/zoom,height=960/zoom;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(1380-width)/2} ${(960-height)/2} ${width} ${height}" role="group" aria-label="${escape(title)}"><defs><pattern id="forest-grid" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="1.5" fill="#98af87" opacity=".3"/></pattern></defs><rect width="1380" height="960" fill="#edf2e5"/><rect x="420" y="90" width="540" height="760" rx="80" fill="#dbe8cd"/><rect width="1380" height="960" fill="url(#forest-grid)"/><text x="690" y="52" text-anchor="middle" class="schematic-title">${escape(title)}</text><g transform="translate(925,60)" fill="#42613c"><path d="M0-18 7 8 0 3-7 8Z"/><text x="16" y="3" font-size="17">N</text></g>${route}${nodes}<text x="690" y="914" text-anchor="middle" class="schematic-note">${escape(note)}</text></svg>`;
}
