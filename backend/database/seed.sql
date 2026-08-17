-- Run this only after registering at least one user through:
-- POST http://localhost:3001/api/auth/register
--
-- Replace the number 1 below if your registered user's id is different.

INSERT INTO parties (host_id, name, description, genre, join_code)
VALUES
  (1, 'Friday Night Mix', 'Songs for our Friday party', 'Pop', 'FRIDAY1'),
  (1, 'Study Session', 'Relaxed music for studying', 'Lo-fi', 'STUDY1');

INSERT INTO songs (party_id, submitted_by, title, artist, song_url, genre)
VALUES
  (1, 1, 'Blinding Lights', 'The Weeknd', NULL, 'Pop'),
  (1, 1, 'Levitating', 'Dua Lipa', NULL, 'Pop'),
  (2, 1, 'Snowman', 'WYS', NULL, 'Lo-fi');

INSERT INTO votes (user_id, song_id, vote_value)
VALUES
  (1, 1, 1),
  (1, 2, -1);

INSERT INTO comments (song_id, user_id, comment_text)
VALUES
  (1, 1, 'This would be a good opening song.');
