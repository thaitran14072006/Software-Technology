import {createRequire} from 'node:module';
import {randomBytes,scryptSync} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const {Client}=require('pg');
const db=new Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try{
 const id='00000000-0000-0000-0000-0000000000aa';
 const {rows:[user]}=await db.query('SELECT password_hash FROM users WHERE id=$1',[id]);
 if(user?.password_hash.startsWith('scrypt:')&&!process.env.ADMIN_PASSWORD){console.log('Admin account retained. Credentials: backend/.runtime/admin-login.txt (if created here).');}
 else{
  const password=process.env.ADMIN_PASSWORD||randomBytes(18).toString('base64url');
  if(password.length<12)throw new Error('ADMIN_PASSWORD must have at least 12 characters.');
  const email=process.env.ADMIN_EMAIL||'admin@local.test',salt=randomBytes(16).toString('hex');
  const hash=`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
  await db.query("INSERT INTO users(id,email,password_hash,full_name,role) VALUES($1,$2,$3,'Local administrator','ADMIN') ON CONFLICT(id) DO UPDATE SET email=$2,password_hash=$3,is_active=true",[id,email,hash]);
  const dir=fileURLToPath(new URL('../backend/.runtime/',import.meta.url));await mkdir(dir,{recursive:true});
  await writeFile(dir+'admin-login.txt',`Local development account. Keep private.\nEmail: ${email}\nPassword: ${password}\n`,{mode:0o600});
  console.log('Local admin initialized. Read backend/.runtime/admin-login.txt; password is not printed in logs.');
 }
}finally{await db.end();}
