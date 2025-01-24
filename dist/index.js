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
// import { courseRoutes } from './routes/course.routes';
// import { userRoutes } from './routes/user.routes';
// import { enrollmentRoutes } from './routes/enrollment.routes';
// import { progressRoutes } from './routes/progress.routes';
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
});
app.use(limiter);
// API Routes
app.use('/api/auth', auth_routes_1.authRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/enrollments', enrollmentRoutes);
// app.use('/api/progress', progressRoutes);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// const express = require('express');
// const app = express();
// const database = require('./config/db');
// const cookieParser = require('cookie-parser');
// const cors = require('cors');
// const { cloudinaryConnect } = require('./config/cloudinary');
// const dotenv = require('dotenv').config();
// const userRoute = require('./routes/User');
// const dashboardRoute = require('./routes/Dashboard');
// const PORT = process.env.PORT || 5000;
// app.use(
//   cors({
//     origin: ['http://localhost:3000'],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());
// // Routes
// app.use('/api/v1/auth', userRoute);
// app.use('/api/v1/dashboard', dashboardRoute);
// app.get('/', (req, res) => {
//   res.status(200).json({
//     hasError: false,
//     message: 'Welcome to the Ed-Tech API',
//   });
// });
// app.listen(PORT, (req, res) => {
//   console.log(`Server running on port ${PORT}`);
//   database.connect();
//   // cloudinaryConnect();
//   console.log('Connected to MongoDB');
// });
