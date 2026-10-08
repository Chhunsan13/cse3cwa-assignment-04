# cse3cwa-assignment-04

Autonomous supermarket simulation for CSE3CWA / CSE5006 Assignment 4.

## Run locally

Requires Node.js 18+.

Backend:

```bash
cd backend
npm install
npm start
```

The API is http://localhost:3001. SQLite is created at `backend/data/supermarket.db`.

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.
