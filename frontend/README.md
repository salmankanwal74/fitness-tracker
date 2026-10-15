# Fitness Tracker (MERN)

Ek full-stack fitness tracking web application: workouts, nutrition, weight, measurements aur performance
ko track karein, charts se progress dekhein, goals set karein, aur community/forum mein doosre users se judein.

## Features
- **Account:** signup (terms/privacy consent), login, forgot/reset password, profile, settings, account delete
- **Tracking:** Workouts, Nutrition, Weight, Measurements, Performance
- **Analytics:** Dashboard, Workout Analytics, Nutrition Analytics (charts), Reports (CSV/PDF export)
- **Goals & Notifications:** goals set karna, milestone/streak/goal notifications (bell icon)
- **Community:** user search, follow/unfollow, suggestions, followers/following
- **Forum:** posts, replies, search, apni post/reply delete
- **Support:** user ticket bhejta hai, admin "Support Inbox" se jawab deta aur resolve karta hai
- **Settings:** light/dark theme, units (kg/lbs, cm/in), notification on/off

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Recharts, Framer Motion |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (Atlas ya local) |
| Auth | JWT, bcryptjs |
| Security | helmet, CORS, rate limiting, input sanitization, NoSQL-injection protection |
| Testing | Node built-in test runner (`node --test`) |
| Deployment (optional) | Docker, docker-compose, nginx |

## Folder Structure
```
fitness-tracker/
├── backend/            Express API (controllers, models, routes, middleware, tests, scripts)
├── frontend/           React app (pages, components, services, utils)
├── docs/               API.md aur baqi documentation
├── docker-compose.yml  (optional) poora project Docker se chalane ke liye
├── .env.example        (optional) Docker ke liye
└── README.md
```

## Quick Start
Requirements: **Node.js 20.19+** (ya 22.12+), MongoDB Atlas account ya local MongoDB.

1. **Backend**
```
   cd backend
   npm install
```
   `.env.example` ko copy karke `.env` banayein aur values bharein (dekhein `backend/README.md`), phir:
```
   npm run dev
```
   Backend `http://localhost:5000` par chalta hai.

2. **Frontend** (naye terminal mein)
```
   cd frontend
   npm install
```
   `frontend/.env` mein likhein: `VITE_API_URL=http://localhost:5000/api`, phir:
```
   npm run dev
```
   App `http://localhost:5173` par khulti hai.

3. **Tests**
```
   cd backend  &&  npm test      (110 tests)
   cd frontend &&  npm test      (33 tests)
```

## Admin account
Backend `.env` mein `ADMIN_EMAILS=admin@example.com` likhein. Us email se signup/login karne wale ko
"Support Inbox" milta hai.

## Non-functional requirements
| Requirement | Kaise poori hui |
|---|---|
| Performance | Pagination (`X-Total-Count` headers), gzip compression, frontend lazy loading (code-splitting), regex search limits |
| Scalability | Stateless JWT API, indexes, Docker + nginx load-balancing (`--scale backend=3`) |
| Security | bcrypt password hash, JWT, helmet, rate limiting, NoSQL-injection sanitizer, input validation, author-only delete, `npm audit` 0 vulnerabilities |
| Privacy / GDPR | Terms+Privacy consent, data export (CSV/PDF), account delete saara data hata deta hai |
| Reliability / Backup | `npm run backup` / `npm run restore`, `/health` endpoint, Docker healthchecks |
| Accessibility | Skip link, ARIA labels/roles, keyboard navigation, `aria-live` messages |
| Logging / Monitoring | Structured logger, har request ko `X-Request-Id`, central error handler |
| Testing | 110 backend + 33 frontend automated tests |

## Documentation
- `docs/USER_GUIDE.md`: user guide
- `docs/API.md`: API endpoints
- `backend/README.md`: backend setup, env variables, scripts
- `frontend/README.md`: frontend setup