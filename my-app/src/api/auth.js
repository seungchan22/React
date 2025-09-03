// client/src/api/auth.js
import http from './http';

// 로그인
export function login(username, password) {
  return http.post('/api/login', { username, password });
}

// (원하면 나중에 추가: me, logout 등)
// export const me = () => http.get('/api/auth/me');
