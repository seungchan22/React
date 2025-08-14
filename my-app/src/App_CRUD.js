import React, {useState, useEffect, useCallback} from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [text, setText] = useState(""); 
  const [messages, setMessages] = useState([]);
  const [editText, setEditText] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('id_desc');
  const limit = 5;

const fetchMessages = useCallback(async () => {
  const res = await axios.get('http://localhost:5000/api/messages', {
    params: { search, page, limit, sort }
  });
  setMessages(res.data.data);
  setTotal(res.data.total);
}, [search, page, limit, sort]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("메시지를 입력하세요!!");
      return;
    }
    await axios.post("http://localhost:5000/api/save", { text });
    setText("");
    fetchMessages();
  };

 
   const handleDelete = async (id) => {
    if(window.confirm("정말로 삭제하시겠습니까?")) { 
    await axios.delete(`http://localhost:5000/api/messages/${id}`);
    fetchMessages();
  }
  };

  const totalPages = Math.ceil(total / limit);

  //  const handleSearch = async (e) => {
  //   e.preventDefault();
  //   setPage(1);
  //   fetchMessages();
  // };

  const startEdit = (msg) => {
    setEditText(msg.text);
    setEditId(msg.id);
  };

  const cancelEdit = () => {
    setEditText("");
    setEditId(null);
  };

  const submitEdit = async (id) => {
    if (!editText.trim()) {
      alert("수정할 메시지를 입력하세요.");
      return;
    }

    await axios.put(`http://localhost:5000/api/messages/${id}`, { text: editText });
    setEditText("");
    setEditId(null);
    fetchMessages();
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">메시지 게시판</h1>

      {/* 입력 */}
      <form onSubmit={handleSubmit} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
        />
        <button className="btn btn-primary" type="submit">저장</button>
      </form>

      {/* 검색 & 정렬 */}
      <div className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어 입력"
        />
        <select
          className="form-select"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
        >
          <option value="id_desc">ID ↓</option>
          <option value="id_asc">ID ↑</option>
          <option value="text_asc">메시지 A→Z</option>
          <option value="text_desc">메시지 Z→A</option>
          <option value="date_asc">작성일 ↑</option>
          <option value="date_desc">작성일 ↓</option>
        </select>
        <button className="btn btn-secondary" onClick={() => { setPage(1); fetchMessages(); }}>검색</button>
      </div>

      {/* 목록 */}
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>메시지</th>
            <th>작성일시</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
  {messages.length === 0 ? (
    <tr>
      <td colSpan="4" className="text-center">데이터 없음</td>
    </tr>
  ) : (
    messages.map((msg) => (
      <tr key={msg.id}>
        <td>{msg.id}</td>
        <td>
          {editId === msg.id ? (
            <input
              type="text"
              className="form-control"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
          ) : (
            msg.text
          )}
        </td>
        <td>{msg.created_at}</td>
        <td>
          {editId === msg.id ? (
            <>
              <button className="btn btn-success btn-sm me-1" onClick={() => submitEdit(msg.id)}>저장</button>
              <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>취소</button>
            </>
          ) : (
            <>
              <button className="btn btn-warning btn-sm me-1" onClick={() => startEdit(msg)}>수정</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(msg.id)}>삭제</button>
            </>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>
      </table>

      {/* 페이지네이션 */}
      <div className="mt-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`btn btn-sm me-1 ${p === page ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;