import {createRequire} from 'node:module';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query("INSERT INTO poi_qr_codes(kind,poi_id,token) SELECT 'POI',p.id,encode(gen_random_bytes(16),'hex') FROM pois p WHERE p.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM poi_qr_codes q WHERE q.poi_id=p.id AND q.kind='POI')");
 console.log('QR registry completed without replacing existing tokens.');
}finally{await db.end();}
