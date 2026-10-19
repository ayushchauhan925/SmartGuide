# SmartGuide

QR-based museum & library guide. Visitors scan a code beside an object to read or hear its story; staff manage the collection in an admin studio.

```
SmartGuide/
├── backend/    Express + TypeScript REST API (Prisma + MySQL, JWT cookie auth, file uploads)
├── frontend/   React + Vite + React Router + Tailwind CSS (visitor site and admin)
└── uploads/    Uploaded images, audio and QR codes (shared, git-ignored)
```

## Requirements

- Node.js 20+
- MySQL 8 (connection string in `backend/.env`)

## First-time setup

```bash
# Backend
cd backend
cp .env.example .env        # then set DATABASE_URL and JWT_SECRET
npm install                 # also runs `prisma generate`
npm run db:push             # create/update tables
npm run db:seed             # demo data + admin@smartguide.demo / admin1234

# Frontend
cd ../frontend
npm install
```

## Development

Run each in its own terminal:

```bash
cd backend  && npm run dev   # API on http://localhost:4000
cd frontend && npm run dev   # App on http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173 for the visitor site and http://localhost:5173/admin for the admin.

## Production

```bash
cd frontend && npm run build          # -> frontend/dist
cd ../backend && npm run build        # -> backend/dist
NODE_ENV=production node dist/index.js
```

The Express server serves the API under `/api/v1` and the built frontend (with SPA fallback) from `../frontend/dist`, so it deploys as a single service. Set `APP_URL` to the public URL visitors use; it is embedded in QR codes and upload URLs.

The root `package.json` has no code of its own; it only wraps the two apps for hosts such as Railway (`railway.json`): `npm install` installs both apps, `npm run build` builds both, and `npm start` pushes the schema, seeds, and starts the server.

## Backend environment (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret for session tokens (32+ chars) |
| `JWT_EXPIRES_IN` | Session length, e.g. `7d` |
| `APP_URL` | Public site URL (frontend origin) |
| `UPLOAD_DIR` | Where uploads are stored (default `../uploads`) |
| `MAX_IMAGE_SIZE_MB` / `MAX_AUDIO_SIZE_MB` | Upload limits |
| `PORT` | API port (default 4000) |
| `FRONTEND_DIST` | Optional path to the built frontend (default `../frontend/dist`) |
