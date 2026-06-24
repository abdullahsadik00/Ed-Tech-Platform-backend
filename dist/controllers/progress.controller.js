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
exports.markSubSectionComplete = exports.getCourseProgress = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
const getCourseProgress = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = Number(req.params.courseId);
        const userId = req.user.id;
        const enrollment = yield prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!enrollment)
            throw new CustomError_1.CustomError(403, 'Not enrolled in this course');
        const progress = yield prisma_1.default.courseProgress.findUnique({
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
                completedSubSectionIds: progress.completedSubSections.map((s) => s.subSectionId),
                lastAccessed: progress.lastAccessed,
                timeSpent: progress.timeSpent,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCourseProgress = getCourseProgress;
const markSubSectionComplete = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = Number(req.params.courseId);
        const subSectionId = Number(req.params.subSectionId);
        const userId = req.user.id;
        const enrollment = yield prisma_1.default.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!enrollment)
            throw new CustomError_1.CustomError(403, 'Not enrolled in this course');
        const subSection = yield prisma_1.default.subSection.findUnique({
            where: { id: subSectionId },
            include: { section: true },
        });
        if (!subSection)
            throw new CustomError_1.CustomError(404, 'Subsection not found');
        if (subSection.section.courseId !== courseId) {
            throw new CustomError_1.CustomError(400, 'Subsection does not belong to this course');
        }
        // Ensure a CourseProgress row exists for this (user, course).
        const progressRecord = yield prisma_1.default.courseProgress.upsert({
            where: { userId_courseId: { userId, courseId } },
            create: { userId, courseId, progress: 0 },
            update: {},
        });
        // Mark this subsection complete (idempotent via the unique constraint).
        yield prisma_1.default.subSectionProgress.upsert({
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
        const totalSubSections = yield prisma_1.default.subSection.count({
            where: { section: { courseId } },
        });
        const completedCount = yield prisma_1.default.subSectionProgress.count({
            where: { courseProgressId: progressRecord.id },
        });
        const newProgress = totalSubSections > 0 ? (completedCount / totalSubSections) * 100 : 0;
        const final = yield prisma_1.default.courseProgress.update({
            where: { id: progressRecord.id },
            data: { progress: newProgress, lastAccessed: new Date() },
            include: { completedSubSections: { select: { subSectionId: true } } },
        });
        res.json({
            success: true,
            data: {
                progress: final.progress,
                completedSubSectionIds: final.completedSubSections.map((s) => s.subSectionId),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.markSubSectionComplete = markSubSectionComplete;
