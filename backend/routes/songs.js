const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/party/:partyId", async (req, res) => {
  try {
    const result = await pool.query(
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
      [req.params.partyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get songs error:", error);
    res.status(500).json({ error: "Could not retrieve songs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          songs.*,
          COALESCE(SUM(votes.vote_value), 0)::INTEGER AS vote_score
       FROM songs
       LEFT JOIN votes ON votes.song_id = songs.id
       WHERE songs.id = $1
       GROUP BY songs.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Song not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get song error:", error);
    res.status(500).json({ error: "Could not retrieve song" });
  }
});

router.post("/party/:partyId", authenticateToken, async (req, res) => {
  const { title, artist, songUrl, genre } = req.body;

  if (!title || !artist) {
    return res.status(400).json({
      error: "Song title and artist are required"
    });
  }

  try {
    const duplicateResult = await pool.query(
      `SELECT id
       FROM songs
       WHERE party_id = $1
         AND LOWER(title) = LOWER($2)
         AND LOWER(artist) = LOWER($3)`,
      [req.params.partyId, title, artist]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        error: "This song has already been submitted to the party"
      });
    }

    const result = await pool.query(
      `INSERT INTO songs
        (party_id, submitted_by, title, artist, song_url, genre)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.partyId,
        req.user.id,
        title,
        artist,
        songUrl || null,
        genre || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create song error:", error);

    if (error.code === "23503") {
      return res.status(404).json({ error: "Party not found" });
    }

    res.status(500).json({ error: "Could not submit song" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { title, artist, songUrl, genre } = req.body;

  try {
    const songResult = await pool.query(
      "SELECT submitted_by FROM songs WHERE id = $1",
      [req.params.id]
    );

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (songResult.rows[0].submitted_by !== req.user.id) {
      return res.status(403).json({
        error: "You can only edit songs you submitted"
      });
    }

    const result = await pool.query(
      `UPDATE songs
       SET title = COALESCE($1, title),
           artist = COALESCE($2, artist),
           song_url = COALESCE($3, song_url),
           genre = COALESCE($4, genre)
       WHERE id = $5
       RETURNING *`,
      [title ?? null, artist ?? null, songUrl ?? null, genre ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update song error:", error);
    res.status(500).json({ error: "Could not update song" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM songs
       USING parties
       WHERE songs.id = $1
         AND songs.party_id = parties.id
         AND (songs.submitted_by = $2 OR parties.host_id = $2)
       RETURNING songs.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: "Song not found or you do not have permission"
      });
    }

    res.json({ message: "Song deleted" });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({ error: "Could not delete song" });
  }
});

module.exports = router;
