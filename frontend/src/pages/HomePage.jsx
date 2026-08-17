import {
  useCallback,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import CurrentSongCard from '../components/CurrentSongCard';
import Modal from '../components/Modal';
import PartyInfoCard from '../components/PartyInfoCard';
import QueueList from '../components/QueueList';
import RecommendedSongs from '../components/RecommendedSongs';

import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useParty } from '../context/PartyContext';

import {
  canAddToQueue,
  canControlPlayback,
  canUseFavorites,
} from '../utils/permissions';

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

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();

  const {
    currentParty,
    currentRole,
    joinMockParty,
    leaveParty,
  } = useParty();

  const {
    currentSong,
    queue,
    recommendedSongs,
    isPlaying,
    favoriteIds,
    togglePlayback,
    nextSong,
    previousSong,
    addToQueue,
    playSong,
    toggleFavorite,
  } = useMusic();

  const [modalType, setModalType] =
    useState(null);

  const [roomCode, setRoomCode] =
    useState('');

  const [joinError, setJoinError] =
    useState('');

  const [notice, setNotice] =
    useState(
      location.state?.message || '',
    );

  const [copied, setCopied] =
    useState(false);

  const permissionLevel =
    Number(
      currentParty?.permissionLevel,
    ) || 0;

  const canQueue = currentParty
    ? canAddToQueue(
        currentRole,
        permissionLevel,
      )
    : false;

  const canControl = currentParty
    ? canControlPlayback(
        currentRole,
        permissionLevel,
      )
    : false;

  const canFavorite = currentParty
    ? canUseFavorites(
        currentRole,
        permissionLevel,
      )
    : false;

  const closeModal = useCallback(() => {
    setModalType(null);
    setCopied(false);
    setJoinError('');
  }, []);

  function createParty() {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/create-party',
          message:
            'Log in to create a party.',
        },
      });

      return;
    }

    navigate('/create-party');
  }

  async function submitJoin(event) {
    event.preventDefault();

    if (!roomCode.trim()) {
      setJoinError(
        'Enter a room code to continue.',
      );

      return;
    }

    try {
      const party =
        await joinMockParty(
          roomCode.trim(),
        );

      setNotice(
        `You joined “${party.name}” as a guest.`,
      );

      setRoomCode('');
      closeModal();
    } catch (error) {
      setJoinError(
        error.message ||
          'Could not join the party.',
      );
    }
  }

  async function copyRoomCode() {
    if (!currentParty?.roomCode) {
      setNotice(
        'This party does not have a room code yet.',
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(
        currentParty.roomCode,
      );

      setCopied(true);
    } catch {
      setCopied(true);
    }
  }

  function favoriteSong(song) {
    if (!isAuthenticated) {
      setNotice(
        'Log in to save songs to your favorites.',
      );

      return;
    }

    if (!currentParty) {
      setNotice(
        'Create or join a party first.',
      );

      return;
    }

    if (!canFavorite) {
      setNotice(
        'Favorites are unavailable at this party permission level.',
      );

      return;
    }

    const wasFavorite =
      favoriteIds.includes(song.id);

    toggleFavorite(song.id);

    setNotice(
      wasFavorite
        ? `Removed “${song.title}” from favorites.`
        : `Saved “${song.title}” to favorites.`,
    );
  }

  async function queueSong(song) {
    if (!currentParty) {
      setNotice(
        'Create or join a party first.',
      );

      return;
    }

    if (!canQueue) {
      setNotice(
        'Only the host can add songs in this room.',
      );

      return;
    }

    const alreadyQueued =
      queue.some((queuedSong) =>
        songsMatch(queuedSong, song),
      );

    if (alreadyQueued) {
      setNotice(
        `“${song.title}” is already in the queue. Use its Play button in the Queue section.`,
      );

      return;
    }

    try {
      await addToQueue(song);

      setNotice(
        `Added “${song.title}” to the queue.`,
      );
    } catch (error) {
      setNotice(
        error.message ||
          'Could not add the song to the queue.',
      );
    }
  }

  async function handlePlaySong(song) {
    if (!currentParty) {
      setNotice(
        'Create or join a party first.',
      );

      return;
    }

    if (!canControl) {
      setNotice(
        'You do not have permission to control playback.',
      );

      return;
    }

    try {
      await playSong(song);

      setNotice(
        `Now playing “${song.title}”.`,
      );
    } catch (error) {
      setNotice(
        error.message ||
          'Could not play the song.',
      );
    }
  }

  async function handleTogglePlayback() {
    try {
      await togglePlayback();
    } catch (error) {
      setNotice(
        error.message ||
          'Could not change playback.',
      );
    }
  }

  async function handleNextSong() {
    try {
      await nextSong();
    } catch (error) {
      setNotice(
        error.message ||
          'Could not play the next song.',
      );
    }
  }

  async function handlePreviousSong() {
    try {
      await previousSong();
    } catch (error) {
      setNotice(
        error.message ||
          'Could not play the previous song.',
      );
    }
  }

  return (
    <main className="home-page page-container">
      <div className="home-intro">
        <div>
          <p className="eyebrow">
            Shared listening, simplified
          </p>

          <h1>
            Good music, better together.
          </h1>
        </div>

        <p>
          Everyone brings a song. The room
          builds the soundtrack.
        </p>
      </div>

      {notice && (
        <div
          className="notice-banner"
          role="status"
        >
          <span>{notice}</span>

          <button
            type="button"
            onClick={() =>
              setNotice('')
            }
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {currentParty ? (
        <PartyInfoCard
          party={currentParty}
          role={currentRole}
          onInvite={() =>
            setModalType('invite')
          }
          onJoin={() =>
            setModalType('join')
          }
          onCreate={createParty}
        />
      ) : (
        <section className="empty-party-state">
          <p className="eyebrow">
            No active room
          </p>

          <h2>
            Create or join a party to get
            started.
          </h2>

          <p>
            Once you enter a room, the party
            information and music queue will
            appear here.
          </p>

          <div className="create-form-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={createParty}
            >
              Create party
            </button>

            <button
              className="button button-ghost"
              type="button"
              onClick={() =>
                setModalType('join')
              }
            >
              Join party
            </button>
          </div>
        </section>
      )}

      {currentParty && (
        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            margin: '1rem 0',
          }}
        >
          <button
            className="button button-ghost"
            type="button"
            onClick={() => {
              leaveParty();

              setNotice(
                'You left the party.',
              );
            }}
          >
            Leave Party
          </button>
        </div>
      )}

      {currentParty && (
        <>
          <div className="music-grid">
            <QueueList
              queue={queue}
              favoriteIds={favoriteIds}
              onFavorite={favoriteSong}
              favoriteDisabled={
                !canFavorite
              }
              onPlay={handlePlaySong}
              playDisabled={
                !canControl
              }
            />

            {currentSong ? (
              <CurrentSongCard
                song={currentSong}
                isPlaying={isPlaying}
                canControl={canControl}
                onTogglePlayback={
                  handleTogglePlayback
                }
                onPrevious={
                  handlePreviousSong
                }
                onNext={
                  handleNextSong
                }
              />
            ) : (
              <section className="current-song-card empty-current-song">
                <p className="eyebrow">
                  Now playing
                </p>

                <h2>
                  No song playing
                </h2>

                <p>
                  Add a song to the queue,
                  then press Play.
                </p>
              </section>
            )}

            <RecommendedSongs
              songs={recommendedSongs}
              queue={queue}
              favoriteIds={favoriteIds}
              onFavorite={favoriteSong}
              onAddToQueue={queueSong}
              canQueue={canQueue}
              canFavorite={canFavorite}
            />
          </div>

          <p className="provider-note">
            Demo playlist · Placeholder audio
            provider
          </p>
        </>
      )}

      {modalType === 'invite' &&
        currentParty && (
          <Modal
            title="Invite your crowd"
            onClose={closeModal}
          >
            <p className="modal-description">
              Share this room code. No account
              is needed to join and browse.
            </p>

            <div className="room-code-box">
              <span>
                {currentParty.roomCode ||
                  'No room code'}
              </span>

              <button
                className="button button-primary"
                type="button"
                onClick={copyRoomCode}
                disabled={
                  !currentParty.roomCode
                }
              >
                {copied
                  ? 'Copied!'
                  : 'Copy code'}
              </button>
            </div>
          </Modal>
        )}

      {modalType === 'join' && (
        <Modal
          title="Join a party"
          onClose={closeModal}
        >
          <p className="modal-description">
            Enter the room code provided by
            the party host.
          </p>

          <form
            className="join-form"
            onSubmit={submitJoin}
            noValidate
          >
            <label htmlFor="room-code">
              Room code
            </label>

            <input
              id="room-code"
              value={roomCode}
              onChange={(event) => {
                setRoomCode(
                  event.target.value,
                );

                setJoinError('');
              }}
              placeholder="CDJ-4821"
              autoComplete="off"
              aria-invalid={Boolean(
                joinError,
              )}
              aria-describedby={
                joinError
                  ? 'room-code-error'
                  : undefined
              }
              autoFocus
            />

            {joinError && (
              <span
                className="field-error"
                id="room-code-error"
              >
                {joinError}
              </span>
            )}

            <button
              className="button button-primary button-full"
              type="submit"
            >
              Join party
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}