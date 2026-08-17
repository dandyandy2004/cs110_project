const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/song/:songId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          comments.*,
          users.display_name,
          users.username
       FROM comments
       JOIN users ON users.id = comments.user_id
       WHERE comments.song_id = $1
       ORDER BY comments.created_at ASC`,
      [req.params.songId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Could not retrieve comments" });
  }
});

router.post("/song/:songId", authenticateToken, async (req, res) => {
  const { commentText } = req.body;

  if (!commentText || !commentText.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (song_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.songId, req.user.id, commentText.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create comment error:", error);

    if (error.code === "23503") {
      return res.status(404).json({ error: "Song not found" });
    }

    res.status(500).json({ error: "Could not create comment" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM comments
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: "Comment not found or you do not own it"
      });
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Could not delete comment" });
  }
});

module.exports = router;
