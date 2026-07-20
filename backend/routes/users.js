const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, email, favorite_genres, created_at
       FROM users
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const userId = Number(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({
      error: "You can only edit your own profile"
    });
  }

  const { displayName, favoriteGenres } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           favorite_genres = COALESCE($2, favorite_genres)
       WHERE id = $3
       RETURNING id, username, display_name, email, favorite_genres, created_at`,
      [displayName ?? null, favoriteGenres ?? null, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Could not update user" });
  }
});

router.get("/:id/parties", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM parties
       WHERE host_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get user parties error:", error);
    res.status(500).json({ error: "Could not retrieve parties" });
  }
});

router.get("/:id/songs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT songs.*, parties.name AS party_name
       FROM songs
       JOIN parties ON parties.id = songs.party_id
       WHERE songs.submitted_by = $1
       ORDER BY songs.submitted_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get user songs error:", error);
    res.status(500).json({ error: "Could not retrieve songs" });
  }
});

module.exports = router;
