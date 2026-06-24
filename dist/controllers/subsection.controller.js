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
exports.deleteSubSection = exports.updateSubSection = exports.createSubSection = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
const subSectionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    // Must match the Prisma ContentType enum (schema.prisma) or the DB write
    // throws. v1 editor only offers VIDEO + DOCUMENT; the rest are accepted for
    // forward-compatibility with the schema.
    type: zod_1.z
        .enum(['VIDEO', 'DOCUMENT', 'AUDIO', 'PRESENTATION', 'INTERACTIVE'])
        .default('VIDEO'),
    content: zod_1.z.string().min(1),
    duration: zod_1.z.number().int().min(0),
    order: zod_1.z.number().int().min(0),
    isFree: zod_1.z.boolean().default(false),
});
const updateSubSectionSchema = subSectionSchema.partial();
function assertInstructorOwnsSection(sectionId, userId, userRole) {
    return __awaiter(this, void 0, void 0, function* () {
        const section = yield prisma_1.default.section.findUnique({
            where: { id: sectionId },
            include: { course: { select: { instructorId: true } } },
        });
        if (!section)
            throw new CustomError_1.CustomError(404, 'Section not found');
        if (userRole !== 'ADMIN' && section.course.instructorId !== userId) {
            throw new CustomError_1.CustomError(403, 'You do not own this course');
        }
        return section;
    });
}
const createSubSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectionId = Number(req.params.sectionId);
        yield assertInstructorOwnsSection(sectionId, req.user.id, req.user.role);
        const data = subSectionSchema.parse(req.body);
        const subSection = yield prisma_1.default.subSection.create({
            data: Object.assign(Object.assign({}, data), { sectionId }),
        });
        res.status(201).json({ success: true, data: subSection });
    }
    catch (error) {
        next(error);
    }
});
exports.createSubSection = createSubSection;
const updateSubSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const subSection = yield prisma_1.default.subSection.findUnique({ where: { id } });
        if (!subSection)
            throw new CustomError_1.CustomError(404, 'SubSection not found');
        yield assertInstructorOwnsSection(subSection.sectionId, req.user.id, req.user.role);
        const data = updateSubSectionSchema.parse(req.body);
        const updated = yield prisma_1.default.subSection.update({ where: { id }, data });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.updateSubSection = updateSubSection;
const deleteSubSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(req.params.id);
        const subSection = yield prisma_1.default.subSection.findUnique({ where: { id } });
        if (!subSection)
            throw new CustomError_1.CustomError(404, 'SubSection not found');
        yield assertInstructorOwnsSection(subSection.sectionId, req.user.id, req.user.role);
        // Clean up progress references before deleting. SubSectionProgress rows
        // cascade automatically; the legacy CourseProgress.subSectionId pointer
        // must be nulled to avoid a FK violation.
        yield prisma_1.default.$transaction([
            prisma_1.default.courseProgress.updateMany({
                where: { subSectionId: id },
                data: { subSectionId: null },
            }),
            prisma_1.default.subSection.delete({ where: { id } }),
        ]);
        res.json({ success: true, data: { id } });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteSubSection = deleteSubSection;
