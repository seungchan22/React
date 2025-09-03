import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/users.controller.js';

const r = Router();

r.get('/users', authenticateToken, requireRole(['admin']), ctrl.list);
r.post('/users', authenticateToken, requireRole(['admin']), ctrl.create);
r.put('/users/:id', authenticateToken, requireRole(['admin']), ctrl.update);
r.put('/users/:id/password', authenticateToken, requireRole(['admin']), ctrl.resetPassword);

export default r;
