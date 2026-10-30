import {stopNumber} from './schematic-map.mjs';
// Adapted from cat-tien-app/js/map/leaflet-map.js. Never project schematic points to fake GPS.
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const PARK_CENTER = [11.423368, 107.422042];
export function documentCoordinates(poi) {
  return /^urn:sha256:[a-f0-9]{64}#point-\d{2}$/.test(poi.geoSourceUrl || '');
}
export function verifiedCoordinates(poi) {
  return (poi.geoVerified || documentCoordinates(poi) || /^https:\/\//.test(poi.geoSourceUrl || '')) && typeof poi.lat === 'number' && typeof poi.lng === 'number'
    && Number.isFinite(poi.lat) && Number.isFinite(poi.lng)
    && Math.abs(poi.lat) <= 90 && Math.abs(poi.lng) <= 180 ? [poi.lat, poi.lng] : null;
}
export function createOutdoorMap({ container, note, onSelect }) {
  let map, markers, position, tiles, visible = false, latest;
  function fitPoints() {
    const points=(latest?.pois||[]).map(verifiedCoordinates).filter(Boolean);
    map.stop();map.invalidateSize({pan:false});
    if(points.length)map.fitBounds(points,{padding:[32,32],maxZoom:15,animate:false});
    else map.setView(PARK_CENTER,13);
  }
  function init() {
    const L = window.L;
    if (!L) throw new Error('Chưa tải được thư viện bản đồ. Hãy dùng sơ đồ tham quan.');
    map = L.map(container).setView(PARK_CENTER, 13);
    tiles = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    }).addTo(map);
    tiles.on('tileerror', () => { note.textContent = 'Không tải được nền OpenStreetMap. Hãy kiểm tra mạng hoặc chuyển về sơ đồ.'; });
    markers = L.layerGroup().addTo(map);
    position = L.layerGroup().addTo(map);
  }
  function update(data) {
    latest = data;
    if (!visible || !map) return;
    markers.clearLayers(); position.clearLayers();
    const L = window.L;
    for (const p of data.pois) {
      const ll = verifiedCoordinates(p);
      if (!ll) continue;
      const label = document.createElement('span'); label.textContent = `${stopNumber(p)}. ${p.name}`;
      L.circleMarker(ll, { radius: p.id === data.selectedId ? 12 : 9, color: '#234d3a', fillColor: '#d8e9ac', fillOpacity: 1 })
        .addTo(markers).bindTooltip(label).on('click', () => onSelect(p.id));
    }
    if (data.gps) {
      const ll = [data.gps.lat, data.gps.lng];
      L.circle(ll, { radius: data.gps.accuracy || 0, color: '#297fc5', weight: 1, fillOpacity: .1 }).addTo(position);
      L.circleMarker(ll, { radius: 7, color: '#fff', fillColor: '#297fc5', fillOpacity: 1 }).addTo(position);
    }
    note.textContent = `OpenStreetMap · ${data.pois.filter(verifiedCoordinates).length}/${data.pois.length} điểm đang lọc có tọa độ đối chiếu nguồn. Tuyến tham quan xem trên sơ đồ.`;
  }
  return {
    update,
    show(value) {
      visible = value; container.hidden = !value; note.hidden = !value;
      if (value) {
        const firstShow=!map;
        if (!map) init();
        requestAnimationFrame(() => { map.invalidateSize(); if (latest) update(latest); if(firstShow)fitPoints(); });
      }
    },
    reset() { if (map) fitPoints(); },
  };
}
