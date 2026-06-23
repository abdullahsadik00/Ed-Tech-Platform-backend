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
        completedSections: { select: { id: true } },
      },
    });

    if (!progress) {
      return res.json({
        success: true,
        data: {
          progress: 0,
          completedSectionIds: [],
          lastAccessed: null,
          timeSpent: 0,
        },
      });
    }

    res.json({
      success: true,
      data: {
        progress: progress.progress,
        completedSectionIds: progress.completedSections.map((s) => s.id),
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

    const sectionId = subSection.sectionId;

    let progressRecord = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { completedSections: { select: { id: true } } },
    });

    if (!progressRecord) {
      progressRecord = await prisma.courseProgress.create({
        data: { userId, courseId, progress: 0 },
        include: { completedSections: { select: { id: true } } },
      });
    }

    const alreadyComplete = progressRecord.completedSections.some(
      (s) => s.id === sectionId
    );

    const totalSections = await prisma.section.count({ where: { courseId } });

    let completedCount = progressRecord.completedSections.length;

    const updated = await prisma.courseProgress.update({
      where: { id: progressRecord.id },
      data: {
        lastAccessed: new Date(),
        subSectionId,
        ...(alreadyComplete
          ? {}
          : {
              completedSections: { connect: { id: sectionId } },
            }),
      },
      include: { completedSections: { select: { id: true } } },
    });

    if (!alreadyComplete) {
      completedCount = updated.completedSections.length;
    }

    const newProgress =
      totalSections > 0 ? (completedCount / totalSections) * 100 : 0;

    const final = await prisma.courseProgress.update({
      where: { id: progressRecord.id },
      data: { progress: newProgress },
      include: { completedSections: { select: { id: true } } },
    });

    res.json({
      success: true,
      data: {
        progress: final.progress,
        completedSectionIds: final.completedSections.map((s) => s.id),
      },
    });
  } catch (error) {
    next(error);
  }
};
