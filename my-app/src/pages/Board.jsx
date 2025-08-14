// client/src/pages/Board.jsx
import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { Table, Button, Form } from 'react-bootstrap';

export default function Board() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('id_desc');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    const res = await api.get('/api/messages', { params: { page, limit, search, sort } });
    setList(res.data.data);
    setTotal(res.data.total);
  }, [page, limit, search, sort]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!message.trim()) return;
    if (editId) {
      await api.put(`/api/messages/${editId}`, { message });
      setEditId(null);
    } else {
      await api.post('/api/messages', { message });
    }
    setMessage('');
    load();
  };

  const onEdit = (row) => { setEditId(row.id); setMessage(row.msg); };
  const onDelete = async (id) => {
    await api.delete(`/api/messages/${id}`);
    if ((total - 1) <= (page - 1) * limit && page > 1) setPage(page - 1);
    else load();
  };
  const applySearch = () => { setPage(1); load(); };
  const changeSort = (e) => { setSort(e.target.value); setPage(1); };

  const formatDate = (v) => {
    if (!v) return '-';
    return new Date(v).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div>
      <h3 className="mb-4">메시지 게시판 <small className="text-muted">({total}건)</small></h3>

      {/* 입력 */}
      <div className="d-flex gap-2 mb-3">
        <Form.Control
          placeholder="메시지 입력"
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
        />
        <Button onClick={submit} variant={editId ? 'warning' : 'primary'}>
          {editId ? '수정' : '등록'}
        </Button>
      </div>

      {/* 검색/정렬 */}
      <div className="d-flex gap-2 mb-3">
        <Form.Control
          placeholder="검색어"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
        <Form.Select value={sort} onChange={changeSort} style={{ maxWidth: 220 }}>
          <option value="id_desc">ID ↓</option>
          <option value="id_asc">ID ↑</option>
          <option value="msg_asc">메시지 A→Z</option>
          <option value="msg_desc">메시지 Z→A</option>
          <option value="date_desc">작성일 ↓</option>
          <option value="date_asc">작성일 ↑</option>
        </Form.Select>
        <Button variant="secondary" onClick={applySearch}>검색</Button>
      </div>

      {/* 목록 */}
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th style={{width:80}}>ID</th>
            <th>메시지</th>
            <th style={{width:200}}>작성일시</th>
            <th style={{width:180}}>액션</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr><td colSpan="4" className="text-center">데이터 없음</td></tr>
          ) : list.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.msg}</td>
              <td>{formatDate(row.created_at)}</td>
              <td>
                <Button size="sm" className="me-2" variant="secondary" onClick={()=>onEdit(row)}>수정</Button>
                <Button size="sm" variant="danger" onClick={()=>onDelete(row.id)}>삭제</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* 페이지네이션 */}
      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="outline-primary" disabled={page<=1} onClick={()=>setPage(page-1)}>이전</Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p===page ? 'primary':'outline-primary'}
            onClick={()=>setPage(p)}
          >{p}</Button>
        ))}
        <Button size="sm" variant="outline-primary" disabled={page>=totalPages} onClick={()=>setPage(page+1)}>다음</Button>
      </div>
    </div>
  );
}
