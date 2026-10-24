import qrcode from './vendor/qrcode.mjs';

export function joinURL(input) {
  const url = new URL(input.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 1500) throw new Error('Nhập địa chỉ web http hoặc https hợp lệ, không chứa thông tin đăng nhập.');
  // A join link opens the visitor page, without selection or credentials.
  const source = url.searchParams.get('source');
  url.search = ''; url.hash = '';
  if (['demo', 'api'].includes(source)) url.searchParams.set('source', source);
  return url.href;
}
export function isLoopback(input) {
  return ['localhost', '::1', '[::1]', '0.0.0.0'].includes(new URL(input).hostname) || /^127\./.test(new URL(input).hostname);
}
export function qrSVG(url) {
  const code = qrcode(0, 'M');
  code.addData(joinURL(url)); code.make();
  return code.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
}
