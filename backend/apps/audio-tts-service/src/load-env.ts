// Nạp backend/.env (nếu có) trước mọi import khác. Cần Node >= 20.12. Biến đã có sẵn trong môi trường không bị ghi đè.
try { (process as any).loadEnvFile?.('.env'); } catch { /* không có .env: dùng biến môi trường hệ thống */ }
export {};
