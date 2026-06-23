import { Router } from 'express';
import {
  updateSection,
  deleteSection,
} from '../controllers/section.controller';
import { createSubSection } from '../controllers/subsection.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.put(
  '/:id',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  updateSection
);
router.delete(
  '/:id',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  deleteSection
);

router.post(
  '/:sectionId/subsections',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  createSubSection
);

export { router as sectionRoutes };
