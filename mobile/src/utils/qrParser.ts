/** Chấp nhận: https://host/q/<token>  hoặc  sag://poi/<token>. Trả token hoặc null. */
export function parseQr(raw: string): string | null {
  const m = raw.trim().match(/^(?:https?:\/\/[^/\s]+\/q\/|sag:\/\/poi\/)([A-Za-z0-9_-]{8,64})\/?$/);
  return m ? m[1] : null;
}
