import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'no_token' });
  jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'invalid_token' });
    req.user = decoded;
    next();
  });
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

export function requireAuth(req, res, next) {
  // 1) 받은 헤더 확인 (대소문자 섞여 오는 환경 대비)
  const raw = req.headers.authorization || req.headers.Authorization || '';
  console.log('[AUTH] header =', raw || '(none)');

  // 2) 'Bearer ' 유무에 상관없이 토큰만 추출
  const token = String(raw).replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    console.warn('[AUTH] no token');
    return res.status(401).json({ message: 'Unauthorized: no token' });
  }

  try {
    // 3) 검증
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[AUTH] JWT_SECRET missing in env');
      return res.status(500).json({ message: 'Server misconfigured (no JWT_SECRET)' });
    }
    const payload = jwt.verify(token, secret); // HS256 기본

    // 4) req.user 주입 (payload 필드 이름은 발급 시점과 동일해야 함)
    req.user = {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (e) {
    console.warn('[AUTH] verify failed:', e.name, e.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}
