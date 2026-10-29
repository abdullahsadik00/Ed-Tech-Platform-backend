// Demo data for the public deployment. Runs on every deploy (`vercel-build`) and is
// idempotent: the demo users are upserted and the demo instructor's courses are
// rebuilt from scratch, so anything visitors change resets on the next deploy.
//
// Demo logins (also shown on the login page and in the README):
//   Student     demo.student@example.com     / Demo@1234
//   Instructor  demo.instructor@example.com  / Demo@1234
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@1234';

type Lesson = { title: string; youtubeId: string; minutes: number; description: string };
type SeedSection = { title: string; lessons: Lesson[] };
type SeedCourse = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  featured: boolean;
  sections: SeedSection[];
};

const courses: SeedCourse[] = [
  {
    title: 'Web Foundations: HTML, CSS & JavaScript',
    slug: 'web-foundations',
    shortDescription: 'The three building blocks of every web page, plus Git.',
    description:
      'A fast tour of the core web platform: structuring pages with HTML, styling them with CSS, adding behaviour with JavaScript, and tracking your work with Git.',
    level: 'BEGINNER',
    featured: true,
    sections: [
      {
        title: 'Structure and style',
        lessons: [
          { title: 'HTML in 100 seconds', youtubeId: 'ok-plXXHlWw', minutes: 2, description: 'Elements, attributes and the document tree.' },
          { title: 'CSS in 100 seconds', youtubeId: 'OEV8gMkCHXQ', minutes: 2, description: 'Selectors, the box model and the cascade.' },
          { title: 'Learn CSS in 20 minutes', youtubeId: '1PnVor36_40', minutes: 20, description: 'A practical walkthrough of everyday CSS.' },
        ],
      },
      {
        title: 'Programming the page',
        lessons: [
          { title: 'JavaScript in 100 seconds', youtubeId: 'DHjqpvDnNGE', minutes: 2, description: 'What JavaScript is and how it runs in the browser.' },
          { title: 'Git explained in 100 seconds', youtubeId: 'hwP7WQkmECE', minutes: 2, description: 'Commits, branches and why version control matters.' },
        ],
      },
    ],
  },
  {
    title: 'Modern Frontend with React & TypeScript',
    slug: 'react-typescript',
    shortDescription: 'Build typed, component-based user interfaces.',
    description:
      'Learn why TypeScript catches bugs before they ship, how React models UIs as components and state, and then build your first React app end to end.',
    level: 'INTERMEDIATE',
    featured: true,
    sections: [
      {
        title: 'Core concepts',
        lessons: [
          { title: 'TypeScript in 100 seconds', youtubeId: 'zQnBQ4tB3ZA', minutes: 2, description: 'Static types on top of JavaScript.' },
          { title: 'React in 100 seconds', youtubeId: 'Tn6-PIqc4UM', minutes: 2, description: 'Components, props, state and the virtual DOM.' },
        ],
      },
      {
        title: 'Building an app',
        lessons: [
          { title: 'React tutorial for beginners', youtubeId: 'SqcY0GlETPk', minutes: 80, description: 'A complete beginner project in React.' },
        ],
      },
    ],
  },
  {
    title: 'Backend Essentials: Node.js, REST & Databases',
    slug: 'backend-essentials',
    shortDescription: 'APIs, SQL, caching and containers.',
    description:
      'Everything behind the API: running JavaScript on the server with Node.js, designing RESTful endpoints, modelling data in SQL and PostgreSQL, caching with Redis, and shipping with Docker.',
    level: 'INTERMEDIATE',
    featured: false,
    sections: [
      {
        title: 'Servers and APIs',
        lessons: [
          { title: 'Node.js beginner guide', youtubeId: 'ENrzD9HAZK4', minutes: 16, description: 'Runtime, modules, npm and a first server.' },
          { title: 'RESTful APIs in 100 seconds', youtubeId: '-MTSQjw5DrM', minutes: 11, description: 'REST principles and an Express API from scratch.' },
        ],
      },
      {
        title: 'Data and infrastructure',
        lessons: [
          { title: 'SQL explained in 100 seconds', youtubeId: 'zsjvFFKOm3c', minutes: 2, description: 'Tables, queries and joins.' },
          { title: 'PostgreSQL in 100 seconds', youtubeId: 'n2Fluyr3lbc', minutes: 2, description: 'Why Postgres is the default relational database.' },
          { title: 'Redis in 100 seconds', youtubeId: 'G1rOthIU-uo', minutes: 2, description: 'In-memory data structures for caching and queues.' },
          { title: 'Docker in 100 seconds', youtubeId: 'Gjnup-PuquQ', minutes: 2, description: 'Images, containers and reproducible environments.' },
        ],
      },
    ],
  },
];

