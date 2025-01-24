"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post('/signup', auth_controller_1.signUp);
router.post('/login', auth_controller_1.login);
