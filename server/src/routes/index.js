import { Router } from 'express';
import auth from './auth.routes.js';
import users from './users.routes.js';
import messages from './messages.routes.js';
import postsRoutes from './posts.routes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(auth);      // /api/login, /api/register
router.use(users);     // /api/users...
router.use(messages);  // /api/messages...
router.use('/posts', postsRoutes); 
router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

export default router;
