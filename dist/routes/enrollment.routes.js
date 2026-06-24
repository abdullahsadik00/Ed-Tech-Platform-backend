"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentRoutes = void 0;
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.enrollmentRoutes = router;
router.get('/me', auth_1.authenticate, enrollment_controller_1.getMyEnrollments);
