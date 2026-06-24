import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';

export const getCourseProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new CustomError(403, 'Not enrolled in this course');

    const progress = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        completedSubSections: { select: { subSectionId: true } },
      },
    });

    if (!progress) {
      res.json({
        success: true,
        data: {
          progress: 0,
          completedSubSectionIds: [],
          lastAccessed: null,
          timeSpent: 0,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        progress: progress.progress,
        completedSubSectionIds: progress.completedSubSections.map(
          (s) => s.subSectionId
        ),
        lastAccessed: progress.lastAccessed,
        timeSpent: progress.timeSpent,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markSubSectionComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = Number(req.params.courseId);
    const subSectionId = Number(req.params.subSectionId);
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new CustomError(403, 'Not enrolled in this course');

    const subSection = await prisma.subSection.findUnique({
      where: { id: subSectionId },
      include: { section: true },
    });
    if (!subSection) throw new CustomError(404, 'Subsection not found');
    if (subSection.section.courseId !== courseId) {
      throw new CustomError(400, 'Subsection does not belong to this course');
    }

    // Ensure a CourseProgress row exists for this (user, course).
    const progressRecord = await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, progress: 0 },
      update: {},
    });

    // Mark this subsection complete (idempotent via the unique constraint).
    await prisma.subSectionProgress.upsert({
      where: {
        courseProgressId_subSectionId: {
          courseProgressId: progressRecord.id,
          subSectionId,
        },
      },
      create: { courseProgressId: progressRecord.id, subSectionId },
      update: {},
    });

    // Recompute progress as completed subsections / total subsections in course.
    const totalSubSections = await prisma.subSection.count({
      where: { section: { courseId } },
    });
    const completedCount = await prisma.subSectionProgress.count({
      where: { courseProgressId: progressRecord.id },
    });

    const newProgress =
      totalSubSections > 0 ? (completedCount / totalSubSections) * 100 : 0;

    const final = await prisma.courseProgress.update({
      where: { id: progressRecord.id },
      data: { progress: newProgress, lastAccessed: new Date() },
      include: { completedSubSections: { select: { subSectionId: true } } },
    });

    res.json({
      success: true,
      data: {
        progress: final.progress,
        completedSubSectionIds: final.completedSubSections.map(
          (s) => s.subSectionId
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};
