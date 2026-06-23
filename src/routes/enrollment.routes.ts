import { Router } from 'express';
import { getMyEnrollments } from '../controllers/enrollment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticate, getMyEnrollments);

export { router as enrollmentRoutes };
