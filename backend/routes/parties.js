const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

function makeJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

router.get("/search", async (req, res) => {
  const searchTerm = req.query.q || "";

  try {
    const result = await pool.query(
      `SELECT parties.*, users.display_name AS host_name
       FROM parties
       JOIN users ON users.id = parties.host_id
       WHERE parties.name ILIKE $1
          OR parties.genre ILIKE $1
          OR parties.description ILIKE $1
          OR users.display_name ILIKE $1
       ORDER BY parties.created_at DESC`,
      [`%${searchTerm}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Search parties error:", error);
    res.status(500).json({ error: "Could not search parties" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT parties.*, users.display_name AS host_name
       FROM parties
       JOIN users ON users.id = parties.host_id
       ORDER BY parties.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get parties error:", error);
    res.status(500).json({ error: "Could not retrieve parties" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const partyResult = await pool.query(
      `SELECT parties.*, users.display_name AS host_name
       FROM parties
       JOIN users ON users.id = parties.host_id
       WHERE parties.id = $1`,
      [req.params.id]
    );

    if (partyResult.rows.length === 0) {
      return res.status(404).json({ error: "Party not found" });
    }

    const songsResult = await pool.query(
      `SELECT
          songs.*,
          users.display_name AS submitted_by_name,
          COALESCE(SUM(votes.vote_value), 0)::INTEGER AS vote_score
       FROM songs
       LEFT JOIN users ON users.id = songs.submitted_by
       LEFT JOIN votes ON votes.song_id = songs.id
       WHERE songs.party_id = $1
       GROUP BY songs.id, users.display_name
       ORDER BY vote_score DESC, songs.submitted_at ASC`,
      [req.params.id]
    );

    res.json({
      party: partyResult.rows[0],
      songs: songsResult.rows
    });
  } catch (error) {
    console.error("Get party error:", error);
    res.status(500).json({ error: "Could not retrieve party" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { name, description, genre } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Party name is required" });
  }

  try {
    let result;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = makeJoinCode();

      try {
        result = await pool.query(
          `INSERT INTO parties
            (host_id, name, description, genre, join_code)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [req.user.id, name, description || null, genre || null, joinCode]
        );
        break;
      } catch (error) {
        if (error.code !== "23505") {
          throw error;
        }
      }
    }

    if (!result) {
      return res.status(500).json({ error: "Could not generate join code" });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create party error:", error);
    res.status(500).json({ error: "Could not create party" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { name, description, genre } = req.body;

  try {
    const ownerResult = await pool.query(
      "SELECT host_id FROM parties WHERE id = $1",
      [req.params.id]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ error: "Party not found" });
    }

    if (ownerResult.rows[0].host_id !== req.user.id) {
      return res.status(403).json({
        error: "Only the party host can edit this party"
      });
    }

    const result = await pool.query(
      `UPDATE parties
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           genre = COALESCE($3, genre)
       WHERE id = $4
       RETURNING *`,
      [name ?? null, description ?? null, genre ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update party error:", error);
    res.status(500).json({ error: "Could not update party" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM parties
       WHERE id = $1 AND host_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: "Party not found or you are not the host"
      });
    }

    res.json({ message: "Party deleted" });
  } catch (error) {
    console.error("Delete party error:", error);
    res.status(500).json({ error: "Could not delete party" });
  }
});

module.exports = router;
