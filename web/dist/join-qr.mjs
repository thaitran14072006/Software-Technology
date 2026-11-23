import qrcode from './vendor/qrcode.mjs';

export function joinURL(input) {
  const url = new URL(input.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 1500) throw new Error('Nhập địa chỉ web http hoặc https hợp lệ, không chứa thông tin đăng nhập.');
  // A join link opens the visitor page, without selection or credentials.
  url.search = ''; url.hash = '';
  return url.href;
}
export function isLoopback(input) {
  return ['localhost', '::1', '[::1]', '0.0.0.0'].includes(new URL(input).hostname) || /^127\./.test(new URL(input).hostname);
}
// Refresh saved local addresses after changing Wi-Fi or removing a VPN adapter.
// Explicit public URLs (for example a tunnel) remain a valid user override.
export function preferredJoinURL(defaultUrl, savedUrl) {
  const current = joinURL(defaultUrl);
  if (!savedUrl) return current;
  try {
    const saved = joinURL(savedUrl);
    const host = new URL(saved).hostname;
    const local = isLoopback(saved) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
    return local && !isLoopback(current) ? current : saved;
  } catch { return current; }
}
export function qrSVG(url) {
  return renderQr(joinURL(url));
}
export function poiQrURL(base, token) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) throw new Error('Token QR không hợp lệ.');
  const url = new URL(joinURL(base));
  url.searchParams.set('qr', token);
  return url.href;
}
export function poiQrSVG(base, token) {
  return renderQr(poiQrURL(base, token));
}
function renderQr(value) {
  const code = qrcode(0, 'M');
  code.addData(value); code.make();
  return code.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
}
