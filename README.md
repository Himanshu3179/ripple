## Ripple — MERN Reddit Clone

Ripple is a full-stack Reddit-inspired community platform built with the MERN stack. It delivers a clean, modern feed with voting, threaded conversations, and account management.

### Features
- 🔐 Authentication with JWT (sign up, login, logout, profile bootstrap)
- 📰 Post creation with topics, rich descriptions, optional cover images, and real-time voting
- 💬 Nested comments with reply chains and independent vote tracking
- 🔥 Feed sorting (Hot, New, Top) plus text-based search and trending topic highlights
- 🎨 Responsive, polished UI built with React, Vite, TailwindCSS, and React Query

### Tech Stack
- **Frontend:** Vite + React 19, React Router, React Query, TailwindCSS, Day.js, React Hot Toast
- **Backend:** Node, Express 5, MongoDB with Mongoose, JWT auth, bcrypt, CORS, Morgan
- **Tooling:** Nodemon for dev server, ESLint, modern ES modules end-to-end

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
```

`frontend/.env`
```
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

All protected routes use `Authorization: Bearer <token>` headers.

---

## Development Notes
- TailwindCSS powers styling; adjust themes in `frontend/tailwind.config.js`
- React Query handles caching. Invalidate queries via `queryClient.invalidateQueries(...)` when mutating
- MongoDB indices are auto-managed; ensure the configured database is reachable before running the server

Enjoy building on Ripple! Contributions and customizations welcome.
