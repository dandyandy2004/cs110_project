# Backend Setup Guide

How to install and run the backend for the collaborative party music application.

The backend uses:

- Node.js
- Express
- PostgreSQL
- pgAdmin 4
- JSON Web Tokens
- bcrypt
- The iTunes Search API


When you are done with the installation. Remember to have both the frontend and backend both running on seperate terminals: npm run dev


---

## 1. Install the required software

### Node.js

Download the current Long-Term Support version of Node.js:

https://nodejs.org/


### PostgreSQL

Download PostgreSQL from the official website:

https://www.postgresql.org/download/


During installation:

1. Keep PostgreSQL Server selected.
2. Keep the command-line tools selected.
3. Install pgAdmin 4 when the installer offers it.
4. Create a password for the `postgres` database user.
5. Save that password because the backend will need it.
6. Keep the default PostgreSQL port as `5432`.


## 2. Open the backend folder

Clone the repository:

```bash
git clone https://github.com/dandyandy2004/cs110_project/tree/main
```

Move into the backend folder:

```bash
cd cs110_project/backend
```

Install the project dependencies:

```bash
npm install
```
---

## 3. Open pgAdmin

1. Open **pgAdmin 4**.
2. Enter the pgAdmin master password if requested.
3. In the left sidebar, expand **Servers**.
4. Expand the PostgreSQL server created during installation.
5. Enter the password created for the `postgres` user.
6. Expand **Databases**.

If no server appears:

1. Right-click **Servers**.
2. Select **Register → Server**.
3. Under the **General** tab, enter:

```text
Local PostgreSQL
```

4. Open the **Connection** tab.
5. Enter:

```text
Host name/address: localhost
Port: 5432
Maintenance database: postgres
Username: postgres
Password: your PostgreSQL password
```

6. Enable **Save password**.
7. Click **Save**.

---

## 4. Create the database

In pgAdmin:

1. Right-click **Databases**.
2. Select **Create → Database**.
3. Enter:

```text
party_music
```

4. Leave the owner as `postgres`.
5. Click **Save**.

You should now see `party_music` underneath **Databases**.

---

## 5. Open the Query Tool

1. Click the `party_music` database.
2. Right-click it.
3. Select **Query Tool**.
4. Paste the SQL script from the next section.
5. Press the Execute button, which looks like a play icon.
6. Wait for the success message.

---

## 6. Create all database tables

Run this entire script in the pgAdmin Query Tool:

```sql
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS party_members CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    host_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    room_code VARCHAR(20) NOT NULL UNIQUE,
    playback_status VARCHAR(20) NOT NULL DEFAULT 'paused'
        CHECK (playback_status IN ('playing', 'paused')),
    current_song_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE party_members (
    id SERIAL PRIMARY KEY,
    party_id INTEGER NOT NULL
        REFERENCES parties(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (party_id, user_id)
);

CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    party_id INTEGER NOT NULL
        REFERENCES parties(id)
        ON DELETE CASCADE,
    submitted_by INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    song_url TEXT,
    genre VARCHAR(100),
    image_url TEXT,
    preview_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE parties
ADD CONSTRAINT parties_current_song_id_fkey
FOREIGN KEY (current_song_id)
REFERENCES songs(id)
ON DELETE SET NULL;

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    song_id INTEGER NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    vote_value INTEGER NOT NULL
        CHECK (vote_value IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (song_id, user_id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    song_id INTEGER NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    content TEXT NOT NULL
        CHECK (LENGTH(TRIM(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parties_room_code
ON parties(room_code);

CREATE INDEX idx_parties_host_id
ON parties(host_id);

CREATE INDEX idx_party_members_party_id
ON party_members(party_id);

CREATE INDEX idx_party_members_user_id
ON party_members(user_id);

CREATE INDEX idx_songs_party_id
ON songs(party_id);

CREATE INDEX idx_songs_submitted_by
ON songs(submitted_by);

CREATE INDEX idx_votes_song_id
ON votes(song_id);

CREATE INDEX idx_votes_user_id
ON votes(user_id);

CREATE INDEX idx_comments_song_id
ON comments(song_id);

CREATE INDEX idx_comments_user_id
ON comments(user_id);
```

