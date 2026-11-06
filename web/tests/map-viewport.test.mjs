import test from 'node:test';
import assert from 'node:assert/strict';
import {mapViewport,panMapViewport,zoomMapAt,MIN_MAP_ZOOM,MAX_MAP_ZOOM,DEFAULT_MAP_CENTER,MAP_LEFT,MAP_TOP,MAP_WIDTH,MAP_HEIGHT} from '../map-viewport.mjs';
import {renderReferenceMap} from '../reference-map.mjs';

test('Zoom doubles map detail without moving or renumbering the stops',()=>{
  const svg=renderReferenceMap({zoom:2});
  assert.match(svg,/viewBox="350 247.5 700 495"/);
  assert.match(svg,/cx="329" cy="619"/);
  assert.equal((svg.match(/data-reference-stop=/g)||[]).length,15);
});

test('Dragging moves the viewport by the corresponding map distance',()=>{
  const view=panMapViewport(2,DEFAULT_MAP_CENTER,100,50,700,495);
  assert.deepEqual(view.center,{x:600,y:445});
  assert.equal(view.viewBox,'250 197.5 700 495');
  const edge=panMapViewport(2,DEFAULT_MAP_CENTER,100000,100000,700,495);
  assert.equal(edge.viewBox,'0 0 700 495');
  const opposite=panMapViewport(2,DEFAULT_MAP_CENTER,-100000,-100000,700,495);
  assert.equal(opposite.viewBox,'700 495 700 495');
});

test('Zooming out restores all map regions after a pan and supports a smaller overview',()=>{
  assert.equal(mapViewport(1,{x:100,y:100}).viewBox,'0 0 1400 990');
  const view=mapViewport(MIN_MAP_ZOOM,{x:100,y:100});
  assert.deepEqual(view.center,DEFAULT_MAP_CENTER);
  const [x,y,w,h]=view.viewBox.split(' ').map(Number);
  assert.ok(x<MAP_LEFT && y<MAP_TOP && x+w>MAP_LEFT+MAP_WIDTH && y+h>MAP_TOP+MAP_HEIGHT);
});

test('Viewport remains finite at zoom limits and unavailable element sizes',()=>{
  assert.equal(mapViewport(100).zoom,MAX_MAP_ZOOM);
  assert.equal(mapViewport(0).zoom,MIN_MAP_ZOOM);
  assert.equal(mapViewport(NaN,{x:Infinity,y:NaN}).viewBox,'0 0 1400 990');
  assert.equal(panMapViewport(2,DEFAULT_MAP_CENTER,100,100,0,0).viewBox,'350 247.5 700 495');
});

test('Selecting or filtering a stop retains the zoomed viewport',()=>{
  const p={id:'tree',code:'2',name:'Tung đại thụ'};
  const svg=renderReferenceMap({pois:[p],visibleIds:[p.id],selectedId:p.id,zoom:2,center:{x:500,y:500}});
  assert.match(svg,/viewBox="150 252.5 700 495"/);
  assert.match(svg,/data-id="tree"[^>]*aria-pressed="true"/);
});

test('Wheel zoom keeps the same map coordinate underneath the mouse',()=>{
  const center=DEFAULT_MAP_CENTER,x=.3,y=.35;
  const before=mapViewport(1,center),after=zoomMapAt(1,center,2,x,y);
  const point=view=>({x:view.center.x+(x-.5)*view.width,y:view.center.y+(y-.5)*view.height});
  assert.ok(Math.abs(point(after).x-point(before).x)<1e-8);
  assert.ok(Math.abs(point(after).y-point(before).y)<1e-8);
  assert.deepEqual(zoomMapAt(after.zoom,after.center,1,x,y).center,center);
});

test('Wheel zoom at the map edges respects limits without losing the map',()=>{
  const view=zoomMapAt(3,{x:300,y:200},100,0,0);
  assert.equal(view.zoom,MAX_MAP_ZOOM);
  const [x,y,w,h]=view.viewBox.split(' ').map(Number);
  assert.ok(x>=MAP_LEFT && y>=MAP_TOP && x+w<=MAP_LEFT+MAP_WIDTH && y+h<=MAP_TOP+MAP_HEIGHT);
  assert.equal(zoomMapAt(1,DEFAULT_MAP_CENTER,NaN,NaN,Infinity).viewBox,'0 0 1400 990');
});
