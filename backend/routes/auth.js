const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, displayName, email, password, favoriteGenres } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "username, email, and password are required"
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Username or email is already in use"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
  `INSERT INTO users
   (username, display_name, email, password_hash, favorite_genres)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, username, display_name, email, favorite_genres, created_at`,
  [
    username,
    displayName || username,
    email,
    passwordHash,
    Array.isArray(favoriteGenres) ? favoriteGenres : []
  ]
);

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(201).json({ token, user });
    } catch (error) {
    console.error("Register error:");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Detail:", error.detail);
    console.error("Code:", error.code);

    res.status(500).json({
      error: error.message,
      detail: error.detail
    });
  }
}); // <-- THIS closes router.post("/register")

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "email and password are required"
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        favorite_genres: user.favorite_genres
      }
    });
} catch (error) {
  console.error("Login error:");
  console.error(error);
  console.error(error.message);
  console.error(error.detail);

  res.status(500).json({
    error: error.message
  });
}
});

module.exports = router;
