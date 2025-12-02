# WeCal Architecture Guide

## System Overview

WeCal is a three-tier application:
- **Presentation Layer**: React frontend (Port 3000)
- **Application Layer**: Node.js/Express REST API (Port 5000) + WebSocket Server
- **Data Layer**: SQLite database with schema for users, events, friends, and messages

## Directory Structure

```
backend/
├── server.js              # Express server, routes initialization, HTTP server setup
├── websocket.js           # WebSocket server for real-time updates
├── db.js                  # SQLite database schema and initialization
├── routes/
│   ├── authRoutes.js      # POST /login, /register
│   ├── userRoutes.js      # User profile, commitments (events) CRUD
│   └── socialRoutes.js    # Friends, meeting invites, inbox operations
└── Dockerfile             # Container configuration

src/ (React)
├── App.js                 # Main React component
├── usercontext.js         # Global user state context
├── webSocketListener.js   # WebSocket connection handler
├── components/
│   ├── header.js
│   ├── calendar.js        # Event calendar display
│   ├── eventForm.js       # Create/edit event form
│   ├── eventMenu.js       # Event actions menu
│   ├── inbox.js           # Message inbox
│   ├── addFriend.js       # Add friend form
│   ├── profile.js         # User profile
│   └── ...
└── styles/
    ├── calendar.css
    ├── form.css
    └── ...
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
)
```

### Commitments Table (Events)
```sql
CREATE TABLE commitments (
    commitment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    days TEXT NOT NULL,        -- JSON array of day numbers
    dates TEXT NOT NULL,       -- JSON array of specific dates
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### Friends Table
```sql
CREATE TABLE friends (
    user1_id INTEGER,
    user2_id INTEGER,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    PRIMARY KEY (user1_id, user2_id)
)
```

### Inbox Table (Messages)
```sql
CREATE TABLE inbox (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER,
    sender_id INTEGER,
    status TEXT DEFAULT 'unread',
    type TEXT CHECK(type IN ('friend_request', 'message', 'meeting_request')),
    content TEXT,
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
)
```

### Meeting Invites Table
```sql
CREATE TABLE meeting_invites (
    owner_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    commitment_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    PRIMARY KEY (member_id, owner_id),
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
)
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` – Authenticate user
  - Request: `{ username, password }`
  - Response: `{ userId, username, email }`
- `POST /register` – Create new user
  - Request: `{ username, password, email }`
  - Response: `{ userId, username, email }`

### Users (`/api/users`)
- `GET /:id` – Get user profile
- `GET /:id/commitments` – Get all user events
- `POST /:id/commitments` – Create new event
  - Request: `{ name, startTime, endTime, days, dates }`
- `PUT /commitments/:id` – Update event
- `DELETE /commitments/:id` – Delete event

### Social (`/api/social`)
- `POST /friends` – Send friend request
  - Request: `{ userId, friendId }`
- `GET /friends/:id` – Get user's friends
- `POST /invites` – Send meeting invite
  - Request: `{ sender, recipient, commitment }`
- `GET /invites/:id` – Get meeting invites
- `GET /inbox/:id` – Get user inbox messages

## WebSocket Communication

### Connection Flow

1. **Client connects**: Browser establishes WebSocket connection to `ws://localhost:5001`
2. **Login message**: After authentication, client sends:
   ```json
   {
     "type": "login",
     "id": 123
   }
   ```
3. **Server registers**: Server maps client ID to WebSocket connection in `clientMap`
4. **Receive updates**: Server broadcasts messages to specific users

### Message Types

#### Friend Request Notification
```json
{
  "type": "friend_request",
  "sender_id": 1,
  "sender_name": "Alice",
  "content": "wants to be your friend"
}
```

#### Event Invitation
```json
{
  "type": "meeting_request",
  "sender_id": 1,
  "sender_name": "Alice",
  "event_name": "Team Standup",
  "time": "10:00 AM - 10:30 AM",
  "content": "invited you to Team Standup"
}
```

#### Inbox Message
```json
{
  "type": "message",
  "sender_id": 1,
  "sender_name": "Alice",
  "content": "Hey, are you available tomorrow?"
}
```

## Data Flow Examples

### Example 1: Creating an Event

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User fills EventForm and clicks "Create"                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. React sends POST /api/users/123/commitments             │
│    { name, startTime, endTime, days, dates }               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend inserts into commitments table                  │
│    with user_id = 123                                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend returns { commitment_id, ... }                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. React updates userContext with new commitment           │
│    and re-renders calendar                                  │
└─────────────────────────────────────────────────────────────┘
```

### Example 2: Sending a Friend Request via WebSocket

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Add Friend" and submits form               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. React sends POST /api/social/friends                    │
│    { sender: 123, recipient: 456 }                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend inserts into inbox table                        │
│    type = 'friend_request', recipient_id = 456             │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend sends WebSocket message to recipient            │
│    via clientMap.get(456)                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Recipient's frontend receives notification               │
│    in webSocketListener, updates inbox UI                   │
└─────────────────────────────────────────────────────────────┘
```

### Example 3: Inviting a Friend to an Event

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User creates event and clicks "Invite Friend"           │
│    (to be implemented)                                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. React sends POST /api/social/invites                    │
│    { sender: 123, commitment_id: 789, recipient: 456 }     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend inserts into meeting_invites and inbox          │
│    Creates inbox entry with type = 'meeting_request'       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend sends WebSocket notification to recipient       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Recipient sees event in their calendar (if accepted)    │
│    or in their inbox as pending invitation                 │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### React Context (usercontext.js)

The global user state includes:
- `userId` – Logged-in user ID
- `username` – Username
- `friends` – Array of friend user objects
- `inbox` – Array of messages/notifications
- `commitments` – Array of user's events
- `friendCommitments` – Friends' events (for calendar sharing)

### WebSocket Real-time Updates

The `webSocketListener.js` component:
1. Connects to WebSocket on mount
2. Sends `{ type: 'login', id: userId }` to register
3. Listens for incoming messages
4. Updates userContext when notifications arrive
5. Triggers re-renders via React state hooks

## Performance Considerations

1. **Event Filtering**: Calendar displays events from `userContext.commitments` and `friendCommitments`
2. **Friend Visibility**: Users can see friends' events only if friends are added
3. **Database Indexing**: Consider indexing `user_id` on commitments table for faster queries
4. **WebSocket Scalability**: Current implementation uses in-memory `clientMap`; for production, consider Redis

## Security Considerations

1. **Authentication**: Currently basic (username/password); consider JWT tokens
2. **CORS**: Configured via environment variables
3. **SQL Injection**: Use parameterized queries (check route handlers)
4. **WebSocket Auth**: Validate user ID before accepting messages
5. **Data Privacy**: Friends can only see each other's events if mutually connected

## Future Enhancements

- [ ] Token-based authentication (JWT)
- [ ] Event sharing with non-friend users
- [ ] Event comments and activity feeds
- [ ] Notification preferences (email, push)
- [ ] Database migration to PostgreSQL
- [ ] Redis for scaling WebSocket connections
- [ ] Message encryption
- [ ] Rate limiting on API endpoints
