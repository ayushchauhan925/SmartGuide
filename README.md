# SmartGuide

A QR-based Museum & Library Information System. Staff manage artefacts through a secure admin panel; visitors scan a QR code to instantly view rich content — images, descriptions, audio guides — on any device, no app required.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

### Admin Panel
- **Artefact Management** — Create, edit, delete artefacts with title, description, metadata, status (active / draft / inactive)
- **Image Uploads** — Attach multiple images per artefact with drag-and-drop ordering
- **Audio Guides** — Upload MP3/WAV audio narrations for each artefact
- **QR Code Generator** — Generate and download QR codes that link visitors to the public page
- **Categories & Locations** — Organise artefacts by category and physical location
- **User Management** — Admin can create/manage staff accounts with role-based access
- **Audit Logs** — Full log of every action (who did what and when)
- **Dashboard** — Overview stats: total artefacts, QR scans, active items

### Visitor Experience
- **Scan & View** — Scan any QR code to open the artefact page instantly in a browser
- **Rich Content** — Image gallery with thumbnail strip, full description, metadata grid
- **Audio Player** — Built-in player with progress bar, speed control (1×/1.5×/2×), and reset
- **Mobile-First** — Fully responsive, works on any phone without installing an app

### Security
- JWT authentication stored in **HttpOnly cookies** (no localStorage)
- **Role-based access control** — `admin`, `editor`, `viewer`
- **NoSQL injection protection** — blocks MongoDB operator objects (`$gt`, `$where`, etc.)
- **Magic-byte file validation** — verifies actual file content, not just the claimed MIME type
- **Rate limiting** on login endpoint (10 attempts per 15 minutes)
- **Helmet** security headers — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **CORS** restricted to configured frontend origin
- No stack traces exposed in production error responses
- Graceful shutdown with connection cleanup

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| **Express 5** | HTTP server and routing |
| **TypeScript** | Type safety |
| **Prisma 6** | MongoDB ORM |
| **MongoDB** | Primary database (requires replica set) |
| **JWT + bcryptjs** | Authentication and password hashing |
| **Multer** | File upload handling |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Brute-force protection |
| **compression** | Gzip responses |
| **morgan** | Request logging |
| **qrcode** | QR code image generation |

### Frontend
| Package | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **TypeScript** | Type safety |
| **React Router v7** | Client-side routing |
| **Lucide React** | Icon set |
| **CSS Custom Properties** | Design system (no Tailwind) |

---

## Project Structure

```
SmartGuide/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # MongoDB data models
│   ├── scripts/
│   │   └── migrate-mysql-to-mongo.ts  # One-time MySQL → MongoDB migration
│   ├── src/
│   │   ├── index.ts               # Express app entry point
│   │   ├── lib/
│   │   │   ├── auth.ts            # JWT sign/verify, cookie helpers
│   │   │   ├── audit.ts           # Audit log writer
│   │   │   ├── prisma.ts          # Prisma client singleton
│   │   │   └── storage.ts         # File save/delete + magic-byte validation
│   │   ├── middleware/
│   │   │   ├── auth.ts            # requireAuth() middleware + RBAC
│   │   │   └── sanitize.ts        # NoSQL injection sanitizer
│   │   └── routes/
│   │       ├── auth.ts            # POST /api/v1/auth (login/logout/me)
│   │       ├── artefacts.ts       # CRUD + image/audio/QR sub-routes
│   │       ├── categories.ts      # Category CRUD
│   │       ├── locations.ts       # Location CRUD
│   │       ├── users.ts           # User management (admin only)
│   │       ├── auditLogs.ts       # Audit log viewer (admin only)
│   │       ├── qrCodes.ts         # QR code listing
│   │       ├── public.ts          # Public visitor route (no auth)
│   │       └── files.ts           # Uploaded file serving
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Router setup
│   │   ├── index.css              # Global design system (CSS variables)
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Auth state + login/logout
│   │   ├── lib/
│   │   │   ├── api.ts             # Fetch wrapper with error handling
│   │   │   └── types.ts           # Shared TypeScript interfaces
│   │   ├── components/ui/
│   │   │   ├── Badge.tsx          # Status badge
│   │   │   ├── ConfirmModal.tsx   # Delete confirmation dialog
│   │   │   ├── FormField.tsx      # Labelled input wrapper
│   │   │   └── Toast.tsx          # Notification toasts
│   │   └── pages/
│   │       ├── LoginPage.tsx      # Split-screen login
│   │       ├── VisitorPage.tsx    # Public artefact view (QR landing page)
│   │       └── admin/
│   │           ├── AdminLayout.tsx        # Collapsible sidebar shell
│   │           ├── DashboardPage.tsx      # Stats overview
│   │           ├── ArtefactsPage.tsx      # Artefact list + search + filter
│   │           ├── ArtefactDetailPage.tsx # View artefact
│   │           ├── ArtefactEditPage.tsx   # Edit artefact
│   │           ├── ArtefactNewPage.tsx    # Create artefact
│   │           ├── ArtefactQrPage.tsx     # QR code viewer/generator
│   │           ├── CategoriesPage.tsx     # Category management
│   │           ├── LocationsPage.tsx      # Location management
│   │           ├── UsersPage.tsx          # User management
│   │           ├── QrCodesPage.tsx        # All QR codes list
│   │           └── AuditLogsPage.tsx      # Audit log viewer
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── start-all.bat                  # Windows: start MongoDB + backend + frontend
├── start-mongodb-rs.bat           # Windows: start MongoDB replica set instance
└── README.md
```

