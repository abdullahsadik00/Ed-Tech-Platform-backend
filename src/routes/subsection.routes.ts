import { Router } from 'express';
import {
  updateSubSection,
  deleteSubSection,
} from '../controllers/subsection.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.put(
  '/:id',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  updateSubSection
);
router.delete(
  '/:id',
  authenticate,
  requireRole('INSTRUCTOR', 'ADMIN'),
  deleteSubSection
);

export { router as subSectionRoutes };
