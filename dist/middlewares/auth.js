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
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const CustomError_1 = require("../utils/CustomError");
const prisma_1 = __importDefault(require("../config/prisma"));
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token || req.body.token || req.headers.authorization;
        if (!token) {
            throw new CustomError_1.CustomError(401, 'No token provided');
        }
        const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret-key');
        const user = yield prisma_1.default.user.findUnique({
            where: { id: decode.userId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new CustomError_1.CustomError(401, 'User not found');
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(new CustomError_1.CustomError(401, 'Invalid Token'));
    }
});
exports.authenticate = authenticate;
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// exports.auth = async function(req, res, next) {
//     try {
//         const token = req.cookies.token || req.body.token || req.header('Authorization');
//         if(!token){
//             return res.status(401).json({
//                 hasError: true,
//                 message: 'No token provided',
//             });
//         }
//         try {
//             const decode = jwt.verify(token, process.env.SECRET_KEY);
//             req.user = decode;
//             console.log(req.user);
//         } catch (error) {
//             return res.status(401).json({
//                 hasError: true,
//                 message: 'Token is invalid',
//             })
//         }
//         next();
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             hasError: true,
//             message: 'Failed to authenticate user',
//         });
//     }
// };
// exports.isStudent = async function (req, res,next){
//     try {
//         if (req.user.role !== 'student') {
//             return res.status(401).json({
//                 hasError: true,
//                 message: 'User is not a student',
//             });
//         }
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             hasError: true,
//             message: 'User is not a student',
//         })
//     }
// }
// exports.isTeacher = async function (req, res, next){
//     try {
//         if (req.user.role!== 'Teacher') {
//             return res.status(401).json({
//                 hasError: true,
//                 message: 'User is not a teacher',
//             });
//         }
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             hasError: true,
//             message: 'User is not a teacher',
//         })
//     }
// }
// exports.isAdmin = async function (req, res, next){
//     try {
//         if (req.user.role!== 'Admin') {
//             return res.status(401).json({
//                 hasError: true,
//                 message: 'User is not an admin',
//             });
//         }
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             hasError: true,
//             message: 'User is not an admin',
//         })
//     }
// }
