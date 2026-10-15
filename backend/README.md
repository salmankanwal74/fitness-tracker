# Fitness Tracker: Backend (Node.js + Express + MongoDB)

## Requirements
- Node.js 20.19+ (ya 22.12+)
- MongoDB Atlas ya local MongoDB

## Setup
```
cd backend
npm install
```
`.env.example` ko copy karke `.env` banayein aur values bharein, phir `npm run dev` (development) ya `npm start` (production).

## Environment variables (`.env`)
| Variable | Zaroori? | Matlab |
|---|---|---|
| `PORT` | haan | Server port (jaise `5000`) |
| `MONGO_URI` | haan | MongoDB connection string |
| `JWT_SECRET` | haan | Token sign karne ka lamba random text |
| `ADMIN_EMAILS` | nahi | Admin emails (comma se alag), jaise `admin@example.com` |
| `NODE_ENV` | nahi | `production` par JSON logs aur chhupe hue stack traces |
| `CORS_ORIGIN` | nahi | Frontend ka address (production) |
| `CLIENT_URL` | nahi | Password-reset link mein use hota hai (jaise `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | nahi | Asli email bhejne ke liye (warna reset link terminal mein dikhta hai) |
| `TRUST_PROXY` | nahi | Proxy ke peeche chalne par `1` |
| `LOG_LEVEL` | nahi | `debug`, `info`, `warn`, `error` |
| `BACKUP_DIR`, `BACKUP_KEEP` | nahi | Backup folder (default `./backups`) aur kitni purani backups rakhni hain (default 7) |
| `AUTH_RATE_LIMIT`, `API_RATE_LIMIT` | nahi | Rate limits (default: auth 20, api 300 har 15 minute / IP) |

## Scripts
| Command | Kaam |
|---|---|
| `npm run dev` | Development server (nodemon) |
| `npm start` | Production server |
| `npm test` | Saare automated tests (110) |
| `npm run backup` | Database ka backup `backups/backup-<tarikh-waqt>/` mein |
| `npm run restore -- backups/<folder>` | Backup se restore (sirf khali collections mein) |
| `npm run restore -- backups/<folder> --drop` | Maujooda data hata kar backup se badal do |
| `npm run check:setup` | Setup ki jaanch (env, database, admin) |
| `npm run check:admin` | Admin accounts ki jaanch |
| `npm run audit:prod` | Production dependencies ki security audit |

## Backup aur Restore
```
npm run backup
npm run restore -- backups/backup-20261013-190000 --drop
```
Backup har collection ko JSON (EJSON) file mein save karta hai aur `manifest.json` mein ginti likhta hai.
Sirf sab se nayi `BACKUP_KEEP` backups rakhi jati hain.

## Security
- Passwords `bcryptjs` se hash; login par JWT token
- `helmet` security headers, CORS control
- Rate limiting (login/signup/forgot-password par sakht limit)
- Input sanitization (NoSQL injection: `$ne`, `$gt` jaise operators block)
- Regex search escape, pagination limits
- Author-only delete (forum post/reply), admin-only routes (`adminOnly` middleware)
- Account delete par workouts, nutrition, weight, measurements, performance, goals, notifications, support,
  follows, forum posts aur replies sab hat jate hain

## Logging aur Monitoring
- Structured logger (`utils/logger.js`): production mein har line JSON
- Har request ko `X-Request-Id`; request ke baad ek log line
- Central `errorHandler`: errors ek jagah log hote hain
- `GET /health`: server aur database ki halat (database band ho to 503)

## Folder structure
```
backend/
├── app.js           Express app (middleware + routes)
├── server.js        Server start aur database connection
├── config/          database config
├── controllers/     har feature ka logic
├── models/          Mongoose models
├── routes/          API routes
├── middleware/      auth, validation, sanitize, logger, errors
├── utils/           logger, backup, notify, pagination, helpers
├── scripts/         backup, restore, check scripts
└── tests/           automated tests
```

API endpoints ki list: `../docs/API.md`