import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';

const sectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  isFree: z.boolean().default(false),
  duration: z.number().int().min(0).default(0),
});

const updateSectionSchema = sectionSchema.partial();

async function assertInstructorOwnsCourse(
  courseId: number,
  userId: number,
  userRole: string
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new CustomError(404, 'Course not found');
  if (userRole !== 'ADMIN' && course.instructorId !== userId) {
    throw new CustomError(403, 'You do not own this course');
  }
  return course;
}

export const createSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = Number(req.params.courseId);
    await assertInstructorOwnsCourse(courseId, req.user!.id, req.user!.role);

    const data = sectionSchema.parse(req.body);

    const section = await prisma.section.create({
      data: { ...data, courseId },
      include: { subSections: true },
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section) throw new CustomError(404, 'Section not found');

    await assertInstructorOwnsCourse(
      section.courseId,
      req.user!.id,
      req.user!.role
    );

    const data = updateSectionSchema.parse(req.body);
    const updated = await prisma.section.update({ where: { id }, data });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section) throw new CustomError(404, 'Section not found');

    await assertInstructorOwnsCourse(
      section.courseId,
      req.user!.id,
      req.user!.role
    );

    const subSectionIds = (
      await prisma.subSection.findMany({
        where: { sectionId: id },
        select: { id: true },
      })
    ).map((s) => s.id);

    // Clean up progress references before deleting subsections.
    // SubSectionProgress rows cascade on subsection delete; the legacy
    // CourseProgress.subSectionId pointer and the section-level M2M must be
    // cleared explicitly to avoid FK violations.
    await prisma.$transaction([
      prisma.courseProgress.updateMany({
        where: { subSectionId: { in: subSectionIds } },
        data: { subSectionId: null },
      }),
      prisma.subSection.deleteMany({ where: { sectionId: id } }),
      prisma.section.delete({ where: { id } }),
    ]);

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
