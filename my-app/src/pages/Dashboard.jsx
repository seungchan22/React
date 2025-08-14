// client/src/pages/Dashboard.jsx
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Board from './Board';

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex">
      {/* 좌측 사이드바 */}
      <div className="bg-dark text-white p-3 vh-100" style={{ width: 220 }}>
        <h5 className="mb-4">메뉴</h5>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <NavLink to="/board" className="nav-link text-white">게시판</NavLink>
          </li>
          <li className="nav-item">
            <button className="btn btn-outline-light w-100" onClick={logout}>로그아웃</button>
          </li>
        </ul>
      </div>

      {/* 우측 컨텐츠 */}
      <div className="flex-grow-1 p-4">
        <Routes>
          <Route path="/board" element={<Board />} />
        </Routes>
      </div>
    </div>
  );
}
