import SongListItem from './SongListItem';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function songsMatch(firstSong, secondSong) {
  return (
    normalizeText(firstSong?.title) ===
      normalizeText(secondSong?.title) &&
    normalizeText(firstSong?.artist) ===
      normalizeText(secondSong?.artist)
  );
}

export default function RecommendedSongs({
  songs,
  queue,
  favoriteIds,
  onFavorite,
  onAddToQueue,
  canQueue,
  canFavorite,
}) {
  return (
    <section
      className="panel list-panel recommendations-panel"
      aria-labelledby="recommendations-title"
    >
      <div className="section-title-row">
        <div>
          <p className="eyebrow">
            For this crowd
          </p>

          <h2 id="recommendations-title">
            Recommended
          </h2>
        </div>

        <span
          className="sparkle"
          aria-hidden="true"
        >
          ✦
        </span>
      </div>

      <ul className="song-list">
        {songs.map((song) => {
          const alreadyQueued =
            queue.some((queuedSong) =>
              songsMatch(queuedSong, song),
            );

          return (
            <SongListItem
              key={song.id}
              song={song}
              isFavorite={favoriteIds.includes(
                song.id,
              )}
              onFavorite={onFavorite}
              favoriteDisabled={!canFavorite}
              action={
                <button
                  className="add-song-button"
                  type="button"
                  onClick={() =>
                    onAddToQueue(song)
                  }
                  disabled={
                    !canQueue ||
                    alreadyQueued
                  }
                  aria-label={
                    alreadyQueued
                      ? `${song.title} is already in the queue`
                      : `Add ${song.title} to queue`
                  }
                  title={
                    alreadyQueued
                      ? 'Already in queue'
                      : !canQueue
                        ? 'Only the host can add songs in this party'
                        : 'Add to queue'
                  }
                >
                  <span aria-hidden="true">
                    {alreadyQueued
                      ? '✓'
                      : '＋'}
                  </span>

                  <span className="add-song-label">
                    {alreadyQueued
                      ? 'Added'
                      : 'Add'}
                  </span>
                </button>
              }
            />
          );
        })}
      </ul>

      {!canQueue && (
        <p className="panel-note">
          Only the host can add songs in this room.
        </p>
      )}
    </section>
  );
}