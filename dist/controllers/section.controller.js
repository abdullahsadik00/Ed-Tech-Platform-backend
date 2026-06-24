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
exports.deleteSection = exports.updateSection = exports.createSection = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
const sectionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    order: zod_1.z.number().int().min(0),
    isFree: zod_1.z.boolean().default(false),
    duration: zod_1.z.number().int().min(0).default(0),
});
const updateSectionSchema = sectionSchema.partial();
function assertInstructorOwnsCourse(courseId, userId, userRole) {
    return __awaiter(this, void 0, void 0, function* () {
        const course = yield prisma_1.default.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new CustomError_1.CustomError(404, 'Course not found');
        if (userRole !== 'ADMIN' && course.instructorId !== userId) {
            throw new CustomError_1.CustomError(403, 'You do not own this course');
        }
        return course;
    });
}
const createSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = Number(req.params.courseId);
        yield assertInstructorOwnsCourse(courseId, req.user.id, req.user.role);
        const data = sectionSchema.parse(req.body);
        const section = yield prisma_1.default.section.create({
            data: Object.assign(Object.assign({}, data), { courseId }),
            include: { subSections: true },
        });
        res.status(201).json({ success: true, data: section });
    }
    catch (error) {
        next(error);
    }
});
exports.createSection = createSection;
const updateSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const section = yield prisma_1.default.section.findUnique({ where: { id } });
        if (!section)
            throw new CustomError_1.CustomError(404, 'Section not found');
        yield assertInstructorOwnsCourse(section.courseId, req.user.id, req.user.role);
        const data = updateSectionSchema.parse(req.body);
        const updated = yield prisma_1.default.section.update({ where: { id }, data });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updateSection = updateSection;
const deleteSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const section = yield prisma_1.default.section.findUnique({ where: { id } });
        if (!section)
            throw new CustomError_1.CustomError(404, 'Section not found');
        yield assertInstructorOwnsCourse(section.courseId, req.user.id, req.user.role);
        const subSectionIds = (yield prisma_1.default.subSection.findMany({
            where: { sectionId: id },
            select: { id: true },
        })).map((s) => s.id);
        // Clean up progress references before deleting subsections.
        // SubSectionProgress rows cascade on subsection delete; the legacy
        // CourseProgress.subSectionId pointer and the section-level M2M must be
        // cleared explicitly to avoid FK violations.
        yield prisma_1.default.$transaction([
            prisma_1.default.courseProgress.updateMany({
                where: { subSectionId: { in: subSectionIds } },
                data: { subSectionId: null },
            }),
            prisma_1.default.subSection.deleteMany({ where: { sectionId: id } }),
            prisma_1.default.section.delete({ where: { id } }),
        ]);
        res.json({ success: true, data: { id } });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteSection = deleteSection;
