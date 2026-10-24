import { spawn, spawnSync } from 'node:child_process';
import { access, copyFile, mkdir, readFile,writeFile } from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lanURLs } from './lan-url.mjs';
import { appPorts, assertPortsAvailable } from './check-app-ports.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const backend = path.join(root, 'backend');
const children = [];
let stopping = false;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const exists = async p => { try { await access(p); return true; } catch { return false; } };
function run(exe, args, cwd = root, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { cwd, stdio: 'inherit', ...options });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${path.basename(exe)} ${args[0]} exited ${code}`)));
  });
}
async function waitFor(check, description) {
  for (let i = 0; i < 90; i++) {
    try { if (await check() && !stopping) return; } catch {}
    if (stopping) throw new Error('Stopped');
    await delay(1000);
  }
  throw new Error(`Timed out waiting for ${description}. See backend/.runtime/*.log.`);
}
function launch(name, file, cwd) {
  const log = createWriteStream(path.join(backend, '.runtime', `${name}.log`), { flags: 'w' });
  const child = spawn(process.execPath, [file], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log); child.stderr.pipe(log); children.push(child);
  child.on('error', error => { console.error(`${name}: ${error.message}`); stop(1); });
  child.on('exit', code => { log.end(); if (!stopping) { console.error(`${name} exited (${code}). Read backend/.runtime/${name}.log`); stop(1); } });
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach(child => child.kill());
  console.log('\nStopped application processes. Docker data is retained; npm run infra:stop stops containers.');
  process.exitCode = code;
}
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
try {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Use Node.js 24+ for the updated NestJS runtime.');
  if (!process.env.npm_execpath) throw new Error('Start this script with npm run dev:full.');
  if (!await exists(path.join(backend, '.env'))) await copyFile(path.join(backend, '.env.example'), path.join(backend, '.env'));
  const envFile=path.join(backend,'.env');let envText=await readFile(envFile,'utf8');
  if(!process.env.JWT_SECRET && (/^JWT_SECRET=change-me-in-dev\s*$/m.test(envText)||!/^JWT_SECRET=\S+/m.test(envText))){
    const line=`JWT_SECRET=${randomBytes(48).toString('hex')}`;
    envText=/^JWT_SECRET=.*$/m.test(envText)?envText.replace(/^JWT_SECRET=.*$/m,line):envText+'\n'+line+'\n';
    await writeFile(envFile,envText,{mode:0o600});console.log('Prepared a private random local JWT secret.');
  }
  process.loadEnvFile(path.join(backend, '.env'));
  await assertPortsAvailable(appPorts(process.env, process.argv.includes('--lan')));
  if (process.argv.includes('--gemini')) {
    if (!process.env.GEMINI_API_KEY) throw new Error('Thêm GEMINI_API_KEY vào backend/.env trước khi chạy dev:gemini. Không gửi key lên chat.');
    process.env.TTS_PROVIDER = 'GEMINI';
  }
  // Free by default, even when an older .env still selects Google.
  else if (process.argv.includes('--local-tts')) process.env.TTS_PROVIDER = 'LOCAL';
  else if (!process.argv.includes('--cloud-tts')) process.env.TTS_PROVIDER = 'DEVICE';
  process.env.PUBLIC_ASSET_BASE = '/audio-assets';
  console.log(`TTS: ${process.env.TTS_PROVIDER}${process.env.TTS_PROVIDER === 'LOCAL' ? ' (eSpeak). Muốn giọng Google AI Studio: npm run dev:gemini:lan' : ''}`);
  if (process.env.DATABASE_URL !== 'postgres://sag:sag@localhost:5432/sag') throw new Error('dev:full only seeds the local demo DATABASE_URL. For a custom database follow DEMO.md and run services manually.');
  console.log('Starting local infrastructure…');
  const compose = ['compose', '-f', path.join(backend, 'docker', 'docker-compose.yml'),...((process.argv.includes('--local-tts')||process.argv.includes('--gemini'))?['--profile','local-tts']:[])];
  await run('docker', [...compose, 'up', '-d', '--quiet-pull']);
  if(process.argv.includes('--local-tts'))await waitFor(async()=>(await fetch(`${process.env.LOCAL_TTS_URL??'http://127.0.0.1:3010'}/health`)).ok,'local TTS');
  await waitFor(async () => spawnSync('docker', [...compose, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'sag', '-d', 'sag'], { stdio: 'ignore' }).status === 0, 'PostgreSQL');
  if (!await exists(path.join(backend, 'node_modules', 'ts-loader'))) await run(process.execPath, [process.env.npm_execpath, 'ci', '--no-audit', '--no-fund'], backend);
  console.log('Building backend services and web…');
  if (!process.argv.includes('--skip-build')) await run(process.execPath, [process.env.npm_execpath, 'run', 'build'], backend);
  await run(process.execPath, [path.join(root, 'web', 'build.mjs')]);
  await mkdir(path.join(backend, '.runtime'), { recursive: true });
  // Establish the FK identity before creating POIs; seed the QR row after POIs exist.
  const sql = Buffer.concat([await readFile(path.join(backend, 'db', 'complete.sql')), Buffer.from('\n'), await readFile(path.join(backend, 'db', 'dev-seed.sql')), Buffer.from('\n'), await readFile(path.join(backend, 'db', 'analytics.sql'))]);
  async function applyDevSql() {
    await new Promise((resolve, reject) => {
      const child = spawn('docker', [...compose, 'exec', '-T', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'sag', '-d', 'sag'], { cwd: root, stdio: ['pipe', 'inherit', 'inherit'] });
      child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error('Demo SQL seed failed'))); child.stdin.end(sql);
    });
  }
  await applyDevSql();
  await run(process.execPath, [path.join(root, 'scripts', 'setup-admin.mjs')]);
  await run(process.execPath, [path.join(root, 'scripts', 'seed-shared-content.mjs')]);
  for (const service of ['content-poi-service', 'audio-tts-service', 'qr-fallback-service']) launch(service, path.join(backend, 'dist', 'apps', service, 'main.js'), backend);
  const contentPort = process.env.CONTENT_PORT || '3001';
  const qrPort = process.env.QR_PORT || '3003';
  const contentUrl = `http://127.0.0.1:${contentPort}`;
  await waitFor(async () => (await fetch(`${contentUrl}/api/v1/pois?mapId=00000000-0000-0000-0000-000000000001&lang=vi`)).ok, 'content API');
  await waitFor(async () => (await fetch(`http://127.0.0.1:${qrPort}/api/v1/qr`)).ok, 'QR API');
  const jwt = spawnSync(process.execPath, [path.join(root, 'scripts', 'dev-token.js')], { env: process.env, encoding: 'utf8' });
  if (jwt.status !== 0) throw new Error('Cannot generate local demo JWT');
  await run(process.execPath, [path.join(root, 'scripts', 'seed-from-legacy.js'), `${contentUrl}/api/v1`, '00000000-0000-0000-0000-000000000001'], root, { env: { ...process.env, ADMIN_TOKEN: jwt.stdout.trim() } });
  await applyDevSql();
  await run(process.execPath, [path.join(root, 'scripts', 'complete-seed.mjs')]);
  process.env.CONTENT_API_URL ||= contentUrl;
  process.env.QR_API_URL ||= `http://127.0.0.1:${qrPort}`;
  if (process.argv.includes('--lan')) {
    const urls = lanURLs(process.env.PORT || 4173);
    if (!urls.length && !process.env.PUBLIC_WEB_URL) throw new Error('Không tìm thấy IPv4 Wi-Fi/LAN. Kết nối máy tính vào mạng rồi chạy lại.');
    process.env.HOST = '0.0.0.0';
    process.env.PUBLIC_WEB_URL ||= urls[0];
    console.log(`\nĐiện thoại cùng Wi-Fi: ${process.env.PUBLIC_WEB_URL}\nQR tham gia dùng địa chỉ này. Các địa chỉ LAN phát hiện được: ${urls.join(', ')}`);
  }
  launch('web', path.join(root, 'web', 'server.mjs'), root);
  await waitFor(async ()=>(await fetch(`http://127.0.0.1:${process.env.PORT||4173}/`)).ok,'web server');
  await waitFor(async ()=>(await fetch(`http://127.0.0.1:${process.env.AUDIO_PORT||3002}/health/ready`)).ok,'audio readiness');
  console.log(`\nWeb: http://127.0.0.1:${process.env.PORT || 4173}\nVisitors do not sign in. Admin: Kết nối → Đăng nhập quản trị. Credentials: backend/.runtime/admin-login.txt\nLogs: backend/.runtime/ · Ctrl+C stops app processes.`);
} catch (error) { console.error(error.message); stop(1); }
