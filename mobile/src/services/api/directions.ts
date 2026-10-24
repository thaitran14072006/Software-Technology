import { haversine } from '../../utils/haversine';
import type { RouteInfo } from '../../store/mapStore';
type P={lat:number;lng:number};
/** No paid routing API. Forest routes use the local graph; outside it only an explicit approximation. */
export async function getWalkingRoute(from:P,to:P):Promise<RouteInfo>{
 const d=haversine(from,to);
 return {coords:[[from.lng,from.lat],[to.lng,to.lat]],distanceM:d,durationS:d/1.2,approximate:true};
}
