import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const generator = path.join(root, 'scripts', 'generate-demo-gemini-audio.mjs');
const build = path.join(root, 'web', 'build.mjs');
const selectedPois = '2,5,7,8,15';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function runNode(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
    child.stderr.on('data', chunk => { output += chunk; process.stderr.write(chunk); });
    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}

const pacificClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
});

function nextPacificReset() {
  const minute = Math.floor(Date.now() / 60000) * 60000 + 60000;
  for (let offset = 0; offset < 48 * 60; offset++) {
    const candidate = new Date(minute + offset * 60000);
    const parts = Object.fromEntries(pacificClock.formatToParts(candidate).map(p => [p.type, p.value]));
    if (parts.hour === '00' && parts.minute === '03') return candidate;
  }
  throw new Error('Could not determine the next Pacific quota reset');
}

async function waitForReset() {
  const target = nextPacificReset();
  console.log(`Gemini Free daily quota is exhausted. Next attempt: ${target.toISOString()} (00:03 Pacific).`);
  while (Date.now() < target.getTime()) await sleep(Math.min(60000, target.getTime() - Date.now()));
}

async function missingCount(args) {
  const result = await runNode(generator, [...args, '--dry-run']);
  if (result.code !== 0) throw new Error(`Unable to inspect Gemini queue (exit ${result.code})`);
  const match = result.output.match(/Generating (\d+) of \d+ missing clips/);
  if (!match) throw new Error('Could not read Gemini queue size');
  return Number(match[1]);
}

async function drain(args) {
  while (true) {
    const remaining = await missingCount(args);
    if (remaining === 0) return;
    await waitForReset();
    const result = await runNode(generator, [...args, '--max=10']);
    if (result.code !== 0) {
      if (/daily request quota is exhausted/i.test(result.output)) continue;
      throw new Error(`Gemini generation stopped with exit code ${result.code}; see diagnostics above.`);
    }
    const buildResult = await runNode(build);
    if (buildResult.code !== 0) throw new Error(`Web build failed with exit code ${buildResult.code}`);
  }
}

console.log(`First, regenerate all five languages for POIs ${selectedPois} with the warmer Sulafat voice.`);
await drain([`--voice=Sulafat`, `--poi=${selectedPois}`, '--force']);
console.log('Selected voice replacements are complete. Continuing the remaining Gemini narration queue while preserving the selected Sulafat POIs.');
await drain([`--exclude-pois=${selectedPois}`]);
console.log('All current narration transcripts have matching Gemini audio; selected POIs use Sulafat.');
