import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';

const subSectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z
    .enum(['VIDEO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT', 'LIVE_SESSION'])
    .default('VIDEO'),
  content: z.string().min(1),
  duration: z.number().int().min(0),
  order: z.number().int().min(0),
  isFree: z.boolean().default(false),
});

const updateSubSectionSchema = subSectionSchema.partial();

async function assertInstructorOwnsSection(
  sectionId: number,
  userId: number,
  userRole: string
) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!section) throw new CustomError(404, 'Section not found');
  if (userRole !== 'ADMIN' && section.course.instructorId !== userId) {
    throw new CustomError(403, 'You do not own this course');
  }
  return section;
}

export const createSubSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sectionId = Number(req.params.sectionId);
    await assertInstructorOwnsSection(sectionId, req.user!.id, req.user!.role);

    const data = subSectionSchema.parse(req.body);
    const subSection = await prisma.subSection.create({
      data: { ...data, sectionId },
    });

    res.status(201).json({ success: true, data: subSection });
  } catch (error) {
    next(error);
  }
};

export const updateSubSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const subSection = await prisma.subSection.findUnique({ where: { id } });
    if (!subSection) throw new CustomError(404, 'SubSection not found');

    await assertInstructorOwnsSection(
      subSection.sectionId,
      req.user!.id,
      req.user!.role
    );

    const data = updateSubSectionSchema.parse(req.body);
    const updated = await prisma.subSection.update({ where: { id }, data });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteSubSection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const subSection = await prisma.subSection.findUnique({ where: { id } });
    if (!subSection) throw new CustomError(404, 'SubSection not found');

    await assertInstructorOwnsSection(
      subSection.sectionId,
      req.user!.id,
      req.user!.role
    );

    await prisma.subSection.delete({ where: { id } });

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
