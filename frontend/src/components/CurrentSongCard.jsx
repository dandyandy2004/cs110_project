import {
  useEffect,
  useRef,
  useState,
} from 'react';

function formatTime(seconds) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return '0:00';
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  const remainingSeconds = Math.floor(
    seconds % 60,
  );

  return `${minutes}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
}

export default function CurrentSongCard({
  song,
  isPlaying,
  canControl,
  onTogglePlayback,
  onPrevious,
  onNext,
}) {
  const audioRef = useRef(null);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [audioEnabled, setAudioEnabled] =
    useState(canControl);

  const [audioError, setAudioError] =
    useState('');

  const [
    isAutoSkipping,
    setIsAutoSkipping,
  ] = useState(false);

  const imageUrl =
    song?.imageUrl ||
    song?.image_url ||
    song?.albumImage ||
    '/placeholder-album.png';

  const previewUrl =
    song?.previewUrl ||
    song?.preview_url ||
    song?.songUrl ||
    song?.song_url ||
    '';

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    setCurrentTime(0);
    setDuration(0);
    setAudioError('');
    setIsAutoSkipping(false);

    if (!previewUrl) {
      audio.removeAttribute('src');
      audio.load();

      return;
    }

    audio.src = previewUrl;
    audio.load();
  }, [song?.id, previewUrl]);

  useEffect(() => {
    if (canControl) {
      setAudioEnabled(true);
    }
  }, [canControl]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !previewUrl) {
      return;
    }

    if (isPlaying && audioEnabled) {
      audio.play().catch((error) => {
        console.error(
          'Preview playback failed:',
          error,
        );

        setAudioError(
          canControl
            ? 'Press Play to start the preview.'
            : 'Press Join Audio to listen.',
        );
      });
    } else {
      audio.pause();
    }
  }, [
    isPlaying,
    audioEnabled,
    previewUrl,
    song?.id,
    canControl,
  ]);

  async function handleJoinAudio() {
    const audio = audioRef.current;

    if (!audio || !previewUrl) {
      return;
    }

    setAudioEnabled(true);
    setAudioError('');

    if (isPlaying) {
      try {
        await audio.play();
      } catch (error) {
        console.error(
          'Could not join audio:',
          error,
        );

        setAudioError(
          'The audio preview could not be started.',
        );
      }
    }
  }

  async function handleEnded() {
    setCurrentTime(0);

    if (
      !canControl ||
      isAutoSkipping
    ) {
      return;
    }

    setIsAutoSkipping(true);

    try {
      await onNext?.();
    } catch (error) {
      console.error(
        'Automatic skip failed:',
        error,
      );

      setAudioError(
        error.message ||
          'Could not play the next song.',
      );

      setIsAutoSkipping(false);
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setDuration(
      Number.isFinite(audio.duration)
        ? audio.duration
        : 0,
    );
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(
      audio.currentTime || 0,
    );
  }

  function handleAudioError() {
    setAudioError(
      'This song preview could not be loaded.',
    );
  }

  const progressPercent =
    duration > 0
      ? Math.min(
          (currentTime / duration) * 100,
          100,
        )
      : 0;

  if (!song) {
    return (
      <section
        className="panel current-song-card empty-current-song"
        aria-labelledby="now-playing-title"
      >
        <div className="section-heading centered-heading">
          <p className="eyebrow">
            Now playing
          </p>
        </div>

        <div className="current-song-copy">
          <h2 id="now-playing-title">
            No song playing
          </h2>

          <p>
            Add a song to the queue to get
            started.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="panel current-song-card"
      aria-labelledby="now-playing-title"
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      <div className="section-heading centered-heading">
        <p className="eyebrow">
          Now playing
        </p>

        <span
          className="sound-bars"
          aria-label={
            isPlaying
              ? 'Playing'
              : 'Paused'
          }
        >
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="album-art-wrap">
        <img
          className="current-album-art"
          src={imageUrl}
          alt={`${
            song.title || 'Current song'
          } album cover`}
          onError={(event) => {
            event.currentTarget.src =
              '/placeholder-album.png';
          }}
        />

        <span className="album-badge">
          CDJ
        </span>
      </div>

      <div className="current-song-copy">
        <h2 id="now-playing-title">
          {song.title ||
            'Unknown title'}
        </h2>

        <p>
          {song.artist ||
            'Unknown artist'}
        </p>
      </div>

      <div className="progress-block">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Song preview progress"
          aria-valuemin="0"
          aria-valuemax={
            duration || 30
          }
          aria-valuenow={
            currentTime
          }
        >
          <span
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        <div className="progress-times">
          <span>
            {formatTime(currentTime)}
          </span>

          <span>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {!previewUrl && (
        <p className="control-note">
          No preview is available for this
          song.
        </p>
      )}

      {audioError && (
        <p
          className="control-note"
          role="alert"
        >
          {audioError}
        </p>
      )}

      {!canControl && !audioEnabled && (
        <button
          className="join-audio-button"
          type="button"
          onClick={handleJoinAudio}
          disabled={!previewUrl}
        >
          Join Audio
        </button>
      )}

      {!canControl && audioEnabled && (
        <p className="control-note">
          Audio joined. Your playback will
          follow the host.
        </p>
      )}

      <div className="playback-controls">
        <button
          className="playback-button"
          type="button"
          onClick={onPrevious}
          disabled={
            !canControl ||
            isAutoSkipping
          }
          aria-label="Previous song"
          title={
            !canControl
              ? 'The host controls playback in this party'
              : 'Previous song'
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6.5 5v14M18 6.5l-8 5.5 8 5.5v-11Z" />
          </svg>
        </button>

        <button
          className="playback-button play-button"
          type="button"
          onClick={onTogglePlayback}
          disabled={
            !canControl ||
            !previewUrl ||
            isAutoSkipping
          }
          aria-label={
            isPlaying
              ? 'Pause'
              : 'Play'
          }
          title={
            !canControl
              ? 'The host controls playback in this party'
              : !previewUrl
                ? 'No preview is available'
                : isPlaying
                  ? 'Pause'
                  : 'Play'
          }
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 6v12M16 6v12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m9 6 8 6-8 6V6Z" />
            </svg>
          )}
        </button>

        <button
          className="playback-button"
          type="button"
          onClick={onNext}
          disabled={
            !canControl ||
            isAutoSkipping
          }
          aria-label="Next song"
          title={
            !canControl
              ? 'The host controls playback in this party'
              : 'Skip and delete current song'
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M17.5 5v14M6 6.5l8 5.5-8 5.5v-11Z" />
          </svg>
        </button>
      </div>

      {isAutoSkipping && (
        <p className="control-note">
          Loading the next song...
        </p>
      )}

      {!canControl && (
        <p className="control-note">
          The host controls playback. Your
          audio follows the host after you
          join.
        </p>
      )}
    </section>
  );
}