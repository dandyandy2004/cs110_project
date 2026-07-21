import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CurrentSongCard from '../components/CurrentSongCard';
import Modal from '../components/Modal';
import PartyInfoCard from '../components/PartyInfoCard';
import QueueList from '../components/QueueList';
import RecommendedSongs from '../components/RecommendedSongs';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';
import { useParty } from '../context/PartyContext';
import { canAddToQueue, canControlPlayback, canUseFavorites } from '../utils/permissions';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { currentParty, currentRole, joinMockParty } = useParty();
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
    toggleFavorite,
  } = useMusic();
  const [modalType, setModalType] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');
  const [copied, setCopied] = useState(false);

  const closeModal = useCallback(() => {
    setModalType(null);
    setCopied(false);
    setJoinError('');
  }, []);

  const canQueue = canAddToQueue(currentRole, currentParty.permissionLevel);
  const canControl = canControlPlayback(currentRole, currentParty.permissionLevel);
  const canFavorite = canUseFavorites(currentRole, currentParty.permissionLevel);

  function createParty() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/create-party', message: 'Log in to create a party.' } });
      return;
    }
    navigate('/create-party');
  }

  function submitJoin(event) {
    event.preventDefault();
    if (!roomCode.trim()) {
      setJoinError('Enter a room code to continue.');
      return;
    }
    const party = joinMockParty(roomCode.trim());
    setNotice(`You joined “${party.name}” as a guest.`);
    setRoomCode('');
    closeModal();
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(currentParty.roomCode);
      setCopied(true);
    } catch {
      setCopied(true);
    }
  }

  function favoriteSong(song) {
    if (!isAuthenticated) {
      setNotice('Log in to save songs to your favorites.');
      return;
    }
    if (!canFavorite) {
      setNotice('Favorites are unavailable at this party permission level.');
      return;
    }
    toggleFavorite(song.id);
    setNotice(favoriteIds.includes(song.id) ? `Removed “${song.title}” from favorites.` : `Saved “${song.title}” to favorites.`);
  }

  function queueSong(song) {
    if (!canQueue) {
      setNotice('Only the host can add songs in this room.');
      return;
    }
    const alreadyQueued = queue.some((queuedSong) => queuedSong.id === song.id);
    addToQueue(song);
    setNotice(alreadyQueued ? 'That song is already in the queue.' : `Added “${song.title}” to the queue.`);
  }

  return (
    <main className="home-page page-container">
      <div className="home-intro">
        <div>
          <p className="eyebrow">Shared listening, simplified</p>
          <h1>Good music, better together.</h1>
        </div>
        <p>Everyone brings a song. The room builds the soundtrack.</p>
      </div>

      {notice && (
        <div className="notice-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button>
        </div>
      )}

      <PartyInfoCard
        party={currentParty}
        role={currentRole}
        onInvite={() => setModalType('invite')}
        onJoin={() => setModalType('join')}
        onCreate={createParty}
      />

      <div className="music-grid">
        <QueueList
          queue={queue}
          favoriteIds={favoriteIds}
          onFavorite={favoriteSong}
          favoriteDisabled={!canFavorite}
        />
        <CurrentSongCard
          song={currentSong}
          isPlaying={isPlaying}
          canControl={canControl}
          onTogglePlayback={togglePlayback}
          onPrevious={previousSong}
          onNext={nextSong}
        />
        <RecommendedSongs
          songs={recommendedSongs}
          favoriteIds={favoriteIds}
          onFavorite={favoriteSong}
          onAddToQueue={queueSong}
          canQueue={canQueue}
          canFavorite={canFavorite}
        />
      </div>

      <p className="provider-note">Demo playlist · Placeholder audio provider</p>

      {modalType === 'invite' && (
        <Modal title="Invite your crowd" onClose={closeModal}>
          <p className="modal-description">Share this room code. No account is needed to join and browse.</p>
          <div className="room-code-box">
            <span>{currentParty.roomCode}</span>
            <button className="button button-primary" type="button" onClick={copyRoomCode}>
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        </Modal>
      )}

      {modalType === 'join' && (
        <Modal title="Join a party" onClose={closeModal}>
          <p className="modal-description">Enter any non-empty room code for this frontend demo.</p>
          <form className="join-form" onSubmit={submitJoin} noValidate>
            <label htmlFor="room-code">Room code</label>
            <input
              id="room-code"
              value={roomCode}
              onChange={(event) => {
                setRoomCode(event.target.value);
                setJoinError('');
              }}
              placeholder="CDJ-4821"
              autoComplete="off"
              aria-invalid={Boolean(joinError)}
              aria-describedby={joinError ? 'room-code-error' : undefined}
              autoFocus
            />
            {joinError && <span className="field-error" id="room-code-error">{joinError}</span>}
            <button className="button button-primary button-full" type="submit">Join party</button>
          </form>
        </Modal>
      )}
    </main>
  );
}
