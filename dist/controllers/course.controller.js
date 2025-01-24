"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseById = exports.getCourses = exports.createCourse = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
// import { CustomError } from '../utils/customError';
const courseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    shortDescription: zod_1.z.string().optional(),
    thumbnail: zod_1.z.string().url(),
    previewVideo: zod_1.z.string().url().optional(),
    price: zod_1.z.number().min(0),
    currency: zod_1.z.string().default('INR'),
    level: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    language: zod_1.z.string().default('English'),
    duration: zod_1.z.number().min(0),
    featured: zod_1.z.boolean().default(false),
    isPrivate: zod_1.z.boolean().default(false),
    allowGuestPreview: zod_1.z.boolean().default(true),
    metaTitle: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.number()).optional(),
    subjects: zod_1.z.array(zod_1.z.number()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
    requirements: zod_1.z.array(zod_1.z.string()).optional(),
    learningOutcomes: zod_1.z.array(zod_1.z.string()).optional(),
});
const createCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'INSTRUCTOR' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
            throw new CustomError_1.CustomError(403, 'Only instructors can create courses');
        }
        const validatedData = courseSchema.parse(req.body);
        const course = yield prisma_1.default.course.create({
            data: Object.assign(Object.assign({}, validatedData), { instructor: { connect: { id: req.user.id } }, tags: {
                    create: (_c = validatedData.tags) === null || _c === void 0 ? void 0 : _c.map((tagId) => ({
                        tag: { connect: { id: tagId } },
                    })),
                }, slug: '', subjects: {
                    create: (_d = validatedData.subjects) === null || _d === void 0 ? void 0 : _d.map((subjectId) => ({
                        subject: { connect: { id: subjectId } },
                    })),
                }, prerequisites: {
                    create: (_e = validatedData.prerequisites) === null || _e === void 0 ? void 0 : _e.map((prerequisite) => ({
                        title: prerequisite,
                        description: prerequisite,
                    })),
                }, requirements: {
                    create: (_f = validatedData.requirements) === null || _f === void 0 ? void 0 : _f.map((requirement) => ({
                        requirement,
                    })),
                }, learningOutcomes: {
                    create: (_g = validatedData.learningOutcomes) === null || _g === void 0 ? void 0 : _g.map((outcome) => ({
                        title: outcome,
                        description: outcome,
                    })),
                } }),
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
    }
    catch (error) {
        next(error);
    }
});
exports.createCourse = createCourse;
const getCourses = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, level, featured, search, tags, subjects, } = req.query;
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ published: true }, (level && { level: level })), (featured && { featured: featured === 'true' })), (search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        })), (tags && {
            tags: {
                some: {
                    tagId: {
                        in: tags.split(',').map(Number),
                    },
                },
            },
        })), (subjects && {
            subjects: {
                some: {
                    subjectId: {
                        in: subjects.split(',').map(Number),
                    },
                },
            },
        }));
        const courses = yield prisma_1.default.course.findMany({
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
        const total = yield prisma_1.default.course.count({ where: {} });
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
    }
    catch (error) {
        next(error);
    }
});
exports.getCourses = getCourses;
const getCourseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield prisma_1.default.course.findUnique({
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
            throw new CustomError_1.CustomError(404, 'Course not found');
        }
        res.json({
            success: true,
            data: course,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCourseById = getCourseById;
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
