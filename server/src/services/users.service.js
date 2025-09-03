import db from '../config/db.js';
import bcrypt from 'bcrypt';

export async function findByUsername(username) {
  const [rows] = await db.query(
    'SELECT id, username, password, name, role, is_active, created_at FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

export async function list({ search = '', page = 1, limit = 10, sort = 'id_desc' }) {
  const offset = (page - 1) * limit;
  const like = `%${search.trim()}%`;
  const orderBy = ({
    id_asc:'id ASC', id_desc:'id DESC',
    username_asc:'username ASC', username_desc:'username DESC',
    name_asc:'name ASC', name_desc:'name DESC',
    role_asc:'role ASC', role_desc:'role DESC'
  })[sort] || 'id DESC';

  const paramsWhere = search ? [like, like] : [];
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM users
     ${search ? 'WHERE (username LIKE ? OR name LIKE ?)' : ''}`,
    paramsWhere
  );

  const [rows] = await db.query(
    `SELECT id, username, name, role, is_active, created_at
     FROM users
     ${search ? 'WHERE (username LIKE ? OR name LIKE ?)' : ''}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    search ? [...paramsWhere, Number(limit), Number(offset)] : [Number(limit), Number(offset)]
  );
  return { data: rows, total, page: Number(page), limit: Number(limit) };
}

export async function create({ username, name, role = 'user', is_active = 1, password }) {
  if (!username || !name || !password) throw new Error('username/name/password required');
  const hash = bcrypt.hashSync(password, 10);
  const [r] = await db.query(
    'INSERT INTO users (username, name, role, is_active, password) VALUES (?, ?, ?, ?, ?)',
    [username, name, role, is_active ? 1 : 0, hash]
  );
  return r.insertId;
}

export async function update(id, { name, role, is_active }) {
  if (!Number.isFinite(id)) throw new Error('invalid_id');
  await db.query(
    'UPDATE users SET name=?, role=?, is_active=? WHERE id=?',
    [name, role, is_active ? 1 : 0, id]
  );
}

export async function resetPassword(id, password) {
  if (!Number.isFinite(id)) throw new Error('invalid_id');
  if (!password) throw new Error('password required');
  const hash = bcrypt.hashSync(password, 10);
  await db.query('UPDATE users SET password=? WHERE id=?', [hash, id]);
}
