import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DemoAnalytics } from './demo-analytics.mjs';
import {buildOfflineArchive} from '../scripts/build-offline-archive.mjs';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const mime = { '.zip': 'application/zip', '.ttf': 'font/ttf', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const services = { '/content-api/': process.env.CONTENT_API_URL || 'http://127.0.0.1:3001', '/qr-api/': process.env.QR_API_URL || 'http://127.0.0.1:3003' };

export function createServer(options = {}) {
  let buildingArchive;
  const analytics = options.analytics || new DemoAnalytics(fileURLToPath(new URL('./.runtime/listens.json', import.meta.url)));
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if(url.pathname==='/offline-guide.zip' && ['GET','HEAD'].includes(req.method)){
        buildingArchive ||= buildOfflineArchive(`http://127.0.0.1:${req.socket.localPort}`).finally(()=>{buildingArchive=null;});
        const archive=await buildingArchive;
        res.writeHead(200,{'content-type':'application/zip','content-disposition':'attachment; filename="CatTien-Google-Audio.zip"','content-length':archive.buffer.length,'cache-control':'no-store'});res.end(req.method==='HEAD'?undefined:archive.buffer);return;
      }
      if (url.pathname === '/web-config' && req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ joinUrl: process.env.PUBLIC_WEB_URL || null })); return;
      }
      if (url.pathname.startsWith('/demo-api/analytics')) {
        let result;
        if (url.pathname === '/demo-api/analytics' && req.method === 'GET') result = await analytics.summary();
        else if (req.method === 'POST' && ['/demo-api/analytics/presence', '/demo-api/analytics/listens'].includes(url.pathname)) {
          let body = '', size = 0;
          for await (const chunk of req) { size += chunk.length; if (size > 8192) throw Object.assign(new Error('Request too large'), { status: 413 }); body += chunk; }
          let dto; try { dto = JSON.parse(body); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
          if (!dto || typeof dto !== 'object') throw Object.assign(new Error('Invalid JSON'), { status: 400 });
          result = url.pathname.endsWith('/presence') ? analytics.presence(dto) : await analytics.listen(dto);
        } else { res.writeHead(405); res.end(); return; }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(result)); return;
      }
      const prefix = Object.keys(services).find(p => url.pathname.startsWith(p));
      if (url.pathname.startsWith('/audio-assets/') && ['GET','HEAD'].includes(req.method)) {
        const assetBase = process.env.AUDIO_API_URL || 'http://127.0.0.1:3002';
        const upstream = await fetch(`${assetBase}/assets/${url.pathname.slice('/audio-assets/'.length)}`, {headers:req.headers.range?{range:req.headers.range}:{},signal:AbortSignal.timeout(20000),redirect:'error'});
        const headers = {};
        for (const key of ['content-type','content-length','content-range','accept-ranges','cache-control']) if(upstream.headers.has(key)) headers[key]=upstream.headers.get(key);
        res.writeHead(upstream.status,headers);res.end(req.method==='HEAD'?undefined:Buffer.from(await upstream.arrayBuffer()));return;
      }
      if (prefix) {
        const headers = { 'content-type': req.headers['content-type'] || 'application/json' };
        if (req.headers.authorization) headers.authorization = req.headers.authorization;
        // Buffer a bounded request: Node fetch cannot replay an IncomingMessage body on a 401 challenge.
        let body;
        if(!['GET','HEAD'].includes(req.method)){
          const chunks=[];let size=0;
          for await(const chunk of req){size+=chunk.length;if(size>21*1024*1024)throw Object.assign(new Error('File/request quá lớn.'),{status:413});chunks.push(chunk);}
          body=Buffer.concat(chunks);
        }
        const upstream = await fetch(`${services[prefix]}/api/v1/${url.pathname.slice(prefix.length)}${url.search}`, {
          method: req.method, headers,
          body,
          duplex: 'half', signal: AbortSignal.timeout(20000), redirect: 'error',
        });
        res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' });
        res.end(Buffer.from(await upstream.arrayBuffer()));
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
      let decoded;
      try { decoded = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end(); return; }
      const filename = path.resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (!filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      if (!(await stat(filename)).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, {
        'content-type': mime[path.extname(filename)] || 'application/octet-stream',
        'cache-control': 'no-cache', 'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self' http: https:; media-src 'self' http: https: blob:; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
      });
      res.end(req.method === 'HEAD' ? undefined : await readFile(filename));
    } catch (error) {
      if(!error.status && error.code!=='ENOENT') console.warn('Web upstream error:',error.message,error.cause?.message || '');
      const missing = error.code === 'ENOENT';
      res.writeHead(error.status || (missing ? 404 : 502), { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: error.status ? error.message : missing ? 'File not found' : 'Không kết nối được dịch vụ. Kiểm tra máy chủ hoặc backend đang chạy.' }));
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  createServer().listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Smart Audio Guide: http://127.0.0.1:${port}`));
}
