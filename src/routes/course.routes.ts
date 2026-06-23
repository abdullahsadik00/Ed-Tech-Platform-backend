import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  getInstructorCourses,
} from '../controllers/course.controller';
import {
  createSection,
} from '../controllers/section.controller';
import {
  enrollInCourse,
  checkEnrollment,
} from '../controllers/enrollment.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/', getCourses);
router.get(
  '/mine',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  getInstructorCourses
);
router.get('/:id', getCourseById);

router.post(
  '/',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  createCourse
);
router.put(
  '/:id',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  updateCourse
);
router.put(
  '/:id/publish',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  publishCourse
);

router.post(
  '/:courseId/sections',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  createSection
);

router.post('/:courseId/enroll', authenticate, enrollInCourse);
router.get('/:courseId/enrollment', authenticate, checkEnrollment);

export { router as courseRoutes };
