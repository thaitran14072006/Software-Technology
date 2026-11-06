import { isQuotaFailure } from '../src/poi/tts-quota';

describe('TTS quota retry guard', () => {
  test.each([
    'GEMINI_QUOTA: hết hạn mức',
    'QUOTA_EXHAUSTED',
  ])('recognizes non-retryable quota failure: %s', message => {
    expect(isQuotaFailure(message)).toBe(true);
  });

  test.each([
    'Không kết nối được Gemini TTS',
    'WORKER_LEASE_EXPIRED',
    'REPLACED_BY_NATURAL_VOICE_BATCH',
    null,
  ])('does not classify other job states as quota failures: %s', message => {
    expect(isQuotaFailure(message)).toBe(false);
  });
});
