# Ed-Tech Platform — Backend

REST API for the Ed-Tech Platform. Handles authentication, course/section/lesson
management, enrollment, and per-lesson progress tracking.

Pairs with the [Ed-Tech Platform frontend](https://github.com/abdullahsadik00/Ed-Tech-Platform-frontend)
(React + Vite).

**Live API:** https://ed-tech-platform-backend-ten.vercel.app (health check at [`/api/health`](https://ed-tech-platform-backend-ten.vercel.app/api/health)), used by the [live frontend](https://ed-tech-platform-frontend-two.vercel.app).

## Deployment

Runs on Vercel as a serverless Express function, with PostgreSQL on Neon. Each production deploy runs `vercel-build`:

1. `prisma migrate deploy` applies pending migrations over the direct (unpooled) connection.
2. `prisma db seed` (`prisma/seed.ts`) upserts the demo student and instructor and rebuilds the three demo courses.
3. `tsc` builds the app.

Production environment variables: `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (from the Neon integration), `JWT_SECRET`, and `CLIENT_URL` (comma-separated allowed origins).

## Tech stack

- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** via **Prisma ORM** (`prisma/schema.prisma`)
- **Zod** for request validation
- **JWT** (`jsonwebtoken`) auth + **bcrypt** password hashing
- **Helmet**, **CORS**, and **express-rate-limit** for hardening

## Project layout

```
src/
├── controllers/   # business logic, one file per resource
├── routes/        # Express routers, one file per resource
├── middlewares/   # authenticate, requireRole, error + 404 handlers
├── config/        # singleton Prisma client
├── utils/         # CustomError
└── index.ts       # app bootstrap + route wiring
prisma/
├── schema.prisma  # data model (PostgreSQL)
└── migrations/    # migration history
```

## API surface (v1)

- `POST /api/auth/signup`, `POST /api/auth/login`
- `GET /api/courses` (filter/search/paginate), `GET /api/courses/:id`,
  `GET /api/courses/mine`, `POST /api/courses`, `PUT /api/courses/:id`,
  `PUT /api/courses/:id/publish`
- `POST /api/courses/:courseId/sections`, `PUT /api/sections/:id`,
  `DELETE /api/sections/:id`
- `POST /api/sections/:sectionId/subsections`, `PUT /api/subsections/:id`,
  `DELETE /api/subsections/:id`
- `POST /api/courses/:courseId/enroll`, `GET /api/courses/:courseId/enrollment`,
  `GET /api/enrollments/me`
- `GET /api/progress/:courseId`,
  `POST /api/progress/:courseId/subsections/:subSectionId`

Full request/response details are in `docs/API.md`.

All responses follow `{ success: true, data }` on success and
`{ hasError: true, message, errors }` on failure.

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
npm install
cp .env.example .env        # then edit values
npx prisma migrate dev      # create + apply schema
npm run dev                 # ts-node dev server at http://localhost:3000
```

Required environment variables (the server exits on startup if `DATABASE_URL`
or `JWT_SECRET` is missing):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/edtech_dev?schema=public"
JWT_SECRET="change-me-to-a-long-random-secret-min-32-chars"
CLIENT_URL="http://localhost:5173"   # optional, CORS origin
PORT=3000                            # optional
NODE_ENV="development"               # optional
```

### Scripts

```bash
npm run dev      # ts-node dev server with reload
npm run build    # tsc compile to dist/
npm start        # run compiled dist/index.js
```

Useful Prisma commands:

```bash
npx prisma studio                     # browse the database
npx prisma migrate dev --name <name>  # create + apply a migration
npx prisma generate                   # regenerate the client after schema edits
```

## Notes on scope

The Prisma schema models many future features (quizzes, assignments,
certificates, discussions, notifications, analytics, taxonomy, etc.). Only the
core learning-loop models are wired to routes in v1: `User`, `Course`,
`Section`, `SubSection`, `Enrollment`, `CourseProgress` (+ `SubSectionProgress`
for per-lesson completion), and `LoginHistory`.
