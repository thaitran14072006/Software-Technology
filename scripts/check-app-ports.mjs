import { createServer } from 'node:net';

export async function assertPortsAvailable(services) {
  const endpoints = new Set();
  for (const { name, port, host } of services) {
    const number = Number(port);
    if (!Number.isInteger(number) || number < 1 || number > 65535) {
      throw new Error(`Cổng ${name} không hợp lệ: ${port}`);
    }
    if (endpoints.has(number)) throw new Error(`Cấu hình trùng cổng ${number} giữa các dịch vụ.`);
    endpoints.add(number);
    await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', error => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Không thể khởi động: cổng ${number} (${name}) đang được sử dụng. Dừng phiên đang chạy bằng Ctrl+C tại terminal cũ rồi chạy lại. Không mở hai phiên hệ thống cùng lúc.`));
        } else reject(error);
      });
      server.listen({ port: number, host, exclusive: true }, () => server.close(error => error ? reject(error) : resolve()));
    });
  }
}

export function appPorts(env = process.env, lan = false) {
  return [
    { name: 'web', port: env.PORT || 4173, host: lan ? '0.0.0.0' : env.HOST || '127.0.0.1' },
    { name: 'content API', port: env.CONTENT_PORT || 3001, host: env.API_HOST || '127.0.0.1' },
    { name: 'audio API', port: env.AUDIO_PORT || 3002, host: env.API_HOST || '127.0.0.1' },
    { name: 'QR API', port: env.QR_PORT || 3003, host: env.API_HOST || '127.0.0.1' },
  ];
}
