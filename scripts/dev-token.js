// Tạo JWT ADMIN cho môi trường dev (user-service chưa được xây dựng). Dùng: JWT_SECRET=... node scripts/dev-token.js
const crypto = require('crypto');
const secret = process.env.JWT_SECRET;
if (!secret) { console.error('Thiếu JWT_SECRET'); process.exit(1); }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const head = b64({ alg: 'HS256', typ: 'JWT' }), body = b64({ sub: '00000000-0000-0000-0000-0000000000aa', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 86400 });
const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
console.log(`${head}.${body}.${sig}`);
