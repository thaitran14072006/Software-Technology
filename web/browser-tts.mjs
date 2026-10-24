// Preserve cat-tien-app's voice ordering, including the browser's online voices.
const normalize = value => value.replaceAll('_', '-').toLowerCase();
export function selectVoice(voices, locale) {
  const wanted = normalize(locale);
  return voices.find(v => normalize(v.lang) === wanted)
    || voices.find(v => normalize(v.lang).split('-')[0] === wanted.split('-')[0]);
}

export function playbackSource(preference, hasMp3, hasSpeech) {
  if (preference === 'mp3' && hasMp3) return 'mp3';
  if (hasSpeech) return 'browser';
  return hasMp3 ? 'mp3' : null;
}

export function loadVoices(synth, timeoutMs = 700) {
  const voices = synth.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise(resolve => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', changed);
      resolve(synth.getVoices());
    };
    const changed = () => { if (synth.getVoices().length) finish(); };
    synth.addEventListener('voiceschanged', changed);
    timer = setTimeout(finish, timeoutMs);
    changed();
  });
}
