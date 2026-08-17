import SongListItem from './SongListItem';

export default function QueueList({
  queue,
  favoriteIds,
  onFavorite,
  favoriteDisabled,
  onPlay,
  playDisabled,
}) {
  return (
    <section
      className="panel list-panel queue-panel"
      aria-labelledby="queue-title"
    >
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Coming up</p>
          <h2 id="queue-title">Queue</h2>
        </div>

        <span className="count-badge">
          {queue.length}
        </span>
      </div>

      <ol className="song-list">
        {queue.map((song, index) => (
          <SongListItem
            key={song.id}
            song={song}
            index={index}
            isFavorite={favoriteIds.includes(song.id)}
            onFavorite={onFavorite}
            favoriteDisabled={favoriteDisabled}
            action={
              <button
                className="add-song-button"
                type="button"
                onClick={() => onPlay(song)}
                disabled={playDisabled}
              >
                <span aria-hidden="true">▶</span>
                <span className="add-song-label">
                  Play
                </span>
              </button>
            }
          />
        ))}
      </ol>

      {queue.length === 0 && (
        <p className="panel-note">
          No songs have been added yet.
        </p>
      )}
    </section>
  );
}