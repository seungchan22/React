// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth'; // ← 우리가 만든 API 래퍼 (http.js 사용)

export default function Login() {
  const navigate = useNavigate();

  // 입력 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // UX 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await login(username, password); // ← http.post('/api/login', ...)
      // 응답 형태: { token, user }
      localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // 로그인 후 이동 (기존 흐름 유지)
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '로그인에 실패했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <h3 className="mb-4">로그인</h3>

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">아이디</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            placeholder="아이디"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">비밀번호</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="비밀번호"
          />
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
