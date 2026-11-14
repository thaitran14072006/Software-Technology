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
  const code = qrcode(0, 'M');
  code.addData(joinURL(url)); code.make();
  return code.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
}
