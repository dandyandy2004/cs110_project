import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import { PartyProvider } from './context/PartyContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';
import './styles/navbar.css';
import './styles/login.css';
import './styles/home.css';
import './styles/profile.css';
import './styles/create-party.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PartyProvider>
            <MusicProvider>
              <App />
            </MusicProvider>
          </PartyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
