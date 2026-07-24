# cs110_project
# Crowd DJ 🎵

Crowd DJ is a full-stack collaborative music queue application that allows users to create virtual music rooms where participants can search for songs, build a shared queue, and listen together. Each party has a designated host who controls playback, while guests can contribute songs, comment, and participate in the shared music experience. The application combines a modern React frontend with a Node.js/Express backend and a PostgreSQL database to provide a synchronized, real-time party environment.

This repository contains both the frontend and backend source code.

---
### Frontend

The frontend is built with React and Vite and provides the complete user interface for the application. Users can:

- Register and log in
- Create or join parties using room codes
- Browse recommended songs
- Add songs to the shared queue
- View album artwork
- Listen to song previews
- Control playback (host only)

Detailed frontend setup instructions are available in:

```
frontend/README.md
```

---

### Backend

The backend is built using Node.js, Express, and PostgreSQL.

It provides REST API endpoints for:

- User authentication
- Party management
- Song queue management
- Playback synchronization
- Voting
- Comments
- Music search

The backend also manages the PostgreSQL database and communicates with the iTunes Search API to retrieve song metadata and preview URLs.

Detailed installation instructions—including PostgreSQL installation, pgAdmin configuration, database creation, SQL schema, environment variables, and troubleshooting—are available in:

```
backend/README.md
```

---

## Technologies Used

### Frontend

- React
- Vite
- React Router
- Context API
- JavaScript
- CSS

### Backend

- Node.js
- Express
- PostgreSQL
- pg
- bcrypt
- JSON Web Tokens (JWT)
- dotenv

### External Services

- iTunes Search API

## Running the Project


### Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on:

```
http://localhost:3001
```

---

### Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```
http://localhost:5173
```
