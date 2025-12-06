# WeCal – social event planner

WeCal lets friends share calendars, send invites, and chat in real time. It’s a React frontend talking to a Node/Express API with WebSocket notifications, containerized with Docker.

## What’s inside
- Frontend: React 18, React-Bootstrap, FullCalendar, React DatePicker.
- Backend: Node.js + Express REST API.
- Real-time: WebSockets (ws) for inbox and notifications.
- Data: PostgreSQL in production (SQLite available for local dev).
- Ops: Docker + Docker Compose; env-driven config for API/WS URLs and CORS.

## Quick start (local)
```bash
npm install
# Backend
cd backend && node server.js    # http://localhost:5000
# Frontend (new terminal)
npm start                       # http://localhost:3000
```

Using Docker:
```bash
docker-compose up --build
# frontend: http://localhost:3000
# api:      http://localhost:5000
# ws:       ws://localhost:5001
```

## Config to set
Create `.env` (or `.env.prod`) in the repo root:
```
PORT=5000
WEBSOCKET_PORT=5001
DATABASE_URL=postgres://user:pw@db:5432/wecal
PGSSL=false
CORS_ORIGINS=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5001
```

## How it flows
- Login/register via `/api/auth`.
- Events via `/api/users/...`.
- Friends and inbox via `/api/social/...`.
- WebSocket pushes inbox updates and friend/meeting notifications live.
