// Checks a clean installation in an isolated temporary database, never the app DB.
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
try{process.loadEnvFile(new URL('../backend/.env',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
const root=fileURLToPath(new URL('../',import.meta.url));
const url=new URL(process.env.DATABASE_URL||'postgres://sag:sag@localhost:5432/sag');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname),'Only a local test database is supported');
const admin=new Client({connectionString:url.href});
const name='sag_share_test_'+randomBytes(6).toString('hex');
await admin.connect();
let test,created=false;
try{
 await admin.query(`CREATE DATABASE ${name}`);created=true;
 url.pathname='/'+name;
 test=new Client({connectionString:url.href});await test.connect();
 for(const file of ['schema.sql','complete.sql','analytics.sql'])await test.query(await readFile(new URL('../backend/db/'+file,import.meta.url),'utf8'));
 const storage=fileURLToPath(new URL('../backend/.runtime/'+name+'/storage/',import.meta.url));
 await mkdir(storage,{recursive:true});
 const seed=()=>{const result=spawnSync(process.execPath,['scripts/seed-shared-content.mjs'],{cwd:root,encoding:'utf8',env:{...process.env,DATABASE_URL:url.href,STORAGE_LOCAL_DIR:storage}});assert.equal(result.status,0,result.stderr);console.log(result.stdout.trim());};
 seed();
 const fixture=JSON.parse(await readFile(new URL('../backend/fixtures/content.json',import.meta.url),'utf8'));
 const expected=fixture.pois.reduce((n,p)=>n+p.translations.length,0);
 const ready=fixture.pois.reduce((n,p)=>n+p.translations.filter(t=>t.audio).length,0);
 const count=async table=>Number((await test.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n);
 assert.equal(await count('pois'),fixture.pois.length);
 assert.equal(await count('poi_translations'),expected);
 assert.equal(await count('users'),0);
 assert.equal(await count('refresh_tokens'),0);
 assert.equal(await count('visitor_sessions'),0);
 assert.equal(await count('tts_jobs'),0);
 const {rows:audios}=await test.query("SELECT audio_url,size_bytes FROM poi_audios WHERE status='READY' AND provider='GEMINI'");
 assert.equal(audios.length,ready);
 for(const a of audios)assert.equal((await readFile(storage+a.audio_url.slice('/audio-assets/'.length))).length,a.size_bytes);
 await test.query("UPDATE poi_translations SET name='Collaborator edit' WHERE id=(SELECT id FROM poi_translations LIMIT 1)");
 seed();
 assert.equal(await count('pois'),fixture.pois.length);
 assert.equal(await count('poi_audios'),expected);
 assert.equal(Number((await test.query("SELECT count(*) n FROM poi_translations WHERE name='Collaborator edit'")).rows[0].n),1);
 const {rows:existing}=await test.query("SELECT id,translation_id FROM poi_audios WHERE status='READY' ORDER BY id LIMIT 2");
 await test.query("UPDATE poi_audios SET status='FAILED',audio_url=NULL WHERE id=ANY($1::uuid[])",[existing.map(a=>a.id)]);
 await test.query("UPDATE poi_translations SET script_text='Changed by collaborator',text_hash=repeat('0',64) WHERE id=$1",[existing[1].translation_id]);
 seed();
 assert.equal((await test.query('SELECT status FROM poi_audios WHERE id=$1',[existing[0].id])).rows[0].status,'READY');
 assert.equal((await test.query('SELECT status FROM poi_audios WHERE id=$1',[existing[1].id])).rows[0].status,'FAILED');
 assert.equal((await test.query('SELECT script_text FROM poi_translations WHERE id=$1',[existing[1].translation_id])).rows[0].script_text,'Changed by collaborator');
 console.log('PASS: incremental Google audio import restores matching recordings and rejects changed transcripts.');
 console.log(`PASS: ${fixture.pois.length} POIs, ${expected} translations, ${ready} checked MP3s; rerun preserves edits; no private records or TTS requests.`);
}finally{
 if(test)await test.end();
 if(created)await admin.query(`DROP DATABASE ${name}`);
 await admin.end();
}
