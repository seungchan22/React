import React, {useState, useEffect, useCallback} from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState(""); 
  const [messages, setMessages] = useState([]);
  const [editText, setEditText] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

const fetchMessages = useCallback(async () => {
  const res = await axios.get('http://localhost:5000/api/messages', {
    params: { search, page, limit }
  });
  setMessages(res.data.data);
  setTotal(res.data.total);
}, [search, page, limit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("메시지를 입력하세요.");
      return;
    }
    await axios.post("http://localhost:5000/api/save", { text });
    setText("");
    fetchMessages();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleDelete = async (id) => {
    if(window.confirm("정말로 삭제하시겠습니까?")) { 
    await axios.delete(`http://localhost:5000/api/messages/${id}`);
    fetchMessages();
  }
  };

  const startEdit = (msg) => {
    setEditText(msg.text);
    setEditId(msg.id);
  };

  const canselEdit = () => {
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
    <div style={{ padding: "20px"}}>
        <h1>메시지 저장</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"   
        />
        <button type="submit">저장</button>
      </form>

      <form onSubmit={handleSearch} style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어를 입력하세요"
        />
        <button type="submit">검색</button>
      </form>

      <h2>메시지 목록</h2>
      {messages.length === 0 ? (
        <p>데이터 없음</p>
      
      ) : (
        <table border ="1" cellPadding="5" style={{ marginTop: "10px", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>메시지</th>
              <th>작성일</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td>{msg.id}</td>
                <td>
                  {editId === msg.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{width: '100%'}}
                    />
                  ) : (
                       msg.text
                  )}
                </td>
                 <td>{msg.created_at}</td>
                <td style={{whiteSpace : 'nowrap'}}>
                  {editId === msg.id ? (
                    <>                    
                        <button onClick={() => submitEdit(msg.id)}>저장</button>
                        <button onClick={canselEdit} style={{marginLeft: 6}}>취소</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(msg)}>수정</button>
                      <button onClick={() => handleDelete(msg.id)} style={{marginLeft: 6}}>삭제</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    <div style={{margin: 10}}>
      {Array.from({length: totalPages}, (_, i) => i +1 ).map(p => (
          <button key={p} onClick={() => setPage(p)} 
          style={{ margin: 2, backgroundColor: page === p ? "lightgray" : " " }}>
          {p}
        </button>
      ))}
      <span>페이지: {page}</span>
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>이전</button>
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>다음</button>
    </div>
    </div>
  );
} 
 

export default App;
