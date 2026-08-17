const express = require('express');
const crypto = require('crypto');

const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

function generateRoomCode() {
  const randomPart = crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase();

  return `CDJ-${randomPart}`;
}

async function createUniqueRoomCode() {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = generateRoomCode();

    const result = await pool.query(
      'SELECT id FROM parties WHERE join_code = $1',
      [roomCode],
    );

    exists = result.rows.length > 0;
  }

  return roomCode;
}

/*
  GET /api/parties
*/
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.genre,
        p.visibility,
        p.permission_level,
        p.join_code,
        p.host_id,
        p.created_at,
        u.username AS host_username
      FROM parties p
      JOIN users u
        ON p.host_id = u.id
      ORDER BY p.created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get parties error:', error);

    return res.status(500).json({
      error: 'Could not retrieve parties.',
    });
  }
});

/*
  POST /api/parties
*/
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description = '',
      genre = '',
      visibility = 'public',
      permissionLevel = 2,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Party name is required.',
      });
    }

    const roomCode = await createUniqueRoomCode();

    const result = await pool.query(
      `
        INSERT INTO parties (
          name,
          description,
          genre,
          visibility,
          permission_level,
          join_code,
          host_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          name,
          description,
          genre,
          visibility,
          permission_level,
          join_code,
          host_id,
          created_at
      `,
      [
        name.trim(),
        description.trim(),
        genre,
        visibility,
        Number(permissionLevel),
        roomCode,
        req.user.id,
      ],
    );

    const party = result.rows[0];

    return res.status(201).json({
      ...party,
      roomCode: party.join_code,
      permissionLevel: party.permission_level,
    });
  } catch (error) {
    console.error('Create party error:', error);

    return res.status(500).json({
      error: 'Could not create party.',
    });
  }
});

/*
  PATCH /api/parties/:id/current-song
*/
router.patch(
  '/:id/current-song',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        songId,
        playbackStatus = 'playing',
      } = req.body;

      const partyResult = await pool.query(
        `
          SELECT host_id
          FROM parties
          WHERE id = $1
        `,
        [req.params.id],
      );

      if (partyResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Party not found.',
        });
      }

      if (
        Number(partyResult.rows[0].host_id) !==
        Number(req.user.id)
      ) {
        return res.status(403).json({
          error:
            'Only the host can change the current song.',
        });
      }

      if (songId) {
        const songResult = await pool.query(
          `
            SELECT id
            FROM songs
            WHERE id = $1
              AND party_id = $2
          `,
          [songId, req.params.id],
        );

        if (songResult.rows.length === 0) {
          return res.status(400).json({
            error:
              'The selected song is not in this party.',
          });
        }
      }

      const result = await pool.query(
        `
          UPDATE parties
          SET
            current_song_id = $1,
            playback_status = $2
          WHERE id = $3
          RETURNING *
        `,
        [
          songId || null,
          playbackStatus,
          req.params.id,
        ],
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(
        'Update current song error:',
        error,
      );

      return res.status(500).json({
        error:
          'Could not update the current song.',
      });
    }
  },
);

/*
  PATCH /api/parties/:id/skip

  Skips the current song and deletes it from PostgreSQL.
*/
router.patch(
  '/:id/skip',
  authenticateToken,
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const partyId = Number(req.params.id);

      if (!Number.isInteger(partyId)) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          error: 'Invalid party ID.',
        });
      }

      const partyResult = await client.query(
        `
          SELECT
            id,
            host_id,
            current_song_id
          FROM parties
          WHERE id = $1
          FOR UPDATE
        `,
        [partyId],
      );

      if (partyResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Party not found.',
        });
      }

      const party = partyResult.rows[0];

      if (
        Number(party.host_id) !==
        Number(req.user.id)
      ) {
        await client.query('ROLLBACK');

        return res.status(403).json({
          error:
            'Only the host can skip songs.',
        });
      }

      const skippedSongId =
        party.current_song_id;

      if (!skippedSongId) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          error:
            'There is no current song to skip.',
        });
      }

      const nextSongResult = await client.query(
        `
          SELECT *
          FROM songs
          WHERE party_id = $1
            AND id <> $2
          ORDER BY
            CASE
              WHEN id > $2 THEN 0
              ELSE 1
            END,
            id ASC
          LIMIT 1
        `,
        [partyId, skippedSongId],
      );

      const nextSong =
        nextSongResult.rows[0] || null;

      await client.query(
        `
          UPDATE parties
          SET
            current_song_id = $1,
            playback_status = $2
          WHERE id = $3
        `,
        [
          nextSong?.id || null,
          nextSong ? 'playing' : 'paused',
          partyId,
        ],
      );

      const deleteResult = await client.query(
        `
          DELETE FROM songs
          WHERE id = $1
            AND party_id = $2
          RETURNING *
        `,
        [skippedSongId, partyId],
      );

      if (deleteResult.rows.length === 0) {
        throw new Error(
          'The skipped song could not be found.',
        );
      }

      await client.query('COMMIT');

      return res.json({
        message:
          'Song skipped and deleted successfully.',
        deletedSongId: skippedSongId,
        currentSong: nextSong,
        playbackStatus: nextSong
          ? 'playing'
          : 'paused',
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error('Skip song error:', error);

      return res.status(500).json({
        error:
          'Could not skip and delete the song.',
      });
    } finally {
      client.release();
    }
  },
);

