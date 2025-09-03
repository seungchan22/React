import { useEffect, useRef, useState } from "react";
import { createPost, getPost, updatePost } from "../api/posts";
import { useNavigate, useParams } from "react-router-dom";

export default function PostForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef();

  useEffect(()=>{ if (id) load(); }, [id]);
  async function load() {
    const { data } = await getPost(id);
    setTitle(data.post.title);
    setContent(data.post.content);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    for (const f of files) fd.append("files", f);

    if (id) await updatePost(id, fd);
    else await createPost(fd);

    nav("/posts");
  }

  return (
    <form onSubmit={onSubmit} style={{maxWidth:960, margin:"0 auto", padding:16}}>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목"
             style={{width:"100%", padding:8, border:"1px solid #ddd", marginBottom:8}} />
      <textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={12} placeholder="본문"
                style={{width:"100%", padding:8, border:"1px solid #ddd"}} />
      <div style={{marginTop:8}}>
        <input ref={fileRef} type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} />
      </div>
      {files.length>0 && (
        <ul style={{fontSize:12, color:"#555"}}>
          {files.map((f,i)=>(<li key={i}>{f.name} ({(f.size/1024).toFixed(1)} KB)</li>))}
        </ul>
      )}
      <div style={{display:"flex", gap:8, marginTop:12}}>
        <button style={{padding:"8px 12px", border:"1px solid #222"}}>{id ? "수정" : "등록"}</button>
        <a href="#/posts" style={{padding:"8px 12px", border:"1px solid #222", textDecoration:"none"}}>취소</a>
      </div>
    </form>
  );
}
