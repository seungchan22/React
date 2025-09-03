import  pool  from '../config/db.js';

export async function createPost({ title, content, authorId }, conn = pool) {
  const [r] = await conn.execute(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
    [title, content, authorId]
  );
  return r.insertId;
}

export async function updatePost({ id, title, content }, conn = pool) {
  await conn.execute(
    `UPDATE posts SET title=:title, content=:content WHERE id=:id`,
    { id, title, content }
  );
}

export async function deletePost(id, conn = pool) {
  await conn.execute(`DELETE FROM posts WHERE id=:id`, { id });
}

export async function getPost(id) {
  const [rows] = await pool.execute(
    `SELECT p.*, u.email AS author_email 
       FROM posts p JOIN users u ON u.id=p.author_id 
      WHERE p.id=:id`,
    { id }
  );
  return rows[0] || null;
}

export async function listPosts({ page = 1, limit = 10, q }) {
  // 1) 숫자 검증/정규화
  page  = Number.isFinite(+page)  && +page  > 0 ? Math.floor(+page)  : 1;
  limit = Number.isFinite(+limit) && +limit > 0 ? Math.min(Math.floor(+limit), 100) : 10;
  const offset = (page - 1) * limit;

  // 2) where/params 구성 (where만 바인딩, LIMIT/OFFSET은 안전하게 인라인)
  let where = '';
  const args = [];
  if (q && q.trim()) {
    where = 'WHERE p.title LIKE ? OR p.content LIKE ?';
    const like = `%${q.trim()}%`;
    args.push(like, like);
  }

  // 3) 목록 쿼리 (LIMIT/OFFSET 인라인)
  const sqlList = `
    SELECT
      p.id,
      p.title,
      LEFT(p.content, 200) AS preview,
      p.created_at,
      p.author_id,
      (SELECT COUNT(*) FROM attachments a WHERE a.post_id = p.id) AS attachment_count
    FROM posts p
    ${where}
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [rows] = await pool.execute(sqlList, args);

  // 4) 카운트 쿼리 (where만 동일 바인딩)
  const sqlCount = `
    SELECT COUNT(*) AS cnt
    FROM posts p
    ${where}
  `;
  const [[{ cnt }]] = await pool.execute(sqlCount, args);

  return { rows, total: cnt };
}

