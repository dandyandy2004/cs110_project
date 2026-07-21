import { createContext, useContext, useMemo, useState } from 'react';
import { initialQueue, mockSongs, recommendedSongs } from '../data/mockSongs';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [queue, setQueue] = useState(initialQueue);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const currentSong = mockSongs[currentSongIndex];

  function togglePlayback() {
    setIsPlaying((current) => !current);
  }

  function nextSong() {
    setCurrentSongIndex((current) => (current + 1) % mockSongs.length);
  }

  function previousSong() {
    setCurrentSongIndex((current) => (current - 1 + mockSongs.length) % mockSongs.length);
  }

  function addToQueue(song) {
    setQueue((current) => (
      current.some((queuedSong) => queuedSong.id === song.id) ? current : [...current, song]
    ));
  }

  function toggleFavorite(songId) {
    setFavoriteIds((current) => (
      current.includes(songId)
        ? current.filter((favoriteId) => favoriteId !== songId)
        : [...current, songId]
    ));
  }

  const favoriteSongs = mockSongs.filter((song) => favoriteIds.includes(song.id));

  const value = useMemo(
    () => ({
      currentSong,
      queue,
      recommendedSongs,
      isPlaying,
      favoriteIds,
      favoriteSongs,
      togglePlayback,
      nextSong,
      previousSong,
      addToQueue,
      toggleFavorite,
    }),
    [currentSong, queue, isPlaying, favoriteIds, favoriteSongs],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
}
