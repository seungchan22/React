// client/src/api/axios.js
import axios from 'axios';

// 프록시(setupProxy.js)로 /api만 백엔드로 보낼 거면 ''(상대경로)로 둡니다.
const api = axios.create({ baseURL: '' });
// 프록시를 안 쓴다면 ↓
// const api = axios.create({ baseURL: 'http://localhost:5000' });

/** 요청 인터셉터: 매 요청에 토큰 자동 첨부 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** 응답 인터셉터: 401/403이면 토큰 제거 후 로그인 화면으로 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
