import catalog from '../src/config/poi-catalog.json';
import {applyPoiCatalog} from '../src/config/poi-catalog';
test('updated mobile caches retain exactly the revised catalog and preserve audio metadata',()=>{
 const input=catalog.points.map(p=>({id:p.code,code:p.code,lat:0,lng:0,geoVerified:true,lang:'vi',name:'old',audio:{provider:'GEMINI'}}));
 input.push({id:'removed',code:'3',lat:11,lng:107,geoVerified:true,lang:'vi',name:'retired',audio:{provider:'GEMINI'}});
 const result=applyPoiCatalog(input);
 expect(result).toHaveLength(15);expect(result.map(p=>p.code)).toEqual(catalog.points.map(p=>p.code));
 for(const [i,p] of result.entries()){expect(p.lat).toBe(catalog.points[i].latitude);expect(p.lng).toBe(catalog.points[i].longitude);expect(p.geoVerified).toBe(false);expect(p.audio.provider).toBe('GEMINI');}
});
