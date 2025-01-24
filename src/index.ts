import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { authRoutes } from './routes/auth.routes';
// import { courseRoutes } from './routes/course.routes';
// import { userRoutes } from './routes/user.routes';
// import { enrollmentRoutes } from './routes/enrollment.routes';
// import { progressRoutes } from './routes/progress.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/enrollments', enrollmentRoutes);
// app.use('/api/progress', progressRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

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
