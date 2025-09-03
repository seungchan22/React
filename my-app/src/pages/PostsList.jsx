import { useEffect, useState } from "react";
import { listPosts } from '../api/posts';
import { Link } from 'react-router-dom';

export default function PostsList() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  useEffect(() => { fetchList(); }, [page, q]);

  async function fetchList() {
    const { data } = await listPosts({ page, limit: 10, q });
    setRows(data.rows); setTotal(data.total);
  }

  const pages = Math.max(1, Math.ceil(total / 10));

  return (
    <div style={{maxWidth:960, margin:"0 auto", padding:16}}>
      <div style={{display:"flex", gap:8, marginBottom:12}}>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="검색(제목/본문)"
               style={{flex:1, padding:8, border:"1px solid #ddd"}} />
        <Link to="new" style={{padding:"8px 12px", border:"1px solid #222", textDecoration:"none"}}>
            글쓰기
+       </Link>
      </div>
      <ul style={{listStyle:"none", padding:0, margin:0}}>
        {rows.map(r=>(
          <li key={r.id} style={{border:"1px solid #eee", padding:12, marginBottom:8}}>
            <a href={`#/posts/${r.id}`} style={{textDecoration:"none", color:"inherit"}}>
              <div style={{fontWeight:600}}>{r.title}</div>
              <div style={{fontSize:12, color:"#666"}}>{r.author_email} · {new Date(r.created_at).toLocaleString()}</div>
              <div style={{marginTop:6, fontSize:14}}>{r.preview}...</div>
              {r.attachment_count>0 && (
                <div style={{marginTop:4, fontSize:12, color:"#666"}}>첨부 {r.attachment_count}개</div>
              )}
            </a>
          </li>
        ))}
      </ul>
      <div style={{display:"flex", gap:6, justifyContent:"center", marginTop:12}}>
        {Array.from({length: pages}, (_,i)=>i+1).map(n=>(
          <button key={n} onClick={()=>setPage(n)}
            style={{
              padding:"6px 10px", border:"1px solid #222",
              background:n===page?"#222":"#fff", color:n===page?"#fff":"#222"
            }}>{n}</button>
        ))}
      </div>
    </div>
  );
}
