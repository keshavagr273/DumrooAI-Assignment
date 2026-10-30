import { Router } from 'express';
import { login, register, getMe, logout, seed } from './auth.controller.js';
import requireAuth from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/seed', seed);
router.get('/me', requireAuth, getMe);

export default router;
