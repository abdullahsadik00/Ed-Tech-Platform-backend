import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  thumbnail: z.string().url(),
  previewVideo: z.string().url().optional(),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  language: z.string().default('English'),
  duration: z.number().min(0),
  featured: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  allowGuestPreview: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.number()).optional(),
  subjects: z.array(z.number()).optional(),
  prerequisites: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Date.now()}`;
}

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== 'INSTRUCTOR' && req.user?.role !== 'ADMIN') {
      throw new CustomError(403, 'Only instructors can create courses');
    }

    const validatedData = courseSchema.parse(req.body);

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        slug: generateSlug(validatedData.title),
        instructor: { connect: { id: req.user.id } },
        tags: {
          create: validatedData.tags?.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        subjects: {
          create: validatedData.subjects?.map((subjectId) => ({
            subject: { connect: { id: subjectId } },
          })),
        },
        prerequisites: {
          create: validatedData.prerequisites?.map((prerequisite) => ({
            title: prerequisite,
            description: prerequisite,
          })),
        },
        requirements: {
          create: validatedData.requirements?.map((requirement) => ({
            requirement,
          })),
        },
        learningOutcomes: {
          create: validatedData.learningOutcomes?.map((outcome) => ({
            title: outcome,
            description: outcome,
          })),
        },
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tags: { include: { tag: true } },
        subjects: { include: { subject: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      level,
      featured,
      search,
      tags,
      subjects,
    } = req.query;

    const where = {
      published: true,
      ...(level && { level: level as string }),
      ...(featured && { featured: featured === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search as string, mode: 'insensitive' as const } },
          { description: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }),
      ...(tags && {
        tags: {
          some: {
            tagId: { in: (tags as string).split(',').map(Number) },
          },
        },
      }),
      ...(subjects && {
        subjects: {
          some: {
            subjectId: { in: (subjects as string).split(',').map(Number) },
          },
        },
      }),
    };

    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: { include: { tag: true } },
        subjects: { include: { subject: true } },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.course.count({ where });

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, bio: true },
        },
        sections: { include: { subSections: true } },
        tags: { include: { tag: true } },
        subjects: { include: { subject: true } },
        prerequisites: true,
        requirements: true,
        learningOutcomes: true,
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
    });

    if (!course) {
      throw new CustomError(404, 'Course not found');
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};