> Warning: this script deletes existing application tables before recreating them. Do not run it if the database contains information you need to keep.

---

## 7. Update an older database without deleting it. Skip if you just created a database.

Use these queries only when the database already exists.

Add artwork and preview columns:

```sql
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE songs
ADD COLUMN IF NOT EXISTS preview_url TEXT;
```

Add playback status if it is missing:

```sql
ALTER TABLE parties
ADD COLUMN IF NOT EXISTS playback_status VARCHAR(20)
NOT NULL DEFAULT 'paused';
```

Add the current song column if it is missing:

```sql
ALTER TABLE parties
ADD COLUMN IF NOT EXISTS current_song_id INTEGER;
```

Recreate the current-song foreign key:

```sql
ALTER TABLE parties
DROP CONSTRAINT IF EXISTS parties_current_song_id_fkey;

ALTER TABLE parties
ADD CONSTRAINT parties_current_song_id_fkey
FOREIGN KEY (current_song_id)
REFERENCES songs(id)
ON DELETE SET NULL;
```

---


## 8. Create the environment file

Inside the `backend` folder, create a file named:

```text
.env
```

Add:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/party_music
JWT_SECRET=replace_this_with_a_long_random_secret
```

Replace:

```text
YOUR_POSTGRES_PASSWORD
```

with the password created during PostgreSQL installation.

Do not upload `.env` to GitHub.

Add this to `.gitignore`:

```gitignore
node_modules/
.env
```

---


## 9. Start the backend

From the backend folder, run:

```bash
npm run dev
```


The backend  runs at:

```text
http://localhost:3001
```

---



## 10. Useful pgAdmin queries  - Just use these when you want to check on the database.

### View all users

```sql
SELECT *
FROM users
ORDER BY created_at DESC;
```

### View all parties

```sql
SELECT *
FROM parties
ORDER BY created_at DESC;
```

### View all songs

```sql
SELECT *
FROM songs
ORDER BY submitted_at DESC;
```

### View songs with the submitter's name

```sql
SELECT
    songs.id,
    songs.title,
    songs.artist,
    songs.image_url,
    songs.preview_url,
    users.display_name AS submitted_by,
    songs.submitted_at
FROM songs
JOIN users
    ON users.id = songs.submitted_by
ORDER BY songs.submitted_at DESC;
```

### View songs in party 1

Replace `1` with the desired party ID.

```sql
SELECT *
FROM songs
WHERE party_id = 1
ORDER BY submitted_at ASC;
```

### View the current song for party 1

```sql
SELECT
    parties.id AS party_id,
    parties.name AS party_name,
    parties.playback_status,
    songs.id AS song_id,
    songs.title,
    songs.artist
FROM parties
LEFT JOIN songs
    ON songs.id = parties.current_song_id
WHERE parties.id = 1;
```


### View all party members

```sql
SELECT
    parties.name AS party_name,
    users.display_name,
    users.email,
    party_members.joined_at
FROM party_members
JOIN parties
    ON parties.id = party_members.party_id
JOIN users
    ON users.id = party_members.user_id
ORDER BY party_members.joined_at ASC;
```

---

## 11. Safely clear test data

Clear every party's current-song reference before manually deleting songs:

```sql
UPDATE parties
SET current_song_id = NULL,
    playback_status = 'paused';
```

Delete every song:

```sql
DELETE FROM songs;
```

Delete every vote:

```sql
DELETE FROM votes;
```

Delete every comment:

```sql
DELETE FROM comments;
```

Delete every party member:

```sql
DELETE FROM party_members;
```

Delete every party:

```sql
DELETE FROM parties;
```

Delete every user:

```sql
DELETE FROM users;
```
---

## 12. Common errors


### Invalid or expired token

Log in again to receive a new JWT token.

When switching from `localStorage` to `sessionStorage`, clear the old browser values:

```js
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---



