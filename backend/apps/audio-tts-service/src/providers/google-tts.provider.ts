import { Injectable } from '@nestjs/common';
import { SynthesizeInput, SynthesizeOutput, TtsProvider, TtsQuotaError, TtsTransientError } from './tts-provider.interface';
import { chunkText } from '../util/chunk-text';

const VOICES: Record<string, { MALE: string; FEMALE: string }> = {
  'vi-VN': { FEMALE: 'vi-VN-Neural2-A', MALE: 'vi-VN-Neural2-D' },
  'en-US': { FEMALE: 'en-US-Neural2-F', MALE: 'en-US-Neural2-D' },
  'ja-JP': { FEMALE: 'ja-JP-Neural2-B', MALE: 'ja-JP-Neural2-C' },
  'cmn-CN': { FEMALE: 'cmn-CN-Wavenet-A', MALE: 'cmn-CN-Wavenet-B' },
  'ko-KR': { FEMALE: 'ko-KR-Neural2-A', MALE: 'ko-KR-Neural2-C' },
};

@Injectable()
export class GoogleTtsProvider implements TtsProvider {
  readonly name = 'GOOGLE' as const;
  private readonly key = process.env.GOOGLE_TTS_KEY;

  async synthesize({ text, locale, gender }: SynthesizeInput): Promise<SynthesizeOutput> {
    if (!this.key) throw new Error('Thiếu GOOGLE_TTS_KEY');
    const voiceName = VOICES[locale]?.[gender];
    const parts: Buffer[] = [];
    for (const chunk of chunkText(text)) parts.push(await this.call(chunk, locale, voiceName));
    return { audio: Buffer.concat(parts), mime: 'audio/mpeg', voiceName: voiceName ?? locale, chars: text.length };
  }

  private async call(text: string, locale: string, voiceName?: string): Promise<Buffer> {
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.key! },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: locale, ...(voiceName && { name: voiceName }) },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
      }),
      signal: AbortSignal.timeout(15000),
    }).catch((e) => { throw new TtsTransientError(`network: ${e.message}`); });

    if (res.status === 429) throw new TtsQuotaError('Vượt quota Google TTS');
    if (res.status >= 500) throw new TtsTransientError(`Google ${res.status}`);
    if (!res.ok) throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = (await res.json()) as { audioContent?: string };
    if (!j.audioContent) throw new Error('Google TTS không trả audioContent');
    return Buffer.from(j.audioContent, 'base64');
  }
}
