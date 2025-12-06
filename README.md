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
