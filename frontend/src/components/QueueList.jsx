import SongListItem from './SongListItem';

export default function QueueList({ queue, favoriteIds, onFavorite, favoriteDisabled }) {
  return (
    <section className="panel list-panel queue-panel" aria-labelledby="queue-title">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Coming up</p>
          <h2 id="queue-title">Queue</h2>
        </div>
        <span className="count-badge">{queue.length}</span>
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
          />
        ))}
      </ol>
      {favoriteDisabled && (
        <p className="panel-note">Favorites unlock in guest queue rooms.</p>
      )}
    </section>
  );
}
