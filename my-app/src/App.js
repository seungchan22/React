// client/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostsList from "./pages/PostsList";
import PostDetail from "./pages/PostDetail";
import PostForm from "./pages/PostForm";

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* 로그인된 사용자만 접근 */}
        <Route path="/*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        {/* <Route path="/posts" element={<PostsList />} />
        <Route path="/posts/new" element={<PostForm />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/posts/:id/edit" element={<PostForm />} /> */}
      </Routes>
    </Router>
  );
}
