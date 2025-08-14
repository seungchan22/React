// client/src/api/axios.js
import axios from 'axios';

// CRA 프록시(setupProxy.js)로 /api만 백엔드로 보낼 거면 baseURL은 ''(상대경로)
const api = axios.create({ baseURL: '' });
// 만약 프록시 없이 절대경로 쓸 거면:
// const api = axios.create({ baseURL: 'http://localhost:5000' });

/** 요청: 토큰 자동 첨부 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** 응답: 401이면 자동 로그아웃 → /login 이동 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem('token');
      // 페이지 어디서든 동작하도록 강제 이동
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
