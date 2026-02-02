# WeCal - social event planner

WeCal lets friends share calendars, send invites, and message in real time. It is a React frontend talking to a Node/Express API with WebSocket notifications, backed by PostgreSQL, and deployed on AWS EC2 behind Caddy and Cloudflare.

This repo also satisfies the Cloudflare AI application assignment requirements:
- LLM: Cloudflare Workers AI (Llama 3.x) used in the agent when configured.
- Workflow / coordination: Cloudflare Worker orchestrates intent parsing and API calls; backend persists state.
- User input: chat UI in the app calling the Worker `/chat` endpoint.
- Memory / state: session state stored in Worker memory per session; durable data stored in Postgres.
- AI prompts used are documented in `PROMPTS.md`.

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

## Agent workflows (detailed)
The planner supports three states for events and a few common request types. It keeps a short chat history per session and merges new messages into an event draft.

### Primary request types
- **Create event**: "schedule a lunch on Friday at 1" → create event for the requester.
- **Invite to event**: "invite Emily to lunch on Friday at 1" → create event + send `event_invite` messages.
- **Edit event**: "move lunch to 2" → if multi‑attendee, sends `event_edit` requests; otherwise updates immediately.
- **Status updates**: "accept/decline" on invites and edit requests.
- **Follow‑ups**: the agent asks concise, missing‑field questions (e.g., "What should I call it?").

### Event edit modes
- **Disabled (view only)**: viewing a friend’s event you were not invited to. No edits or actions.
- **Enabled‑locked**: you are invited but pending/declined. You can change your status; edits are locked.
- **Enabled‑unlocked**: you are attending (accepted). Full edit + invite access.

### Status rules
- Event status is **accepted** only when all attendees have accepted.
- Inviting someone adds them immediately with `pending` status.
- Changing only your own status does not re‑pend other attendees.

## Core data tables (PostgreSQL)
The current schema is intentionally small and focused:

- **users**
  - Basic account records (`id`, `username`, `password`).
- **events**
  - Canonical event data (`event_id`, `owner_id`, `name`, `event_date`, `start_time`, `end_time`, `status`).
- **event_members**
  - Join table for attendees and their status (`event_id`, `user_id`, `status`).
- **friends**
  - Undirected friend relationships (`user1_id`, `user2_id`).
- **messages**
  - Chat + notifications (`type` includes `friend_request`, `message`, `event_invite`, `event_edit`).

## API flow summary (agent + UI)
- **Create event (solo)** → `POST /api/users/:id/add-event`
- **Invite friend(s)** → `POST /api/social/:sender_id/:event_id/invite` (or `send-message` for single)
- **Edit request** → `POST /api/social/:requester_id/request-edit`
- **Accept / decline** → `POST /api/social/:recipient_id/:sender_id/update-request`
- **Status toggle** → `POST /api/social/:user_id/:event_id/update-status`
- **Event list** → `GET /api/users/:id/get-events`
- **Attendees list** → `GET /api/social/events/:event_id/members`

## DNS + routing (production)
- Cloudflare manages DNS and TLS. The agent runs as a Cloudflare Worker on a custom subdomain (for example, `agent.wecal.online`).
- Caddy terminates and routes traffic on EC2, reverse proxying to the frontend and API/WS ports.

## Local dev (short)
- Frontend: `npm install` then `npm start` (uses `.env` for API/WS/agent URLs).
- API: `cd backend && npm install && npm start`.
- Worker: `cd cloudflare-agent && npm install && npm run dev -- --local --var API_BASE_URL=http://localhost:5000`.

## Demo
- App: https://wecal.online/
- Agent endpoint: https://agent.wecal.online/chat (POST only)
