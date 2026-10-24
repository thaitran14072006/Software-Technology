import { spawn } from 'node:child_process';
import path from 'node:path';
import { SynthesizeInput, SynthesizeOutput, TtsProvider, TtsQuotaError, TtsTransientError } from './tts-provider.interface';

export function geminiRequest(text: string, locale: string, voice: string) {
  return {
    contents: [{ role: 'user', parts: [{ text: text.normalize('NFC'), speech_metadata: { style: `Warm, clear national park audio guide in ${locale}. Natural pacing, faithful pronunciation, no extra words, no music.` } }] }],
    generationConfig: { responseModalities: ['AUDIO'], responseFormat: { audio: { mimeType: 'AUDIO_WAV', sampleRate: 24000 } }, speechConfig: { voiceConfig: { voice } } },
  };
}

export function encodeMp3(wav: Buffer): Promise<Buffer> {
  const args = ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1'];
  const executable = process.env.FFMPEG_BIN || 'docker';
  const commandArgs = process.env.FFMPEG_BIN ? args : ['compose', '-f', path.resolve('docker/docker-compose.yml'), 'exec', '-T', 'local-tts', 'ffmpeg', ...args];
  return new Promise((resolve, reject) => {
    const child = spawn(executable, commandArgs, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const chunks: Buffer[] = []; let size = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error('MP3 conversion timed out')); }, 90000);
    child.on('error', () => { clearTimeout(timer); reject(new Error('Không chạy được FFmpeg. Khởi chạy container local-tts hoặc cấu hình FFMPEG_BIN.')); });
    child.stdout.on('data', data => { size += data.length; if (size > 20 * 1024 * 1024) { child.kill(); reject(new Error('Audio vượt 20 MB')); } else chunks.push(data); });
    child.stderr.resume(); child.stdin.on('error', () => {});
    child.on('close', code => { clearTimeout(timer); code === 0 && size > 0 ? resolve(Buffer.concat(chunks)) : reject(new Error('FFmpeg không chuyển được audio Google sang MP3')); });
    child.stdin.end(wav);
  });
}

// Google AI Studio / Gemini API, distinct from Google Cloud Text-to-Speech.
export class GeminiTtsProvider implements TtsProvider {
  readonly name = 'GEMINI' as const;
  constructor(private request: typeof fetch = fetch, private convert = encodeMp3) {}
  async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Thiếu GEMINI_API_KEY trong backend/.env');
    if (!input.text.trim() || input.text.length > 10000) throw new Error('Kịch bản Gemini phải dài 1–10000 ký tự');
    const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
    if (!['gemini-3.8-flash-tts','gemini-3.8-flash-lite-tts'].includes(model)) throw new Error('GEMINI_TTS_MODEL phải là model Gemini 3.8 TTS hỗ trợ request schema hiện tại');
    const voice = (input.gender === 'MALE' ? process.env.GEMINI_VOICE_MALE : process.env.GEMINI_VOICE_FEMALE) || (input.gender === 'MALE' ? 'Charon' : 'Kore');
    const res = await this.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(geminiRequest(input.text, input.locale === 'cmn-CN' ? 'zh-CN' : input.locale, voice)), signal: AbortSignal.timeout(150000),
    }).catch(() => { throw new TtsTransientError('Không kết nối được Gemini TTS'); });
    if (res.status === 429) throw new TtsQuotaError('GEMINI_QUOTA: hết hạn mức, không tự chuyển sang engine khác');
    if (res.status >= 500) throw new TtsTransientError(`Gemini HTTP ${res.status}`);
    if (!res.ok) throw new Error(`Gemini TTS HTTP ${res.status}; kiểm tra key, model và quyền trong AI Studio`);
    const json: any = await res.json();
    if (json.candidates?.[0]?.finishReason && json.candidates[0].finishReason !== 'STOP') throw new Error('Gemini không trả audio hoàn chỉnh');
    const parts = json.candidates?.[0]?.content?.parts || [];
    const audio = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/'))?.inlineData;
    if (!audio?.data) throw new Error('Gemini không trả dữ liệu âm thanh');
    const wav = Buffer.from(audio.data, 'base64');
    if (wav.length < 44 || wav.length > 50 * 1024 * 1024 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Gemini trả audio khác WAV được yêu cầu');
    return { audio: await this.convert(wav), mime: 'audio/mpeg', voiceName: `${model}/${voice}`, chars: input.text.length };
  }
}
