export interface SynthesizeInput { text: string; locale: string; gender: 'MALE' | 'FEMALE'; }
export interface SynthesizeOutput { audio: Buffer; mime: 'audio/mpeg'; voiceName: string; chars: number; }

export interface TtsProvider {
  readonly name: 'GOOGLE' | 'GEMINI' | 'AWS' | 'ZALO' | 'DEVICE' | 'LOCAL';
  synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>;
}
export const TTS_PROVIDER = Symbol('TTS_PROVIDER');

export class TtsQuotaError extends Error {}      // 429 / quota -> không retry
export class TtsTransientError extends Error {}  // 5xx / timeout -> retry
