import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
if(existsSync(new URL('./data/active-pois.json',import.meta.url)))throw Error('This Word coordinate list is superseded by active-pois.json. Use content:catalog instead.');
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
try{process.loadEnvFile(new URL('../backend/.env',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
const data=JSON.parse(await readFile(new URL('./data/document-coordinates.json',import.meta.url),'utf8'));
const translations=JSON.parse(await readFile(new URL('./data/coordinate-poi-translations.json',import.meta.url),'utf8'));
const doc=new URL('../'+data.sourceFile,import.meta.url);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
if(digest(await readFile(doc))!==data.sourceSha256)throw Error('Document changed; review the coordinate mapping first.');
if(data.points.length!==15||new Set(data.points.map(p=>p.code)).size!==15)throw Error('Expected 15 distinct coordinate points');
for(const p of data.points){
 if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180||p.geoVerified!==false)throw Error('Invalid coordinate or field-verification flag');
 if(p.geoSourceUrl!==`urn:sha256:${data.sourceSha256}#point-${String(p.documentOrder).padStart(2,'0')}`)throw Error('Invalid document provenance');
 if(!p.existing&&['en','ja','ko','zh'].some(l=>!translations[p.code]?.[l]?.every(Boolean)))throw Error('Missing new-POI translation');
}
const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query('BEGIN');await db.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const {rows:before}=await db.query(`SELECT p.*, (SELECT json_agg(t) FROM poi_translations t WHERE t.poi_id=p.id) AS translations, (SELECT json_agg(a) FROM poi_audios a WHERE a.poi_id=p.id) AS audios FROM pois p WHERE p.code=ANY($1::text[])`,[data.points.map(p=>p.code)]);
 for(const p of data.points){const old=before.find(x=>x.code===p.code);if(p.existing&&!old)throw Error(`Mapped existing code ${p.code} is missing`);if(old?.deleted_at)throw Error(`Code ${p.code} was deleted; review before import`);if(!p.existing&&old&&old.geo_source_url!==p.geoSourceUrl)throw Error(`New code ${p.code} is already used by another source`);}
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({dryRun:true,update:data.points.filter(p=>{const old=before.find(x=>x.code===p.code);return old&&(old.latitude!==p.latitude||old.longitude!==p.longitude||old.geo_source_url!==p.geoSourceUrl||old.geo_verified!==false);}).length,create:data.points.filter(p=>!before.some(x=>x.code===p.code)).length,sourceSha256:data.sourceSha256}));await db.query('ROLLBACK');}
 else{
  const dir=new URL('../backend/.runtime/coordinate-import/',import.meta.url);await mkdir(dir,{recursive:true});
  const backup=new URL(`before-${Date.now()}.json`,dir);await writeFile(backup,JSON.stringify({sourceSha256:data.sourceSha256,pois:before},null,2));
  const ids=[],changes=[];let created=0,updated=0;
  for(const p of data.points){
   const old=before.find(x=>x.code===p.code);
   if(old){
    if(old.latitude===p.latitude&&old.longitude===p.longitude&&old.geo_source_url===p.geoSourceUrl&&old.geo_verified===false)continue;
    await db.query('UPDATE pois SET latitude=$1,longitude=$2,geo_source_url=$3,geo_verified=false,version=version+1 WHERE id=$4',[p.latitude,p.longitude,p.geoSourceUrl,old.id]);ids.push(old.id);updated++;
    changes.push({code:p.code,name:p.name,action:'updated',before:[old.latitude,old.longitude],after:[p.latitude,p.longitude]});
   }else{
    const {rows:[poi]}=await db.query(`INSERT INTO pois(code,map_id,category_id,latitude,longitude,geo_verified,geo_source_url,status,sort_order) VALUES($1,'00000000-0000-0000-0000-000000000001',$2,$3,$4,false,$5,'PUBLISHED',$6) RETURNING id`,[p.code,p.categoryId,p.latitude,p.longitude,p.geoSourceUrl,100+p.documentOrder]);
    const vi=p.code==='coord-08'?p.description+' Điểm đánh dấu thể hiện khu vực quan sát trong tài liệu, không đại diện cho toàn bộ tuyến ngắm thú đêm.':p.description;
    const rows=[['vi',p.name,vi],...['en','ja','ko','zh'].map(l=>[l,...translations[p.code][l]])];
    for(const [lang,name,text] of rows){
     const {rows:[tr]}=await db.query('INSERT INTO poi_translations(poi_id,lang_code,name,summary,script_text,text_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[poi.id,lang,name,text.slice(0,500),text,digest(text.trim())]);
     await db.query("INSERT INTO poi_audios(translation_id,poi_id,lang_code,source,status) VALUES($1,$2,$3,'TTS','PENDING')",[tr.id,poi.id,lang]);
    }
    await db.query("INSERT INTO poi_qr_codes(kind,poi_id,token) VALUES('POI',$1,$2)",[poi.id,randomUUID().replaceAll('-','')]);
    ids.push(poi.id);created++;changes.push({code:p.code,name:p.name,action:'created',after:[p.latitude,p.longitude]});
   }
  }
  if(ids.length){const {rows:[clock]}=await db.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await db.query('UPDATE pois SET rev=$1,updated_at=now() WHERE id=ANY($2::uuid[])',[clock.rev,ids]);}
  const result={created,updated,documentPoints:15,backup:fileURLToPath(backup),sourceSha256:data.sourceSha256,changes,noGoogleRequests:true};
  await db.query('COMMIT');await writeFile(new URL('last-result.json',dir),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }
}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
