import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(path.join(root, 'backend', '.env'));
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY is empty in backend/.env');
const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
if (model !== 'gemini-3.8-flash-tts' && model !== 'gemini-3.8-flash-lite-tts') throw new Error(`Unsupported Gemini TTS model: ${model}`);
const voice = process.env.GEMINI_VOICE_FEMALE || 'Kore';
const langs = {
  vi: 'Vietnamese', en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Mandarin Chinese',
};
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
class RateLimitError extends Error { constructor(message, waitMs) { super(message); this.waitMs = waitMs; } }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const fixture = JSON.parse(await readFile(path.join(root, 'backend/fixtures/content.json'), 'utf8'));
const pois = fixture.pois.filter(p => Number(p.code) >= 1 && Number(p.code) <= 15);
const outDir = path.join(root, 'web/narration-audio');
const manifestPath = path.join(outDir, 'manifest.json');
await mkdir(outDir, { recursive: true });
let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let manifestWrite = Promise.resolve();
function saveManifest() {
  const snapshot = JSON.stringify(manifest, null, 2) + '\n';
  manifestWrite = manifestWrite.then(() => writeFile(manifestPath, snapshot));
  return manifestWrite;
}
const sourceAudio = new Set(await (await import('node:fs/promises')).readdir(path.join(root, 'backend/fixtures/audio')));
const tasks = [];
for (const poi of pois) for (const [lang, language] of Object.entries(langs)) {
  const tr = poi.translations.find(t => t.lang_code === lang);
  if (only && only !== `${poi.code}:${lang}`) continue;
  if (!tr?.script_text?.trim()) throw new Error(`Missing script ${poi.code}:${lang}`);
  if ([...sourceAudio].some(f => f.startsWith(`${poi.code}-${lang}-`) && f.endsWith('.mp3'))) continue;
  const hash = tr.text_hash || createHash('sha256').update(tr.script_text).digest('hex');
  const old = manifest[`${poi.code}:${lang}`];
  if (old?.provider === 'GEMINI' && old.textHash === hash && old.model === model && old.voice === voice) continue;
  tasks.push({ code: poi.code, lang, language, text: tr.script_text, textHash: hash });
}

function convertToMp3(wav) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', [
      'compose', '-f', path.join(root, 'backend/docker/docker-compose.yml'), 'exec', '-T', 'local-tts',
      'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const chunks = []; let bytes = 0; let errors = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('FFmpeg conversion timed out')); }, 90000);
    child.stdout.on('data', b => { bytes += b.length; if (bytes > 20 * 1024 * 1024) child.kill(); else chunks.push(b); });
    child.stderr.on('data', b => { errors += b.toString(); });
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => { clearTimeout(timer); code === 0 && bytes > 1000 ? resolve(Buffer.concat(chunks)) : reject(new Error(`MP3 conversion failed: ${errors.slice(0, 300)}`)); });
    child.stdin.on('error', () => {});
    child.stdin.end(wav);
  });
}

async function synthesize(task) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{
        text: task.text.normalize('NFC'),
        speech_metadata: { style: `Warm, clear national park tour narration in fluent ${task.language}. Native-sounding pronunciation and natural pacing. Read the transcript exactly; do not translate, summarize, omit, or add words.` },
      }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        responseFormat: { audio: { mimeType: 'AUDIO_WAV', sampleRate: 24000 } },
        speechConfig: { voiceConfig: { voice } },
      },
    }),
    signal: AbortSignal.timeout(150000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    if (response.status === 429) {
      if (/requests per day|daily request|RPD/i.test(detail)) throw new Error('Gemini Free tier daily request quota is exhausted; rerun after the quota resets.');
      const seconds = Number(detail.match(/retry in ([\d.]+)s/i)?.[1] || 60);
      throw new RateLimitError(`Gemini free-tier rate limit; waiting ${Math.ceil(seconds)}s`, Math.ceil(seconds * 1000));
    }
    throw new Error(`Gemini ${response.status} for ${task.code}:${task.lang}: ${detail}`);
  }
  const json = await response.json();
  const parts = json.candidates?.[0]?.content?.parts || [];
  const raw = parts.find(p => p.inlineData?.mimeType?.startsWith('audio/'))?.inlineData?.data;
  if (!raw) throw new Error(`Gemini returned no audio for ${task.code}:${task.lang}`);
  const wav = Buffer.from(raw, 'base64');
  if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`Invalid WAV for ${task.code}:${task.lang}`);
  const mp3 = await convertToMp3(wav);
  const file = `${task.code}-${task.lang}.mp3`;
  const temp = path.join(outDir, `${file}.tmp`);
  await writeFile(temp, mp3);
  await rename(temp, path.join(outDir, file));
  manifest[`${task.code}:${task.lang}`] = {
    file, textHash: task.textHash, provider: 'GEMINI', model, voice,
    voiceName: `Gemini ${model} · ${voice}`, bytes: mp3.length,
  };
  await saveManifest();
  console.log(`Generated Gemini audio ${task.code}:${task.lang} (${mp3.length} bytes)`);
}

console.log(`Generating ${tasks.length} missing clips with ${model}/${voice}; existing Google recordings remain unchanged.`);
for (let i = 0; i < tasks.length; i += 3) {
  // The Free tier currently allows only three generateContent requests per minute.
  await wait(61000);
  const batch = tasks.slice(i, i + 3);
  await Promise.all(batch.map(async task => {
    let retries = 0;
    while (true) {
      try { await synthesize(task); break; }
      catch (error) {
        if (!(error instanceof RateLimitError) || retries >= 2) throw error;
        console.log(`${error.message}; retrying ${task.code}:${task.lang}`);
        await wait(error.waitMs + 2000);
        retries++;
      }
    }
  }));
}
console.log(`Finished ${tasks.length} Gemini clips.`);
