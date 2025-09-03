import db from '../config/db.js';
import { env } from '../config/env.js';

const COL = env.MSG_COL; // 'text' or 'message'

export async function list({ search = '', page = 1, limit = 10, sort = 'id_desc' }) {
  const offset = (page - 1) * limit;
  const like = `%${search.trim()}%`;
  const orderBy = ({
    id_asc:'id ASC', id_desc:'id DESC',
    msg_asc:`${COL} ASC`, msg_desc:`${COL} DESC`,
    date_asc:'created_at ASC', date_desc:'created_at DESC'
  })[sort] || 'id DESC';

  const where = search ? `WHERE \`${COL}\` LIKE ?` : '';
  const paramsWhere = search ? [like] : [];

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM messages ${where}`,
    paramsWhere
  );
  const [rows] = await db.query(
    `SELECT id, \`${COL}\` AS msg, created_at
     FROM messages
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    search ? [like, Number(limit), Number(offset)] : [Number(limit), Number(offset)]
  );

  return { data: rows, total, page: Number(page), limit: Number(limit) };
}

export async function create(body) {
  const raw = (body?.message ?? body?.text ?? '').toString().trim();
  if (!raw) throw new Error('message is required');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO messages (\`${COL}\`) VALUES (?)`,
      [raw]
    );
    await conn.commit();
    return r.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function update(id, body) {
  if (!Number.isFinite(id)) throw new Error('invalid_id');
  const raw = (body?.message ?? body?.text ?? '').toString().trim();
  if (!raw) throw new Error('message is required');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE messages SET \`${COL}\` = ? WHERE id = ?`,
      [raw, id]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function remove(id) {
  if (!Number.isFinite(id)) throw new Error('invalid_id');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM messages WHERE id = ?', [id]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
