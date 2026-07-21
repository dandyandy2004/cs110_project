import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  function openProfile() {
    navigate(isAuthenticated ? '/profile' : '/login', {
      state: isAuthenticated ? undefined : { message: 'Log in to view your profile.' },
    });
  }

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link className="brand" to="/home" aria-label="Crowd DJ home">
          <BrandMark />
          <span>Crowd DJ</span>
        </Link>

        <div className="nav-actions">
          <Link className="nav-home-link" to="/home">Home</Link>
          <button
            className="avatar-button"
            type="button"
            onClick={openProfile}
            aria-label={isAuthenticated ? `Open ${user.username}'s profile` : 'Log in to view profile'}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm-7.25 8c.55-3.55 3.12-5.5 7.25-5.5s6.7 1.95 7.25 5.5" />
              </svg>
            )}
          </button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
