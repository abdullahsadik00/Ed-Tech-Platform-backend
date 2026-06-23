import { Router } from 'express';
import {
  getCourseProgress,
  markSubSectionComplete,
} from '../controllers/progress.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/:courseId', authenticate, getCourseProgress);
router.post(
  '/:courseId/subsections/:subSectionId',
  authenticate,
  markSubSectionComplete
);

export { router as progressRoutes };
