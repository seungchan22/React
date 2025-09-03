// src/pages/Users/UsersList.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import http from '../../api/http';  

export default function UsersList() {
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem('user') || 'null');
  if (me?.role !== 'admin') {
    // 클라이언트 가드: 관리자 외 접근 금지
    navigate('/board', { replace: true });
  }

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('id_desc');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username:'', name:'', role:'user', is_active:1, password:'' });

  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ id:null, password:'' });

  const totalPages = Math.max(1, Math.ceil(total/limit));

  const token = localStorage.getItem('token');
  if (!token) navigate('/login', { replace: true });

  const load = useCallback(async ()=>{
    const res = await http.get('/api/users', { params:{ page, limit, search, sort } });
    setRows(res.data.data);
    setTotal(res.data.total);
  }, [page, limit, search, sort]);

  useEffect(()=>{ load(); }, [load]);

  const fmtDate = (v) => {
    if (!v) return '-';
    return new Date(v).toLocaleString('ko-KR', {
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit'
    });
  };

  // 생성/수정
  const openCreate = () => {
    setEditing(null);
    setForm({ username:'', name:'', role:'user', is_active:1, password:'' });
    setShowForm(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ username:u.username, name:u.name, role:u.role, is_active:u.is_active?1:0, password:'' });
    setShowForm(true);
  };
  const submitForm = async () => {
    if (!form.username || !form.name || (!editing && !form.password)) {
      alert('필수값을 입력하세요.'); return;
    }
    if (editing) {
      await http.put(`/api/users/${editing.id}`, {
        name: form.name, role: form.role, is_active: form.is_active ? 1:0
      });
    } else {
      await http.post('/api/users', form);
    }
    setShowForm(false);
    load();
  };

  // 비밀번호 초기화
  const openPw = (u) => {
    setPwForm({ id:u.id, password:'' });
    setShowPw(true);
  };
  const submitPw = async () => {
    if (!pwForm.password) { alert('비밀번호를 입력하세요.'); return; }
    await http.put(`/api/users/${pwForm.id}/password`, { password: pwForm.password });
    setShowPw(false);
  };

  // 검색/정렬
  const applySearch = () => { setPage(1); load(); };
  const changeSort = (e) => { setSort(e.target.value); setPage(1); };

  return (
    <div>
      <h3 className="mb-4">사용자 관리 <small className="text-muted">({total}명)</small></h3>

      <div className="d-flex gap-2 mb-3">
        <Form.Control
          placeholder="아이디/이름 검색"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
        <Form.Select value={sort} onChange={changeSort} style={{maxWidth:220}}>
          <option value="id_desc">ID ↓</option>
          <option value="id_asc">ID ↑</option>
          <option value="username_asc">아이디 A→Z</option>
          <option value="username_desc">아이디 Z→A</option>
          <option value="name_asc">이름 A→Z</option>
          <option value="name_desc">이름 Z→A</option>
          <option value="role_asc">역할 A→Z</option>
          <option value="role_desc">역할 Z→A</option>
        </Form.Select>
        <Button variant="secondary" onClick={applySearch}>검색</Button>
        <div className="ms-auto">
          <Button onClick={openCreate}>신규 사용자</Button>
        </div>
      </div>

      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th style={{width:80}}>ID</th>
            <th>아이디</th>
            <th>이름</th>
            <th style={{width:120}}>역할</th>
            <th style={{width:120}}>활성</th>
            <th style={{width:200}}>생성일</th>
            <th style={{width:220}}>액션</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="7" className="text-center">데이터 없음</td></tr>
          ) : rows.map(u=>(
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? 'Y' : 'N'}</td>
              <td>{fmtDate(u.created_at)}</td>
              <td>
                <Button size="sm" className="me-2" variant="secondary" onClick={()=>openEdit(u)}>수정</Button>
                <Button size="sm" variant="warning" onClick={()=>openPw(u)}>비밀번호 초기화</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* 페이지네이션 */}
      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="outline-primary" disabled={page<=1} onClick={()=>setPage(page-1)}>이전</Button>
        {Array.from({ length: Math.max(1, Math.min(10, totalPages)) }, (_, i) => {
          const p = i + 1;
          return (
            <Button
              key={p}
              size="sm"
              variant={p===page ? 'primary' : 'outline-primary'}
              onClick={()=>setPage(p)}
            >{p}</Button>
          );
        })}
        <Button size="sm" variant="outline-primary" disabled={page>=totalPages} onClick={()=>setPage(page+1)}>다음</Button>
      </div>

      {/* 생성/수정 모달 */}
      <Modal show={showForm} onHide={()=>setShowForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? '사용자 수정' : '사용자 생성'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group>
              <Form.Label>아이디</Form.Label>
              <Form.Control
                disabled={!!editing}
                value={form.username}
                onChange={(e)=>setForm({...form, username:e.target.value})}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>이름</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e)=>setForm({...form, name:e.target.value})}
              />
            </Form.Group>
            {!editing && (
              <Form.Group>
                <Form.Label>초기 비밀번호</Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={(e)=>setForm({...form, password:e.target.value})}
                />
              </Form.Group>
            )}
            <Form.Group>
              <Form.Label>역할</Form.Label>
              <Form.Select
                value={form.role}
                onChange={(e)=>setForm({...form, role:e.target.value})}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="guest">guest</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="switch"
                id="active"
                label="활성화"
                checked={!!form.is_active}
                onChange={(e)=>setForm({...form, is_active:e.target.checked?1:0})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowForm(false)}>닫기</Button>
          <Button variant="primary" onClick={submitForm}>{editing ? '저장' : '생성'}</Button>
        </Modal.Footer>
      </Modal>

      {/* 비밀번호 초기화 모달 */}
      <Modal show={showPw} onHide={()=>setShowPw(false)}>
        <Modal.Header closeButton><Modal.Title>비밀번호 초기화</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>새 비밀번호</Form.Label>
            <Form.Control
              type="password"
              value={pwForm.password}
              onChange={(e)=>setPwForm({...pwForm, password:e.target.value})}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowPw(false)}>취소</Button>
          <Button variant="warning" onClick={submitPw}>변경</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
