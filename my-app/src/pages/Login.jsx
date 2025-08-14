// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, Form, Button } from 'react-bootstrap';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/board', { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Card style={{ width: 360 }} className="shadow">
        <Card.Body>
          <h3 className="text-center mb-4">로그인</h3>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Control
                placeholder="아이디"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Control
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
