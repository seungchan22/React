import { useEffect, useState } from "react";
import { getPost, deletePost } from "../api/posts";
import { useParams } from "react-router-dom";

export default function PostDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(()=>{ (async ()=>{
    const { data } = await getPost(id);
    setData(data);
  })(); }, [id]);

  if (!data) return null;
  const { post, attachments } = data;

  async function onDelete() {
    if (!window.confirm("삭제할까요?")) return;
    await deletePost(id);
    window.location.hash = "#/posts";
  }

  return (
    <div style={{maxWidth:960, margin:"0 auto", padding:16}}>
      <div style={{fontSize:24, fontWeight:700}}>{post.title}</div>
      <div style={{fontSize:12, color:"#666"}}>{post.author_email} · {new Date(post.created_at).toLocaleString()}</div>
      <div style={{whiteSpace:"pre-line", border:"1px solid #eee", padding:12, marginTop:8}}>{post.content}</div>

      {attachments?.length>0 && (
        <div style={{border:"1px solid #eee", padding:12, marginTop:12}}>
          <div style={{fontWeight:600, marginBottom:6}}>첨부파일</div>
          <ul>
            {attachments.map(a=>(
              <li key={a.id}>
                <a href={`http://localhost:4000/api/posts/${post.id}/attachments/${a.id}`}>
                  {a.original_name} ({(a.size/1024).toFixed(1)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <a href={`#/posts/${id}/edit`} style={{padding:"8px 12px", border:"1px solid #222"}}>수정</a>
        <button onClick={onDelete} style={{padding:"8px 12px", border:"1px solid #222"}}>삭제</button>
        <a href="#/posts" style={{padding:"8px 12px", border:"1px solid #222"}}>목록</a>
      </div>
    </div>
  );
}
