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
exports.login = exports.signUp = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const CustomError_1 = require("../utils/CustomError");
const signupSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'STUDENT', 'INSTRUCTOR']).default('STUDENT'),
});
const signUp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = signupSchema.parse(req.body);
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            throw new CustomError_1.CustomError(400, 'Email already registered');
        }
        const hashedPassword = yield bcrypt_1.default.hash(validatedData.password, 10);
        const user = yield prisma_1.default.user.create({
            data: Object.assign(Object.assign({}, validatedData), { password: hashedPassword }),
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            data: { user, token },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.signUp = signUp;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = yield prisma_1.default.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            throw new CustomError_1.CustomError(401, 'Invalid email or password');
        }
        const isPasswordValid = yield bcrypt_1.default.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            throw new CustomError_1.CustomError(401, 'Invalid email or password');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        yield prisma_1.default.loginHistory.create({
            data: {
                userId: user.id,
                ipAddress: String(req.ip),
                userAgent: req.headers['user-agent'] || '',
                hasError: false,
            },
        });
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
