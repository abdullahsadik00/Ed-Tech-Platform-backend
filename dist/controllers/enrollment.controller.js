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
exports.checkEnrollment = exports.getMyEnrollments = exports.enrollInCourse = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
const enrollInCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = Number(req.params.courseId);
        const userId = req.user.id;
        const course = yield prisma_1.default.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new CustomError_1.CustomError(404, 'Course not found');
        if (!course.published)
            throw new CustomError_1.CustomError(404, 'Course not found');
        const existing = yield prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing)
            throw new CustomError_1.CustomError(409, 'You are already enrolled in this course');
        if (Number(course.price) > 0) {
            throw new CustomError_1.CustomError(402, 'This course requires payment. Payments are coming soon.');
        }
        const [enrollment] = yield prisma_1.default.$transaction([
            prisma_1.default.enrollment.create({
                data: {
                    userId,
                    courseId,
                    price: course.price,
                    currency: course.currency,
                },
            }),
            prisma_1.default.courseProgress.upsert({
                where: { userId_courseId: { userId, courseId } },
                create: { userId, courseId, progress: 0 },
                update: {},
            }),
        ]);
        res.status(201).json({ success: true, data: enrollment });
    }
    catch (error) {
        next(error);
    }
});
exports.enrollInCourse = enrollInCourse;
const getMyEnrollments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const enrollments = yield prisma_1.default.enrollment.findMany({
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
        const progressRecords = yield prisma_1.default.courseProgress.findMany({
            where: { userId },
            select: { courseId: true, progress: true, lastAccessed: true },
        });
        const progressMap = new Map(progressRecords.map((p) => [p.courseId, p]));
        const result = enrollments.map((e) => {
            var _a, _b, _c, _d;
            return (Object.assign(Object.assign({}, e), { progress: (_b = (_a = progressMap.get(e.courseId)) === null || _a === void 0 ? void 0 : _a.progress) !== null && _b !== void 0 ? _b : 0, lastAccessed: (_d = (_c = progressMap.get(e.courseId)) === null || _c === void 0 ? void 0 : _c.lastAccessed) !== null && _d !== void 0 ? _d : e.enrolledAt }));
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyEnrollments = getMyEnrollments;
const checkEnrollment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = Number(req.params.courseId);
        const userId = req.user.id;
        const enrollment = yield prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        res.json({
            success: true,
            data: { enrolled: !!enrollment, enrollment: enrollment !== null && enrollment !== void 0 ? enrollment : null },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.checkEnrollment = checkEnrollment;
