# WeCal - social event planner

WeCal lets friends share calendars, send invites, and message in real time. It is a React frontend talking to a Node/Express API with WebSocket notifications, backed by PostgreSQL, and deployed on AWS EC2 behind Caddy and Cloudflare.

## Overview (quick scan)
- Messaging and inbox: real-time chat plus notifications for invites and updates.
- Sharing and inviting: create events, share availability, and send meeting requests.
- AI agent scheduling: natural-language chat that turns intent into API calls.
- Ops: Docker Compose on EC2, Caddy reverse proxy, Cloudflare DNS and TLS.

## Key services and ports
- Frontend: 3000
- API: 5000
- WebSocket: 5001
- Agent (Cloudflare Worker dev): 8787

## How the agent works (short)
- The frontend sends the user message plus small signals (client time, timezone, recent context) to the Worker `/chat` endpoint.
- The Worker parses intent and schedules calls to the existing API endpoints (friends, commitments, invites).
- It asks for confirmation before sending invites unless the user explicitly confirms.

## DNS + routing (production)
- Cloudflare manages DNS and TLS. The agent runs as a Cloudflare Worker on a custom subdomain (for example, `agent.wecal.online`).
- Caddy terminates and routes traffic on EC2, reverse proxying to the frontend and API/WS ports.

## Local dev (short)
- Frontend: `npm install` then `npm start` (uses `.env` for API/WS/agent URLs).
- API: `cd backend && npm install && npm start`.
- Worker: `cd cloudflare-agent && npm install && npm run dev -- --local --var API_BASE_URL=http://localhost:5000`.

## Demo
- https://wecal.online/
