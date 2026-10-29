import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './routes/auth.routes';
import { courseRoutes } from './routes/course.routes';
import { sectionRoutes } from './routes/section.routes';
import { subSectionRoutes } from './routes/subsection.routes';
import { enrollmentRoutes } from './routes/enrollment.routes';
import { progressRoutes } from './routes/progress.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

const app = express();

// Behind Vercel's proxy: trust the first hop so rate limiting keys on the real client IP.
app.set('trust proxy', 1);

// CLIENT_URL may list several origins, comma-separated (e.g. production + local dev).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subsections', subSectionRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
