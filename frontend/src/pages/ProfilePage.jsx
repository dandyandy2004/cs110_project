import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SongListItem from '../components/SongListItem';
import { useAuth } from '../context/AuthContext';
import { useMusic } from '../context/MusicContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, logout, updateAvatar } = useAuth();
  const { favoriteSongs, favoriteIds, toggleFavorite } = useMusic();
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);

  function selectAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setAvatarPreview(reader.result);
      updateAvatar(reader.result);
    });
    reader.readAsDataURL(file);
  }

  function signOut() {
    logout();
    navigate('/home', { replace: true, state: { message: 'You’re now browsing as a guest.' } });
  }

  return (
    <main className="profile-page page-container">
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {avatarPreview ? (
              <img src={avatarPreview} alt={`${user.username}'s selected avatar`} />
            ) : (
              <span aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <button className="avatar-edit" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change avatar">
            <span aria-hidden="true">✎</span>
          </button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={selectAvatar} />
        </div>
        <div className="profile-copy">
          <p className="eyebrow">Your profile</p>
          <h1 id="profile-title">@{user.username}</h1>
          <p>{user.email}</p>
          <div className="profile-actions">
            <button className="button button-secondary" type="button" onClick={() => fileInputRef.current?.click()}>Change avatar</button>
            <button className="text-button" type="button" onClick={signOut}>Log out</button>
          </div>
        </div>
      </section>

      <section className="favorites-section panel" aria-labelledby="favorites-title">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Your collection</p>
            <h2 id="favorites-title">Favorite songs</h2>
          </div>
          <span className="count-badge">{favoriteSongs.length}</span>
        </div>
        {favoriteSongs.length ? (
          <ul className="profile-favorites-grid">
            {favoriteSongs.map((song) => (
              <SongListItem
                key={song.id}
                song={song}
                isFavorite={favoriteIds.includes(song.id)}
                onFavorite={(favoriteSong) => toggleFavorite(favoriteSong.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">♡</span>
            <h3>No favorites yet</h3>
            <p>Heart a song from the queue or recommendations and it’ll appear here.</p>
            <button className="button button-primary" type="button" onClick={() => navigate('/home')}>Explore the party</button>
          </div>
        )}
      </section>
    </main>
  );
}
