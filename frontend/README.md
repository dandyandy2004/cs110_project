# Crowd DJ frontend

Crowd DJ is a collaborative music-room interface where a host and guests build a shared queue. This folder contains the frontend only. Authentication, party joining, playback, favorites, and song-provider behavior are intentionally mocked so a separate Node/Express/PostgreSQL backend can be connected later.

## Technology

- React and Vite
- React Router
- JavaScript
- Plain CSS with light and evening themes
- React Context for auth, party, music, and theme state

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Create a local `.env` from `.env.example` if the future backend uses a different address. `VITE_API_BASE_URL` defaults to `http://localhost:3000/api`.

For a production compilation check, run `npm run build`.

## Routes

- `/` redirects to `/home`
- `/home` is public and supports guest browsing and room-code joining
- `/login` contains mock login and signup modes
- `/profile` requires mock authentication
- `/create-party` requires mock authentication

## Current behavior

Guests can open the home page, see the current song and queue, browse recommendations, and join any non-empty room code. Mock login accepts any non-empty username/email and password. Signup requires a username, a basically valid email, and a password. No credentials leave the browser.

Creating a party generates a local room code and supports three permission levels:

1. **Host only** — guests can listen and browse.
2. **Guests can queue** — guests can add and favorite songs, but cannot control playback.
3. **Guests can queue + play** — guests can add songs, favorite songs, and control playback.

The host always has full frontend controls. These UI checks are not a security boundary; the backend must enforce the same rules.

Song data and album covers are placeholders. No real provider or audio stream is connected. Add a future provider in `src/services/musicService.js`, keeping the existing provider-neutral song shape. Add future REST requests in `src/services/api.js`; components should not make scattered network calls directly.

Theme selection and the current mock auth/party are saved in browser `localStorage`. Favorite and playback state are session-only. Avatar selection uses a local preview and is not uploaded.

Backend development is handled separately. Deployment, hosting configuration, databases, real authentication, and provider API credentials are intentionally excluded.
