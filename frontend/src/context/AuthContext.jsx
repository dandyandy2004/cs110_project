import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'crowd-dj-auth';

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || { isAuthenticated: false, user: null };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);

  function saveAuth(nextAuth) {
    setAuth(nextAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }

  function login(identifier) {
    const isEmail = identifier.includes('@');
    const user = {
      username: isEmail ? identifier.split('@')[0] : identifier,
      email: isEmail ? identifier : `${identifier}@crowddj.mock`,
      avatarUrl: null,
    };
    saveAuth({ isAuthenticated: true, user });
    return user;
  }

  function signup(userData) {
    const user = { username: userData.username, email: userData.email, avatarUrl: null };
    saveAuth({ isAuthenticated: true, user });
    return user;
  }

  function logout() {
    saveAuth({ isAuthenticated: false, user: null });
  }

  function updateAvatar(avatarUrl) {
    // Blob URLs only live for the current browser session, so keep the preview
    // in memory rather than persisting an unusable URL after refresh.
    setAuth({ ...auth, user: { ...auth.user, avatarUrl } });
  }

  const value = useMemo(
    () => ({ ...auth, login, signup, logout, updateAvatar }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
