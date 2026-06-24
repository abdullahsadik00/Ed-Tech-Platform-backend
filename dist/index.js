"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const auth_routes_1 = require("./routes/auth.routes");
const course_routes_1 = require("./routes/course.routes");
const section_routes_1 = require("./routes/section.routes");
const subsection_routes_1 = require("./routes/subsection.routes");
const enrollment_routes_1 = require("./routes/enrollment.routes");
const progress_routes_1 = require("./routes/progress.routes");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
(0, dotenv_1.config)();
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
});
app.use(limiter);
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/courses', course_routes_1.courseRoutes);
app.use('/api/sections', section_routes_1.sectionRoutes);
app.use('/api/subsections', subsection_routes_1.subSectionRoutes);
app.use('/api/enrollments', enrollment_routes_1.enrollmentRoutes);
app.use('/api/progress', progress_routes_1.progressRoutes);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
