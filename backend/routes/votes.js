const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.post("/song/:songId", authenticateToken, async (req, res) => {
  const voteValue = Number(req.body.voteValue);

  if (![1, -1].includes(voteValue)) {
    return res.status(400).json({
      error: "voteValue must be 1 for upvote or -1 for downvote"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO votes (user_id, song_id, vote_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id)
       DO UPDATE SET
         vote_value = EXCLUDED.vote_value,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, req.params.songId, voteValue]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Vote error:", error);

    if (error.code === "23503") {
      return res.status(404).json({ error: "Song not found" });
    }

    res.status(500).json({ error: "Could not save vote" });
  }
});

router.delete("/song/:songId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM votes
       WHERE user_id = $1 AND song_id = $2
       RETURNING id`,
      [req.user.id, req.params.songId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vote not found" });
    }

    res.json({ message: "Vote removed" });
  } catch (error) {
    console.error("Delete vote error:", error);
    res.status(500).json({ error: "Could not remove vote" });
  }
});

module.exports = router;
