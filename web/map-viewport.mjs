export const MAP_LEFT=0,MAP_TOP=0,MAP_WIDTH=1400,MAP_HEIGHT=990,MIN_MAP_ZOOM=.65,MAX_MAP_ZOOM=4;
export const DEFAULT_MAP_CENTER={x:MAP_LEFT+MAP_WIDTH/2,y:MAP_TOP+MAP_HEIGHT/2};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function mapViewport(zoom=1,center=DEFAULT_MAP_CENTER) {
  zoom=clamp(Number.isFinite(zoom)?zoom:1,MIN_MAP_ZOOM,MAX_MAP_ZOOM);
  const width=MAP_WIDTH/zoom,height=MAP_HEIGHT/zoom;
  const x=Number.isFinite(center?.x)?center.x:DEFAULT_MAP_CENTER.x;
  const y=Number.isFinite(center?.y)?center.y:DEFAULT_MAP_CENTER.y;
  const cx=width>=MAP_WIDTH?DEFAULT_MAP_CENTER.x:clamp(x,MAP_LEFT+width/2,MAP_LEFT+MAP_WIDTH-width/2);
  const cy=height>=MAP_HEIGHT?DEFAULT_MAP_CENTER.y:clamp(y,MAP_TOP+height/2,MAP_TOP+MAP_HEIGHT-height/2);
  return {zoom,width,height,center:{x:cx,y:cy},viewBox:`${cx-width/2} ${cy-height/2} ${width} ${height}`};
}

export function panMapViewport(zoom,center,dx,dy,pixelWidth,pixelHeight) {
  const view=mapViewport(zoom,center);
  if(view.zoom<=1 || !Number.isFinite(pixelWidth) || !Number.isFinite(pixelHeight) || pixelWidth<=0 || pixelHeight<=0)return view;
  return mapViewport(view.zoom,{
    x:view.center.x-dx*view.width/pixelWidth,
    y:view.center.y-dy*view.height/pixelHeight,
  });
}

// Preserve the map coordinate under the pointer while the wheel changes scale.
export function zoomMapAt(zoom,center,nextZoom,pointerX=.5,pointerY=.5) {
  const current=mapViewport(zoom,center),next=mapViewport(nextZoom,center);
  const x=clamp(Number.isFinite(pointerX)?pointerX:.5,0,1)-.5;
  const y=clamp(Number.isFinite(pointerY)?pointerY:.5,0,1)-.5;
  return mapViewport(next.zoom,{
    x:current.center.x+x*(current.width-next.width),
    y:current.center.y+y*(current.height-next.height),
  });
}
