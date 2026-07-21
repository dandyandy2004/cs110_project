export default function CurrentSongCard({
  song,
  isPlaying,
  canControl,
  onTogglePlayback,
  onPrevious,
  onNext,
}) {
  return (
    <section className="panel current-song-card" aria-labelledby="now-playing-title">
      <div className="section-heading centered-heading">
        <p className="eyebrow">Now playing</p>
        <span className="sound-bars" aria-label={isPlaying ? 'Playing' : 'Paused'}>
          <i /><i /><i />
        </span>
      </div>
      <div className="album-art-wrap">
        <img className="current-album-art" src={song.albumImage} alt={`${song.title} placeholder cover`} />
        <span className="album-badge">CDJ</span>
      </div>
      <div className="current-song-copy">
        <h2 id="now-playing-title">{song.title}</h2>
        <p>{song.artist}</p>
      </div>
      <div className="progress-block" aria-hidden="true">
        <div className="progress-track"><span /></div>
        <div className="progress-times"><span>1:42</span><span>3:28</span></div>
      </div>
      <div className="playback-controls">
        <button
          className="playback-button"
          type="button"
          onClick={onPrevious}
          disabled={!canControl}
          aria-label="Previous song"
          title={!canControl ? 'The host controls playback in this party' : 'Previous song'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 5v14M18 6.5l-8 5.5 8 5.5v-11Z" /></svg>
        </button>
        <button
          className="playback-button play-button"
          type="button"
          onClick={onTogglePlayback}
          disabled={!canControl}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={!canControl ? 'The host controls playback in this party' : isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 8 6-8 6V6Z" /></svg>
          )}
        </button>
        <button
          className="playback-button"
          type="button"
          onClick={onNext}
          disabled={!canControl}
          aria-label="Next song"
          title={!canControl ? 'The host controls playback in this party' : 'Next song'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 5v14M6 6.5l8 5.5-8 5.5v-11Z" /></svg>
        </button>
      </div>
      {!canControl && <p className="control-note">Playback is host-controlled in this room.</p>}
    </section>
  );
}
