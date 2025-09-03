import  pool  from '../config/db.js';

export async function addAttachments(postId, files, conn = pool) {
  if (!files?.length) return;
  const values = files.map(f => [
    postId,
    f.originalname,
    f.filename,
    f.mimetype,
    f.size,
    f.path.replace(/\\/g, '/')
  ]);
  // mysql2 bulk insert
  await conn.query(
    `INSERT INTO attachments
      (post_id, original_name, stored_name, mime_type, size, stored_path)
     VALUES ?`,
    [values]
  );
}

export async function getAttachments(postId) {
  const [rows] = await pool.execute(
    `SELECT id, original_name, stored_name, mime_type, size, stored_path 
     FROM attachments WHERE post_id=:postId`,
    { postId }
  );
  return rows;
}

export async function getAttachment(id) {
  const [rows] = await pool.execute(
    `SELECT * FROM attachments WHERE id=:id`,
    { id }
  );
  return rows[0] || null;
}
