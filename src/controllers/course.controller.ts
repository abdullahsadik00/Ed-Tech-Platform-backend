import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { CustomError } from '../utils/CustomError';
// import { CustomError } from '../utils/customError';

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
        instructor: { connect: { id: req.user.id } },
        tags: {
          create: validatedData.tags?.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        slug: '',
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
        tags: {
          include: {
            tag: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
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
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
      ...(tags && {
        tags: {
          some: {
            tagId: {
              in: (tags as string).split(',').map(Number),
            },
          },
        },
      }),
      ...(subjects && {
        subjects: {
          some: {
            subjectId: {
              in: (subjects as string).split(',').map(Number),
            },
          },
        },
      }),
    };

    const courses = await prisma.course.findMany({
      where: {},
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.course.count({ where: {} });

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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        sections: {
          include: {
            subSections: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        prerequisites: true,
        requirements: true,
        learningOutcomes: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
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
// const Course = require('../models/Course');
// const Tags = require('../models/Tags');
// const User = require('../models/User');
// const uploadImagetoCloudinary = require('../utils/imageUploader');

// exports.createCourse = async (req, res) => {
//   try {
//     const { courseName, courseDescription, whatYouwillLearn, tags, price } =
//       req.body;

//     const { thumbnail } = req.files.courseThumbnailImage;
//     if (
//       !courseName ||
//       !courseDescription ||
//       !tags ||
//       !price ||
//       !thumbnail ||
//       !whatYouwillLearn
//     ) {
//       return res.status(400).json({
//         message: 'All fields are required',
//         hasError: true,
//       });
//     }
//     const instructorId = req.user.id;
//     const instructorDetails = User.findById(instructorId);
//     if (!instructorDetails) {
//       return res.status(404).json({
//         message: 'Instructor not found',
//         hasError: true,
//       });
//     }
//     const tagsDetails = Tags.findById(tags);
//     if (!tagsDetails) {
//       return res.status(400).json({
//         message: 'Tag not found',
//         hasError: true,
//       });
//     }

//     const thumbnailImageUploaded = await uploadImagetoCloudinary(
//       thumbnail,
//       process.env.FOLDER_NAME
//     );
//     const newCourse = Course({
//       courseName,
//       courseDescription,
//       whatYouwillLearn,
//       tags: tagsDetails._id,
//       price,
//       thumbnail: thumbnailImageUploaded.secure_url,
//       instructor: instructorDetails._id,
//     });
//     await User.findOneAndUpdate(
//       instructorDetails._id,
//       {
//         $push: { courses: newCourse._id },
//       },
//       { new: true }
//     );
//     await Tags.findOneAndUpdate(
//       { id: tagsDetails._id },
//       {
//         $push: {
//           courses: newCourse._id,
//         },
//       },
//       { new: true }
//     );
//     return res.status(200).json({
//       hasErrors: false,
//       data: newCourse,
//       message: 'Course created successfully',
//     });
//   } catch (error) {
//     return res.status(400).json({
//       message: 'Failed to create course',
//       hasError: true,
//       error: error.message,
//     });
//   }
// };

// exports.getAllCourses = async (req, res) => {
//   try {
//     const allCourses = await Course.find(
//       {},
//       { courseName: true, price: true, thumbnail: true, instructor: true }
//     )
//       .populate('instructor')
//       .exec();
//     if (allCourses.length) {
//       return res.status(200).json({
//         hasErrors: false,
//         data: allCourses,
//         message: 'Courses fetched successfully',
//       });
//     }
//   } catch (error) {
//     return res.status(400).json({
//       message: 'Failed to get courses',
//       hasError: true,
//       error: error.message,
//     });
//   }
// };

// exports.getCourseDetails = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const courseDetails = await Course.findById({ _id: courseId })
//       .populate({
//         path: 'instructor',
//         populate: {
//           path: 'additionalDetails',
//         },
//       })
//       .populate({
//         path: 'tags',
//         populate: {
//           path: 'courses',
//         },
//       })
//       .populate({
//         path: 'sections',
//         populate: {
//           path: 'SubSection',
//         },
//       })
//       .populate('ratingAndreview')
//       .exec();
//     if (courseDetails) {
//       return res.status(200).json({
//         hasErrors: false,
//         data: courseDetails,
//         message: 'Course details fetched successfully',
//       });
//     } else {
//       return res.status(404).json({
//         hasError: true,
//         message: 'Course not found',
//       });
//     }
//   } catch (error) {
//     return res.status(404).json({
//       hasError: true,
//       message: `Failed to get course details ${error}`,
//     });
//   }
// };
