import { Router } from 'express';
import { login, signUp } from '../controllers/auth.controller';
const router = Router();
router.post('/signup', signUp);
router.post('/login', login);

export { router as authRoutes };