async function upsertUser(email: string, firstName: string, lastName: string, role: 'STUDENT' | 'INSTRUCTOR') {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    create: { email, firstName, lastName, role, password, isEmailVerified: true },
    update: { firstName, lastName, role, password, isActive: true, isBanned: false },
  });
}

async function resetInstructorCourses(instructorId: number) {
  const existing = await prisma.course.findMany({ where: { instructorId }, select: { id: true } });
  const courseIds = existing.map((c) => c.id);
  if (courseIds.length === 0) return;

  await prisma.$transaction([
    prisma.subSectionProgress.deleteMany({ where: { courseProgress: { courseId: { in: courseIds } } } }),
    prisma.courseProgress.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma.enrollment.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma.subSection.deleteMany({ where: { section: { courseId: { in: courseIds } } } }),
    prisma.section.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma.course.deleteMany({ where: { id: { in: courseIds } } }),
  ]);
}

async function createCourse(instructorId: number, c: SeedCourse) {
  const lessons = c.sections.flatMap((s) => s.lessons);
  const course = await prisma.course.create({
    data: {
      title: c.title,
      slug: c.slug,
      description: c.description,
      shortDescription: c.shortDescription,
      thumbnail: `https://img.youtube.com/vi/${lessons[0].youtubeId}/hqdefault.jpg`,
      price: 0,
      level: c.level,
      status: 'PUBLISHED',
      published: true,
      publishedAt: new Date(),
      featured: c.featured,
      duration: lessons.reduce((sum, l) => sum + l.minutes, 0),
      totalLectures: lessons.length,
      instructorId,
      sections: {
        create: c.sections.map((s, si) => ({
          title: s.title,
          order: si + 1,
          duration: s.lessons.reduce((sum, l) => sum + l.minutes, 0),
          isPublished: true,
          isFree: true,
          subSections: {
            create: s.lessons.map((l, li) => ({
              title: l.title,
              description: l.description,
              type: 'VIDEO' as const,
              content: `https://www.youtube.com/watch?v=${l.youtubeId}`,
              duration: l.minutes,
              order: li + 1,
              isPublished: true,
              isFree: true,
            })),
          },
        })),
      },
    },
    include: { sections: { include: { subSections: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
  });
  return course;
}

// Enroll the demo student and mark the first `completed` lessons as done, so the
// dashboard and course player open with realistic in-progress state.
async function enrollWithProgress(userId: number, course: Awaited<ReturnType<typeof createCourse>>, completed: number) {
  const lessonIds = course.sections.flatMap((s) => s.subSections.map((ss) => ss.id));
  await prisma.enrollment.create({ data: { userId, courseId: course.id, price: 0, currency: course.currency } });
  await prisma.courseProgress.create({
    data: {
      userId,
      courseId: course.id,
      progress: Math.round((completed / lessonIds.length) * 100),
      completedSubSections: {
        create: lessonIds.slice(0, completed).map((subSectionId) => ({ subSectionId })),
      },
    },
  });
}

async function main() {
  const instructor = await upsertUser('demo.instructor@example.com', 'Demo', 'Instructor', 'INSTRUCTOR');
  const student = await upsertUser('demo.student@example.com', 'Demo', 'Student', 'STUDENT');

  await resetInstructorCourses(instructor.id);
  const created = [];
  for (const c of courses) created.push(await createCourse(instructor.id, c));

  await enrollWithProgress(student.id, created[0], 2);
  await enrollWithProgress(student.id, created[1], 1);

  console.log(`Seeded ${created.length} courses for ${instructor.email}; ${student.email} enrolled in 2.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