/*
  GET /api/parties/code/:roomCode
*/
router.get('/code/:roomCode', async (req, res) => {
  try {
    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.genre,
          p.visibility,
          p.permission_level,
          p.join_code,
          p.host_id,
          p.created_at,
          u.username AS host_username
        FROM parties p
        JOIN users u
          ON p.host_id = u.id
        WHERE UPPER(p.join_code) = $1
      `,
      [roomCode],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          'Party not found. Check the room code.',
      });
    }

    const party = result.rows[0];

    return res.json({
      ...party,
      roomCode: party.join_code,
      permissionLevel:
        party.permission_level,
      hostUsername:
        party.host_username,
    });
  } catch (error) {
    console.error('Join party error:', error);

    return res.status(500).json({
      error: 'Could not join party.',
    });
  }
});

/*
  GET /api/parties/:id
*/
router.get('/:id', async (req, res) => {
  try {
    const partyResult = await pool.query(
      `
        SELECT
          p.*,
          u.username AS host_username,
          s.id AS selected_song_id,
          s.title AS current_song_title,
          s.artist AS current_song_artist
        FROM parties p
        JOIN users u
          ON p.host_id = u.id
        LEFT JOIN songs s
          ON p.current_song_id = s.id
        WHERE p.id = $1
      `,
      [req.params.id],
    );

    if (partyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Party not found.',
      });
    }

    const songsResult = await pool.query(
      `
        SELECT *
        FROM songs
        WHERE party_id = $1
        ORDER BY id ASC
      `,
      [req.params.id],
    );

    const party = partyResult.rows[0];

    return res.json({
      ...party,
      roomCode: party.join_code,
      permissionLevel:
        party.permission_level,
      hostUsername:
        party.host_username,
      currentSong: party.selected_song_id
        ? {
            id: party.selected_song_id,
            title:
              party.current_song_title,
            artist:
              party.current_song_artist,
          }
        : null,
      playbackStatus:
        party.playback_status,
      songs: songsResult.rows,
    });
  } catch (error) {
    console.error('Get party error:', error);

    return res.status(500).json({
      error:
        'Could not retrieve the party.',
    });
  }
});

/*
  DELETE /api/parties/:id
*/
router.delete(
  '/:id',
  authenticateToken,
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const partyResult = await client.query(
        `
          SELECT host_id
          FROM parties
          WHERE id = $1
          FOR UPDATE
        `,
        [req.params.id],
      );

      if (partyResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Party not found.',
        });
      }

      if (
        Number(partyResult.rows[0].host_id) !==
        Number(req.user.id)
      ) {
        await client.query('ROLLBACK');

        return res.status(403).json({
          error:
            'Only the host can delete this party.',
        });
      }

      await client.query(
        `
          UPDATE parties
          SET current_song_id = NULL
          WHERE id = $1
        `,
        [req.params.id],
      );

      await client.query(
        `
          DELETE FROM songs
          WHERE party_id = $1
        `,
        [req.params.id],
      );

      await client.query(
        `
          DELETE FROM parties
          WHERE id = $1
        `,
        [req.params.id],
      );

      await client.query('COMMIT');

      return res.json({
        message:
          'Party deleted successfully.',
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error(
        'Delete party error:',
        error,
      );

      return res.status(500).json({
        error:
          'Could not delete the party.',
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;