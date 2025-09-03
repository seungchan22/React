import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
const r = Router();

r.post('/login', ctrl.login);
r.post('/register', ctrl.register); // 선택

export default r;
