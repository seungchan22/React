// server/src/routes/posts.routes.js
import { Router } from 'express';
import * as ctrl from '../controllers/posts.controller.js';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();

// 임시 확인용 (필요 시)
// r.get('/__test', (req, res) => res.json({ ok: true }));

r.get('/', ctrl.list);
r.get('/:id', ctrl.detail);
r.get('/:id/attachments/:attId', ctrl.download);

r.post('/', requireAuth, upload.array('files', 10), ctrl.create);
r.put('/:id', requireAuth, upload.array('files', 10), ctrl.update);
r.delete('/:id', requireAuth, ctrl.remove);
r.use((req, _res, next) => {
  console.log('[HIT posts.routes]', req.method, req.originalUrl, 'at', new Date().toISOString());
  next();
});

export default r;
