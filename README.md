# WeCal – social event planner

WeCal lets friends share calendars, send invites, and chat in real time. It’s a React frontend talking to a Node/Express API with WebSocket notifications, containerized with Docker. Deployed on AWS EC2 micro.

### React Frontend <-> Websocket server <-> PostgreSQL database
### {------------------------Docker--------------------------} -> AWS EC2
# Demo
[wecal.online](http://98.94.150.212:3000/)

## What’s inside
- Frontend: React 18, React-Bootstrap, FullCalendar, React DatePicker.
- Backend: Node.js + Express REST API.
- Real-time: WebSockets (ws) for inbox and notifications.
- Data: PostgreSQL in production (SQLite available for local dev).
- Ops: Docker + Docker Compose; env-driven config for API/WS URLs and CORS.


## How it flows
- Login/register via `/api/auth`.
- Events via `/api/users/...`.
- Friends and inbox via `/api/social/...`.
- WebSocket pushes inbox updates and friend/meeting notifications live.

## AI Planner (new)
- Frontend uses `REACT_APP_AGENT_URL` (or runtime `window.__ENV.REACT_APP_AGENT_URL`) to call the Cloudflare Worker at `/chat`.
- Worker lives in `cloudflare-agent/` and forwards tool calls to the existing Express API (friends, commitments, meeting requests).
- Worker enforces confirmation before sending invites unless the user says “send it”.
- Toggle the right-side panel in-app to chat with the planner.

## Local dev quickstart
- React app: `npm install` then `npm start` (uses `.env` with `REACT_APP_API_URL`, `REACT_APP_WS_URL`, `REACT_APP_AGENT_URL`).
- Express API: `cd backend && npm install && npm start` (respects `CORS_ORIGINS` and DB envs).
- Worker: `cd cloudflare-agent && npm install && npm run dev -- --local --var API_BASE_URL=http://localhost:5000` (update `wrangler.toml` vars or CLI `--var`). Default dev port is 8787.
- Point the frontend at the Worker: set `REACT_APP_AGENT_URL=http://localhost:8787` in your env file before running `npm start`.

# Future updates
- fix domain @wecal.online
- create mobile ui
- add chat messages
- https (Secure)
