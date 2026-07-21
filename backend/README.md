# Party Music Backend

## 1. Install PostgreSQL and create the database

```sql
CREATE DATABASE party_music;
```

## 2. Create `.env`

Copy `.env.example` to `.env` and enter your PostgreSQL password.

## 3. Install packages

```bash
npm install
```

## 4. Create tables

```bash
psql -U postgres -d party_music -f database/schema.sql
```

## 5. Start the backend

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3001
```

## 6. Register a user

Send a POST request to:

```text
http://localhost:3001/api/auth/register
```

JSON body:

```json
{
  "username": "andres",
  "displayName": "Andres",
  "email": "andres@example.com",
  "password": "password123",
  "favoriteGenres": ["Pop", "Hip-hop"]
}
```

For protected routes, send this header:

```text
Authorization: Bearer YOUR_TOKEN
```
