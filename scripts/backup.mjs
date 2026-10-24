import {spawn} from 'node:child_process';
import {mkdir,cp,access,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const folder=path.join(root,'backend','.runtime','backups',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(folder,{recursive:true});
const compose=['compose','-f',path.join(root,'backend','docker','docker-compose.yml')];
function run(args){return new Promise((resolve,reject)=>{const child=spawn('docker',[...compose,...args],{cwd:root,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Backup command failed.')));});}
await run(['exec','-T','postgres','pg_dump','-U','sag','-d','sag','-Fc','-f','/tmp/sag-backup.dump']);
await run(['cp','postgres:/tmp/sag-backup.dump',path.join(folder,'database.dump')]);
try{await access(path.join(root,'backend','storage'));await cp(path.join(root,'backend','storage'),path.join(folder,'storage'),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(folder,'RESTORE.md'),'Stop application writes before backup for a consistent database/file pair. Restore database.dump with pg_restore into a NEW database; copy storage/ into the configured local storage directory. Verify POI counts, files and asset URLs before switching. Never overwrite the primary database to test a backup.\n');
console.log(`Backup retained locally: ${folder}`);
