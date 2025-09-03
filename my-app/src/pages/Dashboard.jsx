// client/src/pages/Dashboard.jsx
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Users from './Users/UsersList';

// ✅ 게시판 3종만 추가 (나머지는 변경하지 않음)
import PostsList from './PostsList';
import PostDetail from './PostDetail';
import PostForm from './PostForm';
import { useState } from 'react';

function decodeJwtPayload(raw) {
   try {
     const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
     const b64u = token.split('.')[1];
     if (!b64u) return null;
     const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
     const json = decodeURIComponent(
       atob(b64)
         .split('')
         .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
         .join('')
     );
     return JSON.parse(json);
   } catch { return null; }
 }

export default function Dashboard() {
  const navigate = useNavigate();
  // ✅ 기존 방식 존중: 먼저 localStorage.user 사용
  //    없으면 토큰에서 1회 복원하여 localStorage.user 를 채워 메뉴가 다시 보이게 함.
  const [user] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      if (s) return JSON.parse(s);
    } catch {}
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    const payload = decodeJwtPayload(raw);
    if (!payload) return null;
    const u = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      email: payload.email
    };
    try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
    return u;
  });
  const role = user?.role;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex">
      {/* 좌측 사이드바 */}
      <div className="bg-dark text-white p-3 vh-100" style={{ width: 220 }}>
        <h5 className="mb-4">메뉴</h5>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            {/* ✅ 상대 경로로 게시판만 추가 */}
            <NavLink to="posts" className="nav-link text-white">게시판</NavLink>
          </li>
          {role === 'admin' && (
            <li className="nav-item mb-2">
              {/* ✅ 기존처럼 admin일 때만 사용자관리 노출 */}
              <NavLink to="users" className="nav-link text-white">사용자 관리</NavLink>
            </li>
          )}
          <li className="nav-item mt-2">
            <button className="btn btn-outline-light w-100" onClick={logout}>로그아웃</button>
          </li>
        </ul>
      </div>

      {/* 우측 컨텐츠 */}
      <div className="flex-grow-1 p-4">
        <Routes>
          {/* ✅ 게시판 라우트만 중첩 추가 */}
          <Route path="posts" element={<PostsList />} />
          <Route path="posts/new" element={<PostForm />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="posts/:id/edit" element={<PostForm />} />

          {/* ✅ 사용자관리는 기존처럼 조건부 라우트 (변경 없음) */}
          {role === 'admin' && <Route path="users" element={<Users />} />}

          {/* ✅ 과한 와일드카드로 posts 강제 렌더하던 부분 제거/완화 */}
          <Route index element={<PostsList />} />
        </Routes>
      </div>
    </div>
  );
}
