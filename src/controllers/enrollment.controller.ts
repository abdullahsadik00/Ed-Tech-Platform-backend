import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';

export const enrollInCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new CustomError(404, 'Course not found');
    if (!course.published) throw new CustomError(404, 'Course not found');

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new CustomError(409, 'You are already enrolled in this course');

    if (Number(course.price) > 0) {
      throw new CustomError(402, 'This course requires payment. Payments are coming soon.');
    }

    const [enrollment] = await prisma.$transaction([
      prisma.enrollment.create({
        data: {
          userId,
          courseId,
          price: course.price,
          currency: course.currency,
        },
      }),
      prisma.courseProgress.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, progress: 0 },
        update: {},
      }),
    ]);

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            level: true,
            language: true,
            instructor: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const progressRecords = await prisma.courseProgress.findMany({
      where: { userId },
      select: { courseId: true, progress: true, lastAccessed: true },
    });

    const progressMap = new Map(
      progressRecords.map((p) => [p.courseId, p])
    );

    const result = enrollments.map((e) => ({
      ...e,
      progress: progressMap.get(e.courseId)?.progress ?? 0,
      lastAccessed: progressMap.get(e.courseId)?.lastAccessed ?? e.enrolledAt,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const checkEnrollment = async (
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

    res.json({
      success: true,
      data: { enrolled: !!enrollment, enrollment: enrollment ?? null },
    });
  } catch (error) {
    next(error);
  }
};