---

## Database Schema

```
User
├── id (ObjectId)
├── name, email (unique), passwordHash
├── role: admin | editor | viewer
└── isActive, createdAt, updatedAt

Artefact
├── id (ObjectId)
├── uniquePublicId (UUID — used in QR URLs)
├── title, description, metadata (JSON)
├── status: active | inactive | draft
├── categoryId → Category
├── locationId → Location
├── images[] → ArtefactImage
├── audio → ArtefactAudio
└── qrCode → QrCode

QrCode
├── id (ObjectId)
├── artefactId → Artefact
├── uniqueShortCode, publicUrl
├── scanCount, lastScannedAt
└── isActive

AuditLog
├── userId → User
├── action (login | create | update | delete | deactivate)
├── entityType, entityId
├── changes (JSON diff)
└── ipAddress, createdAt
```

---

## API Reference

All admin routes require a valid session cookie (`smartguide_session`).

### Authentication
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth` | Public | Login — returns session cookie |
| GET | `/api/v1/auth/me` | Public | Get current user from cookie |
| POST | `/api/v1/auth/logout` | Public | Clear session cookie |

### Artefacts
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/v1/artefacts` | viewer+ | List with search, filter, pagination |
| POST | `/api/v1/artefacts` | editor+ | Create artefact |
| GET | `/api/v1/artefacts/:id` | viewer+ | Get single artefact |
| PUT | `/api/v1/artefacts/:id` | editor+ | Update artefact |
| DELETE | `/api/v1/artefacts/:id` | editor+ | Delete artefact + files |
| POST | `/api/v1/artefacts/:id/images` | editor+ | Upload images (multi) |
| DELETE | `/api/v1/artefacts/:id/images/:imageId` | editor+ | Delete image |
| POST | `/api/v1/artefacts/:id/audio` | editor+ | Upload audio file |
| GET | `/api/v1/artefacts/:id/qr` | viewer+ | Get QR code + data URL |
| POST | `/api/v1/artefacts/:id/qr` | editor+ | Generate / regenerate QR code |

### Categories & Locations
| Method | Path | Access | Description |
|---|---|---|---|
| GET/POST | `/api/v1/categories` | viewer / editor+ | List or create |
| PUT/DELETE | `/api/v1/categories/:id` | editor+ | Update or delete |
| GET/POST | `/api/v1/locations` | viewer / editor+ | List or create |
| PUT/DELETE | `/api/v1/locations/:id` | editor+ | Update or delete |

### Users & Audit (Admin only)
| Method | Path | Access | Description |
|---|---|---|---|
| GET/POST | `/api/v1/users` | admin | List or create users |
| PUT/DELETE | `/api/v1/users/:id` | admin | Update or deactivate user |
| GET | `/api/v1/audit-logs` | admin | Paginated audit log |

