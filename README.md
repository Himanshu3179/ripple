## Ripple — MERN Reddit Clone

Ripple is a full-stack Reddit-inspired community platform built with the MERN stack. It delivers a clean, modern feed with voting, threaded conversations, and account management.

### Features
- 🔐 Authentication with JWT (sign up, login, logout, profile bootstrap)
- 📰 Post creation with topics, rich descriptions, optional cover images, and real-time voting
- 💬 Nested comments with reply chains, independent vote tracking, and AI-powered reply drafting
- 🔥 Feed sorting (Hot, New, Top) plus text-based search and trending topic highlights
- 🤖 Starforge AI composer with per-plan quotas and quota tracking
- 💎 Stars currency, membership tiers (Explorer, Star Pass, Star Federation), and Razorpay checkout flows
- 🛒 Billing hub to buy Stars, upgrade memberships, and track perks
- 🎨 Responsive, polished UI built with React, Vite, TailwindCSS, and React Query

### Tech Stack
- **Frontend:** Vite + React 19 with TypeScript, React Router, React Query, TailwindCSS, Day.js, React Hot Toast
- **Backend:** Node, Express 5 with TypeScript, MongoDB with Mongoose, JWT auth, bcrypt, CORS, Morgan
- **Tooling:** ts-node-dev for live reload, ESLint, modern ES modules end-to-end

---

## Getting Started

### 1. Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- MongoDB instance (local or remote)

### 2. Clone & Install
```bash
git clone <repo>
cd first

# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 3. Configure Environment Variables
Edit the generated `.env` files.

`backend/.env`
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/ripple
JWT_SECRET=super-secret-key-change-me
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
OPENAI_API_KEY=sk-your-openai-key (optional – enables live Starforge drafts)
```

`frontend/.env`
```
# Optional when running outside Docker. The app defaults to `/api` which
# works with the Docker proxy and production build.
VITE_API_URL=http://localhost:4000
```

### 4. Run the App
In separate terminals:
```bash
# Backend API
cd backend
npm run dev

# Frontend UI
cd frontend
npm run dev
```

Visit `http://localhost:5173` to explore Ripple.

---

## Project Structure
```
first/
├── backend/          # Express + MongoDB API
│   ├── src/
│   │   ├── config/   # Database connection
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   └── .env.example
├── frontend/         # Vite React single-page app
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   └── .env.example
└── README.md
```

---

## API Highlights
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — authenticate, receive JWT
- `GET /api/posts` — list posts with sorting and search (`sort=hot|new|top`, `topic=`, `q=`)
- `POST /api/posts` — create post (auth required)
- `POST /api/posts/:postId/vote` — upvote/downvote
- `GET /api/posts/:postId/comments` — fetch nested comments
- `POST /api/posts/:postId/comments` — create comment or reply
- `GET /api/billing/meta` — retrieve membership plans and star packs
- `POST /api/billing/stars/checkout` — start a Razorpay order for Stars
- `POST /api/billing/membership/checkout` — upgrade membership tier via Razorpay
- `POST /api/billing/verify` — verify Razorpay signatures client-side
- `POST /api/ai/compose` — Starforge AI post generator (counts against quota)

All protected routes use `Authorization: Bearer <token>` headers.

---

## Development Notes
- TailwindCSS powers styling; adjust themes in `frontend/tailwind.config.js`
- React Query handles caching. Invalidate queries via `queryClient.invalidateQueries(...)` when mutating
- MongoDB indices are auto-managed; ensure the configured database is reachable before running the server

Enjoy building on Ripple! Contributions and customizations welcome.

---

## 🚀 Automated Deployment (CI/CD)

Ripple includes automated deployment to AWS EC2 using GitHub Actions. Every push to `main` automatically:

- ✅ Builds and pushes Docker image to Docker Hub
- ✅ Deploys to EC2 instance
- ✅ Configures Nginx reverse proxy
- ✅ Sets up SSL with Let's Encrypt (if domain provided)
- ✅ Runs health checks

### Quick Setup

1. **Configure GitHub Secrets** (see [DEPLOYMENT.md](.github/DEPLOYMENT.md))
   - EC2 connection details
   - Docker Hub credentials
   - Application secrets (MongoDB, JWT, etc.)

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Monitor deployment:**
   - Check GitHub Actions tab in your repository
   - View logs and deployment status

### Documentation

- 📘 [Full Deployment Guide](.github/DEPLOYMENT.md) - Complete setup instructions
- 🔐 [Secrets Setup Guide](.github/SECRETS_SETUP.md) - Quick reference for GitHub Secrets

### Cost Optimization

- Uses existing EC2 instance (no creation costs)
- Free tier eligible (t2.micro/t3.micro)
- Docker Hub free tier
- Automatic cleanup of old Docker images

---

## Docker Workflow

### Development (hot reload)

1. Build the dev image and start the single container:
   ```bash
   docker compose up --build
   ```

2. Visit `http://localhost:5173` (frontend) and `http://localhost:4000/api/health` (API).

   The container runs both Vite and the Express API together, proxies `/api` requests, and
   watches your local `frontend/` and `backend/` directories for real-time updates.

   Environment variables are pre-configured in `docker-compose.yml`. Edit the file if you
   need to point at a different database or tweak ports.

### Production Image

1. Build the production image:
   ```bash
   docker build -t ripple-app .
   ```

2. Run the container (make sure MongoDB is reachable via `MONGO_URI`):
   ```bash
   docker run -p 4000:4000 \
     -e MONGO_URI="your-mongo-uri" \
     -e JWT_SECRET="your-secret" \
     ripple-app
   ```

   The production image runs the compiled Express server and serves the React build from
   the same port (`/api/*` for JSON, everything else falls back to `index.html`). No extra
   CORS configuration is required.
