import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/messages.controller.js';

const r = Router();

// 조회: 로그인 사용자 모두 허용
r.get('/messages', authenticateToken, ctrl.list);

// 쓰기/수정/삭제: admin/user만 허용(guest 차단)
r.post('/messages', authenticateToken, requireRole(['admin','user']), ctrl.create);
r.put('/messages/:id', authenticateToken, requireRole(['admin','user']), ctrl.update);
r.delete('/messages/:id', authenticateToken, requireRole(['admin','user']), ctrl.remove);

export default r;
