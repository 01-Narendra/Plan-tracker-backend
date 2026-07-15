# Ledger — Daily Plan Tracker (Backend)

Express.js + MongoDB backend API for the plan tracker. Handles auth, plan CRUD,
point management, daily rollover, and streak calculation.

## Setup

### Install dependencies

```bash
npm install
```

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plan-tracker
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

### Start the server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server will run on `http://localhost:5000`.

---


### Deploy

- MongoDB: Use MongoDB Atlas for a managed cloud database
- Server: Deploy to Heroku, Railway, Render, or your own server
- Frontend: Deploy to Vercel, Netlify, or similar
- Update `FRONTEND_URL` and `MONGODB_URI` in production env vars
