import { isURL } from 'class-validator';

/** A document fingerprint records provenance; it does not certify field GPS. */
export function isCoordinateSource(value: unknown): boolean {
  return typeof value === 'string' && (
    /^urn:sha256:[a-f0-9]{64}#point-\d{2}$/.test(value) ||
    isURL(value, { protocols: ['https'], require_protocol: true, disallow_auth: true })
  );
}
