export default function SongListItem({
  song,
  index,
  isFavorite,
  onFavorite,
  favoriteDisabled = false,
  action,
}) {
  return (
    <li className="song-list-item">
      {typeof index === 'number' && <span className="song-number" aria-hidden="true">{index + 1}</span>}
      <img src={song.albumImage} alt={`${song.title} placeholder cover`} />
      <div className="song-meta">
        <strong>{song.title}</strong>
        <span>{song.artist}</span>
      </div>
      <div className="song-item-actions">
        {action}
        <button
          className={`heart-button ${isFavorite ? 'is-favorite' : ''}`}
          type="button"
          onClick={() => onFavorite(song)}
          disabled={favoriteDisabled}
          aria-label={`${isFavorite ? 'Remove' : 'Add'} ${song.title} ${isFavorite ? 'from' : 'to'} favorites`}
          aria-pressed={isFavorite}
        >
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </div>
    </li>
  );
}
