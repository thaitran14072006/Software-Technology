import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const languages = ['vi', 'en', 'ja', 'ko', 'zh'];
const locale = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'cmn-CN' };
const content = JSON.parse(await readFile(path.join(root, 'backend/fixtures/content.json'), 'utf8'));
const fixtureDir = path.join(root, 'backend/fixtures/audio');
const outputDir = path.join(root, 'web/narration-audio');
const manifestPath = path.join(outputDir, 'manifest.json');
const pois = content.pois.filter(p => Number(p.code) >= 1 && Number(p.code) <= 15);
if (pois.length !== 15) throw new Error(`Expected 15 stops, found ${pois.length}`);
await mkdir(outputDir, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const fixtureFiles = new Set(await (await import('node:fs/promises')).readdir(fixtureDir));
const tasks = [];
for (const poi of pois) for (const lang of languages) {
  const tr = poi.translations.find(t => t.lang_code === lang);
  if (!tr?.script_text?.trim()) throw new Error(`Missing script ${poi.code}:${lang}`);
  const key = `${poi.code}:${lang}`;
  if ([...fixtureFiles].some(f => f.startsWith(`${poi.code}-${lang}-`) && f.endsWith('.mp3'))) continue;
  const file = `${poi.code}-${lang}.mp3`;
  const textHash = tr.text_hash || createHash('sha256').update(tr.script_text).digest('hex');
  if (manifest[key]?.textHash === textHash) continue;
  tasks.push({ poi, lang, key, file, text: tr.script_text, textHash });
}
let next = 0;
const workers = Array.from({ length: 2 }, async () => {
  while (next < tasks.length) {
    const task = tasks[next++];
    const response = await fetch('http://127.0.0.1:3010/synthesize', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: task.text, locale: locale[task.lang], gender: 'FEMALE' }),
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('audio/mpeg'))
      throw new Error(`TTS failed ${task.key}: HTTP ${response.status} ${await response.text()}`);
    const audio = Buffer.from(await response.arrayBuffer());
    if (audio.length < 1000) throw new Error(`Audio too small for ${task.key}: ${audio.length}`);
    await writeFile(path.join(outputDir, task.file), audio);
    manifest[task.key] = { file: task.file, textHash: task.textHash, voiceName: `eSpeak NG ${response.headers.get('x-voice') || locale[task.lang]}`, bytes: audio.length };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Generated ${task.key} (${audio.length} bytes)`);
  }
});
await Promise.all(workers);
console.log(`Finished ${tasks.length} local audio files; existing Google recordings retained.`);
