import { createContext, useContext, useMemo, useState } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'crowd-dj-auth';

function getStoredAuth() {
  try {
    return (
      JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY)) || {
        isAuthenticated: false,
        user: null,
        token: null,
      }
    );
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
    };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);

  function saveAuth(nextAuth) {
    setAuth(nextAuth);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }

  async function login(email, password) {
    const data = await loginUser({
      email,
      password,
    });

    const nextAuth = {
      isAuthenticated: true,
      user: data.user,
      token: data.token,
    };

    saveAuth(nextAuth);

    return data.user;
  }

  async function signup(userData) {
    const data = await registerUser({
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      password: userData.password,
      favoriteGenres: userData.favoriteGenres || [],
    });

    const nextAuth = {
      isAuthenticated: true,
      user: data.user,
      token: data.token,
    };

    saveAuth(nextAuth);

    return data.user;
  }

  function logout() {
    saveAuth({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  }

  function updateAvatar(avatarUrl) {
    const nextAuth = {
      ...auth,
      user: {
        ...auth.user,
        avatarUrl,
      },
    };

    saveAuth(nextAuth);
  }

  const value = useMemo(
    () => ({
      ...auth,
      login,
      signup,
      logout,
      updateAvatar,
    }),
    [auth],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}