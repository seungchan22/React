// server/src/controllers/posts.controller.js
import fs from 'fs';
import pool  from '../config/db.js';
import {
  createPost, updatePost, deletePost, getPost, listPosts
} from '../models/posts.model.js';
import {
  addAttachments, getAttachments, getAttachment
} from '../models/attachments.model.js';

export async function list(req, res) {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const q = (req.query.q || '').trim();
  const { rows, total } = await listPosts({ page, limit, q });
  res.json({ rows, total, page, limit });
}

export async function detail(req, res) {
  const id = req.params.id;
  const post = await getPost(id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  const attachments = await getAttachments(id);
  res.json({ post, attachments });
}

// server/src/controllers/posts.controller.js
export async function create(req, res) {
  if (res.headersSent) return; // ✅ 이미 응답 시작되었으면 즉시 종료 (안전벨트)
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'title, content required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const postId = await createPost({ title, content, authorId: req.user.id }, conn);
    // 첨부 안쓰신다 했으니 이 줄은 있어도 영향 없음 (files 없으면 내부에서 바로 return)
    if (req.files?.length) await addAttachments(postId, req.files, conn);

    await conn.commit();
    return res.status(201).json({ id: postId });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('[POSTS:create] ERROR', e.code, e.message);
    if (!res.headersSent) return res.status(500).json({ message: 'Create failed' });
  } finally {
    conn.release();
  }
}



export async function update(req, res) {
  const id = req.params.id;
  const { title, content } = req.body;

  const post = await getPost(id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (post.author_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  await updatePost({ id, title, content });
  if (req.files?.length) await addAttachments(id, req.files);
  res.json({ message: 'Updated' });
}

export async function remove(req, res) {
  const id = req.params.id;

  const post = await getPost(id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (post.author_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  const atts = await getAttachments(id);
  for (const a of atts) {
    try { fs.unlinkSync(a.stored_path); } catch {}
  }
  await deletePost(id);
  res.json({ message: 'Deleted' });
}

export async function download(req, res) {
  const { id, attId } = req.params;
  const att = await getAttachment(attId);
  if (!att || String(att.post_id) !== String(id)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.download(att.stored_path, att.original_name);
}
