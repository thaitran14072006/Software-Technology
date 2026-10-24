import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
try { process.loadEnvFile(fileURLToPath(new URL('../backend/.env', import.meta.url))); } catch {}
const result = spawnSync(process.execPath, [fileURLToPath(new URL('./dev-token.js', import.meta.url))], { stdio: 'inherit' });
process.exitCode = result.status || 0;
