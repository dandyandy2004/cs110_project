export default function SongListItem({
  song,
  index,
  isFavorite,
  onFavorite,
  favoriteDisabled = false,
  action,
  userVote = 0,
  onVote,
  onToggleComments,
  commentCount = 0
}) {
  const voteScore = song.vote_score ?? song.voteScore ?? 0;

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
      
      <div className="vote-group">
          <button
            className={`vote-button ${userVote === 1 ? 'voted-up' : ''}`}
            type="button"
            onClick={() => onVote?.(song, userVote === 1 ? 0 : 1)}
            aria-label={`Upvote ${song.title}`}
          >
            ▲
          </button>
          <span className="vote-score">{voteScore}</span>
          <button
            className={`vote-button ${userVote === -1 ? 'voted-down' : ''}`}
            type="button"
            onClick={() => onVote?.(song, userVote === -1 ? 0 : -1)}
            aria-label={`Downvote ${song.title}`}
          >
            ▼
          </button>
        </div>

        {OnToggleComments && (
          <button
            className="comment-toggle-button"
            type="button"
            onClick={onToggleComments}
            aria-label={`Comments for ${song.title}`}
          >
            💬 <span>{commentCount}</span>
          </button>
        )}

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
