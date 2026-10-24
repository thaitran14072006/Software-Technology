export const EVT = {
  TTS_REQUESTED: 'tts.requested',
  TTS_COMPLETED: 'tts.completed',
  TTS_FAILED: 'tts.failed',
} as const;

export interface TtsRequestedEvent {
  audioId: string;
  translationId: string;
  poiCode: string;
  langCode: string;
  ttsLocale: string;
  gender: 'MALE' | 'FEMALE';
  text: string;
  textHash: string;
}

export interface TtsCompletedEvent {
  audioId: string;
  textHash: string;
  provider: string;
  voiceName: string;
  audioUrl: string;
  sizeBytes: number;
  durationSec: number;
}

export interface TtsFailedEvent {
  audioId: string;
  textHash: string;
  error: string;
}