### Public (No auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/public/a/:uniquePublicId` | Visitor artefact page data + scan count increment |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server + database status |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running as a **replica set** (required by Prisma for write transactions)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/ayushchauhan925/SmartGuide.git
cd SmartGuide
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URL and JWT secret
npx prisma generate
npm run dev
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 4. MongoDB replica set (local)

Prisma requires MongoDB to run as a replica set. Start one locally:

```bash
# Create data directory
mkdir -p /data/rs0

# Start mongod with replica set
mongod --dbpath /data/rs0 --replSet rs0 --port 27017 --bind_ip 127.0.0.1

# In another terminal, initialise the replica set
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

On **Windows**, run `start-mongodb-rs.bat` which does this automatically using the bundled scripts.

### 5. Open the app

| URL | Description |
|---|---|
| `http://localhost:5173` | Frontend (login page) |
| `http://localhost:5173/admin` | Admin panel |
| `http://localhost:4000/api/health` | Backend health check |

Default credentials (after seeding or migration):
```
admin@smartguide.demo  /  Admin@123   (role: admin)
editor@smartguide.demo /  Admin@123   (role: editor)
```

---

## Environment Variables

Create `backend/.env` from the provided `.env.example`:

```env
# MongoDB connection string (must be a replica set)
DATABASE_URL="mongodb://127.0.0.1:27017/smartguide?replicaSet=rs0&directConnection=true"

# JWT
JWT_SECRET="change-this-to-a-long-random-secret"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# URLs (change to your domain in production)
FRONTEND_URL="http://localhost:5173"
APP_URL="http://localhost:4000"

# File uploads
UPLOAD_DIR="./uploads"
MAX_IMAGE_SIZE_MB=10
MAX_AUDIO_SIZE_MB=20
```

> **Important:** Never commit `.env` to git. It is already in `.gitignore`.

---

## Security

| Layer | Implementation |
|---|---|
| Authentication | JWT in `HttpOnly`, `SameSite=Lax` cookie — not localStorage |
| Authorisation | Role hierarchy: `viewer < editor < admin` enforced per route |
| NoSQL Injection | Global middleware rejects any body containing `$`-prefixed keys |
| File Uploads | Magic-byte inspection of file buffer — client MIME type is ignored |
| Brute Force | `express-rate-limit`: 10 login attempts per 15 minutes |
| Headers | `helmet` — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Permissions-Policy | Camera, microphone, geolocation, payment all disabled |
| User Enumeration | Login returns identical 401 for wrong email or wrong password |
| Error Responses | Stack traces never sent to client in production |
| Process Stability | `unhandledRejection` and `uncaughtException` handlers prevent crashes |
| Path Traversal | `subDir` normalised in storage layer; `..` sequences stripped |

---

## Deployment

### Production build

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd ../backend && npm run build

# Start
NODE_ENV=production node dist/index.js
```

In production mode, Express serves the built frontend from `../frontend/dist/` automatically — a single server, a single domain.

### Recommended platforms

| Platform | Notes |
|---|---|
| **Railway** | Easiest. Connect GitHub repo, set env vars, deploy. ~$5/month |
| **Render** | Free tier available (spins down on idle). $7/month for always-on |
| **DigitalOcean App Platform** | $5/month, reliable |
| **VPS** | Full control. DigitalOcean / Hetzner from $4/month |

### MongoDB in production

Use **MongoDB Atlas** free tier (512MB) — change `DATABASE_URL` to your Atlas connection string. No replica set configuration needed (Atlas handles it).

### After deploying

1. Set `FRONTEND_URL` and `APP_URL` to your real domain in env vars
2. Regenerate all QR codes from the admin panel so they use the `https://` URLs

---

## Role Reference

| Action | viewer | editor | admin |
|---|:---:|:---:|:---:|
| View artefacts, categories, locations | ✅ | ✅ | ✅ |
| Create / edit artefacts | ❌ | ✅ | ✅ |
| Upload images / audio | ❌ | ✅ | ✅ |
| Generate QR codes | ❌ | ✅ | ✅ |
| Manage categories & locations | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
