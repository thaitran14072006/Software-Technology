import { readFile, writeFile } from 'node:fs/promises';

// RN 0.80+ Arguments.fromBundle requires a non-null Bundle. RNTP v4 metadata
// remains nullable: preserve null instead of asserting !! or inventing a track.
const base = new URL('../node_modules/react-native-track-player/', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', base), 'utf8'));
if (!['4.1.1', '4.1.2'].includes(version)) {
  throw new Error(`Review the TrackPlayer Android compatibility patch for version ${version}.`);
}
const target = new URL('android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt', base);
const raw = await readFile(target, 'utf8');
let source = raw.replace(/\r\n/g, '\n');
const replacements = [
  [
    'Arguments.fromBundle(musicService.tracks[index].originalItem)',
    'musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) }',
  ],
  [
    'else Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            )',
    'else musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }',
  ],
];
for (const [before, after] of replacements) {
  if (source.includes(after)) continue;
  if (source.split(before).length !== 2) throw new Error('TrackPlayer source changed; review patch before applying.');
  source = source.replace(before, after);
}
// Expression bodies infer kotlinx.coroutines.Job, which RN's TurboModule
// interop cannot expose as an async @ReactMethod. Keep the coroutine and Promise
// semantics, but make each exported method return JVM void (Kotlin Unit).
const coroutineMethod = /(@ReactMethod\s+fun\s+(\w+)\s*\([^)]*\))\s*=\s*scope\.launch\s*\{/g;
function closingBrace(text, opening) {
  let depth = 1;
  for (let i = opening + 1; i < text.length; i++) {
    if (text.startsWith('//', i)) { const end = text.indexOf('\n', i); i = end < 0 ? text.length : end; continue; }
    if (text.startsWith('/*', i)) { const end = text.indexOf('*/', i + 2); if (end < 0) break; i = end + 1; continue; }
    if (text.startsWith('"""', i)) { const end = text.indexOf('"""', i + 3); if (end < 0) break; i = end + 2; continue; }
    if (text[i] === '"' || text[i] === "'") {
      const quote = text[i++];
      while (i < text.length && text[i] !== quote) { if (text[i] === '\\') i++; i++; }
      continue;
    }
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return i;
  }
  throw new Error('Unbalanced Kotlin coroutine body; patch not applied.');
}
const matches = [...source.matchAll(coroutineMethod)];
const wrapped = [...source.matchAll(/@ReactMethod\s+fun\s+\w+\s*\([^)]*\): Unit \{\s+scope\.launch \{/g)];
if (matches.length === 37 && wrapped.length === 0) {
  for (const match of matches.reverse()) {
    const opening = match.index + match[0].length - 1;
    const closing = closingBrace(source, opening);
    const body = source.slice(opening + 1, closing).replace(/\n/g, '\n    ');
    source = source.slice(0, match.index) + `${match[1]}: Unit {\n        scope.launch {${body}}\n    }` + source.slice(closing + 1);
  }
} else if (matches.length !== 0 || wrapped.length !== 37) {
  throw new Error('TrackPlayer coroutine method layout changed; review TurboModule compatibility patch.');
}
const updated = raw.includes('\r\n') ? source.replace(/\n/g, '\r\n') : source;
if (updated !== raw) await writeFile(target, updated);
console.log('TrackPlayer Android compatibility applied: nullable metadata + 37 void coroutine methods.');
