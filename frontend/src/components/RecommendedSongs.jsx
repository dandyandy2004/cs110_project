import SongListItem from './SongListItem';

export default function RecommendedSongs({
  songs,
  favoriteIds,
  onFavorite,
  onAddToQueue,
  canQueue,
  canFavorite,
}) {
  return (
    <section className="panel list-panel recommendations-panel" aria-labelledby="recommendations-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">For this crowd</p>
          <h2 id="recommendations-title">Recommended</h2>
        </div>
        <span className="sparkle" aria-hidden="true">✦</span>
      </div>
      <ul className="song-list">
        {songs.map((song) => (
          <SongListItem
            key={song.id}
            song={song}
            isFavorite={favoriteIds.includes(song.id)}
            onFavorite={onFavorite}
            favoriteDisabled={!canFavorite}
            action={(
              <button
                className="add-song-button"
                type="button"
                onClick={() => onAddToQueue(song)}
                disabled={!canQueue}
                aria-label={`Add ${song.title} to queue`}
                title={!canQueue ? 'Only the host can add songs in this party' : 'Add to queue'}
              >
                <span aria-hidden="true">＋</span>
                <span className="add-song-label">Add</span>
              </button>
            )}
          />
        ))}
      </ul>
      {!canQueue && <p className="panel-note">Only the host can add songs in this room.</p>}
    </section>
  );
}
