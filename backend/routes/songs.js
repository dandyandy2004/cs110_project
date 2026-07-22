const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/*
  GET /api/songs/party/:partyId

  Returns all songs for a party, including artwork,
  preview audio, submitter name, and vote score.
*/
router.get('/party/:partyId', async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          songs.*,
          users.display_name AS submitted_by_name,
          COALESCE(
            SUM(votes.vote_value),
            0
          )::INTEGER AS vote_score
        FROM songs
        LEFT JOIN users
          ON users.id = songs.submitted_by
        LEFT JOIN votes
          ON votes.song_id = songs.id
        WHERE songs.party_id = $1
        GROUP BY
          songs.id,
          users.display_name
        ORDER BY
          vote_score DESC,
          songs.submitted_at ASC
      `,
      [req.params.partyId],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get songs error:', error);

    return res.status(500).json({
      error: 'Could not retrieve songs',
    });
  }
});

/*
  GET /api/songs/:id
*/
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          songs.*,
          COALESCE(
            SUM(votes.vote_value),
            0
          )::INTEGER AS vote_score
        FROM songs
        LEFT JOIN votes
          ON votes.song_id = songs.id
        WHERE songs.id = $1
        GROUP BY songs.id
      `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Song not found',
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get song error:', error);

    return res.status(500).json({
      error: 'Could not retrieve song',
    });
  }
});

/*
  POST /api/songs/party/:partyId

  Adds an iTunes song to a party queue.
*/
router.post(
  '/party/:partyId',
  authenticateToken,
  async (req, res) => {
    const {
      title,
      artist,
      songUrl,
      previewUrl,
      imageUrl,
      genre,
    } = req.body;

    if (!title?.trim() || !artist?.trim()) {
      return res.status(400).json({
        error: 'Song title and artist are required',
      });
    }

    try {
      const partyResult = await pool.query(
        `
          SELECT id
          FROM parties
          WHERE id = $1
        `,
        [req.params.partyId],
      );

      if (partyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Party not found',
        });
      }

      const duplicateResult = await pool.query(
        `
          SELECT id
          FROM songs
          WHERE party_id = $1
            AND LOWER(title) = LOWER($2)
            AND LOWER(artist) = LOWER($3)
        `,
        [
          req.params.partyId,
          title.trim(),
          artist.trim(),
        ],
      );

      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          error:
            'This song has already been submitted to the party',
        });
      }

      /*
        song_url is kept for compatibility with your
        existing database.

        preview_url stores the iTunes preview explicitly.
      */
      const audioUrl =
        previewUrl || songUrl || null;

      const result = await pool.query(
        `
          INSERT INTO songs (
            party_id,
            submitted_by,
            title,
            artist,
            song_url,
            genre,
            image_url,
            preview_url
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          RETURNING *
        `,
        [
          req.params.partyId,
          req.user.id,
          title.trim(),
          artist.trim(),
          audioUrl,
          genre || null,
          imageUrl || null,
          audioUrl,
        ],
      );

      return res.status(201).json(
        result.rows[0],
      );
    } catch (error) {
      console.error('Create song error:', error);

      if (error.code === '23503') {
        return res.status(404).json({
          error: 'Party not found',
        });
      }

      return res.status(500).json({
        error: 'Could not submit song',
      });
    }
  },
);

/*
  PUT /api/songs/:id
*/
router.put(
  '/:id',
  authenticateToken,
  async (req, res) => {
    const {
      title,
      artist,
      songUrl,
      previewUrl,
      imageUrl,
      genre,
    } = req.body;

    try {
      const songResult = await pool.query(
        `
          SELECT submitted_by
          FROM songs
          WHERE id = $1
        `,
        [req.params.id],
      );

      if (songResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Song not found',
        });
      }

      if (
        Number(songResult.rows[0].submitted_by) !==
        Number(req.user.id)
      ) {
        return res.status(403).json({
          error:
            'You can only edit songs you submitted',
        });
      }

      const audioUrl =
        previewUrl ?? songUrl ?? null;

      const result = await pool.query(
        `
          UPDATE songs
          SET
            title = COALESCE($1, title),
            artist = COALESCE($2, artist),
            song_url = COALESCE($3, song_url),
            genre = COALESCE($4, genre),
            image_url = COALESCE($5, image_url),
            preview_url = COALESCE(
              $6,
              preview_url
            )
          WHERE id = $7
          RETURNING *
        `,
        [
          title ?? null,
          artist ?? null,
          audioUrl,
          genre ?? null,
          imageUrl ?? null,
          audioUrl,
          req.params.id,
        ],
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Update song error:', error);

      return res.status(500).json({
        error: 'Could not update song',
      });
    }
  },
);

/*
  DELETE /api/songs/:id
*/
router.delete(
  '/:id',
  authenticateToken,
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const songResult = await client.query(
        `
          SELECT
            songs.id,
            songs.party_id,
            songs.submitted_by,
            parties.host_id,
            parties.current_song_id
          FROM songs
          JOIN parties
            ON parties.id = songs.party_id
          WHERE songs.id = $1
          FOR UPDATE
        `,
        [req.params.id],
      );

      if (songResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Song not found',
        });
      }

      const song = songResult.rows[0];

      const canDelete =
        Number(song.submitted_by) ===
          Number(req.user.id) ||
        Number(song.host_id) ===
          Number(req.user.id);

      if (!canDelete) {
        await client.query('ROLLBACK');

        return res.status(403).json({
          error:
            'You do not have permission to delete this song',
        });
      }

      /*
        Remove the party reference if this is currently
        playing. This prevents a foreign-key error.
      */
      if (
        Number(song.current_song_id) ===
        Number(song.id)
      ) {
        await client.query(
          `
            UPDATE parties
            SET
              current_song_id = NULL,
              playback_status = 'paused'
            WHERE id = $1
          `,
          [song.party_id],
        );
      }

      await client.query(
        `
          DELETE FROM songs
          WHERE id = $1
        `,
        [req.params.id],
      );

      await client.query('COMMIT');

      return res.json({
        message: 'Song deleted',
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error('Delete song error:', error);

      return res.status(500).json({
        error: 'Could not delete song',
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;