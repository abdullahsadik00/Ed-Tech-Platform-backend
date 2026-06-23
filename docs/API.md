# API Reference — Ed-Tech Platform Backend

Base URL: `http://localhost:3000`

All responses follow one of two shapes:
- **Success:** `{ "success": true, "data": { ... } }`
- **Error:** `{ "hasError": true, "message": "...", "errors": [] }`

Protected routes require: `Authorization: Bearer <jwt_token>`

---

## Authentication

### POST /api/auth/signup

Register a new user.

**Request body:**
```json
{
  "firstName": "Aanya",
  "lastName": "Sharma",
  "email": "aanya@example.com",
  "password": "securePassword123",
  "role": "STUDENT"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "aanya@example.com", "firstName": "Aanya", "role": "STUDENT" },
    "token": "<jwt>"
  }
}
```

---

### POST /api/auth/login

Login and receive a JWT.

**Request body:**
```json
{ "email": "aanya@example.com", "password": "securePassword123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "aanya@example.com", "firstName": "Aanya", "role": "STUDENT" },
    "token": "<jwt>"
  }
}
```

---

## Courses

### GET /api/courses

List all published courses. Public endpoint.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10) |
| level | string | `BEGINNER` \| `INTERMEDIATE` \| `ADVANCED` \| `EXPERT` |
| search | string | Full-text search on title + description |
| featured | boolean | Filter featured courses |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1, "title": "React Fundamentals", "slug": "react-fundamentals-1719100000000",
        "price": "0", "level": "BEGINNER", "published": true,
        "instructor": { "id": 2, "firstName": "Ravi", "lastName": "Kumar" },
        "_count": { "enrollments": 45, "reviews": 12 }
      }
    ],
    "pagination": { "total": 45, "pages": 5, "page": 1, "limit": 10 }
  }
}
```

---

### GET /api/courses/mine

Instructor's own courses (all statuses including drafts). Requires `INSTRUCTOR` or `ADMIN` role.

---

### GET /api/courses/:id

Single course detail with full sections, subsections, reviews. Public endpoint.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1, "title": "React Fundamentals", "description": "...",
    "sections": [
      {
        "id": 1, "title": "Introduction", "order": 1,
        "subSections": [
          { "id": 1, "title": "What is React?", "duration": 5, "order": 1 }
        ]
      }
    ],
    "instructor": { "firstName": "Ravi", "bio": "..." },
    "_count": { "enrollments": 45 }
  }
}
```

---

### POST /api/courses

Create a new course. Requires `INSTRUCTOR` or `ADMIN` role.

**Request body:**
```json
{
  "title": "React Fundamentals",
  "description": "A comprehensive introduction to React 18",
  "shortDescription": "Learn React from scratch",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "price": 0,
  "level": "BEGINNER",
  "language": "English",
  "duration": 120
}
```

Course starts as DRAFT (`published: false`). Slug is auto-generated from title + timestamp.

---

### PUT /api/courses/:id

Update course details. Requires ownership (instructorId must match req.user.id) or ADMIN.

---

### PUT /api/courses/:id/publish

Toggle course published status. Sets `published = true` and `publishedAt = now()`. Course must have at least one section with one subsection.

**Response 200:**
```json
{ "success": true, "data": { "id": 1, "published": true, "publishedAt": "2026-06-23T..." } }
```

---

### POST /api/courses/:courseId/enroll

Enroll the authenticated user in a course.

- Free courses (price = 0) enroll immediately.
- Paid courses: returns 402 in Phase 1 ("Payment required — coming soon").
- Duplicate enrollment returns 409.

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 5, "courseId": 1, "userId": 3, "status": "ACTIVE", "enrolledAt": "..." }
}
```

---

### GET /api/courses/:courseId/enrollment

Check if the authenticated user is enrolled in a course.

**Response 200:**
```json
{ "success": true, "data": { "enrolled": true, "enrollment": { "id": 5, "status": "ACTIVE" } } }
```

---

## Sections

### POST /api/courses/:courseId/sections

Add a section to a course. Requires ownership.

**Request body:**
```json
{ "title": "Getting Started", "description": "Introduction section", "order": 1, "isFree": false }
```

---

### PUT /api/sections/:id

Update section title, description, order, isPublished, isFree.

---

### DELETE /api/sections/:id

Delete section and cascade-delete all its subsections.

---

### POST /api/sections/:sectionId/subsections

Add a video lesson to a section.

**Request body:**
```json
{
  "title": "What is React?",
  "description": "Overview of the React library and component model",
  "type": "VIDEO",
  "content": "https://www.youtube.com/embed/SqcY0GlETPk",
  "duration": 8,
  "order": 1,
  "isFree": true
}
```

**`type` values:** `VIDEO` | `DOCUMENT` | `QUIZ` | `ASSIGNMENT` | `LIVE_SESSION`

---

### PUT /api/subsections/:id

Update subsection fields.

---

### DELETE /api/subsections/:id

Delete subsection.

---

## Enrollments

### GET /api/enrollments/me

Get all active enrollments for the authenticated user with course info and progress percentage.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "course": { "id": 1, "title": "React Fundamentals", "thumbnail": "...", "level": "BEGINNER" },
      "progress": 35.5,
      "enrolledAt": "2026-06-01T..."
    }
  ]
}
```

---

## Progress

### GET /api/progress/:courseId

Get progress for the authenticated user in a specific course.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "progress": 35.5,
    "completedSubSectionIds": [1, 2, 5],
    "lastAccessed": "2026-06-23T...",
    "timeSpent": 45
  }
}
```

---

### POST /api/progress/:courseId/subsections/:subSectionId

Mark a subsection as complete and recalculate overall progress.

Progress formula: `(completedSubSections / totalSubSections) * 100`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "progress": 42.8,
    "completedSubSectionIds": [1, 2, 5, 6]
  }
}
```

---

## Error Reference

| Status | Code | Meaning |
|--------|------|---------|
| 400 | Bad Request | Zod validation failed — `errors[]` array has field details |
| 401 | Unauthorized | Missing or invalid JWT token |
| 402 | Payment Required | Course requires payment (Phase 1) |
| 403 | Forbidden | Valid JWT but insufficient role |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate enrollment attempt |
| 500 | Internal Server Error | Unexpected error — check server logs |
