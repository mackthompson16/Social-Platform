# WeCal – Social Event Planning Platform

A full-stack calendar-sharing and messaging platform built with React, Node.js, WebSockets, and SQLite. Features live messaging, event scheduling, and friend collaboration with containerized deployment on AWS.

## Features

- **Live Messaging & Notifications** – Real-time inbox updates via WebSocket server
- **Calendar Sharing** – Create, view, and share events with friends
- **Friend System** – Add friends and manage event invitations
- **Responsive UI** – Built with React, Bootstrap, and FullCalendar
- **RESTful API** – CRUD operations for users, events, and social interactions
- **Docker Ready** – Containerized backend and frontend for easy local development and cloud deployment

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, Bootstrap 5, FullCalendar, React DatePicker |
| **Backend** | Node.js, Express, REST API |
| **Real-time** | WebSockets (ws library) |
| **Database** | SQLite3 (local development), PostgreSQL-ready for cloud |
| **Deployment** | Docker, Docker Compose, AWS (EC2/ECS) |
| **CI/CD** | GitHub Actions |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 3000)               │
│              Calendar UI, Messaging, Friend Management       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                           ↓
┌─────────────────────────────────────────────────────────────┐
│            Node.js/Express Backend (Port 5000)               │
│  Routes: /api/users, /api/social, /api/auth                │
└──────────────────┬────────────────────┬────────────────────┘
                   │ SQLite/Postgres    │ WebSocket (Port 5001)
                   ↓                    ↓
          ┌─────────────────┐  ┌──────────────────┐
          │  Database       │  │  Live Updates    │
          │  (users,        │  │  (inbox messages,│
          │   events,       │  │   notifications) │
          │   messages)     │  │                  │
          └─────────────────┘  └──────────────────┘
```

### Data Flow

1. **User Authentication** – Login/register via `/api/auth` endpoints
2. **Event Management** – Create/view/edit events via `/api/users/commitments`
3. **Social Interactions** – Add friends, send meeting invites via `/api/social`
4. **Live Updates** – WebSocket connections broadcast inbox messages and event changes in real-time

## Getting Started

### Prerequisites

- Node.js v20.18.0 or later
- npm or yarn
- Docker & Docker Compose (for containerized development)

### Local Development (Node)

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd my-app
   npm install
   ```

2. **Start the backend:**
   ```bash
   cd backend
   node server.js
   ```
   The backend runs on `http://localhost:5000`

3. **In a separate terminal, start the frontend:**
   ```bash
   npm start
   ```
   The frontend runs on `http://localhost:3000`

4. **Open your browser** and navigate to `http://localhost:3000`

### Local Development (Docker)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - Backend WebSocket: `ws://localhost:5001`

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
# Backend
PORT=5000
WEBSOCKET_PORT=5001
DB_PATH=./users.db
CORS_ORIGINS=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5001
```

## API Endpoints

### Authentication
- `POST /api/auth/login` – User login
- `POST /api/auth/register` – User registration

### Users
- `GET /api/users/:id` – Get user profile
- `GET /api/users/:id/commitments` – Get user events
- `POST /api/users/:id/commitments` – Create event
- `PUT /api/users/commitments/:id` – Update event
- `DELETE /api/users/commitments/:id` – Delete event

### Social
- `POST /api/social/friends` – Add friend
- `GET /api/social/friends/:id` – Get user's friends
- `POST /api/social/invites` – Send meeting invite
- `GET /api/social/inbox/:id` – Get user's inbox

## Deployment on AWS
### ECS Fargate 

1. **Create ECR repositories** for frontend and backend images
2. **Push Docker images:**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t wecal-backend ./backend
   docker tag wecal-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/wecal-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/wecal-backend:latest
   ```

3. **Create ECS Fargate services** for frontend and backend with separate task definitions
4. **Use AWS Secrets Manager** to store sensitive environment variables (DB credentials, API keys)
5. **Set up Application Load Balancer (ALB)** to route traffic to services

### Secrets Management

Use environment variables from AWS Systems Manager Parameter Store or Secrets Manager:

```bash
docker run -e DB_PASSWORD="$(aws secretsmanager get-secret-value --secret-id wecal/db-password --query SecretString --output text)" wecal-backend:latest
```

## Project Structure

```
my-app/
├── backend/
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── socialRoutes.js
│   │   └── userRoutes.js
│   ├── db.js                 # SQLite database initialization
│   ├── server.js             # Express server & REST API
│   ├── websocket.js          # WebSocket server for real-time updates
│   ├── Dockerfile            # Backend container image
│   └── users.db              # SQLite database file
├── src/                       # React components & styles
│   ├── components/
│   ├── styles/
│   ├── App.js
│   ├── index.js
│   └── usercontext.js        # Global user state
├── public/                    # Static assets
├── Dockerfile                 # Frontend container image
├── docker-compose.yml         # Local development setup
├── docker-compose.prod.yml    # Production setup
├── .env.example               # Environment variables template
├── .github/workflows/         # CI/CD pipelines
├── ARCHITECTURE.md            # Detailed architecture docs
├── package.json
└── README.md
```

## Development Workflow

1. **Make changes** to frontend or backend code
2. **If using Docker Compose:** Changes auto-reload with volume mounts
3. **Run tests** (if available):
   ```bash
   npm test
   ```
4. **Build production images:**
   ```bash
   docker build -t wecal-backend:latest ./backend
   docker build -t wecal-frontend:latest .
   ```

## Known Issues & To-Do

- [ ] Fix bug with viewing friends' commitments (commitments passed incorrectly)
- [ ] Convert EventForm, AddFriend, Profile to modal pop-ups
- [ ] Add click-to-edit functionality for events
- [ ] Implement "Invite Friend" option on Event Form
- [ ] Add comprehensive error handling and logging
- [ ] Migrate from SQLite to PostgreSQL for production
