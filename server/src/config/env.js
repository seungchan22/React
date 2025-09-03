// import dotenv from 'dotenv';
// dotenv.config();

// export const env = {
//   PORT: process.env.PORT || 5000,
//   JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key',
//   DB_HOST: process.env.DB_HOST || 'localhost',
//   DB_USER: process.env.DB_USER || 'root',
//   DB_PASS: process.env.DB_PASS || '0730',
//   DB_NAME: process.env.DB_NAME || 'testdb',
//   MSG_COL: (process.env.MSG_COL || 'text').trim(), // messages 본문 컬럼
//   UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
// };

// server/src/config/env.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 후보 경로들 (위에서부터 우선순위)
const candidates = [
  path.join(__dirname, '..', '..', '.env'), // server/.env  ← 권장 위치
  path.join(__dirname, '..', '.env'),       // server/src/.env
  path.join(__dirname, '.env'),             // server/src/config/.env
  path.join(process.cwd(), '.env'),         // CWD/.env
];

let loadedFrom = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedFrom = p;
    break;
  }
}
// 개발 로그 (원하면 나중에 지워도 됨)
console.log(
  '[ENV] loadedFrom =', loadedFrom || '(none)',
  'JWT_SECRET set?', !!process.env.JWT_SECRET
);

export const env = {
  PORT: Number(process.env.PORT) || 4000, // 기존 기본 4000 유지
  JWT_SECRET: (process.env.JWT_SECRET || '').trim(),
  DB_HOST: (process.env.DB_HOST || 'localhost').trim(),
  DB_USER: (process.env.DB_USER || 'root').trim(),
  DB_PASS: (process.env.DB_PASS || '').trim(),
  DB_NAME: (process.env.DB_NAME || 'testdb').trim(),
  MSG_COL: (process.env.MSG_COL || 'text').trim(),
  UPLOAD_DIR: (process.env.UPLOAD_DIR || 'uploads').trim(),
};
