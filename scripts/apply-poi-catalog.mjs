// Explicit one-time catalog update. Never invoked automatically by startup.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
try{process.loadEnvFile(new URL('../backend/.env',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
const catalog=JSON.parse(await readFile(new URL('./data/active-pois.json',import.meta.url),'utf8'));
const codes=catalog.points.map(p=>p.code),map='00000000-0000-0000-0000-000000000001';
const retiredCodes=['3','4','6','10','11','12','coord-08','coord-13'];
if(codes.length!==15||new Set(codes).size!==15)throw Error('Expected exactly fifteen canonical POIs');
const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query('BEGIN');await db.query('SELECT rev FROM content_clock WHERE id=1 FOR UPDATE');
 const {rows:before}=await db.query('SELECT * FROM pois WHERE map_id=$1',[map]);
 for(const p of catalog.points)if(!before.some(row=>row.code===p.code))throw Error(`Missing canonical POI ${p.code}; seed the current fixture first.`);
 const removed=before.filter(p=>!codes.includes(p.code)&&!p.deleted_at);
 if(removed.some(p=>!retiredCodes.includes(p.code)))throw Error('Unexpected extra POI; review before retiring anything.');
 if(!process.argv.includes('--apply')){
  console.log(JSON.stringify({dryRun:true,keep:codes.length,remove:removed.map(p=>({code:p.code,id:p.id}))}));await db.query('ROLLBACK');
 }else{
  const {rows:[previous]}=await db.query("SELECT value FROM app_configs WHERE key='active_poi_catalog'");
  if(previous?.value?.version===catalog.sourceSha256&&removed.length===0){await db.query('ROLLBACK');console.log('Catalog already applied; no changes made.');}
  else{
   const dir=new URL('../backend/.runtime/catalog-backups/',import.meta.url);await mkdir(dir,{recursive:true});
   const backup=new URL(`before-${Date.now()}.json`,dir);
   const {rows:related}=await db.query(`SELECT p.id,(SELECT json_agg(t) FROM poi_translations t WHERE t.poi_id=p.id) translations,(SELECT json_agg(a) FROM poi_audios a WHERE a.poi_id=p.id) audios FROM pois p WHERE p.map_id=$1`,[map]);
   await writeFile(backup,JSON.stringify({catalogVersion:catalog.sourceSha256,pois:before,related},null,2));
   const changed=new Set();
   for(const p of catalog.points){
    const old=before.find(row=>row.code===p.code);
    await db.query("UPDATE pois SET latitude=$1,longitude=$2,category_id=$3,geo_source_url=$4,geo_verified=false,sort_order=$5,status='PUBLISHED',deleted_at=NULL,version=version+1 WHERE id=$6",[p.latitude,p.longitude,p.categoryId,p.geoSourceUrl,p.order,old.id]);changed.add(old.id);
    for(const [lang,name] of Object.entries(p.names))await db.query('UPDATE poi_translations SET name=$1 WHERE poi_id=$2 AND lang_code=$3',[name,old.id,lang]);
   }
   // Reversible removal only: retain narration files, QR rows, jobs and history.
   if(removed.length){await db.query("UPDATE pois SET status='ARCHIVED',deleted_at=now(),version=version+1 WHERE id=ANY($1::uuid[])",[removed.map(p=>p.id)]);removed.forEach(p=>changed.add(p.id));}
   await db.query("INSERT INTO app_configs(key,value) VALUES('active_poi_catalog',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[JSON.stringify({version:catalog.sourceSha256,codes})]);
   const {rows:[clock]}=await db.query('UPDATE content_clock SET rev=rev+1 WHERE id=1 RETURNING rev');await db.query('UPDATE pois SET rev=$1,updated_at=now() WHERE id=ANY($2::uuid[])',[clock.rev,[...changed]]);
   await db.query('COMMIT');
   const result={keep:15,removed:removed.map(p=>({code:p.code,id:p.id})),backup:backup.href,catalogVersion:catalog.sourceSha256,noExternalRequests:true};
   await writeFile(new URL('last-result.json',dir),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  }
 }
}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
