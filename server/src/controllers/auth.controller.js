import * as users from '../services/users.service.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { ok } from '../utils/response.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) throw new Error('username/password required');

  const user = await users.findByUsername(username);
  if (!user) return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });

  if (!user.is_active) return res.status(403).json({ message: '비활성화된 계정입니다.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });

  ok(res, { token, user: { id: user.id, username: user.username, role: user.role } });
});

export const register = asyncHandler(async (req, res) => {
  const { username, name, password, role = 'user' } = req.body || {};
  if (!username || !name || !password) throw new Error('username/name/password required');
  const id = await users.create({ username, name, password, role, is_active: 1 });
  ok(res, { id });
});
